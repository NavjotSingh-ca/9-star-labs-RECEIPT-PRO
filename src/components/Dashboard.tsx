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
  TrendingUp,
  Sparkles,
  Percent,
} from 'lucide-react';
import { motion } from 'framer-motion';
import { useQuery } from '@tanstack/react-query';
import { cn } from '@/lib/utils';
import dynamic from 'next/dynamic';
import { Skeleton } from '@/components/ui/skeleton';

const SpendingChart = dynamic(() => import('@/components/charts/SpendingChart').then(m => ({ default: m.SpendingChart })), {
  ssr: false,
  loading: () => <Skeleton className="h-48 w-full rounded-lg" />,
});
const DailySpendChart = dynamic(() => import('@/components/charts/DailySpendChart').then(m => ({ default: m.DailySpendChart })), {
  ssr: false,
  loading: () => <Skeleton className="h-64 w-full rounded-lg" />,
});
const CategoryDonut = dynamic(() => import('@/components/charts/CategoryDonut').then(m => ({ default: m.CategoryDonut })), {
  ssr: false,
  loading: () => <Skeleton className="h-64 w-full rounded-lg" />,
});
const Sparkline = dynamic(() => import('@/components/charts/Sparkline').then(m => ({ default: m.Sparkline })), {
  ssr: false,
  loading: () => <Skeleton className="h-10 w-20 rounded-lg" />,
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

/* ─── Stagger Animation Variants ─── */
const containerVariants = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { staggerChildren: 0.06 },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 16 },
  show: { opacity: 1, y: 0, transition: { duration: 0.35, ease: 'easeOut' as const } },
};

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
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex min-h-[50vh] flex-col items-center justify-center gap-5 rounded-lg border border-glass-border bg-card p-12 text-center text-card-foreground shadow-sm" role="alert" aria-live="assertive"
      >
        <div className="flex h-16 w-16 items-center justify-center rounded-xl bg-danger/10 text-danger">
          <AlertCircle className="h-8 w-8" />
        </div>
        <div className="max-w-md space-y-2">
          <h3 className="text-lg font-bold tracking-tight">
            {isNoOrg ? 'Organization Required' : 'Synchronization Error'}
          </h3>
          <p className="text-sm text-muted-foreground leading-relaxed">
            {isNoOrg 
              ? 'Join an organization to unlock the full power of Leduc Receipt Pro dashboard intelligence.' 
              : 'Our secure link to your financial records is temporarily experiencing high latency.'}
          </p>
        </div>
        {!isNoOrg && (
          <Button variant="outline" className="px-6 py-2.5 font-semibold" onClick={() => refetch()}>
            Reconnect
          </Button>
        )}
      </motion.div>
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
        transition={{ duration: 0.35, ease: 'easeOut' as const }}
        className="flex flex-col items-center justify-center py-16 text-center"
      >
        <div className="mb-5 flex h-14 w-14 items-center justify-center rounded-xl bg-champagne/10 text-champagne border border-champagne/20">
          <Receipt className="h-7 w-7" />
        </div>
        <h2 className="text-lg font-bold tracking-tight text-text-primary">Your financial picture starts here</h2>
        <p className="mt-2 max-w-md text-sm text-text-secondary leading-relaxed">
          Scan your first receipt to unlock AI-powered extraction, CRA compliance scoring, and real-time audit intelligence.
        </p>
        <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
          {onScan && (
            <Button
              onClick={onScan}
              className="gap-2 bg-champagne text-black rounded-lg hover:bg-champagne-dim hover:shadow-[0_0_24px_-4px_rgba(190,169,142,0.4)]"
            >
              <Camera className="h-4 w-4" />
              Scan your first receipt
            </Button>
          )}
          <button
            type="button"
            onClick={handleForwardEmail}
            disabled={forwardingEmail}
            className="inline-flex items-center gap-1.5 text-sm text-text-muted underline underline-offset-4 transition hover:text-text-secondary disabled:opacity-50"
          >
            <CopyIcon className="h-3.5 w-3.5" />
            {forwardingEmail ? 'Looking up...' : 'Forward from email'}
          </button>
        </div>
        {/* Feature highlights */}
        <div className="mt-12 grid gap-5 sm:grid-cols-3 max-w-2xl">
          {[
            { icon: Sparkles, title: 'AI Extraction', desc: 'Auto-detects vendors, line items, taxes, and categories from any receipt photo.' },
            { icon: ShieldAlert, title: 'CRA Compliance', desc: 'Real-time scoring ensures every receipt meets CRA audit requirements.' },
            { icon: TrendingUp, title: 'Financial Intelligence', desc: 'Dashboards, tax recovery estimates, and spend trends at your fingertips.' },
          ].map((feature, i) => (
            <motion.div
              key={feature.title}
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.15 + i * 0.08, duration: 0.35 }}
              className="text-center"
            >
              <div className="mx-auto mb-2 flex h-9 w-9 items-center justify-center rounded-lg bg-champagne/10 text-champagne">
                <feature.icon className="h-4.5 w-4.5" />
              </div>
              <h3 className="text-sm font-semibold text-text-primary">{feature.title}</h3>
              <p className="mt-1 text-xs text-text-muted leading-relaxed">{feature.desc}</p>
            </motion.div>
          ))}
        </div>
      </motion.div>
    );
  }

  const momColor = monthOverMonth !== null
    ? monthOverMonth >= 0 ? 'text-emerald-light' : 'text-danger'
    : 'text-text-muted';

  const recoveryPct = totalSpent > 0 ? ((gstRecoverable + pstRecoverable) / totalSpent) * 100 : 0;

  return role === 'Employee' ? (
    <AccessDeniedDashboard 
      scans={receiptCount} 
      total={totalSpent} 
      gst={gstRecoverable} 
    />
  ) : (
    <>
      {/* ─── Hero — Dark premium section ─── */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative mb-6 overflow-hidden rounded-lg border border-champagne/15 bg-gradient-to-br from-[var(--champagne-deep)]/[0.12] via-[var(--card)] to-[var(--champagne)]/[0.05] p-6"
      >
        {/* Ambient glow */}
        <div className="pointer-events-none absolute -right-24 -top-24 h-48 w-48 rounded-full bg-champagne/8 blur-[80px]" />
        <div className="pointer-events-none absolute -bottom-24 -left-24 h-48 w-48 rounded-full bg-champagne/6 blur-[80px]" />

        <div className="relative flex flex-col gap-1 sm:flex-row sm:items-end sm:justify-between">
          <div className="min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-text-muted">
                {thisMonth ? formatMonthLabel(thisMonth.month) : 'This Month'} Spend
              </p>
              <span className="text-text-muted/40">·</span>
              <span className="text-[11px] text-text-secondary">{receiptCount} receipts</span>
            </div>
            <p className="text-4xl font-semibold tracking-tight tabular-nums text-text-primary sm:text-5xl">
              {thisMonth ? (
                <AnimatedCounter
                  from={0}
                  to={thisMonth.amount}
                  format={(v) => formatCurrency(v)}
                  delay={100}
                />
              ) : '$0.00'}
            </p>
            <div className="flex items-center gap-3 mt-2">
              {monthOverMonth !== null && (
                <span className={cn(
                  "inline-flex items-center gap-1.5 rounded-md px-2 py-0.5 text-xs font-semibold",
                  monthOverMonth >= 0
                    ? 'bg-emerald-success/10 text-emerald-light'
                    : 'bg-danger/10 text-danger'
                )}>
                  <span className={cn(
                    "inline-flex h-1.5 w-1.5 rounded-full",
                    monthOverMonth >= 0 ? 'bg-emerald-light' : 'bg-danger'
                  )} />
                  {monthOverMonth >= 0 ? '+' : ''}{Math.abs(monthOverMonth).toFixed(1)}% vs last month
                </span>
              )}
              {last7Days.length >= 2 && (
                <span className="inline-flex items-center gap-1.5 rounded-md bg-champagne/5 px-2 py-0.5 text-xs text-champagne-dim">
                  <Sparkline data={last7Days} />
                  7d
                </span>
              )}
            </div>
          </div>
          <div className="flex items-center gap-2 mt-3 sm:mt-0">
            <Badge variant="outline" className="rounded-md border-glass-border bg-surface px-2.5 py-1 text-[10px] font-semibold tracking-tight text-text-secondary">
              {receiptCount.toLocaleString()} receipts
            </Badge>
          </div>
        </div>
      </motion.div>

      {/* ─── 4-Column KPI Grid ─── */}
      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="show"
        className="mb-6 grid grid-cols-2 gap-3 sm:grid-cols-4"
      >
        <StatCard
          label="Pending"
          value={String(pendingReviewCount || 0)}
          icon={<CheckCircle2 className="h-4 w-4" />}
        />
        <StatCard
          label="Receipts"
          value={receiptCount.toLocaleString()}
          icon={<Receipt className="h-4 w-4" />}
        />
        <StatCard
          label="AI Confidence"
          value={String(highConfidenceCount || 0)}
          icon={<ShieldAlert className="h-4 w-4" />}
        />
        <StatCard
          label="Recovery"
          value={`${recoveryPct.toFixed(1)}%`}
          icon={<Percent className="h-4 w-4" />}
        />
      </motion.div>

      {/* ─── Daily Spend Chart ─── */}
      <motion.div
        variants={itemVariants}
        initial="hidden"
        animate="show"
        className="mb-6"
      >
        <DailySpendChart data={dailySpend} />
      </motion.div>

      {/* ─── Categories + Monthly Trend ─── */}
      <div className="mb-6 grid gap-3 lg:grid-cols-5">
        <motion.div
          variants={itemVariants}
          initial="hidden"
          animate="show"
          className="lg:col-span-3"
        >
          <CategoryDonut data={summary.spendingByCategory || []} />
        </motion.div>
        <motion.div
          variants={itemVariants}
          initial="hidden"
          animate="show"
          className="lg:col-span-2 space-y-3"
        >
          <SpendingChart data={chartData} />
        </motion.div>
      </div>

      {/* ─── Insights + Alerts ─── */}
      <div className="grid gap-3 lg:grid-cols-3 mb-6">
        {mileageTotalKm > 0 && (
          <InsightCard
            icon={<Gauge className="h-4 w-4" />}
            iconBg="bg-emerald-success/10 text-emerald-light"
            title="Mileage"
            value={formatCurrency(mileageTotalAmount)}
            subtitle={`${mileageTotalKm.toLocaleString()} km logged`}
          />
        )}
        {unmatchedBankCount > 0 && (
          <InsightCard
            icon={<Landmark className="h-4 w-4" />}
            iconBg="bg-warning/10 text-warning"
            title="Unmatched"
            value={String(unmatchedBankCount)}
            subtitle={`bank transaction${unmatchedBankCount === 1 ? '' : 's'} no receipt`}
          />
        )}
        {duplicatesBlockedCount > 0 && (
          <InsightCard
            icon={<Lock className="h-4 w-4" />}
            iconBg="bg-champagne/10 text-champagne"
            title="Duplicates Blocked"
            value={String(duplicatesBlockedCount)}
            subtitle={`duplicate${duplicatesBlockedCount === 1 ? '' : 's'} prevented`}
          />
        )}
      </div>

      {/* ─── Alert Tiles ─── */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-xs font-semibold tracking-tight text-text-muted uppercase tracking-wider">Alerts</h3>
          <button
            type="button"
            onClick={() => onFilterClick('all')}
            className="text-xs font-medium text-champagne hover:text-champagne-dim transition-colors"
          >
            View all →
          </button>
        </div>
        <div className="grid gap-3 sm:grid-cols-3">
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
    </>
  );
}

/* ─── Sub-Components ─── */

function StatCard({ label, value, icon, sparkline }: {
  label: string; value: string; icon: React.ReactNode;
  sparkline?: { date: string; amount: number }[];
}) {
  const numValue = Number(String(value).replace(/,/g, '')) || 0;
  return (
    <motion.div
      layout
      variants={{ hidden: { opacity: 0, y: 12 }, show: { opacity: 1, y: 0 } }}
      whileHover={{ scale: 1.01, transition: { duration: 0.15 } }}
    >
      <ShadcnCard className={cn(
        "relative overflow-hidden rounded-lg border border-glass-border bg-card text-card-foreground transition-all duration-200",
        "hover:border-glass-border-hover hover:shadow-md",
      )}>
        <div className="relative z-10 p-4">
          <div className="flex items-center justify-between mb-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-md bg-champagne/10 text-champagne transition-colors group-hover:bg-champagne/15">
              {icon}
            </div>
            {sparkline && <Sparkline data={sparkline} />}
          </div>
          <p className="text-[10px] font-semibold uppercase tracking-[0.06em] text-text-muted">{label}</p>
          <p className="mt-0.5 text-xl font-semibold tracking-tight tabular-nums">
            <AnimatedCounter
              from={0}
              to={numValue}
              format={(v) => Number.isInteger(v) ? Math.round(v).toLocaleString() : v.toLocaleString()}
              delay={200}
            />
          </p>
        </div>
      </ShadcnCard>
    </motion.div>
  );
}

function InsightCard({ icon, iconBg, title, value, subtitle }: {
  icon: React.ReactNode; iconBg: string; title: string; value: string; subtitle: string;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, x: -8 }}
      animate={{ opacity: 1, x: 0 }}
      className="rounded-lg border border-glass-border bg-card p-4 flex items-start gap-3 transition-all duration-200 hover:border-glass-border-hover hover:shadow-sm"
    >
      <div className={`h-9 w-9 rounded-lg flex items-center justify-center shrink-0 ${iconBg}`}>
        {icon}
      </div>
      <div className="min-w-0">
        <p className="text-sm font-semibold text-text-primary">{title}</p>
        <p className="text-xs text-text-secondary leading-relaxed mt-0.5">
          <span className="font-semibold text-text-primary">{value}</span> {subtitle}
        </p>
      </div>
    </motion.div>
  );
}

