'use client';

import { useMemo, useState } from 'react';
import {
  AlertCircle,
  AlertTriangle,
  ArrowRight,
  BadgeAlert,
  CheckCircle2,
  Lock,
  Receipt,
  ShieldAlert,
  TrendingUp,
  Wallet,
  Loader2,
  ChevronRight,
  FileSearch,
  DollarSign,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useQuery } from '@tanstack/react-query';
import { cn } from '@/lib/utils';
import { SpendingChart } from '@/components/charts/SpendingChart';
import {
  Card as ShadcnCard,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { DashboardSkeleton } from '@/components/ui/PremiumSkeletons';

import type { UserRole, ReceiptRow } from '@/lib/types';
import { getDashboardSummary } from '@/lib/services/receipts';
import {
  toNumber,
  formatCurrency,
} from '@/lib/ui-utils';

interface DashboardProps {
  onFilterClick: (filterType: string) => void;
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

export default function Dashboard({
  onFilterClick,
  role = 'Owner',
  userId,
}: DashboardProps) {
  const { data: summary, isLoading, error } = useQuery({
    queryKey: ['dashboard_summary', role, userId],
    queryFn: () => getDashboardSummary(role, userId!),
    enabled: !!userId,
    retry: false,
  });

  const chartData = useMemo(() => {
    if (!summary?.monthlyTrend) return [];
    return summary.monthlyTrend.map((s: { month: string; amount: number }) => ({
      month: formatMonthLabel(s.month),
      amount: toNumber(s.amount)
    })).reverse();
  }, [summary]);

  if (isLoading) return <DashboardSkeleton />;

  if (error || !summary) {
    const isNoOrg = error instanceof Error && error.message.includes('No organization found');
    return (
      <div className="flex min-h-[50vh] flex-col items-center justify-center gap-6 rounded-[3rem] border border-glass-border bg-surface/50 p-12 text-center backdrop-blur-xl">
        <div className="flex h-20 w-20 items-center justify-center rounded-[2rem] bg-amber-500/10 text-amber-500 shadow-inner">
          <AlertCircle className="h-10 w-10" />
        </div>
        <div className="max-w-md space-y-2">
          <h3 className="text-2xl font-black text-text-primary tracking-tight">
            {isNoOrg ? 'Organization Required' : 'Synchronization Error'}
          </h3>
          <p className="text-sm text-text-secondary leading-relaxed">
            {isNoOrg 
              ? 'Join an organization to unlock the full power of Leduc Receipt Pro dashboard intelligence.' 
              : 'Our secure link to your financial records is temporarily experiencing high latency.'}
          </p>
        </div>
        {!isNoOrg && (
          <Button variant="outline" className="rounded-full border-glass-border px-8 py-6 font-bold hover:bg-surface-raised">
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
  } = summary;

  // Empty state for new users
  if (receiptCount === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center animate-in fade-in slide-in-from-bottom-6 duration-1000">
        <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-[2rem] bg-champagne/10">
          <Receipt className="h-8 w-8 text-champagne/50" />
        </div>
        <h3 className="text-lg font-bold text-text-primary">No receipts yet</h3>
        <p className="mt-2 max-w-sm text-sm text-text-secondary">
          Start by scanning your first receipt. Tap the green Scan button below.
        </p>
      </div>
    );
  }

  return role === 'Employee' ? (
    <AccessDeniedDashboard 
      scans={receiptCount} 
      total={totalSpent} 
      gst={gstRecoverable} 
    />
  ) : (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-6 duration-1000">
      {/* Dynamic Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between px-2">
        <div className="space-y-1">
          <Badge variant="outline" className="mb-2 rounded-full border-champagne/20 bg-champagne/10 px-3 py-1 font-black uppercase tracking-widest text-champagne">
            v10.0 Elite
          </Badge>
          <h2 className="text-4xl font-black tracking-tighter text-text-primary sm:text-5xl">
            Financial <span className="text-champagne">Fortress</span>
          </h2>
          <p className="text-sm font-medium text-text-secondary">
            Monitoring <span className="font-bold text-text-primary">{receiptCount}</span> records with bank-grade security
          </p>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex -space-x-3 overflow-hidden">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="inline-block h-10 w-10 rounded-full border-2 border-surface bg-surface-raised ring-2 ring-glass-border" />
            ))}
          </div>
          <p className="text-xs font-bold text-text-muted uppercase tracking-wider">Team Activity</p>
        </div>
      </div>

      {/* Main KPI Grid */}
      <motion.div 
        variants={{
          hidden: { opacity: 0 },
          show: {
            opacity: 1,
            transition: { staggerChildren: 0.1 }
          }
        }}
        initial="hidden"
        animate="show"
        className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4"
      >
        <StatCard
          label="Managed Capital"
          value={formatCurrency(totalSpent)}
          helper="Total recorded spend"
          icon={<Wallet className="h-6 w-6" />}
          className="lg:col-span-2"
          trend={{ value: '12%', up: true }}
        />
        <StatCard
          label="Recoverable GST"
          value={formatCurrency(gstRecoverable)}
          helper="Federal tax capture"
          icon={<CheckCircle2 className="h-6 w-6" />}
          trend={{ value: '4%', up: true }}
        />
        <StatCard
          label="Audit Depth"
          value={receiptCount.toLocaleString()}
          helper="Digital records stored"
          icon={<Receipt className="h-6 w-6" />}
        />
      </motion.div>

      {/* Primary Insights Section */}
      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <SpendingChart data={chartData} />
        </div>
        <GSTRecoveryMeter 
          gst={gstRecoverable} 
          pst={pstRecoverable} 
          total={totalSpent} 
        />
      </div>

      {/* Actionable Risk Alerts */}
      <div className="space-y-4">
        <div className="flex items-center justify-between px-2">
          <h3 className="text-sm font-black uppercase tracking-[0.2em] text-text-muted">Critical Audit Alerts</h3>
          <Button variant="link" onClick={() => onFilterClick('all')} className="text-champagne font-bold text-xs">
            Review All Records <ChevronRight className="ml-1 h-3 w-3" />
          </Button>
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

      {/* Security & Intelligence Footer */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <ShadcnCard className="rounded-[3rem] border-glass-border bg-surface/50 p-6 flex flex-col gap-4">
          <div className="h-10 w-10 rounded-[2rem] bg-blue-500/10 flex items-center justify-center text-blue-400">
            <ShieldAlert className="h-5 w-5" />
          </div>
          <div>
            <p className="text-2xl font-black text-text-primary tabular-nums">{highConfidenceCount}</p>
            <p className="text-[10px] font-bold uppercase tracking-wider text-text-muted">AI Trust Matches</p>
          </div>
        </ShadcnCard>

        <ShadcnCard className="rounded-[3rem] border-glass-border bg-surface/50 p-6 flex flex-col gap-4">
          <div className="h-10 w-10 rounded-[2rem] bg-emerald-500/10 flex items-center justify-center text-emerald-400">
            <Lock className="h-5 w-5" />
          </div>
          <div>
            <p className="text-2xl font-black text-text-primary tabular-nums">{duplicatesBlockedCount}</p>
            <p className="text-[10px] font-bold uppercase tracking-wider text-text-muted">Duplicates Purged</p>
          </div>
        </ShadcnCard>

        <div className="flex col-span-2 rounded-[3rem] border border-champagne/15 bg-champagne/[0.03] p-6 flex items-start gap-4">
          <div className="h-10 w-10 rounded-[2rem] bg-champagne/10 flex items-center justify-center text-champagne shrink-0">
            <TrendingUp className="h-5 w-5" />
          </div>
          <div>
            <p className="text-sm font-bold text-text-primary">System Intelligence</p>
            <p className="mt-1 text-xs text-text-secondary leading-relaxed">
              Your recovery yield is up <span className="text-emerald-light font-bold">12.4%</span> this month. 
              Keep scanning high-quality thermal records for maximum audit protection.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

function StatCard({ label, value, helper, icon, className = "", trend = null }: { label: string; value: string; helper: string; icon: React.ReactNode; className?: string; trend?: { value: string; up: boolean } | null }) {
  return (
    <motion.div
      variants={{ hidden: { opacity: 0, y: 20 }, show: { opacity: 1, y: 0 } }}
      whileHover={{ y: -4, scale: 1.01 }}
      className="h-full"
    >
      <ShadcnCard className={cn(
        "rounded-[3rem] border border-glass-border bg-surface/60 backdrop-blur-xl shadow-sm transition-all duration-300 hover:border-champagne/40 hover:bg-surface-raised relative overflow-hidden group h-full",
        className
      )}>
        <div className="absolute -right-8 -top-8 h-32 w-32 rounded-full bg-champagne/5 blur-3xl transition-all group-hover:bg-champagne/10" />
        <div className="relative z-10 flex flex-col h-full justify-between p-8">
          <div className="flex items-center justify-between">
            <div className="flex h-14 w-14 items-center justify-center rounded-[1.25rem] bg-champagne/10 text-champagne shadow-inner group-hover:scale-110 transition-transform">
              {icon}
            </div>
            {trend && (
              <Badge variant="outline" className={`border-none px-3 py-1 text-[10px] font-black tracking-widest ${trend.up ? 'bg-emerald-500/15 text-emerald-light' : 'bg-red-500/15 text-red-400'}`}>
                {trend.up ? '↑' : '↓'} {trend.value}
              </Badge>
            )}
          </div>
          <div className="mt-10">
            <p className="text-[10px] font-bold uppercase tracking-[0.25em] text-text-muted">{label}</p>
            <p className="mt-1 text-3xl font-black tracking-tighter tabular-nums text-text-primary sm:text-4xl">{value}</p>
            <p className="mt-2 text-xs text-text-secondary opacity-60 font-medium">{helper}</p>
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
    <ShadcnCard className="rounded-[3rem] border border-glass-border bg-surface shadow-2xl relative overflow-hidden flex flex-col justify-center items-center p-8 group">
      <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/[0.04] to-transparent pointer-events-none" />
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
          <span className="text-[10px] font-bold uppercase tracking-widest text-text-muted">Effective Rate</span>
        </div>
      </div>
      <div className="mt-8 grid grid-cols-2 gap-6 w-full pt-6 border-t border-glass-border">
        <div className="text-center">
          <p className="text-[10px] font-black text-emerald-light uppercase tracking-widest">GST Capture</p>
          <p className="text-lg font-bold tabular-nums text-text-primary">{formatShortCurrency(gst)}</p>
        </div>
        <div className="text-center">
          <p className="text-[10px] font-black text-champagne uppercase tracking-widest">PST Capture</p>
          <p className="text-lg font-bold tabular-nums text-text-primary">{formatShortCurrency(pst)}</p>
        </div>
      </div>
    </ShadcnCard>
  );
}

function AlertTile({ title, count, description, tone, onClick }: { title: string; count: number; description: string; tone: 'danger' | 'info' | 'warning'; onClick: () => void }) {
  const toneMap = {
    danger: "border-red-500/20 bg-red-500/[0.04] text-red-400",
    info: "border-blue-500/20 bg-blue-500/[0.04] text-blue-400",
    warning: "border-amber-500/20 bg-amber-500/[0.04] text-amber-400",
  }[tone];

  return (
    <button onClick={onClick} className={cn("group rounded-[2rem] border p-5 text-left transition-all hover:bg-surface-raised active:scale-[0.98]", toneMap)}>
      <div className="flex justify-between items-start mb-4">
        <div className={cn("flex h-10 w-10 items-center justify-center rounded-[2rem]", tone === 'danger' ? 'bg-red-500/10' : tone === 'info' ? 'bg-blue-500/10' : 'bg-amber-500/10')}>
          {tone === 'danger' ? <BadgeAlert className="h-5 w-5" /> : tone === 'info' ? <FileSearch className="h-5 w-5" /> : <ShieldAlert className="h-5 w-5" />}
        </div>
        <span className="text-2xl font-black tabular-nums">{count}</span>
      </div>
      <p className="text-sm font-bold text-text-primary mb-1">{title}</p>
      <p className="text-[11px] font-medium leading-relaxed text-text-secondary opacity-70 line-clamp-2">{description}</p>
    </button>
  );
}

function AccessDeniedDashboard({ scans, total, gst }: { scans: number; total: number; gst: number }) {
  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-6 duration-1000">
      <div className="flex flex-col items-center justify-center rounded-[3rem] border border-glass-border bg-surface/50 p-12 text-center backdrop-blur-xl">
        <div className="h-16 w-16 rounded-[1.5rem] bg-amber-500/10 flex items-center justify-center text-amber-500 mb-6 shadow-inner">
          <Lock className="h-8 w-8" />
        </div>
        <h2 className="text-2xl font-black text-text-primary tracking-tight">Executive Intelligence Restricted</h2>
        <p className="mt-2 max-w-md text-sm text-text-secondary leading-relaxed font-medium">
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