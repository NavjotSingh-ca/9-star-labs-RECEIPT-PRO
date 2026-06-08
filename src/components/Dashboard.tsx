'use client';

import { useMemo, useState } from 'react';
import { Copy as CopyIcon } from 'lucide-react';
import {
  AlertCircle,
  BadgeAlert,
  Camera,
  CheckCircle2,
  Lock,
  Receipt,
  ShieldAlert,
  Wallet,
  FileSearch,
  Gauge,
  Landmark,
} from 'lucide-react';
import { motion } from 'framer-motion';
import { useQuery } from '@tanstack/react-query';
import { cn } from '@/lib/utils';
import dynamic from 'next/dynamic';
import { Skeleton } from '@/components/ui/skeleton';

const SpendingChart = dynamic(() => import('@/components/charts/SpendingChart').then(m => ({ default: m.SpendingChart })), {
  ssr: false,
  loading: () => <Skeleton className="h-48 w-full rounded-xl" />,
});
const DailySpendChart = dynamic(() => import('@/components/charts/DailySpendChart').then(m => ({ default: m.DailySpendChart })), {
  ssr: false,
  loading: () => <Skeleton className="h-64 w-full rounded-xl" />,
});
const CategoryDonut = dynamic(() => import('@/components/charts/CategoryDonut').then(m => ({ default: m.CategoryDonut })), {
  ssr: false,
  loading: () => <Skeleton className="h-64 w-full rounded-xl" />,
});
const Sparkline = dynamic(() => import('@/components/charts/Sparkline').then(m => ({ default: m.Sparkline })), {
  ssr: false,
  loading: () => <Skeleton className="h-12 w-24 rounded" />,
});
import {
  Card as ShadcnCard,
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { DashboardSkeleton } from '@/components/ui/PremiumSkeletons';
import AnimatedCounter from '@/components/ui/AnimatedCounter';

import type { UserRole } from '@/lib/types';
import { supabase, getOrgIdString } from '@/lib/supabase';
import { toast } from 'sonner';
import { getDashboardSummary, getDailySpend } from '@/lib/services/receipts';
import {
  toNumber,
  formatCurrency,
} from '@/lib/ui-utils';

interface DashboardProps {
  onFilterClick: (filterType: string) => void;
  onScan?: () => void;
  role?: UserRole;
  userId?: string;
}

const CATEGORY_COLORS = [
  '#bea98e', // Job Materials
  '#8b5cf6', // Subcontractors
  '#ef4444', // Site Fuel
  '#f59e0b', // Equipment Rental
  '#06b6d4', // Small Tools
  '#ec4899', // Vehicle Maintenance
  '#60a5fa', // Travel/Lodging
  '#10b981', // Office/Admin
];

const currencyFormatter = new Intl.NumberFormat('en-CA', {
  style: 'currency',
  currency: 'CAD',
  maximumFractionDigits: 2,
});

function formatMonthLabel(value: string | undefined | null): string {
  if (!value || typeof value !== 'string' || !/^\d{4}-\d{2}$/.test(value)) return String(value || 'Unknown');
  const [year, month] = value.split('-').map(Number);
  const date = new Date(year, month - 1, 1);
  return date.toLocaleDateString('en-CA', { month: 'short', year: '2-digit' });
}

function formatShortCurrency(value: number): string {
  if (value >= 1000000) return `$${(value / 1000000).toFixed(1)}M`;
  if (value >= 1000) return `$${(value / 1000).toFixed(1)}k`;
  return `$${Math.round(value)}`;
}

function getGreeting(): string {
  const hour = new Date().getHours();
  if (hour < 12) return 'Good morning.';
  if (hour < 17) return 'Good afternoon.';
  return 'Good evening.';
}

export default function Dashboard({
  onFilterClick,
  onScan,
  role = 'Owner',
  userId,
}: DashboardProps) {
  const [forwardingEmail, setForwardingEmail] = useState(false);

  const { data: summary, isLoading, error, refetch } = useQuery({
    queryKey: ['dashboard_summary', role, userId],
    queryFn: () => getDashboardSummary(role, userId!),
    enabled: !!userId,
    retry: false,
    staleTime: 30_000,
  });

  const chartData = useMemo(() => {
    if (!summary?.monthlyTrend) return [];
    return summary.monthlyTrend.map((s: { month: string; amount: number }) => ({
      month: formatMonthLabel(s.month),
      amount: toNumber(s.amount)
    })).reverse();
  }, [summary]);

  // Compute this month & last month spend from trend data
  const thisMonth = useMemo(() => {
    if (!summary?.monthlyTrend?.length) return null;
    const trend = summary.monthlyTrend;
    const latest = trend[trend.length - 1];
    return { amount: toNumber(latest?.amount || 0), month: latest?.month || '' };
  }, [summary]);

  const lastMonth = useMemo(() => {
    if (!summary?.monthlyTrend || summary.monthlyTrend.length < 2) return null;
    const prev = summary.monthlyTrend[summary.monthlyTrend.length - 2];
    return { amount: toNumber(prev?.amount || 0), month: prev?.month || '' };
  }, [summary]);

  const monthOverMonth = useMemo(() => {
    if (!thisMonth || !lastMonth || lastMonth.amount === 0) return null;
    return ((thisMonth.amount - lastMonth.amount) / lastMonth.amount) * 100;
  }, [thisMonth, lastMonth]);

  const topCategories = useMemo(() => {
    if (!summary?.spendingByCategory?.length) return [];
    return [...summary.spendingByCategory]
      .sort((a, b) => b.amount - a.amount)
      .slice(0, 3);
  }, [summary]);

  const { data: dailySpend = [] } = useQuery({
    queryKey: ['daily_spend', userId],
    queryFn: () => getDailySpend(30),
    enabled: !!userId,
    staleTime: 2 * 60 * 1000,
  });

  const last7Days = useMemo(() => {
    if (dailySpend.length < 2) return [];
    return dailySpend.slice(-7);
  }, [dailySpend]);

  const handleForwardEmail = async () => {
    setForwardingEmail(true);
    try {
      const orgId = await getOrgIdString();
      if (!orgId) { toast.error('No organization found'); return; }
      const { data } = await supabase
        .from('organizations')
        .select('receipt_email')
        .eq('id', orgId)
        .single();
      if (data?.receipt_email) {
        await navigator.clipboard.writeText(data.receipt_email);
        toast.success(`Receipt email copied! Send receipts to ${data.receipt_email}`);
      } else {
        toast.error('No receipt email configured for your organization');
      }
    } catch {
      toast.error('Failed to look up receipt email');
    } finally {
      setForwardingEmail(false);
    }
  };

  if (isLoading) return <div role="status" aria-live="polite" aria-label="Loading dashboard"><DashboardSkeleton /></div>;

  if (error || !summary) {
    const isNoOrg = error instanceof Error && error.message.includes('No organization found');
    return (
      <div className="flex min-h-[50vh] flex-col items-center justify-center gap-6 rounded-2xl border bg-card p-12 text-center text-card-foreground shadow-sm" role="alert" aria-live="assertive">
        <div className="flex h-20 w-20 items-center justify-center rounded-2xl bg-destructive/10 text-destructive">
          <AlertCircle className="h-10 w-10" />
        </div>
        <div className="max-w-md space-y-2">
          <h3 className="text-2xl font-bold tracking-tight">
            {isNoOrg ? 'Organization Required' : 'Synchronization Error'}
          </h3>
          <p className="text-sm text-muted-foreground leading-relaxed">
            {isNoOrg 
              ? 'Join an organization to unlock the full power of Leduc Receipt Pro dashboard intelligence.' 
              : 'Our secure link to your financial records is temporarily experiencing high latency.'}
          </p>
        </div>
        {!isNoOrg && (
          <Button variant="outline" className="px-8 py-6 font-bold" onClick={() => refetch()}>
            Reconnect Audit Engine
          </Button>
        )}
      </div>
    );
  }

  const {
    totalSpent = 0,
    gstRecoverable = 0,
    pstRecoverable = 0,
    receiptCount = 0,
    missingBNCount = 0,
    pendingReviewCount = 0,
    flaggedAuditCount = 0,
    highConfidenceCount = 0,
    duplicatesBlockedCount = 0,
    unmatchedBankCount = 0,
    mileageTotalAmount = 0,
    mileageTotalKm = 0,
  } = summary;

  // Empty state for new users
  if (receiptCount === 0) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, ease: 'easeOut' }}
        className="flex flex-col items-center justify-center py-16 text-center"
      >
        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-surface-raised">
          <Receipt className="h-6 w-6 text-text-muted" />
        </div>
        <h2 className="mt-4 text-base font-medium text-text-primary">No receipts yet</h2>
        <p className="mt-1 max-w-sm text-sm text-text-secondary">
          Scan a receipt or forward one from email, and we&rsquo;ll extract every line item automatically.
        </p>
        <div className="mt-6 flex flex-wrap items-center gap-3">
          {onScan && (
            <button
              type="button"
              onClick={onScan}
              className="inline-flex items-center gap-2 rounded-lg bg-champagne px-4 py-2 text-sm font-semibold text-black transition hover:opacity-90"
            >
              <Camera className="h-4 w-4" />
              Scan receipt
            </button>
          )}
          <button
            type="button"
            onClick={handleForwardEmail}
            disabled={forwardingEmail}
            className="inline-flex items-center gap-1.5 text-sm text-text-muted underline underline-offset-4 transition hover:text-text-secondary disabled:opacity-50"
          >
            <CopyIcon className="h-3.5 w-3.5" />
            {forwardingEmail ? 'Looking up...' : 'Forward an email'}
          </button>
        </div>
      </motion.div>
    );
  }

  return role === 'Employee' ? (
    <AccessDeniedDashboard 
      scans={receiptCount} 
      total={totalSpent} 
      gst={gstRecoverable} 
    />
  ) : (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-6 duration-1000" aria-live="polite" aria-atomic="true">
      {/* Greeting */}
      <motion.p
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="text-sm font-medium text-text-muted"
      >
        {getGreeting()}
      </motion.p>

      {/* Hero Metric — This Month's Spend */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.25, ease: 'easeOut' }}
        className="rounded-xl border border-glass-border bg-card p-4 sm:p-8 relative overflow-hidden"
      >
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-br from-champagne/[0.03] to-transparent" />
        <div className="relative flex flex-col gap-1 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-tight text-muted-foreground">
              {thisMonth ? formatMonthLabel(thisMonth.month) : 'This Month'} Spend
            </p>
            <p className="mt-1 text-3xl font-semibold tracking-tight tabular-nums text-text-primary sm:text-5xl sm:text-6xl">
              {thisMonth ? (
                <AnimatedCounter
                  from={0}
                  to={thisMonth.amount}
                  format={(v) => formatCurrency(v)}
                  delay={100}
                />
              ) : '$0.00'}
            </p>
            <div className="mt-3 flex items-center gap-3">
              {monthOverMonth !== null && (
                <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-semibold ${
                  monthOverMonth >= 0
                    ? 'bg-emerald-success/10 text-emerald-light'
                    : 'bg-danger/10 text-danger'
                }`}>
                  {monthOverMonth >= 0 ? '↑' : '↓'} {Math.abs(monthOverMonth).toFixed(1)}%
                </span>
              )}
              {last7Days.length >= 2 && (
                <Sparkline data={last7Days} />
              )}
            </div>
          </div>
          <div className="flex items-center gap-2 mt-4 sm:mt-0">
            <Badge variant="outline" className="rounded-full border-champagne/20 bg-champagne/10 px-3 py-1 text-[10px] font-semibold tracking-tight text-champagne">
              {receiptCount.toLocaleString()} receipts
            </Badge>
          </div>
        </div>
      </motion.div>

      {/* Secondary KPIs */}
      <motion.div
        variants={{
          hidden: { opacity: 0 },
          show: { transition: { staggerChildren: 0.08 } }
        }}
        initial="hidden"
        animate="show"
        className="grid grid-cols-1 gap-4 sm:grid-cols-3"
      >
        <StatCard
          label="Pending Review"
          value={String(pendingReviewCount || 0)}
          helper="Receipts awaiting approval"
          icon={<CheckCircle2 className="h-6 w-6" />}
        />
        <StatCard
          label="Total Receipts"
          value={receiptCount.toLocaleString()}
          helper="All-time records stored"
          icon={<Receipt className="h-6 w-6" />}
        />
        <StatCard
          label="AI Confidence"
          value={String(highConfidenceCount || 0)}
          helper="High-confidence extractions"
          icon={<ShieldAlert className="h-6 w-6" />}
        />
      </motion.div>

      {/* Daily Spend Trend */}
      <div>
        <DailySpendChart data={dailySpend} />
      </div>

      {/* Categories + Tax Recovery */}
      <div className="grid gap-6 lg:grid-cols-5">
        <div className="lg:col-span-3">
          <CategoryDonut data={summary.spendingByCategory || []} />
        </div>
        <div className="lg:col-span-2">
          <GSTRecoveryMeter 
            gst={gstRecoverable} 
            pst={pstRecoverable} 
            total={totalSpent} 
          />
        </div>
      </div>

      {/* Monthly Spend Trend */}
      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <SpendingChart data={chartData} />
        </div>
        <div className="lg:col-span-1 space-y-4">
          {mileageTotalKm > 0 && (
            <div className="rounded-xl border border-glass-border bg-card p-5 flex items-start gap-4">
              <div className="h-10 w-10 rounded-xl bg-emerald-success/10 flex items-center justify-center text-emerald-light shrink-0">
                <Gauge className="h-5 w-5" />
              </div>
              <div>
                <p className="text-sm font-semibold text-text-primary">Mileage Deduction</p>
                <p className="mt-1 text-xs text-text-secondary">
                  <span className="font-medium text-emerald-light">{formatCurrency(mileageTotalAmount)}</span> across {mileageTotalKm.toLocaleString()} km
                </p>
              </div>
            </div>
          )}
          {unmatchedBankCount > 0 && (
            <div className="rounded-xl border border-glass-border bg-card p-5 flex items-start gap-4">
              <div className="h-10 w-10 rounded-xl bg-warning/10 flex items-center justify-center text-warning shrink-0">
                <Landmark className="h-5 w-5" />
              </div>
              <div>
                <p className="text-sm font-semibold text-text-primary">Unmatched Transactions</p>
                <p className="mt-1 text-xs text-text-secondary">
                  <span className="font-medium text-warning">{unmatchedBankCount}</span> bank transaction{unmatchedBankCount === 1 ? '' : 's'} with no matching receipt
                </p>
              </div>
            </div>
          )}
          {duplicatesBlockedCount > 0 && (
            <div className="rounded-xl border border-glass-border bg-card p-5 flex items-start gap-4">
              <div className="h-10 w-10 rounded-xl bg-champagne/10 flex items-center justify-center text-champagne shrink-0">
                <Lock className="h-5 w-5" />
              </div>
              <div>
                <p className="text-sm font-semibold text-text-primary">Duplicates Blocked</p>
                <p className="mt-1 text-xs text-text-secondary">
                  <span className="font-medium text-champagne">{duplicatesBlockedCount}</span> duplicate{duplicatesBlockedCount === 1 ? '' : 's'} prevented by AI
                </p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Audit Alerts */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-semibold tracking-tight text-text-muted">Alerts</h3>
          <button
            type="button"
            onClick={() => onFilterClick('all')}
            className="text-xs font-medium text-champagne hover:text-champagne-dim transition-colors"
          >
            View all records →
          </button>
        </div>
        <div className="grid gap-4 sm:grid-cols-3">
          <AlertTile
            title="Incomplete Records"
            count={missingBNCount}
            description="Missing supplier GST or transaction dates."
            tone="danger"
            onClick={() => onFilterClick('missing-bn')}
          />
          <AlertTile
            title="Awaiting Review"
            count={pendingReviewCount}
            description="Submissions requiring your final approval."
            tone="info"
            onClick={() => onFilterClick('pending-review')}
          />
          <AlertTile
            title="Audit Flags"
            count={flaggedAuditCount}
            description="Warnings for duplicates or thermal risk."
            tone="warning"
            onClick={() => onFilterClick('flagged-audit')}
          />
        </div>
      </div>
    </div>
  );
}

function StatCard({ label, value, helper, icon, className = "", trend = null, sparkline }: {
  label: string; value: string; helper: string; icon: React.ReactNode; className?: string;
  trend?: { value: string; up: boolean } | null;
  sparkline?: { date: string; amount: number }[];
}) {
  const numValue = Number(String(value).replace(/,/g, '')) || 0;
  return (
    <motion.div
      layout
      variants={{ hidden: { opacity: 0, y: 20 }, show: { opacity: 1, y: 0 } }}
      whileHover={{ scale: 1.02 }}
      className="h-full"
    >
      <ShadcnCard className={cn(
        "rounded-xl border border-glass-border bg-card text-card-foreground transition-all duration-200 relative overflow-hidden group h-full hover:-translate-y-[1px] hover:border-glass-border-hover hover:shadow-[0_0_24px_-4px_var(--champagne-glow)]",
        className
      )}>
        <div className="relative z-10 flex flex-col h-full justify-between p-6">
          <div className="flex items-center justify-between">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-champagne/10 text-champagne">
              {icon}
            </div>
            <div className="flex items-center gap-2">
              {sparkline && <Sparkline data={sparkline} />}
              {trend && (
                <Badge variant="secondary" className={`px-2 py-0.5 text-[10px] font-bold tracking-widest ${trend.up ? 'bg-emerald-success/15 text-emerald-light dark:text-emerald-light' : 'bg-danger/15 text-danger dark:text-danger'}`}>
                  {trend.up ? '↑' : '↓'} {trend.value}
                </Badge>
              )}
            </div>
          </div>
          <div className="mt-4">
            <p className="text-[11px] font-semibold uppercase tracking-tight text-muted-foreground">{label}</p>
            <p className="mt-1 text-2xl font-semibold tracking-tight tabular-nums sm:text-4xl">
              <AnimatedCounter
                from={0}
                to={numValue}
                format={(v) => Number.isInteger(v) ? Math.round(v).toLocaleString() : v.toLocaleString()}
                delay={200}
              />
            </p>
            <p className="mt-1 text-xs text-muted-foreground font-medium">{helper}</p>
          </div>
        </div>
      </ShadcnCard>
    </motion.div>
  );
}

function GSTRecoveryMeter({ gst, pst, total }: { gst: number; pst: number; total: number }) {
  const combinedTax = gst + pst;
  const effectiveRate = total > 0 ? (combinedTax / total) * 100 : 0;
  const fillPct = Math.min((effectiveRate / 5) * 100, 100);

  return (
    <ShadcnCard className="rounded-xl border bg-card text-card-foreground shadow-sm relative overflow-hidden flex flex-col justify-center items-center p-8 group">
      <div className="absolute inset-0 bg-gradient-to-br from-emerald-success/[0.02] to-transparent pointer-events-none" />
      <div className="relative">
        <svg width="180" height="110" viewBox="0 0 120 70">
          <path d="M 10 65 A 50 50 0 0 1 110 65" fill="none" stroke="var(--glass-border)" strokeWidth="8" strokeLinecap="round" />
          <motion.path
            d="M 10 65 A 50 50 0 0 1 110 65" fill="none" stroke="var(--emerald-light)" strokeWidth="8" strokeLinecap="round"
            initial={{ strokeDasharray: "157 157", strokeDashoffset: 157 }}
            animate={{ strokeDashoffset: 157 - (fillPct / 100) * 157 }}
            transition={{ duration: 2, ease: "easeOut" }}
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-end pb-3">
          <span className="text-3xl font-black text-text-primary tracking-tighter">{effectiveRate.toFixed(1)}%</span>
          <span className="text-[10px] font-bold uppercase tracking-tight text-text-muted">Effective Rate</span>
        </div>
      </div>
      <div className="mt-8 grid grid-cols-2 gap-6 w-full pt-6 border-t border-glass-border">
        <div className="text-center">
          <p className="text-[10px] font-black text-emerald-light uppercase tracking-tight">GST Capture</p>
          <p className="text-lg font-bold tabular-nums text-text-primary">{formatShortCurrency(gst)}</p>
        </div>
        <div className="text-center">
          <p className="text-[10px] font-black text-champagne uppercase tracking-tight">PST Capture</p>
          <p className="text-lg font-bold tabular-nums text-text-primary">{formatShortCurrency(pst)}</p>
        </div>
      </div>
    </ShadcnCard>
  );
}

function AlertTile({ title, count, description, tone, onClick }: { title: string; count: number; description: string; tone: 'danger' | 'info' | 'warning'; onClick: () => void }) {
  const toneMap = {
    danger: "border-danger/20 bg-danger/[0.04] text-danger",
    info: "border-champagne/20 bg-champagne/5 text-champagne",
    warning: "border-warning/20 bg-warning/[0.04] text-warning",
  }[tone];

  return (
    <motion.button
      onClick={onClick}
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      className={cn("group rounded-[2rem] border p-5 text-left transition-all hover:bg-surface-raised", toneMap)}>
      <div className="flex justify-between items-start mb-4">
        <div className={cn("flex h-10 w-10 items-center justify-center rounded-[2rem]", tone === 'danger' ? 'bg-danger/10' : tone === 'info' ? 'bg-champagne/10' : 'bg-warning/10')}>
          {tone === 'danger' ? <BadgeAlert className="h-5 w-5" /> : tone === 'info' ? <FileSearch className="h-5 w-5" /> : <ShieldAlert className="h-5 w-5" />}
        </div>
        <span className="text-2xl font-black tabular-nums">{count}</span>
      </div>
      <p className="text-sm font-bold text-text-primary mb-1">{title}</p>
      <p className="text-[11px] font-medium leading-relaxed text-text-secondary opacity-70 line-clamp-2">{description}</p>
    </motion.button>
  );
}

function AccessDeniedDashboard({ scans, total, gst }: { scans: number; total: number; gst: number }) {
  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-6 duration-1000" aria-live="polite" aria-atomic="true">
      <div className="flex flex-col items-center justify-center rounded-2xl border bg-card p-12 text-center text-card-foreground shadow-sm">
        <div className="h-16 w-16 rounded-xl bg-warning/10 flex items-center justify-center text-warning mb-6 shadow-inner">
          <Lock className="h-8 w-8" />
        </div>
        <h2 className="text-2xl font-bold tracking-tight">Executive Intelligence Restricted</h2>
        <p className="mt-2 max-w-md text-sm text-muted-foreground leading-relaxed font-medium">
          Detailed financial trends and audit alerts are reserved for account owners and accountants. 
          Your personal capture statistics are displayed below.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <StatCard label="My Scans" value={scans.toLocaleString()} helper="Total receipts captured" icon={<Receipt className="h-6 w-6" />} />
        <StatCard label="My Total" value={formatCurrency(total)} helper="Spend contribution" icon={<Wallet className="h-6 w-6" />} />
        <StatCard label="My GST" value={formatCurrency(gst)} helper="Tax yield generated" icon={<CheckCircle2 className="h-6 w-6" />} />
      </div>
    </div>
  );
}