'use client';

import React, { useMemo, useState, useCallback } from 'react';
import { AlertCircle, Camera, Receipt, ShieldAlert, TrendingUp, Sparkles } from 'lucide-react';
import { motion } from 'framer-motion';
import { useQuery } from '@tanstack/react-query';
import { cn } from '@/lib/utils';

import { Card as ShadcnCard } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { DashboardSkeleton } from '@/components/ui/PremiumSkeletons';
import AnimatedCounter from '@/components/ui/AnimatedCounter';
import type { UserRole } from '@/lib/types';
import { supabase, getOrgIdString } from '@/lib/supabase';
import { toast } from 'sonner';
import { getDashboardSummary } from '@/lib/services/receipts';
import { toNumber, formatCurrency } from '@/lib/ui-utils';
import { fadeUp, staggerMedium, springGentle, cardHoverSubtle } from '@/lib/animations';

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
    } catch {
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

  if (receiptCount === 0) return <EmptyState onScan={onScan} handleCopyEmail={handleCopyEmail} forwardingEmail={forwardingEmail} />;
  if (role === 'Employee') return <EmployeeView scans={receiptCount} total={totalSpent} gst={gstRecoverable} />;

  return (
    <motion.div variants={staggerMedium} initial="hidden" animate="show" className="space-y-4" aria-live="polite">
      <motion.p variants={fadeUp} className="text-xs font-medium text-text-muted">{getGreeting()}</motion.p>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <motion.div variants={fadeUp}>
          <ShadcnCard className="p-5">
            <p className="text-[10px] font-semibold uppercase tracking-wider text-text-muted mb-1">
              {thisMonth ? formatMonthLabel(thisMonth.month) : 'This Month'}
            </p>
            <p className="text-3xl font-bold tracking-tight tabular-nums sm:text-4xl text-text-primary">
              {thisMonth ? <AnimatedCounter from={0} to={thisMonth.amount} format={(v) => formatCurrency(v)} delay={80} /> : '$0.00'}
            </p>
            <div className="flex items-center gap-3 mt-2">
              {mom !== null && (
                <span className={cn("inline-flex items-center gap-1 rounded-md px-1.5 py-0.5 text-[10px] font-semibold", mom >= 0 ? 'bg-champagne/10 text-champagne' : 'bg-danger/10 text-danger')}>
                  <span className={cn("h-1.5 w-1.5 rounded-full", mom >= 0 ? 'bg-champagne' : 'bg-danger')} />
                  {mom >= 0 ? '+' : ''}{Math.abs(mom).toFixed(1)}%
                </span>
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


/** Empty state shown when user has no receipts yet */
interface EmptyStateProps {
  onScan?: () => void;
  handleCopyEmail: () => void;
  forwardingEmail: boolean;
}

const EmptyState = React.memo(function EmptyState({ onScan, handleCopyEmail, forwardingEmail }: EmptyStateProps) {
  return (
    <motion.div
      variants={fadeUp}
      initial="hidden"
      animate="show"
      className="relative flex flex-col items-center justify-center py-20 text-center overflow-hidden"
    >
      {/* Ambient accent glow — antigravity drift */}
      <motion.div
        className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[400px] h-[400px] bg-champagne/5 rounded-full blur-[100px] pointer-events-none antigravity-drift"
        animate={{ y: [0, -8, 0] }}
        transition={{ duration: 10, repeat: Infinity, ease: 'easeInOut' }}
      />

      {/* Icon */}
      <motion.div
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ type: 'spring', stiffness: 250, damping: 18, mass: 0.8 }}
        className="relative mb-5 antigravity-float"
      >
        <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-champagne/15 to-champagne/5 ring-1 ring-champagne/20 ring-inset shadow-[0_0_30px_-8px_rgba(190,169,142,0.2)]">
          <Receipt className="h-8 w-8 text-champagne" />
        </div>
        <motion.div
          className="absolute -top-1 -right-1"
          animate={{ opacity: [0.4, 1, 0.4], scale: [1, 1.1, 1] }}
          transition={{ duration: 2, repeat: Infinity }}
        >
          <Sparkles className="h-4 w-4 text-champagne-dim" />
        </motion.div>
      </motion.div>

      {/* Headline */}
      <motion.h2
        variants={fadeUp}
        initial="hidden"
        animate="show"
        className="text-xl font-bold tracking-tight"
      >
        Your financial picture starts here
      </motion.h2>
      <motion.p
        variants={fadeUp}
        initial="hidden"
        animate="show"
        className="mt-2 max-w-sm text-sm text-text-secondary/80 leading-relaxed"
      >
        Scan your first receipt to unlock AI-powered categorization, CRA compliance scoring, and real-time spend tracking.
      </motion.p>

      {/* CTA */}
      <motion.div
        variants={fadeUp}
        initial="hidden"
        animate="show"
        className="mt-8 flex flex-col items-center gap-4"
      >
        {onScan && (
          <button
            onClick={onScan}
            className="shimmer-auth group relative h-11 px-6 rounded-xl font-semibold text-sm text-black transition-all duration-300 border border-champagne/20 hover:shadow-[0_0_25px_-6px_rgba(190,169,142,0.35)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-champagne/30 focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--obsidian)]"
          >
            <span className="relative z-10 flex items-center gap-2">
              <Camera className="h-4 w-4" />
              Scan your first receipt
            </span>
          </button>
        )}
        <button
          onClick={handleCopyEmail}
          disabled={forwardingEmail}
          className="inline-flex items-center gap-1.5 text-xs text-text-muted hover:text-text-secondary transition-colors duration-200 underline underline-offset-4 decoration-white/10 hover:decoration-white/30"
        >
          {forwardingEmail ? 'Loading...' : 'Or forward receipts from your email'}
        </button>
      </motion.div>

      {/* Feature highlights — staggered entrance */}
      <motion.div
        variants={staggerMedium}
        initial="hidden"
        animate="show"
        className="mt-14 grid gap-3 sm:grid-cols-3 max-w-xl"
      >
        {[
          { icon: Sparkles, title: 'AI Extraction', desc: 'Auto-detects vendors, line items, taxes, and categories from any receipt photo.' },
          { icon: ShieldAlert, title: 'CRA Compliance', desc: 'Real-time scoring ensures every receipt meets Canadian audit requirements.' },
          { icon: TrendingUp, title: 'Financial Intel', desc: 'Dashboards, tax recovery estimates, and spend trends at a glance.' },
        ].map((f, i) => (
          <motion.div
            key={f.title}
            variants={fadeUp}
            className="group rounded-xl border border-glass-border/50 bg-card/50 p-4 text-center antigravity-card"
          >
            <div className="mx-auto mb-2.5 flex h-10 w-10 items-center justify-center rounded-lg bg-champagne/10 text-champagne group-hover:bg-champagne/15 group-hover:shadow-[0_0_15px_-4px_rgba(190,169,142,0.15)] transition-all duration-300">
              <f.icon className="h-5 w-5" />
            </div>
            <h3 className="text-sm font-semibold tracking-tight">{f.title}</h3>
            <p className="text-xs text-text-muted/80 mt-1 leading-relaxed">{f.desc}</p>
          </motion.div>
        ))}
      </motion.div>
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