function AlertTile({ title, count, description, tone, onClick }: { title: string; count: number; description: string; tone: 'danger' | 'info' | 'warning'; onClick: () => void }) {
  const toneMap = {
    danger: "border-l-[3px] border-l-danger/60 bg-danger/[0.03]",
    info: "border-l-[3px] border-l-champagne/60 bg-champagne/3",
    warning: "border-l-[3px] border-l-warning/60 bg-warning/[0.03]",
  }[tone];

  return (
    <motion.button
      onClick={onClick}
      whileHover={{ scale: 1.01 }}
      whileTap={{ scale: 0.99 }}
      className={cn("rounded-lg border border-glass-border bg-card p-4 text-left transition-all duration-200 hover:shadow-sm hover:border-glass-border-hover", toneMap)}>
      <div className="flex justify-between items-start mb-2">
        <div className={cn("flex h-8 w-8 items-center justify-center rounded-lg", tone === 'danger' ? 'bg-danger/10' : tone === 'info' ? 'bg-champagne/10' : 'bg-warning/10')}>
          {tone === 'danger' ? <BadgeAlert className="h-4 w-4" /> : tone === 'info' ? <FileSearch className="h-4 w-4" /> : <ShieldAlert className="h-4 w-4" />}
        </div>
        <span className="text-xl font-bold tabular-nums">{count}</span>
      </div>
      <p className="text-sm font-semibold text-text-primary mb-0.5">{title}</p>
      <p className="text-xs leading-relaxed text-text-secondary line-clamp-2">{description}</p>
    </motion.button>
  );
}

