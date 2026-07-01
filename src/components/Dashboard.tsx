'use client';

import React, { useMemo, useState } from 'react';
import { Copy, AlertCircle, Camera, CheckCircle2, Receipt, ShieldAlert, Wallet, FileSearch, Gauge, Landmark, TrendingUp, Sparkles, Percent } from 'lucide-react';
import { motion } from 'framer-motion';
import { useQuery } from '@tanstack/react-query';
import { cn } from '@/lib/utils';
import dynamic from 'next/dynamic';
import { Skeleton } from '@/components/ui/skeleton';

const SpendingChart = dynamic(() => import('@/components/charts/SpendingChart').then(m => ({ default: m.SpendingChart })), { ssr: false, loading: () => <Skeleton className="h-48 w-full rounded-xl" /> });
const DailySpendChart = dynamic(() => import('@/components/charts/DailySpendChart').then(m => ({ default: m.DailySpendChart })), { ssr: false, loading: () => <Skeleton className="h-64 w-full rounded-xl" /> });
const CategoryDonut = dynamic(() => import('@/components/charts/CategoryDonut').then(m => ({ default: m.CategoryDonut })), { ssr: false, loading: () => <Skeleton className="h-64 w-full rounded-xl" /> });
const Sparkline = dynamic(() => import('@/components/charts/Sparkline').then(m => ({ default: m.Sparkline })), { ssr: false, loading: () => <Skeleton className="h-10 w-20 rounded-lg" /> });

import { Card as ShadcnCard } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { DashboardSkeleton } from '@/components/ui/PremiumSkeletons';
import AnimatedCounter from '@/components/ui/AnimatedCounter';
import type { UserRole } from '@/lib/types';
import { supabase, getOrgIdString } from '@/lib/supabase';
import { toast } from 'sonner';
import { getDashboardSummary, getDailySpend } from '@/lib/services/receipts';
import { toNumber, formatCurrency } from '@/lib/ui-utils';

