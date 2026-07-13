'use client';

import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { AlertCircle, Loader2, Clock, DollarSign, AlertTriangle } from 'lucide-react';
import { motion } from 'framer-motion';
import PageHeader from '@/components/layout/PageHeader';
import { supabase, getOrgIdString } from '@/lib/supabase';
import { formatCurrency, formatDate } from '@/lib/ui-utils';
import { cn } from '@/lib/utils';
import type { ReceiptRow } from '@/lib/types';

interface PayableEntry extends ReceiptRow {
  daysOverdue: number;
}

async function fetchPayables(orgId: string): Promise<ReceiptRow[]> {
  const { data, error } = await supabase
    .from('receipts')
    .select('*')
    .eq('org_id', orgId)
    .eq('is_deleted', false)
    .in('reimbursement_status', ['pending'])
    .eq('needs_reimbursement', true)
    .order('transaction_date', { ascending: false });
  if (error) throw new Error('Failed to load payables');
  return (data || []) as ReceiptRow[];
}

function daysSince(dateStr: string): number {
  const [y, m, d] = dateStr.split('-').map(Number);
  const then = new Date(y, m - 1, d);
  const now = new Date();
  return Math.floor((now.getTime() - then.getTime()) / (1000 * 60 * 60 * 24));
}

function overdueColor(days: number): string {
  if (days <= 15) return 'text-emerald-success bg-emerald-success/10 border-emerald-success/20';
  if (days <= 30) return 'text-warning bg-warning/10 border-warning/20';
  return 'text-danger bg-danger/10 border-danger/20';
}

export default function PayablesDashboard() {
  const { data: orgId } = useQuery({
    queryKey: ['payables-org'],
    queryFn: async () => {
      const id = await getOrgIdString();
      if (!id) throw new Error('No organization found');
      return id;
    },
    staleTime: Infinity,
  });

  const { data: receipts = [], isLoading, error } = useQuery({
    queryKey: ['payables-receipts', orgId],
    queryFn: () => fetchPayables(orgId!),
    enabled: !!orgId,
    staleTime: 5 * 60 * 1000,
  });

  const payables: PayableEntry[] = useMemo(
    () =>
      receipts.map((r) => ({
        ...r,
        daysOverdue: r.transaction_date ? daysSince(r.transaction_date) : 0,
      })),
    [receipts]
  );

  const totalDue = useMemo(
    () => payables.reduce((s, r) => s + r.total_amount, 0),
    [payables]
  );

  const overdueCount = useMemo(
    () => payables.filter((r) => r.daysOverdue > 15).length,
    [payables]
  );

  const avgDaysOverdue = useMemo(
    () => (payables.length > 0 ? Math.round(payables.reduce((s, r) => s + r.daysOverdue, 0) / payables.length) : 0),
    [payables]
  );

  return (
    <div className="space-y-5 fade-in">
      <PageHeader
        title="Payables"
        subtitle="Outstanding payments needing attention"
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

      {!isLoading && !error && payables.length === 0 && (
        <div className="flex flex-col items-center gap-3 rounded-3xl border border-dashed border-glass-border bg-surface/30 py-16 text-center">
          <DollarSign className="h-10 w-10 text-text-muted/50" />
          <p className="text-sm text-text-muted">No outstanding payables.</p>
          <p className="text-xs text-text-muted/70">
            All receipts have been reimbursed or are not flagged for reimbursement.
          </p>
        </div>
      )}

      {!isLoading && !error && payables.length > 0 && (
        <>
          <div className="grid gap-4 sm:grid-cols-3">
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0 }}
              className="rounded-2xl border border-glass-border bg-card p-4 shadow-sm"
            >
              <div className="flex items-center gap-2 text-sm text-text-muted">
                <DollarSign className="h-4 w-4" />
                Total Payables
              </div>
              <p className="mt-1 text-2xl font-semibold tabular-nums text-text-primary">
                {formatCurrency(totalDue)}
              </p>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.05 }}
              className="rounded-2xl border border-glass-border bg-card p-4 shadow-sm"
            >
              <div className="flex items-center gap-2 text-sm text-text-muted">
                <AlertTriangle className="h-4 w-4" />
                Overdue
              </div>
              <p className="mt-1 text-2xl font-semibold tabular-nums text-text-primary">
                {overdueCount}
              </p>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="rounded-2xl border border-glass-border bg-card p-4 shadow-sm"
            >
              <div className="flex items-center gap-2 text-sm text-text-muted">
                <Clock className="h-4 w-4" />
                Avg Days Overdue
              </div>
              <p className="mt-1 text-2xl font-semibold tabular-nums text-text-primary">
                {avgDaysOverdue}
              </p>
            </motion.div>
          </div>

          <div className="overflow-x-auto rounded-2xl border border-glass-border bg-card shadow-sm">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-surface-raised text-left text-xs font-semibold text-text-muted uppercase tracking-wider">
                  <th className="px-4 py-3">Vendor</th>
                  <th className="px-4 py-3">Date</th>
                  <th className="px-4 py-3 text-right">Total Due</th>
                  <th className="px-4 py-3 text-right">Balance</th>
                  <th className="px-4 py-3 text-right">Overdue</th>
                </tr>
              </thead>
              <tbody>
                {payables.map((entry, i) => (
                  <motion.tr
                    key={entry.id}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: i * 0.02 }}
                    className="border-t border-glass-border transition-colors hover:bg-champagne/5"
                  >
                    <td className="px-4 py-3 font-medium text-text-primary">
                      {entry.vendor_name || 'Unknown Vendor'}
                    </td>
                    <td className="px-4 py-3 text-text-secondary">
                      {formatDate(entry.transaction_date)}
                    </td>
                    <td className="px-4 py-3 text-right tabular-nums text-text-primary font-semibold">
                      {formatCurrency(entry.total_amount, entry.currency)}
                    </td>
                    <td className="px-4 py-3 text-right tabular-nums text-text-primary font-semibold">
                      {formatCurrency(entry.total_amount, entry.currency)}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <span
                        className={cn(
                          'inline-block rounded-full border px-2.5 py-0.5 text-xs font-semibold',
                          overdueColor(entry.daysOverdue)
                        )}
                      >
                        {entry.daysOverdue}d
                      </span>
                    </td>
                  </motion.tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  );
}
