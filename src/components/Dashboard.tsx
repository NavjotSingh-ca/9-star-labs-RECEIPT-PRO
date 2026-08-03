'use client';

import React, { useMemo, useState, useCallback } from 'react';
import { AlertCircle, Receipt, ShieldAlert, Mail } from 'lucide-react';
import { motion } from 'framer-motion';
import { useQuery } from '@tanstack/react-query';
import { cn } from '@design/utils';
import { fadeUp, staggerMedium } from '@/lib/animations';

import { Card, CardContent } from '@design/primitives';
import { Button } from '@design/primitives';
import { StatCard } from '@design/patterns';
import { EmptyState } from '@design/patterns';
import { Skeleton } from '@design/primitives';
import { Sparkline } from '@/components/charts/Sparkline';
import AnimatedCounter from '@/components/ui/AnimatedCounter';

import type { UserRole } from '@/lib/types';
import { supabase, getOrgIdString } from '@/lib/supabase';
import { toast } from 'sonner';
import { getDashboardSummary, getDailySpend } from '@/lib/services/receipts';
import { toNumber, formatCurrency } from '@/lib/ui-utils';

interface DashboardProps {
  onScan?: () => void;
  role?: UserRole;
  userId?: string;
}

function formatMonthLabel(value: string | undefined | null): string {
  if (!value || typeof value !== 'string' || !/^\d{4}-\d{2}$/.test(value)) return String(value || 'Unknown');
  const [y, m] = value.split('-').map(Number);
  return new Date(y, m - 1).toLocaleDateString('en-CA', { month: 'short', year: '2-digit' });
}

function getGreeting(): string {
  const h = new Date().getHours();
  if (h < 12) return 'Good morning.';
  if (h < 17) return 'Good afternoon.';
  return 'Good evening.';
}

