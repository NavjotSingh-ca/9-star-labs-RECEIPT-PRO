'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { AlertCircle, Check, Loader2, Share2, Mail, Copy, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'sonner';
import PageHeader from '@/components/layout/PageHeader';
import { supabase, getOrgIdString } from '@/lib/supabase';
import { formatCurrency, formatDate } from '@/lib/ui-utils';
import { cn } from '@/lib/utils';
import type { ReceiptRow } from '@/lib/types';

async function fetchReceipts(orgId: string): Promise<ReceiptRow[]> {
  const { data, error } = await supabase
    .from('receipts')
    .select('*')
    .eq('org_id', orgId)
    .eq('is_deleted', false)
    .order('transaction_date', { ascending: false });
  if (error) throw new Error('Failed to load receipts');
  return (data || []) as ReceiptRow[];
}

function buildShareText(receipts: ReceiptRow[]): string {
  const lines = receipts.map(
    (r) => `${r.vendor_name || 'Unknown'} — ${formatCurrency(r.total_amount, r.currency)} — ${formatDate(r.transaction_date)}`
  );
  return `Receipt${receipts.length > 1 ? 's' : ''}:\n${lines.join('\n')}`;
}

function buildMailtoSubject(receipts: ReceiptRow[]): string {
  if (receipts.length === 1) {
    return `Receipt: ${receipts[0].vendor_name || 'Unknown'} — ${formatCurrency(receipts[0].total_amount, receipts[0].currency)}`;
  }
  return `${receipts.length} Receipts for your records`;
}

function buildMailtoBody(receipts: ReceiptRow[]): string {
  return receipts
    .map(
      (r) =>
        `- ${r.vendor_name || 'Unknown'}: ${formatCurrency(r.total_amount, r.currency)} on ${formatDate(r.transaction_date)}`
    )
    .join('\n');
}

