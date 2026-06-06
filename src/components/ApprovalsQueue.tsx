'use client';

import React, { useState, useCallback, useEffect } from 'react';
import Image from 'next/image';
import { motion, AnimatePresence } from 'framer-motion';
import {
  AlertCircle,
  CheckCircle2,
  Clock,
  DollarSign,
  ImageIcon,
  Loader2,
  ThumbsDown,
  ThumbsUp,
} from 'lucide-react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { getReceiptsPendingApproval, updateReceiptApproval, bulkUpdateApproval } from '@/lib/services/receipts';
import type { ReceiptRow, UserRole } from '@/lib/types';
import { supabase } from '@/lib/supabase';
import { getReceiptImageUrl } from '@/lib/supabase';

interface ApprovalsQueueProps {
  role: UserRole;
}

const cad = new Intl.NumberFormat('en-CA', { style: 'currency', currency: 'CAD', maximumFractionDigits: 2 });

const ReceiptThumbnail = React.memo(function ReceiptThumbnail({ imageUrl, vendorName }: { imageUrl: string | null | undefined; vendorName: string | null | undefined }) {
  const [src, setSrc] = useState<string | null>(null);
  useEffect(() => {
    if (!imageUrl) return;
    getReceiptImageUrl(imageUrl).then(setSrc).catch(() => setSrc(null));
  }, [imageUrl]);
  if (!src) {
    return (
      <div className="flex h-full w-full items-center justify-center">
        <ImageIcon className="h-6 w-6 text-text-muted" />
      </div>
    );
  }
  return (
    <div className="relative h-full w-full">
      <Image src={src} alt={vendorName ?? 'Receipt'} fill className="object-cover" unoptimized sizes="200px" />
    </div>
  );
});

const ApprovalCard = React.memo(function ApprovalCard({
  receipt,
  selected,
  onToggle,
  onApprove,
  onReject,
  loading,
}: {
  receipt: ReceiptRow;
  selected: boolean;
  onToggle: () => void;
  onApprove: (id: string) => void;
  onReject: (id: string) => void;
  loading: boolean;
}) {
  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, x: -20 }}
      className={[
        'group rounded-3xl border p-5 transition',
        selected
          ? 'border-champagne/40 bg-champagne/[0.04]'
          : 'border-glass-border bg-surface hover:border-glass-border-hover',
      ].join(' ')}
    >
      <div className="flex gap-4">
        {/* Checkbox */}
        <button
          type="button"
          onClick={onToggle}
          className={[
            'mt-0.5 h-6 w-6 flex-shrink-0 rounded-[2rem] border-2 transition',
            selected ? 'border-champagne bg-champagne' : 'border-glass-border',
          ].join(' ')}
          aria-label={selected ? 'Deselect' : 'Select'}
        >
          {selected && <CheckCircle2 className="h-4 w-4 text-obsidian" />}
        </button>

        {/* Image thumbnail */}
        <div className="h-16 w-16 flex-shrink-0 overflow-hidden rounded-[2rem] border border-glass-border bg-surface-raised">
          <ReceiptThumbnail imageUrl={receipt.image_url} vendorName={receipt.vendor_name} />
        </div>

        {/* Details */}
        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-2">
            <div>
              <p className="text-sm font-bold text-text-primary">{receipt.vendor_name ?? 'Unknown Vendor'}</p>
              <p className="mt-0.5 text-xs text-text-muted">{receipt.transaction_date ?? '—'}</p>
            </div>
            <p className="text-base font-black text-champagne tabular-nums">
              {cad.format(Number(receipt.total_amount ?? 0))}
            </p>
          </div>

          <div className="mt-2 flex flex-wrap gap-2">
            <span className="rounded-[2rem] bg-surface-raised px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-text-muted">
              {receipt.category ?? 'Uncategorized'}
            </span>
            {receipt.needs_reimbursement && (
              <span className="rounded-[2rem] bg-warning/15 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-warning">
                Reimbursement Pending
              </span>
            )}
            {receipt.document_type === 'estimate' && (
              <span className="rounded-[2rem] bg-champagne/15 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-champagne">
                Estimate
              </span>
            )}
            {receipt.fraud_suspicion && (
              <span className="rounded-[2rem] bg-danger/15 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-danger">
                Fraud Flag
              </span>
            )}
            {receipt.paid_by && (
              <span className="flex items-center gap-1 rounded-[2rem] bg-surface-raised px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-text-muted">
                <DollarSign className="h-2.5 w-2.5" />
                {receipt.paid_by === 'employee_cash' ? 'Employee Cash' : 'Company Card'}
              </span>
            )}
          </div>

          {/* Inline approve / reject */}
          <div className="mt-3 flex gap-2">
            <button
              type="button"
              onClick={() => onApprove(receipt.id)}
              disabled={loading}
              className="flex items-center gap-1.5 rounded-[2rem] bg-emerald-success/10 px-3 py-1.5 text-xs font-bold text-emerald-light transition hover:bg-emerald-success/20 disabled:opacity-50"
              aria-label="Approve (A)"
            >
              <ThumbsUp className="h-3.5 w-3.5" />
              Approve
            </button>
            <button
              type="button"
              onClick={() => onReject(receipt.id)}
              disabled={loading}
              className="flex items-center gap-1.5 rounded-[2rem] bg-danger/10 px-3 py-1.5 text-xs font-bold text-danger transition hover:bg-danger/20 disabled:opacity-50"
              aria-label="Reject (R)"
            >
              <ThumbsDown className="h-3.5 w-3.5" />
              Reject
            </button>
          </div>
        </div>
      </div>
    </motion.div>
  );
});

