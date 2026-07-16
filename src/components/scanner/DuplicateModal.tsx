'use client';

import { motion } from 'framer-motion';
import { AlertTriangle, Ban, CopyCheck } from 'lucide-react';

import { useFocusTrap } from '@/hooks/useFocusTrap';
import type { DuplicateModalProps } from './types';

function formatCurrency(amount: number | null | undefined) {
  return new Intl.NumberFormat('en-CA', {
    style: 'currency',
    currency: 'CAD',
  }).format(Number(amount ?? 0));
}

function formatDate(date: string | null | undefined) {
  if (!date) return 'Unknown date';

  const parsed = new Date(`${date}T00:00:00`);
  if (Number.isNaN(parsed.getTime())) return date;

  return parsed.toLocaleDateString('en-CA', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}

/**
 * Duplicate receipt confirmation modal.
 * Displays the existing record details and asks the user to confirm or cancel.
 * Keyboard-accessible with focus trap, Escape to dismiss, and ARIA dialog semantics.
 */
export default function DuplicateModal({
  candidate,
  onCancel,
  onContinue,
}: DuplicateModalProps) {
  const trapRef = useFocusTrap(true);
  const titleId = 'duplicate-modal-title';
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0, transition: { duration: 0.15 } }}
      transition={{ duration: 0.2 }}
      className="fixed inset-0 z-[110] flex items-center justify-center bg-obsidian/80 p-4 backdrop-blur-xl"
      onClick={onCancel}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => { if (e.key === 'Escape' || e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onCancel?.(); } }}
    >
      <div
        ref={trapRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        className="w-full max-w-lg overflow-hidden rounded-3xl border border-glass-border bg-surface shadow-2xl"
        onClick={(e) => e.stopPropagation()}
        onKeyDown={(e) => { if (e.key === 'Escape') onCancel?.(); }}
      >
        <div className="border-b border-glass-border px-5 py-4">
          <div className="flex items-start gap-3">
            <div className="flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-[2rem] bg-warning/15 text-warning">
              <AlertTriangle className="h-5 w-5" aria-hidden="true" />
            </div>

            <div>
              <h3 id={titleId} className="text-base font-bold text-text-primary">Possible duplicate receipt</h3>
              <p className="mt-1 text-sm text-text-secondary">
                A matching receipt was found using the SHA-256 file hash or the vendor/date/amount fingerprint.
              </p>
            </div>
          </div>
        </div>

        <div className="space-y-4 px-5 py-5">
          <div className="rounded-[3rem] border border-glass-border bg-surface-raised p-4">
            <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-text-muted">Existing record</p>

            <div className="mt-3 grid grid-cols-2 gap-3 text-sm">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-text-muted">Vendor</p>
                <p className="mt-1 font-semibold text-text-primary">{candidate.vendor_name}</p>
              </div>

              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-text-muted">Date</p>
                <p className="mt-1 font-semibold text-text-primary">{formatDate(candidate.transaction_date)}</p>
              </div>

              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-text-muted">Total</p>
                <p className="mt-1 font-semibold tabular-nums text-champagne">{formatCurrency(candidate.total_amount)}</p>
              </div>

              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-text-muted">Category</p>
                <p className="mt-1 font-semibold text-text-primary">{candidate.category || 'Uncategorized'}</p>
              </div>
            </div>

            {candidate.integrity_hash && (
              <div className="mt-4 rounded-[2rem] border border-glass-border bg-surface p-3">
                <p className="text-xs font-semibold uppercase tracking-wide text-text-muted">SHA-256 hash</p>
                <p className="mt-1 break-all font-mono text-[11px] text-text-secondary">{candidate.integrity_hash}</p>
              </div>
            )}
          </div>

          <div className="rounded-[3rem] border border-warning/20 bg-warning/[0.06] px-4 py-3">
            <div className="flex items-start gap-3">
              <CopyCheck className="mt-0.5 h-4 w-4 flex-shrink-0 text-warning" aria-hidden="true" />
              <p className="text-sm leading-relaxed text-warning">
                If this is a separate receipt that only looks similar, you can still save it. Otherwise, cancel and
                review the existing record first.
              </p>
            </div>
          </div>
        </div>

        <div className="flex flex-col-reverse gap-3 border-t border-glass-border px-5 py-4 sm:flex-row sm:justify-end">
          <button
            type="button"
            onClick={onCancel}
            className="inline-flex items-center justify-center gap-2 rounded-[2rem] border border-glass-border bg-surface px-4 py-3 text-sm font-semibold text-text-secondary transition hover:bg-surface-raised"
          >
            <Ban className="h-4 w-4" aria-hidden="true" />
            Cancel
          </button>

          <button
            type="button"
            onClick={onContinue}
            className="inline-flex items-center justify-center gap-2 rounded-[2rem] bg-emerald-success px-4 py-3 text-sm font-semibold text-white transition hover:bg-emerald-success/80"
          >
            <CopyCheck className="h-4 w-4" aria-hidden="true" />
            Save anyway
          </button>
        </div>
      </div>
    </motion.div>
  );
}