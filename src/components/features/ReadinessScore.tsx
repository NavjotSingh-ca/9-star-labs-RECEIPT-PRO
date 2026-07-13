'use client';

import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { AlertCircle, CheckCircle2, Loader2 } from 'lucide-react';
import { motion } from 'framer-motion';
import PageHeader from '@/components/layout/PageHeader';
import { supabase, getOrgIdString } from '@/lib/supabase';
import { cn } from '@/lib/utils';
import type { ReceiptRow } from '@/lib/types';

function scoreColor(score: number): string {
  if (score >= 80) return 'text-emerald-success';
  if (score >= 60) return 'text-warning';
  return 'text-danger';
}

function scoreBg(score: number): string {
  if (score >= 80) return 'bg-emerald-success';
  if (score >= 60) return 'bg-warning';
  return 'bg-danger';
}

interface ChecklistItem {
  label: string;
  met: boolean;
  detail: string;
}

async function fetchReceipts(orgId: string): Promise<ReceiptRow[]> {
  const { data, error } = await supabase
    .from('receipts')
    .select('*')
    .eq('org_id', orgId)
    .eq('is_deleted', false);
  if (error) throw new Error('Failed to load receipts');
  return (data || []) as ReceiptRow[];
}

function computeReadiness(receipts: ReceiptRow[]): { score: number; items: ChecklistItem[] } {
  const total = receipts.length;
  if (total === 0) return { score: 0, items: [] };

  const withCategory = receipts.filter((r) => r.category && r.category !== 'Uncategorized').length;
  const withTax = receipts.filter((r) => r.tax_amount > 0).length;
  const withBN = receipts.filter((r) => r.business_number?.trim()).length;
  const approved = receipts.filter((r) => r.approval_status === 'approved').length;

  const months = new Set<string>();
  for (const r of receipts) {
    if (r.transaction_date) months.add(r.transaction_date.slice(0, 7));
  }
  const monthsFiled = months.size;
  const monthsExpected = Math.max(1, Math.min(12, Math.ceil(total / 10)));
  const monthlyRatio = Math.min(1, monthsFiled / monthsExpected);

  let score = 0;
  const items: ChecklistItem[] = [];

  const catPct = (withCategory / total) * 100;
  const catMet = withCategory / total >= 0.8;
  if (catMet) score += 20;
  items.push({
    label: 'Categorized receipts',
    met: catMet,
    detail: `${withCategory}/${total} (${Math.round(catPct)}%) — ${catMet ? '+20 pts' : 'need ≥80%'}`,
  });

  const taxPct = (withTax / total) * 100;
  const taxMet = withTax / total >= 0.7;
  if (taxMet) score += 20;
  items.push({
    label: 'Tax amounts filled',
    met: taxMet,
    detail: `${withTax}/${total} (${Math.round(taxPct)}%) — ${taxMet ? '+20 pts' : 'need ≥70%'}`,
  });

  const bnPct = (withBN / total) * 100;
  const bnMet = withBN / total >= 0.5;
  if (bnMet) score += 20;
  items.push({
    label: 'Business numbers recorded',
    met: bnMet,
    detail: `${withBN}/${total} (${Math.round(bnPct)}%) — ${bnMet ? '+20 pts' : 'need ≥50%'}`,
  });

  const monthlyMet = monthlyRatio >= 0.8;
  if (monthlyMet) score += 20;
  items.push({
    label: 'Monthly filing consistency',
    met: monthlyMet,
    detail: `${monthsFiled} month${monthsFiled !== 1 ? 's' : ''} filed (${Math.round(monthlyRatio * 100)}%) — ${monthlyMet ? '+20 pts' : 'need ≥80%'}`,
  });

  const appPct = (approved / total) * 100;
  const appMet = approved / total >= 0.9;
  if (appMet) score += 20;
  items.push({
    label: 'Receipts approved',
    met: appMet,
    detail: `${approved}/${total} (${Math.round(appPct)}%) — ${appMet ? '+20 pts' : 'need ≥90%'}`,
  });

  return { score: Math.min(100, score), items };
}

export default function ReadinessScore() {
  const { data: orgId } = useQuery({
    queryKey: ['readiness-org'],
    queryFn: async () => {
      const id = await getOrgIdString();
      if (!id) throw new Error('No organization found');
      return id;
    },
    staleTime: Infinity,
  });

  const { data: receipts = [], isLoading, error } = useQuery({
    queryKey: ['readiness-receipts', orgId],
    queryFn: () => fetchReceipts(orgId!),
    enabled: !!orgId,
    staleTime: 5 * 60 * 1000,
  });

  const { score, items } = useMemo(() => computeReadiness(receipts), [receipts]);

  return (
    <div className="space-y-5 fade-in">
      <PageHeader
        title="Tax Readiness Score"
        subtitle="How prepared your receipts are for CRA review"
      />

      {isLoading && (
        <div className="flex justify-center p-8">
          <Loader2 className="h-8 w-8 animate-spin text-champagne" />
        </div>
      )}

      {error && (
        <div className="rounded-[2rem] bg-danger/10 p-4 text-sm text-danger border border-danger/20">
          <AlertCircle className="inline h-4 w-4 mr-2" />
          {error.message}
        </div>
      )}

      {!isLoading && !error && receipts.length === 0 && (
        <div className="flex flex-col items-center gap-3 rounded-3xl border border-dashed border-glass-border bg-surface/30 py-16 text-center">
          <AlertCircle className="h-10 w-10 text-text-muted/50" />
          <p className="text-sm text-text-muted">No receipts yet.</p>
          <p className="text-xs text-text-muted/70">Add receipts to calculate your readiness score.</p>
        </div>
      )}

      {!isLoading && !error && receipts.length > 0 && (
        <>
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.3 }}
            className="flex flex-col items-center rounded-2xl border border-glass-border bg-card p-8 shadow-sm"
          >
            <span className={cn('text-6xl font-bold tabular-nums', scoreColor(score))}>
              {score}
            </span>
            <span className="mt-1 text-sm text-text-muted">out of 100</span>

            <div className="mt-6 w-full max-w-xs h-2.5 rounded-full bg-surface">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${score}%` }}
                transition={{ duration: 0.6, ease: 'easeOut' }}
                className={cn('h-full rounded-full', scoreBg(score))}
              />
            </div>

            <span className="mt-2 text-xs text-text-muted">
              {score >= 80 ? 'Excellent — you are tax-ready' : score >= 60 ? 'Getting there — a few gaps to close' : 'Needs attention — gaps identified'}
            </span>
          </motion.div>

          <div className="space-y-2">
            <h3 className="text-sm font-semibold text-text-primary">Improvement Checklist</h3>
            {items.map((item) => (
              <motion.div
                key={item.label}
                initial={{ opacity: 0, x: -8 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.2 }}
                className={cn(
                  'flex items-start gap-3 rounded-xl border p-3 transition-colors',
                  item.met
                    ? 'border-emerald-success/20 bg-emerald-success/5'
                    : 'border-danger/20 bg-danger/5'
                )}
              >
                <CheckCircle2
                  className={cn(
                    'h-5 w-5 mt-0.5 shrink-0',
                    item.met ? 'text-emerald-success' : 'text-text-muted/40'
                  )}
                />
                <div className="min-w-0">
                  <p className={cn(
                    'text-sm font-medium',
                    item.met ? 'text-emerald-success' : 'text-text-primary'
                  )}>
                    {item.label}
                  </p>
                  <p className="text-xs text-text-muted mt-0.5">{item.detail}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