interface DashboardProps {
  onFilterClick: (filterType: string) => void;
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

const fadeUp = {
  hidden: { opacity: 0, y: 12 },
  show: { opacity: 1, y: 0, transition: { duration: 0.3 } },
};

const container = {
  hidden: { opacity: 0 },
  show: { transition: { staggerChildren: 0.05 } },
};

export default function Dashboard({ onFilterClick, onScan, role = 'Owner', userId }: DashboardProps) {
  const [forwardingEmail, setForwardingEmail] = useState(false);

  const { data: summary, isLoading, error, refetch } = useQuery({
    queryKey: ['dashboard_summary', role, userId],
    queryFn: () => getDashboardSummary(role, userId!),
    enabled: !!userId, retry: false, staleTime: 5 * 60 * 1000,
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

  const { data: dailySpend = [] } = useQuery({
    queryKey: ['daily_spend', userId],
    queryFn: () => getDailySpend(30),
    enabled: !!userId, staleTime: 2 * 60 * 1000,
  });

  const last7 = useMemo(() => dailySpend.length >= 2 ? dailySpend.slice(-7) : [], [dailySpend]);

  const handleCopyEmail = async () => {
    setForwardingEmail(true);
    try {
      const orgId = await getOrgIdString();
      if (!orgId) { toast.error('No organization found'); return; }
      const { data } = await supabase.from('organizations').select('receipt_email').eq('id', orgId).single();
      if (data?.receipt_email) {
        await navigator.clipboard.writeText(data.receipt_email);
        toast.success(`Receipt email copied: ${data.receipt_email}`);
      } else toast.error('No receipt email configured');
    } catch { toast.error('Failed to lookup'); }
    finally { setForwardingEmail(false); }
  };

  if (isLoading) return <div role="status" aria-live="polite"><DashboardSkeleton /></div>;

  if (error || !summary) {
    const noOrg = error instanceof Error && error.message.includes('No organization');
    return (
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
        className="flex min-h-[40vh] flex-col items-center justify-center gap-4 rounded-xl border border-glass-border bg-card p-10 text-center">
        <AlertCircle className="h-10 w-10 text-danger" />
        <h3 className="text-lg font-bold tracking-tight">{noOrg ? 'Organization Required' : 'Sync Error'}</h3>
        <p className="text-sm text-muted-foreground">{noOrg ? 'Join an organization to continue.' : 'Could not load dashboard data.'}</p>
        {!noOrg && <Button variant="outline" onClick={() => refetch()}>Retry</Button>}
    </motion.div>
  );
  }

  const {
    totalSpent = 0, gstRecoverable = 0, pstRecoverable = 0, receiptCount = 0,
    missingBNCount = 0, pendingReviewCount = 0, flaggedAuditCount = 0,
    highConfidenceCount = 0, duplicatesBlockedCount = 0, unmatchedBankCount = 0,
    mileageTotalAmount = 0, mileageTotalKm = 0,
  } = summary;

  if (receiptCount === 0) return <EmptyState onScan={onScan} handleCopyEmail={handleCopyEmail} forwardingEmail={forwardingEmail} />;
  if (role === 'Employee') return <EmployeeView scans={receiptCount} total={totalSpent} gst={gstRecoverable} />;

  const recoveryPct = totalSpent > 0 ? ((gstRecoverable + pstRecoverable) / totalSpent) * 100 : 0;

  return (
    <motion.div variants={container} initial="hidden" animate="show" className="space-y-4" aria-live="polite">
      {/* Greeting + Row 1: Hero + Stats */}
      <motion.p variants={fadeUp} className="text-xs font-medium text-text-muted">{getGreeting()}</motion.p>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-4">
        {/* Hero metric — spans 1 col on mobile, 1 on desktop */}
        <motion.div variants={fadeUp} className="sm:col-span-1">
          <ShadcnCard className="p-5">
            <p className="text-[10px] font-semibold uppercase tracking-wider text-text-muted mb-1">
              {thisMonth ? formatMonthLabel(thisMonth.month) : 'This Month'}
            </p>
            <p className="text-3xl font-bold tracking-tight tabular-nums sm:text-4xl text-text-primary">
              {thisMonth ? <AnimatedCounter from={0} to={thisMonth.amount} format={(v) => formatCurrency(v)} delay={80} /> : '$0.00'}
            </p>
            <div className="flex items-center gap-3 mt-2">
              {mom !== null && (
                <span className={cn("inline-flex items-center gap-1 rounded-md px-1.5 py-0.5 text-[10px] font-semibold", mom >= 0 ? 'bg-accent/10 text-accent' : 'bg-danger/10 text-danger')}>
                  <span className={cn("h-1.5 w-1.5 rounded-full", mom >= 0 ? 'bg-accent' : 'bg-danger')} />
                  {mom >= 0 ? '+' : ''}{Math.abs(mom).toFixed(1)}%
                </span>
              )}
              {last7.length >= 2 && (
                <span className="inline-flex items-center gap-1 rounded-md bg-accent/5 px-1.5 py-0.5"><Sparkline data={last7} /><span className="text-[10px] text-text-muted">7d</span></span>
              )}
            </div>
          </ShadcnCard>
        </motion.div>

        <KpiCard variants={fadeUp} label="Pending" value={String(pendingReviewCount || 0)} icon={<CheckCircle2 className="h-4 w-4 text-accent" />} />
        <KpiCard variants={fadeUp} label="Receipts" value={receiptCount.toLocaleString()} icon={<Receipt className="h-4 w-4 text-accent" />} />
        <KpiCard variants={fadeUp} label="Recovery" value={`${recoveryPct.toFixed(1)}%`} icon={<Percent className="h-4 w-4 text-accent" />} />
      </div>

      {/* Row 2: Daily Spend — full width */}
      <motion.div variants={fadeUp}>
        <DailySpendChart data={dailySpend} />
      </motion.div>

      {/* Row 3: Categories + Monthly Trend */}
      <div className="grid gap-4 lg:grid-cols-2">
        <motion.div variants={fadeUp}>
          <CategoryDonut data={summary.spendingByCategory || []} />
        </motion.div>
        <motion.div variants={fadeUp} className="space-y-4">
          <SpendingChart data={(summary.monthlyTrend || []).map((s: { month: string; amount: number }) => ({ month: formatMonthLabel(s.month), amount: toNumber(s.amount) })).reverse()} />
        </motion.div>
      </div>

      {/* Row 4: Insights + Alerts */}
      <div className="grid gap-4 lg:grid-cols-2">
        <motion.div variants={fadeUp} className="space-y-2">
          {mileageTotalKm > 0 && <InsightCard icon={<Gauge className="h-4 w-4" />} title="Mileage" value={formatCurrency(mileageTotalAmount)} subtitle={`${mileageTotalKm.toLocaleString()} km`} />}
          {unmatchedBankCount > 0 && <InsightCard icon={<Landmark className="h-4 w-4" />} title="Unmatched" value={String(unmatchedBankCount)} subtitle="transactions" />}
          {duplicatesBlockedCount > 0 && <InsightCard icon={<ShieldAlert className="h-4 w-4" />} title="Duplicates Blocked" value={String(duplicatesBlockedCount)} subtitle="prevented" />}
        </motion.div>

        <motion.div variants={fadeUp} className="space-y-2">
          <p className="text-[10px] font-semibold uppercase tracking-wider text-text-muted">Alerts</p>
          <div className="space-y-2">
            <AlertTile title="Incomplete" count={missingBNCount} tone="danger" onClick={() => onFilterClick('missing-bn')} />
            <AlertTile title="Awaiting Review" count={pendingReviewCount} tone="info" onClick={() => onFilterClick('pending-review')} />
            <AlertTile title="Audit Flags" count={flaggedAuditCount} tone="warning" onClick={() => onFilterClick('flagged-audit')} />
          </div>
        </motion.div>
      </div>
    </motion.div>
  );
}

/* ─── Sub-components ─── */

const KpiCard = React.memo(function KpiCard({ variants: v, label, value, icon }: { variants: typeof fadeUp; label: string; value: string; icon: React.ReactNode }) {
  const num = Number(String(value).replace(/,/g, '')) || 0;
  const isPct = value.includes('%');
  return (
    <motion.div variants={v}>
      <ShadcnCard className="p-4 h-full">
        <div className="flex items-center justify-between mb-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-accent/10">{icon}</div>
        </div>
        <p className="text-[10px] font-semibold uppercase tracking-wider text-text-muted">{label}</p>
        <p className="text-xl font-bold tracking-tight tabular-nums mt-0.5">
          {isPct ? value : <AnimatedCounter from={0} to={num} format={(v) => Number.isInteger(v) ? Math.round(v).toLocaleString() : v.toLocaleString()} delay={150} />}
        </p>
      </ShadcnCard>
    </motion.div>
  );
});

const InsightCard = React.memo(function InsightCard({ icon, title, value, subtitle }: { icon: React.ReactNode; title: string; value: string; subtitle: string }) {
  return (
    <div className="flex items-center gap-3 rounded-xl border border-glass-border bg-card p-4 transition hover:border-glass-border-hover">
      <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-accent/10 text-accent shrink-0">{icon}</div>
      <div className="min-w-0">
        <p className="text-sm font-semibold text-text-primary">{title}</p>
        <p className="text-xs text-text-secondary mt-0.5"><span className="font-semibold">{value}</span> {subtitle}</p>
      </div>
    </div>
  );
});

const AlertTile = React.memo(function AlertTile({ title, count, tone, onClick }: { title: string; count: number; tone: 'danger' | 'info' | 'warning'; onClick: () => void }) {
  const leftBorder = {
    danger: 'border-l-accent/60',
    info: 'border-l-blue-500/60',
    warning: 'border-l-warning/60',
  }[tone];

  const iconMap = {
    danger: <AlertCircle className="h-4 w-4" />,
    info: <FileSearch className="h-4 w-4" />,
    warning: <ShieldAlert className="h-4 w-4" />,
  };

  return (
    <button onClick={onClick} className="flex items-center justify-between w-full rounded-xl border border-glass-border bg-card p-3 text-left transition hover:border-glass-border-hover hover:shadow-sm cursor-pointer">
      <div className="flex items-center gap-2.5">
        <div className={cn("h-8 w-8 rounded-lg flex items-center justify-center", tone === 'danger' ? 'bg-danger/10 text-danger' : tone === 'info' ? 'bg-blue-500/10 text-blue-500' : 'bg-warning/10 text-warning')}>
          {iconMap[tone]}
        </div>
        <span className="text-sm font-medium text-text-primary">{title}</span>
      </div>
      <span className="text-lg font-bold tabular-nums tabular-nums">{count}</span>
    </button>
  );
});

const EmptyState = React.memo(function EmptyState({ onScan, handleCopyEmail, forwardingEmail }: { onScan?: () => void; handleCopyEmail: () => void; forwardingEmail: boolean }) {
  return (
    <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="flex flex-col items-center justify-center py-16 text-center">
      <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-xl bg-accent/10 text-accent border border-accent/20">
        <Receipt className="h-7 w-7" />
      </div>
      <h2 className="text-lg font-bold tracking-tight">Start with your first receipt</h2>
      <p className="mt-2 max-w-md text-sm text-text-secondary">Scan or upload a receipt to automatically extract data and begin tracking your finances.</p>
      <div className="mt-6 flex gap-3">
        {onScan && <Button onClick={onScan} className="gap-2 bg-accent text-white rounded-lg hover:bg-accent-dim"><Camera className="h-4 w-4" /> Scan Receipt</Button>}
        <button onClick={handleCopyEmail} disabled={forwardingEmail} className="text-xs text-text-muted underline underline-offset-4 hover:text-text-secondary">{forwardingEmail ? 'Loading...' : 'Forward from email'}</button>
      </div>
      <div className="mt-12 grid gap-4 sm:grid-cols-3 max-w-xl">
        {[
          { icon: Sparkles, title: 'AI Extraction', desc: 'Auto-detects vendors, line items, taxes, and categories.' },
          { icon: ShieldAlert, title: 'CRA Compliance', desc: 'Real-time scoring ensures every receipt meets audit requirements.' },
          { icon: TrendingUp, title: 'Financial Intel', desc: 'Dashboards, tax recovery estimates, and spend trends.' },
        ].map((f, i) => (
          <motion.div key={f.title} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 + i * 0.08 }} className="text-center">
            <div className="mx-auto mb-2 flex h-9 w-9 items-center justify-center rounded-lg bg-accent/10 text-accent"><f.icon className="h-4.5 w-4.5" /></div>
            <h3 className="text-sm font-semibold">{f.title}</h3>
            <p className="text-xs text-text-muted mt-1">{f.desc}</p>
          </motion.div>
        ))}
      </div>
    </motion.div>
  );
});

const EmployeeView = React.memo(function EmployeeView({ scans, total, gst }: { scans: number; total: number; gst: number }) {
  return (
    <motion.div variants={container} initial="hidden" animate="show" className="space-y-4">
      <motion.div variants={fadeUp} className="rounded-xl border border-glass-border bg-card p-8 text-center">
        <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-warning/10 text-warning mx-auto mb-4"><ShieldAlert className="h-6 w-6" /></div>
        <h2 className="text-lg font-bold">Restricted Dashboard</h2>
        <p className="text-sm text-text-secondary mt-2">Detailed financial data is available to owners and accountants.</p>
      </motion.div>
      <div className="grid grid-cols-3 gap-3">
        <div className="rounded-xl border border-glass-border bg-card p-4">
          <p className="text-[10px] font-semibold uppercase tracking-wider text-text-muted">My Scans</p>
          <p className="text-xl font-bold tabular-nums mt-0.5">{scans}</p>
        </div>
        <div className="rounded-xl border border-glass-border bg-card p-4">
          <p className="text-[10px] font-semibold uppercase tracking-wider text-text-muted">My Total</p>
          <p className="text-xl font-bold tabular-nums mt-0.5">{formatCurrency(total)}</p>
        </div>
        <div className="rounded-xl border border-glass-border bg-card p-4">
          <p className="text-[10px] font-semibold uppercase tracking-wider text-text-muted">My GST</p>
          <p className="text-xl font-bold tabular-nums mt-0.5">{formatCurrency(gst)}</p>
        </div>
      </div>
    </motion.div>
  );
});
