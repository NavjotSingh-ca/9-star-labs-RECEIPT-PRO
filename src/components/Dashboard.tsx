'use client';

import React, { useMemo, useState } from 'react';
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

  const { receiptCount = 0, totalSpent = 0, gstRecoverable = 0 } = summary;

  if (receiptCount === 0) return <EmptyState onScan={onScan} handleCopyEmail={handleCopyEmail} forwardingEmail={forwardingEmail} />;
  if (role === 'Employee') return <EmployeeView scans={receiptCount} total={totalSpent} gst={gstRecoverable} />;

  return (
    <motion.div variants={container} initial="hidden" animate="show" className="space-y-4" aria-live="polite">
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
                <span className={cn("inline-flex items-center gap-1 rounded-md px-1.5 py-0.5 text-[10px] font-semibold", mom >= 0 ? 'bg-accent/10 text-accent' : 'bg-danger/10 text-danger')}>
                  <span className={cn("h-1.5 w-1.5 rounded-full", mom >= 0 ? 'bg-accent' : 'bg-danger')} />
                  {mom >= 0 ? '+' : ''}{Math.abs(mom).toFixed(1)}%
                </span>
              )}
            </div>
          </ShadcnCard>
        </motion.div>

        <KpiCard variants={fadeUp} label="Receipts" value={receiptCount.toLocaleString()} icon={<Receipt className="h-4 w-4 text-accent" />} />
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
