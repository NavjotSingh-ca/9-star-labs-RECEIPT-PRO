'use client';

import { useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { AlertCircle, AlertTriangle, CheckCircle2, DollarSign, Loader2 } from 'lucide-react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { getReimbursementsPending, updateReceiptApproval } from '@/lib/services/receipts';
import type { ReceiptRow, UserRole } from '@/lib/types';
import { supabase } from '@/lib/supabase';
import { Skeleton } from '@/components/ui/skeleton';

interface ReimbursementsPanelProps {
  role: UserRole;
}

const cad = new Intl.NumberFormat('en-CA', { style: 'currency', currency: 'CAD', maximumFractionDigits: 2 });

function ReimburseCard({
  receipt,
  onMarkPaid,
  loading,
}: {
  receipt: ReceiptRow;
  onMarkPaid: (id: string) => void;
  loading: boolean;
}) {
  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, x: 20 }}
      className="flex items-center gap-5 rounded-3xl border border-warning/15 bg-warning/[0.03] p-5"
    >
      {/* Icon */}
      <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-[2rem] bg-warning/10">
        <DollarSign className="h-6 w-6 text-warning" />
      </div>

      {/* Details */}
      <div className="min-w-0 flex-1">
        <p className="text-sm font-bold text-text-primary">{receipt.vendor_name ?? 'Unknown Vendor'}</p>
        <p className="mt-0.5 text-xs text-text-muted">
          {receipt.transaction_date ?? '—'} · {receipt.category ?? 'Uncategorized'}
        </p>
        <div className="mt-1.5 flex flex-wrap items-center gap-2">
          <span className="rounded-[2rem] bg-warning/15 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-warning">
            Employee Cash
          </span>
          <span className={[
            'rounded-[2rem] px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide',
            receipt.reimbursement_status === 'pending' || !receipt.reimbursement_status
              ? 'bg-warning/15 text-warning'
              : receipt.reimbursement_status === 'approved'
              ? 'bg-emerald-success/15 text-emerald-light'
              : 'bg-danger/15 text-danger',
          ].join(' ')}>
            {receipt.reimbursement_status ?? 'Pending'}
          </span>
        </div>
      </div>

      {/* Amount + action */}
      <div className="flex flex-col items-end gap-2">
        <p className="text-lg font-black tabular-nums text-warning">
          {cad.format(Number(receipt.total_amount ?? 0))}
        </p>
        <button
          type="button"
          onClick={() => onMarkPaid(receipt.id)}
          disabled={loading || receipt.reimbursement_status === 'approved'}
          className="flex items-center gap-1.5 rounded-[2rem] bg-emerald-success/10 px-3 py-1.5 text-xs font-bold text-emerald-light transition hover:bg-emerald-success/20 disabled:opacity-40"
        >
          {loading ? (
            <Loader2 className="h-3.5 w-3.5 animate-spin" />
          ) : receipt.reimbursement_status === 'approved' ? (
            <CheckCircle2 className="h-3.5 w-3.5" />
          ) : (
            <DollarSign className="h-3.5 w-3.5" />
          )}
          {receipt.reimbursement_status === 'approved' ? 'Paid' : 'Mark Paid'}
        </button>
      </div>
    </motion.div>
  );
}

export default function ReimbursementsPanel({ role }: ReimbursementsPanelProps) {
  const queryClient = useQueryClient();

  const { data: { user } = {}, isLoading: userLoading } = useQuery({
    queryKey: ['current_user'],
    queryFn: async () => {
      const { data } = await supabase.auth.getUser();
      return data;
    },
    staleTime: Infinity,
  });

  const { data: payables = [], isLoading } = useQuery({
    queryKey: ['reimbursements_pending'],
    queryFn: async () => getReimbursementsPending(user?.id ?? ''),
    enabled: !!user?.id && role !== 'Employee',
    staleTime: 60_000,
  });

  const invalidate = useCallback(() => {
    queryClient.invalidateQueries({ queryKey: ['reimbursements_pending'] });
    queryClient.invalidateQueries({ queryKey: ['receipts'] });
  }, [queryClient]);

  const markPaidMutation = useMutation({
    mutationFn: async (receiptId: string) => {
      const { data: authData } = await supabase.auth.getUser();
      const userId = authData.user?.id;
      if (!userId) throw new Error('Not authenticated');

      const r = payables.find((p) => p.id === receiptId);
      await updateReceiptApproval(
        receiptId,
        'approved',
        userId,
        true,
        r?.vendor_name ?? 'Unknown',
        r?.transaction_date ?? ''
      );
    },
    onSuccess: invalidate,
  });

  const totalPending = payables
    .filter((r) => r.reimbursement_status !== 'approved')
    .reduce((sum, r) => sum + Number(r.total_amount ?? 0), 0);

  if (role === 'Employee') return null;

  return (
    <section className="space-y-5 fade-in" role="region" aria-label="Reimbursements panel">
      {/* Header */}
      <div className="flex items-end justify-between gap-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-warning">Payables</p>
          <h2 className="mt-1 text-2xl font-bold tracking-tight text-text-primary sm:text-3xl">
            Reimbursements
          </h2>
        </div>
        {payables.length > 0 && (
          <div className="rounded-[3rem] border border-warning/30 bg-warning/[0.05] px-3 py-1.5 text-sm font-black text-warning">
            {cad.format(totalPending)} outstanding
          </div>
        )}
      </div>

      {/* Loading */}
      {(isLoading || userLoading) && (
        <div className="space-y-3" role="status" aria-live="polite" aria-label="Loading payables">
          {[...Array(3)].map((_, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.08 }}
              className="flex items-center gap-5 rounded-3xl border border-warning/15 bg-warning/[0.03] p-5"
            >
              <Skeleton className="h-12 w-12 flex-shrink-0 rounded-[2rem]" />
              <div className="min-w-0 flex-1 space-y-2">
                <Skeleton className="h-4 w-40 rounded-[2rem]" />
                <Skeleton className="h-3 w-28 rounded-[2rem]" />
              </div>
              <Skeleton className="h-8 w-24 rounded-[2rem]" />
            </motion.div>
          ))}
        </div>
      )}

      {/* Empty */}
      {!isLoading && payables.length === 0 && (
        <div className="flex flex-col items-center gap-3 rounded-3xl border border-dashed border-glass-border bg-surface/30 py-16 text-center" role="status" aria-live="polite">
          <AlertCircle className="h-10 w-10 text-text-muted opacity-30" />
          <p className="text-sm text-text-muted">No outstanding payables. Employee cash reimbursements will appear here.</p>
        </div>
      )}

      {/* Note */}
      {payables.length > 0 && (
        <div className="flex items-start gap-3 rounded-[3rem] border border-warning/15 bg-warning/[0.04] px-4 py-3">
          <AlertTriangle className="mt-0.5 h-4 w-4 flex-shrink-0 text-warning" />
          <p className="text-xs leading-relaxed text-text-secondary">
            These receipts were paid out-of-pocket by employees. Mark as <strong className="text-text-primary">&quot;Paid&quot;</strong> once the employee has been reimbursed.
          </p>
        </div>
      )}

      {/* Cards */}
      <AnimatePresence mode="popLayout">
        {payables.map((r) => (
          <ReimburseCard
            key={r.id}
            receipt={r}
            onMarkPaid={(id) => markPaidMutation.mutate(id)}
            loading={markPaidMutation.isPending}
          />
        ))}
      </AnimatePresence>
    </section>
  );
}