export default function ApprovalsQueue({ role }: ApprovalsQueueProps) {
  const queryClient = useQueryClient();
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  const { data: pending = [], isLoading } = useQuery({
    queryKey: ['approvals_pending'],
    queryFn: getReceiptsPendingApproval,
    enabled: role !== 'Employee',
  });

  const invalidate = useCallback(() => {
    queryClient.invalidateQueries({ queryKey: ['approvals_pending'] });
    queryClient.invalidateQueries({ queryKey: ['receipts'] });
  }, [queryClient]);

  const approveMutation = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: 'approved' | 'rejected' }) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');
      const r = pending.find((p) => p.id === id);
      await updateReceiptApproval(
        id,
        status,
        user.id,
        r?.needs_reimbursement ?? false,
        r?.vendor_name ?? 'Unknown',
        r?.transaction_date ?? ''
      );
    },
    onMutate: async ({ id, status }) => {
      // Cancel outgoing refetches
      await queryClient.cancelQueries({ queryKey: ['approvals_pending'] });

      // Snapshot previous value
      const previousPending = queryClient.getQueryData(['approvals_pending']) as ReceiptRow[];

      // Optimistically update to the new value
      queryClient.setQueryData(['approvals_pending'], (old: ReceiptRow[] = []) =>
        old.filter((r) => r.id !== id)
      );

      // Return context with previous data
      return { previousPending };
    },
    onError: (err, variables, context) => {
      // Rollback to previous value on error
      if (context?.previousPending) {
        queryClient.setQueryData(['approvals_pending'], context.previousPending);
      }
    },
    onSuccess: invalidate,
  });

  const bulkMutation = useMutation({
    mutationFn: async (status: 'approved' | 'rejected') => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');
      await bulkUpdateApproval([...selected], status, user.id);
    },
    onMutate: async (status) => {
      // Cancel outgoing refetches
      await queryClient.cancelQueries({ queryKey: ['approvals_pending'] });

      // Snapshot previous value
      const previousPending = queryClient.getQueryData(['approvals_pending']) as ReceiptRow[];

      // Optimistically update to the new value
      queryClient.setQueryData(['approvals_pending'], (old: ReceiptRow[] = []) =>
        old.filter((r) => !selected.has(r.id))
      );

      // Return context with previous data
      return { previousPending };
    },
    onError: (err, variables, context) => {
      // Rollback to previous value on error
      if (context?.previousPending) {
        queryClient.setQueryData(['approvals_pending'], context.previousPending);
      }
    },
    onSuccess: () => {
      setSelected(new Set());
      invalidate();
    },
  });

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;
      if (selected.size === 0 || bulkMutation.isPending) return;

      if (e.key.toLowerCase() === 'a') {
        bulkMutation.mutate('approved');
      } else if (e.key.toLowerCase() === 'r') {
        bulkMutation.mutate('rejected');
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selected, bulkMutation]);

  const toggleSelect = useCallback((id: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }, []);

  const selectAll = useCallback(() => {
    setSelected((prev) => {
      if (prev.size === pending.length) {
        return new Set();
      } else {
        return new Set(pending.map((p) => p.id));
      }
    });
  }, [pending]);

  const handleSingleAction = useCallback(async (id: string, status: 'approved' | 'rejected') => {
    setActionLoading(id);
    try {
      await approveMutation.mutateAsync({ id, status });
    } finally {
      setActionLoading(null);
    }
  }, [approveMutation]);

  if (role === 'Employee') {
    return (
      <div className="flex flex-col items-center gap-3 rounded-3xl border border-dashed border-glass-border bg-surface/30 py-16 text-center" role="status" aria-live="polite">
        <AlertCircle className="h-10 w-10 text-text-muted opacity-30" />
        <p className="text-sm text-text-muted">Employees do not have access to the Approvals Queue.</p>
      </div>
    );
  }

  return (
    <section className="space-y-5 fade-in" role="region" aria-label="Approvals queue">
      {/* Header */}
      <div className="flex items-end justify-between gap-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-champagne">Approvals</p>
          <h2 className="mt-1 text-2xl font-bold tracking-tight text-text-primary sm:text-3xl">
            Pending Queue
          </h2>
        </div>
        {pending.length > 0 && (
          <div className="rounded-[3rem] border border-champagne/30 bg-champagne/[0.05] px-3 py-1.5 text-sm font-black text-champagne">
            {pending.length} pending
          </div>
        )}
      </div>

      {/* Bulk actions bar */}
      <AnimatePresence>
        {selected.size > 0 && (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            className="flex items-center gap-3 rounded-[3rem] border border-glass-border bg-surface-raised px-4 py-3"
          >
            <span className="text-sm font-semibold text-text-secondary">
              {selected.size} selected
            </span>
            <div className="ml-auto flex gap-2">
              <button
                type="button"
                onClick={() => bulkMutation.mutate('approved')}
                disabled={bulkMutation.isPending}
                className="flex items-center gap-2 rounded-[2rem] bg-emerald-success/15 px-4 py-2 text-sm font-bold text-emerald-light transition hover:bg-emerald-success/25 disabled:opacity-50"
              >
                <ThumbsUp className="h-4 w-4" />
                Approve All <span className="text-xs opacity-60">(A)</span>
              </button>
              <button
                type="button"
                onClick={() => bulkMutation.mutate('rejected')}
                disabled={bulkMutation.isPending}
                className="flex items-center gap-2 rounded-[2rem] bg-danger/15 px-4 py-2 text-sm font-bold text-danger transition hover:bg-danger/25 disabled:opacity-50"
              >
                <ThumbsDown className="h-4 w-4" />
                Reject All <span className="text-xs opacity-60">(R)</span>
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Select all */}
      {pending.length > 1 && (
        <button
          type="button"
          onClick={selectAll}
          className="text-xs font-semibold text-champagne transition hover:text-champagne-dim"
        >
          {selected.size === pending.length ? 'Deselect all' : 'Select all'}
        </button>
      )}

      {/* Loading */}
      {isLoading && (
        <div className="flex items-center justify-center py-16">
          <Loader2 className="h-8 w-8 animate-spin text-champagne" />
        </div>
      )}

      {/* Empty state */}
      {!isLoading && pending.length === 0 && (
        <div className="flex flex-col items-center gap-3 rounded-3xl border border-dashed border-glass-border bg-surface/30 py-16 text-center" role="status" aria-live="polite">
          <AlertCircle className="h-10 w-10 text-text-muted opacity-30" />
          <p className="text-sm text-text-muted">No receipts pending approval. Employees&apos; scans will appear here once submitted.</p>
        </div>
      )}

      {/* Cards */}
      <AnimatePresence mode="popLayout">
        {pending.map((r) => (
          <ApprovalCard
            key={r.id}
            receipt={r}
            selected={selected.has(r.id)}
            onToggle={() => toggleSelect(r.id)}
            onApprove={(id) => handleSingleAction(id, 'approved')}
            onReject={(id) => handleSingleAction(id, 'rejected')}
            loading={actionLoading === r.id}
          />
        ))}
      </AnimatePresence>

      {/* Keyboard hint */}
      {pending.length > 0 && (
        <div className="flex items-center gap-2 rounded-[3rem] border border-glass-border bg-surface px-4 py-3">
          <Clock className="h-4 w-4 text-text-muted" />
          <p className="text-xs text-text-muted">
            Select receipts then use the bulk toolbar. Keyboard: <kbd className="rounded bg-surface-raised px-1.5 py-0.5 text-champagne">A</kbd> = Approve, <kbd className="rounded bg-surface-raised px-1.5 py-0.5 text-danger">R</kbd> = Reject.
          </p>
        </div>
      )}
    </section>
  );
}