export default function Dashboard({ onScan, role = 'Owner', userId }: DashboardProps) {
  const [forwardingEmail, setForwardingEmail] = useState(false);

  const { data: summary, isLoading, error, refetch } = useQuery({
    queryKey: ['dashboard_summary', role, userId],
    queryFn: () => {
      if (!userId) throw new Error('No user ID');
      return getDashboardSummary(userId);
    },
    enabled: !!userId, retry: 1, staleTime: 5 * 60 * 1000,
  });

  const { data: dailyData = [] } = useQuery({
    queryKey: ['daily_spend', userId, 7],
    queryFn: () => getDailySpend(7),
    enabled: !!userId, staleTime: 5 * 60 * 1000,
  });

  const thisMonth = useMemo(() => {
    if (!summary?.monthlyTrend?.length) return null;
    const t = summary.monthlyTrend;
    const l = t[t.length - 1];
    return { amount: toNumber(l?.amount || 0), month: l?.month || '' };
  }, [summary]);

  const lastMonth = useMemo(() => {
    if (!summary?.monthlyTrend || summary.monthlyTrend.length < 2) return null;
    const p = summary.monthlyTrend[summary.monthlyTrend.length - 2];
    return { amount: toNumber(p?.amount || 0) };
  }, [summary]);

  const mom = useMemo(() => {
    if (!thisMonth || !lastMonth || lastMonth.amount === 0) return null;
    return ((thisMonth.amount - lastMonth.amount) / lastMonth.amount) * 100;
  }, [thisMonth, lastMonth]);

  const handleCopyEmail = useCallback(async () => {
    setForwardingEmail(true);
    try {
      const orgId = await getOrgIdString();
      if (!orgId) { toast.error('No organization found'); return; }
      const { data } = await supabase.from('organizations').select('receipt_email').eq('id', orgId).single();
      if (data?.receipt_email) {
        await navigator.clipboard.writeText(data.receipt_email);
        toast.success(`Receipt email copied: ${data.receipt_email}`);
      } else toast.error('No receipt email configured');
    } catch (err) {
      import('@/lib/logger').then(({ logError }) => logError(err, { action: 'copy_forwarding_email' }));
      toast.error('Failed to lookup organization email');
    } finally {
      setForwardingEmail(false);
    }
  }, []);

  if (isLoading) return <DashboardSkeleton />;

  if (error || !summary) {
    const noOrg = error instanceof Error && error.message.includes('No organization');
    return (
      <motion.div variants={fadeUp} initial="hidden" animate="show"
        className="flex min-h-[40vh] flex-col items-center justify-center gap-4 rounded-xl border border-glass-border bg-surface p-10 text-center">
        <AlertCircle className="h-10 w-10 text-danger" />
        <h3 className="text-lg font-bold tracking-tight">{noOrg ? 'Organization Required' : 'Sync Error'}</h3>
        <p className="text-sm text-text-muted">{noOrg ? 'Join an organization to continue.' : 'Could not load dashboard data.'}</p>
        {!noOrg && <Button variant="outline" onClick={() => refetch()}>Retry</Button>}
      </motion.div>
    );
  }

  const { receiptCount = 0, totalSpent = 0, gstRecoverable = 0 } = summary;

  if (receiptCount === 0) return (
    <EmptyState
      title="Your financial picture starts here"
      description="Scan your first receipt to unlock spending insights, tax-ready reports, and CRA-compliant audit trails — all in one place."
      action={{
        label: "Scan your first receipt",
        onClick: onScan ?? (() => {}),
        variant: "primary"
      }}
      illustration={
        <svg className="h-16 w-16 text-text-muted/50" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 9v3m0 0v3m0-3h3m-3 0H9m12 0a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      }
    />
  );

  return (
    <motion.div variants={staggerMedium} initial="hidden" animate="show" className="space-y-6" aria-live="polite">
      {/* Header & Greeting Bar */}
      <motion.div variants={fadeUp} className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-glass-border pb-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-widest text-champagne">{getGreeting()}</p>
          <h1 className="text-2xl font-extrabold tracking-tight text-text-primary sm:text-3xl">Executive Financial Summary</h1>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={handleCopyEmail} disabled={forwardingEmail} className="rounded-xl border-glass-border text-xs font-medium">
            <Mail className="mr-1.5 h-3.5 w-3.5 text-champagne" />
            Copy Receipt Email
          </Button>
          <Button size="sm" onClick={onScan} className="rounded-xl bg-champagne text-black font-semibold hover:bg-champagne-dim transition-all shadow-md shadow-champagne/20">
            <Receipt className="mr-1.5 h-4 w-4" />
            Scan Receipt
          </Button>
        </div>
      </motion.div>

      {/* Main KPI Cards Grid */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <motion.div variants={fadeUp}>
          <Card variant="interactive" hover className="relative overflow-hidden bg-gradient-to-br from-surface to-champagne/5" padding="lg">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <p className="text-xs font-bold uppercase tracking-wider text-text-muted">
                  {thisMonth ? formatMonthLabel(thisMonth.month) : 'This Month'} Spend
                </p>
                <div className="rounded-full bg-champagne/10 p-2 text-champagne">
                  <Receipt className="h-4 w-4" />
                </div>
              </div>
              <p className="mt-3 text-4xl font-extrabold tracking-tight tabular-nums text-text-primary">
                {thisMonth ? <AnimatedCounter from={0} to={thisMonth.amount} format={(v) => formatCurrency(v)} delay={80} /> : '$0.00'}
              </p>
              <div className="flex items-center justify-between gap-3 mt-4 pt-3 border-t border-glass-border/50">
                {mom !== null ? (
                  <span className={cn("inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-semibold", mom >= 0 ? 'bg-champagne/15 text-champagne' : 'bg-danger/15 text-danger')}>
                    <span className={cn("h-1.5 w-1.5 rounded-full", mom >= 0 ? 'bg-champagne' : 'bg-danger')} />
                    {mom >= 0 ? '+' : ''}{Math.abs(mom).toFixed(1)}% MoM
                  </span>
                ) : (
                  <span className="text-xs text-text-muted">Baseline month</span>
                )}
                {dailyData.length >= 2 && (
                  <div className="w-24">
                    <Sparkline data={dailyData} color="var(--champagne)" id="kpi-spark" />
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <StatCard
          label="Receipts"
          value={receiptCount.toLocaleString()}
          icon={<Receipt className="h-4 w-4 text-champagne" />}
        />
        <StatCard
          label="Total Spend"
          value={formatCurrency(totalSpent)}
          icon={<ShieldAlert className="h-4 w-4 text-champagne" />}
        />
        <StatCard
          label="GST Recoverable"
          value={formatCurrency(gstRecoverable)}
          icon={<Mail className="h-4 w-4 text-champagne" />}
        />
      </div>

      {/* Charts & Secondary Metrics */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <Card variant="interactive" hover padding="lg">
          <CardContent className="p-6">
            <p className="text-xs font-bold uppercase tracking-wider text-text-muted mb-4">Daily Spend (7 Days)</p>
            <DailySpendChart data={dailyData} />
          </CardContent>
        </Card>

        <Card variant="interactive" hover padding="lg">
          <CardContent className="p-6">
            <p className="text-xs font-bold uppercase tracking-wider text-text-muted mb-4">Tax Summary</p>
            <div className="space-y-3">
              <div className="flex items-center justify-between rounded-xl bg-surface p-4">
                <div className="flex items-center gap-3">
                  <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-champagne/10 text-champagne">
                    <Receipt className="h-4 w-4" />
                  </div>
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wider text-text-muted">GST Recoverable</p>
                    <p className="text-lg font-bold tabular-nums text-text-primary">{formatCurrency(gstRecoverable)}</p>
                  </div>
                </div>
              </div>
              <div className="flex items-center justify-between rounded-xl bg-surface p-4">
                <div className="flex items-center gap-3">
                  <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-warning/10 text-warning">
                    <ShieldAlert className="h-4 w-4" />
                  </div>
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wider text-text-muted">Total Spend</p>
                    <p className="text-lg font-bold tabular-nums text-text-primary">{formatCurrency(totalSpent)}</p>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </motion.div>
  );
}

function DashboardSkeleton() {
  return (
    <div className="space-y-6 animate-pulse" role="status" aria-label="Loading dashboard">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-glass-border pb-4">
        <div className="space-y-2">
          <Skeleton className="h-4 w-24 rounded" />
          <Skeleton className="h-8 w-48 rounded" />
        </div>
        <div className="flex gap-2">
          <Skeleton className="h-10 w-32 rounded-xl" />
          <Skeleton className="h-10 w-32 rounded-xl" />
        </div>
      </div>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {[...Array(3)].map((_, _i) => (
          <Skeleton key={_i} variant="card" className="h-40" />
        ))}
      </div>
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <Skeleton className="lg:col-span-2 variant=card h-64" />
        <Skeleton variant="card" className="h-64" />
      </div>
    </div>
  );
}

/* ─── Daily Spend Chart ─── */
function DailySpendChart({ data }: { data: Array<{ date: string; amount: number }> }) {
  if (!data.length) return <p className="text-sm text-text-muted text-center py-8">No spend data for this period</p>;

  const maxAmount = Math.max(...data.map(d => d.amount), 1);
  const barHeight = 120;

  return (
    <div className="h-32 flex items-end justify-around gap-1" role="img" aria-label="Daily spend bar chart">
      {data.map((d) => {
        const height = Math.max((d.amount / maxAmount) * barHeight, 4);
        return (
          <div key={d.date} className="flex flex-col items-center gap-1" style={{ width: '100%' }}>
            <div
              className="rounded-t bg-champagne transition-all duration-300 hover:bg-champagne-dim"
              style={{ height: `${height}px`, width: '100%', maxWidth: '40px' }}
              role="button"
              tabIndex={0}
              aria-label={`${d.date}: ${formatCurrency(d.amount)}`}
            />
            <span className="text-[9px] text-text-muted">{new Date(d.date).toLocaleDateString('en-CA', { weekday: 'short' })}</span>
          </div>
        );
      })}
    </div>
  );
}