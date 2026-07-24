'use client';

import React, { useMemo, useState, useCallback } from 'react';
import { AlertCircle, Receipt, ShieldAlert, Mail } from 'lucide-react';
import { motion } from 'framer-motion';
import { useQuery } from '@tanstack/react-query';
import { cn } from '@/lib/utils';

import { Card as ShadcnCard } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { DashboardSkeleton } from '@/components/ui/PremiumSkeletons';
import { PremiumEmptyState } from '@/components/ui/PremiumEmptyState';
import AnimatedCounter from '@/components/ui/AnimatedCounter';
import type { UserRole } from '@/lib/types';
import { supabase, getOrgIdString } from '@/lib/supabase';
import { toast } from 'sonner';
import { getDashboardSummary, getDailySpend } from '@/lib/services/receipts';
import { toNumber, formatCurrency } from '@/lib/ui-utils';
import { fadeUp, staggerMedium, cardHoverSubtle } from '@/lib/animations';
import { Sparkline } from '@/components/charts/Sparkline';

interface DashboardProps {
  /** Navigate to scanner */
  onScan?: () => void;
  /** Current user role */
  role?: UserRole;
  /** Current user ID */
  userId?: string;
}

/** Format YYYY-MM to short month + year label */
function formatMonthLabel(value: string | undefined | null): string {
  if (!value || typeof value !== 'string' || !/^\d{4}-\d{2}$/.test(value)) return String(value || 'Unknown');
  const [y, m] = value.split('-').map(Number);
  return new Date(y, m - 1).toLocaleDateString('en-CA', { month: 'short', year: '2-digit' });
}

/** Return time-appropriate greeting */
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
      return getDashboardSummary(role, userId);
    },
    enabled: !!userId, retry: 1, staleTime: 5 * 60 * 1000,
  });

  const { data: dailyData = [] } = useQuery({
    queryKey: ['daily_spend', userId],
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

  if (isLoading) return <div role="status" aria-live="polite"><DashboardSkeleton /></div>;

  if (error || !summary) {
    const noOrg = error instanceof Error && error.message.includes('No organization');
    return (
      <motion.div variants={fadeUp} initial="hidden" animate="show"
        className="flex min-h-[40vh] flex-col items-center justify-center gap-4 rounded-xl border border-glass-border bg-card p-10 text-center">
        <AlertCircle className="h-10 w-10 text-danger" />
        <h3 className="text-lg font-bold tracking-tight">{noOrg ? 'Organization Required' : 'Sync Error'}</h3>
        <p className="text-sm text-muted-foreground">{noOrg ? 'Join an organization to continue.' : 'Could not load dashboard data.'}</p>
        {!noOrg && <Button variant="outline" onClick={() => refetch()}>Retry</Button>}
    </motion.div>
  );
  }

  const { receiptCount = 0, totalSpent = 0, gstRecoverable = 0 } = summary;

  if (receiptCount === 0) return (
    <PremiumEmptyState
      onScan={onScan}
      onForwardEmail={handleCopyEmail}
      forwardingEmail={forwardingEmail}
    />
  );
  if (role === 'Employee') return <EmployeeView scans={receiptCount} total={totalSpent} gst={gstRecoverable} />;

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
          <Button size="sm" onClick={onScan} className="rounded-xl bg-champagne text-black font-semibold hover:bg-champagne/90 transition-all shadow-md shadow-champagne/20">
            <Receipt className="mr-1.5 h-4 w-4" />
            Scan Receipt
          </Button>
        </div>
      </motion.div>

      {/* Main KPI Cards Grid */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <motion.div variants={fadeUp}>
          <ShadcnCard className="p-6 relative overflow-hidden bg-gradient-to-br from-card via-card to-champagne/5">
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
              ) : <span className="text-xs text-text-muted">Baseline month</span>}
              {dailyData.length >= 2 && (
                <div className="w-24">
                  <Sparkline data={dailyData} color="var(--champagne)" id="kpi-spark" />
                </div>
              )}
            </div>
          </ShadcnCard>
        </motion.div>

        <KpiCard variants={fadeUp} label="Receipts" value={receiptCount.toLocaleString()} icon={<Receipt className="h-4 w-4 text-champagne" />} />
      </div>
    </motion.div>
  );
}

/* ─── Sub-components ─── */

/** KPI metric card with animated counter */
interface KpiCardProps {
  variants: typeof fadeUp;
  label: string;
  value: string;
  icon: React.ReactNode;
}

const KpiCard = React.memo(function KpiCard({ variants: v, label, value, icon }: KpiCardProps) {
  const num = Number(String(value).replace(/,/g, '')) || 0;
  const isPct = value.includes('%');
  return (
    <motion.div variants={v} whileHover={cardHoverSubtle.whileHover} whileTap={cardHoverSubtle.whileTap} transition={cardHoverSubtle.transition}>
      <ShadcnCard className="p-4 h-full antigravity-card" role="figure" aria-label={`${label}: ${value}`}>
        <div className="flex items-center justify-between mb-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-champagne/10">{icon}</div>
        </div>
        <p className="text-[10px] font-semibold uppercase tracking-wider text-text-muted">{label}</p>
        <p className="text-xl font-bold tracking-tight tabular-nums mt-0.5" aria-live="polite" aria-atomic="true">
          {isPct ? value : <AnimatedCounter from={0} to={num} format={(v) => Number.isInteger(v) ? Math.round(v).toLocaleString() : v.toLocaleString()} delay={150} />}
        </p>
      </ShadcnCard>
    </motion.div>
  );
});




/** Employee-restricted view — shows personal stats only */
const EmployeeView = React.memo(function EmployeeView({ scans, total, gst }: { scans: number; total: number; gst: number }) {
  return (
    <motion.div variants={staggerMedium} initial="hidden" animate="show" className="space-y-4" role="region" aria-label="Employee dashboard summary">
      <motion.div variants={fadeUp} className="rounded-xl border border-glass-border bg-card p-8 text-center">
        <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-warning/10 text-warning mx-auto mb-4"><ShieldAlert className="h-6 w-6" /></div>
        <h2 className="text-lg font-bold">Restricted Dashboard</h2>
        <p className="text-sm text-text-secondary mt-2">Detailed financial data is available to owners and accountants.</p>
      </motion.div>
      <div className="grid grid-cols-3 gap-3">
        <div className="rounded-xl border border-glass-border bg-card p-4" role="figure" aria-label={`Scans: ${scans}`}>
          <p className="text-[10px] font-semibold uppercase tracking-wider text-text-muted">My Scans</p>
          <p className="text-xl font-bold tabular-nums mt-0.5">{scans}</p>
        </div>
        <div className="rounded-xl border border-glass-border bg-card p-4" role="figure" aria-label={`Total: ${formatCurrency(total)}`}>
          <p className="text-[10px] font-semibold uppercase tracking-wider text-text-muted">My Total</p>
          <p className="text-xl font-bold tabular-nums mt-0.5">{formatCurrency(total)}</p>
        </div>
        <div className="rounded-xl border border-glass-border bg-card p-4" role="figure" aria-label={`GST: ${formatCurrency(gst)}`}>
          <p className="text-[10px] font-semibold uppercase tracking-wider text-text-muted">My GST</p>
          <p className="text-xl font-bold tabular-nums mt-0.5">{formatCurrency(gst)}</p>
        </div>
      </div>
    </motion.div>
  );
});