export default function ShareReceipt() {
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [dialogOpen, setDialogOpen] = useState(false);

  const { data: orgId } = useQuery({
    queryKey: ['share-org'],
    queryFn: async () => {
      const id = await getOrgIdString();
      if (!id) throw new Error('No organization found');
      return id;
    },
    staleTime: Infinity,
  });

  const { data: receipts = [], isLoading, error } = useQuery({
    queryKey: ['share-receipts', orgId],
    queryFn: () => fetchReceipts(orgId!),
    enabled: !!orgId,
    staleTime: 5 * 60 * 1000,
  });

  const toggleReceipt = (id: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const selectedList = receipts.filter((r) => selected.has(r.id));

  const handleShare = async () => {
    if (selectedList.length === 0) return;

    const nav = navigator as Navigator & { share?: (data: { title?: string; text?: string }) => Promise<void> };
    if (typeof nav.share === 'function') {
      try {
        await nav.share({
          title: 'Receipts',
          text: buildShareText(selectedList),
        });
        toast.success('Shared successfully');
        setDialogOpen(false);
        return;
      } catch {
        // user cancelled — do nothing
        return;
      }
    }

    // Fallback: copy to clipboard
    const text = buildShareText(selectedList);
    try {
      await navigator.clipboard.writeText(text);
      toast.success('Copied to clipboard');
      setDialogOpen(false);
    } catch {
      toast.error('Failed to copy to clipboard');
    }
  };

  const handleMailto = () => {
    if (selectedList.length === 0) return;
    const subject = encodeURIComponent(buildMailtoSubject(selectedList));
    const body = encodeURIComponent(buildMailtoBody(selectedList));
    window.open(`mailto:?subject=${subject}&body=${body}`, '_blank');
    setDialogOpen(false);
  };

  return (
    <div className="space-y-5 fade-in">
      <PageHeader
        title="Share Receipts"
        subtitle="Select receipts to share via link, email, or your device"
        action={
          receipts.length > 0 && (
            <button
              type="button"
              onClick={() => setDialogOpen(true)}
              disabled={selected.size === 0}
              className={cn(
                'inline-flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-semibold transition-colors',
                selected.size > 0
                  ? 'bg-champagne text-white hover:bg-champagne-dim'
                  : 'bg-surface text-text-muted border border-glass-border cursor-not-allowed'
              )}
            >
              <Share2 className="h-4 w-4" />
              Share ({selected.size})
            </button>
          )
        }
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
          <Share2 className="h-10 w-10 text-text-muted/50" />
          <p className="text-sm text-text-muted">No receipts to share yet.</p>
          <p className="text-xs text-text-muted/70">Upload receipts, then share them with your team or accountant.</p>
        </div>
      )}

      {!isLoading && !error && receipts.length > 0 && (
        <div className="space-y-2">
          {selected.size > 0 && (
            <p className="text-xs text-text-muted px-1">
              {selected.size} receipt{selected.size !== 1 ? 's' : ''} selected
            </p>
          )}
          {receipts.map((receipt, i) => (
            <motion.div
              key={receipt.id}
              initial={{ opacity: 0, y: 4 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.015, duration: 0.15 }}
              onClick={() => toggleReceipt(receipt.id)}
              className={cn(
                'flex cursor-pointer items-center gap-4 rounded-xl border px-4 py-3 shadow-sm transition-all',
                selected.has(receipt.id)
                  ? 'border-champagne/50 bg-champagne/5'
                  : 'border-glass-border bg-card hover:bg-surface/50'
              )}
            >
              <div
                className={cn(
                  'flex h-5 w-5 shrink-0 items-center justify-center rounded border transition-colors',
                  selected.has(receipt.id)
                    ? 'border-champagne bg-champagne text-white'
                    : 'border-glass-border bg-surface'
                )}
              >
                {selected.has(receipt.id) && <Check className="h-3 w-3" />}
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-semibold text-text-primary">
                  {receipt.vendor_name || 'Unknown Vendor'}
                </p>
                <p className="mt-0.5 text-xs text-text-muted">
                  {formatDate(receipt.transaction_date)}
                </p>
              </div>
              <span className="shrink-0 text-sm font-semibold tabular-nums text-text-primary">
                {formatCurrency(receipt.total_amount, receipt.currency)}
              </span>
            </motion.div>
          ))}
        </div>
      )}

      <AnimatePresence>
        {dialogOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-40 bg-black/40"
              onClick={() => setDialogOpen(false)}
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="fixed left-1/2 top-1/2 z-50 w-full max-w-sm -translate-x-1/2 -translate-y-1/2 rounded-2xl border border-glass-border bg-card p-6 shadow-lg"
            >
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-base font-bold text-text-primary">Share Receipts</h2>
                <button
                  type="button"
                  onClick={() => setDialogOpen(false)}
                  className="rounded-lg p-1 text-text-muted hover:bg-surface-hover"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>

              <p className="mb-4 text-sm text-text-secondary">
                {selectedList.length} receipt{selectedList.length !== 1 ? 's' : ''} selected
              </p>

              <div className="space-y-2">
                <button
                  type="button"
                  onClick={handleShare}
                  className="flex w-full items-center gap-3 rounded-xl border border-glass-border bg-surface px-4 py-3 text-sm font-semibold text-text-primary transition-colors hover:bg-surface-hover"
                >
                  <Share2 className="h-5 w-5 text-champagne" />
                  {'share' in navigator ? 'Share via device' : 'Copy to clipboard'}
                </button>

                <button
                  type="button"
                  onClick={handleMailto}
                  className="flex w-full items-center gap-3 rounded-xl border border-glass-border bg-surface px-4 py-3 text-sm font-semibold text-text-primary transition-colors hover:bg-surface-hover"
                >
                  <Mail className="h-5 w-5 text-info" />
                  Send via email
                </button>

                <button
                  type="button"
                  onClick={async () => {
                    const text = buildShareText(selectedList);
                    try {
                      await navigator.clipboard.writeText(text);
                      toast.success('Copied to clipboard');
                      setDialogOpen(false);
                    } catch {
                      toast.error('Failed to copy');
                    }
                  }}
                  className="flex w-full items-center gap-3 rounded-xl border border-glass-border bg-surface px-4 py-3 text-sm font-semibold text-text-primary transition-colors hover:bg-surface-hover"
                >
                  <Copy className="h-5 w-5 text-text-muted" />
                  Copy as text
                </button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