function AccessDeniedDashboard({ scans, total, gst }: { scans: number; total: number; gst: number }) {
  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="show"
      className="space-y-6"
      aria-live="polite"
      aria-atomic="true"
    >
      <motion.div variants={itemVariants} className="flex flex-col items-center justify-center rounded-lg border border-glass-border bg-card p-10 text-center text-card-foreground shadow-sm">
        <div className="h-14 w-14 rounded-xl bg-warning/10 flex items-center justify-center text-warning mb-5">
          <Lock className="h-7 w-7" />
        </div>
        <h2 className="text-lg font-bold tracking-tight">Executive Intelligence Restricted</h2>
        <p className="mt-2 max-w-md text-sm text-muted-foreground leading-relaxed font-medium">
          Detailed financial trends and audit alerts are reserved for account owners and accountants. 
          Your personal capture statistics are displayed below.
        </p>
      </motion.div>

      <motion.div variants={itemVariants} className="grid grid-cols-1 md:grid-cols-3 gap-3">
        <StatCard label="My Scans" value={scans.toLocaleString()} icon={<Receipt className="h-4 w-4" />} />
        <StatCard label="My Total" value={formatCurrency(total)} icon={<Wallet className="h-4 w-4" />} />
        <StatCard label="My GST" value={formatCurrency(gst)} icon={<CheckCircle2 className="h-4 w-4" />} />
      </motion.div>
    </motion.div>
  );
}
