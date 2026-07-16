'use client';

import { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { AlertCircle, ArrowLeft, Check, Loader2, Scale } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import PageHeader from '@/components/layout/PageHeader';
import { supabase, getOrgIdString, getReceiptImageUrl } from '@/lib/supabase';
import { formatCurrency, formatDate } from '@/lib/ui-utils';
import { cn } from '@/lib/utils';
import type { ReceiptRow } from '@/lib/types';

interface ComparisonField {
  label: string;
  getValue: (r: ReceiptRow) => string;
}

const FIELDS: ComparisonField[] = [
  { label: 'Vendor', getValue: (r) => r.vendor_name || '—' },
  { label: 'Date', getValue: (r) => formatDate(r.transaction_date) },
  { label: 'Amount', getValue: (r) => formatCurrency(r.total_amount, r.currency) },
  { label: 'Currency', getValue: (r) => r.currency || 'CAD' },
  { label: 'Category', getValue: (r) => r.category || '—' },
  { label: 'Tax Amount', getValue: (r) => formatCurrency(r.tax_amount) },
  { label: 'PST Amount', getValue: (r) => r.pst_amount != null ? formatCurrency(r.pst_amount) : '—' },
  { label: 'Payment Method', getValue: (r) => r.payment_method || '—' },
  { label: 'Approval Status', getValue: (r) => r.approval_status || '—' },
  { label: 'Notes', getValue: (r) => r.notes || '—' },
];

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

export default function ReceiptComparison() {
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [compareIds, setCompareIds] = useState<[string, string] | null>(null);
  const [imageUrls, setImageUrls] = useState<Record<string, string | null>>({});

  const { data: orgId } = useQuery({
    queryKey: ['compare-org'],
    queryFn: async () => {
      const id = await getOrgIdString();
      if (!id) throw new Error('No organization found');
      return id;
    },
    staleTime: Infinity,
  });

  const { data: receipts = [], isLoading, error } = useQuery({
    queryKey: ['compare-receipts', orgId],
    queryFn: () => fetchReceipts(orgId!),
    enabled: !!orgId,
    staleTime: 5 * 60 * 1000,
  });

  const selectedCount = selectedIds.size;
  const canCompare = selectedCount === 2;

  const toggleSelection = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else if (next.size < 2) {
        next.add(id);
      }
      return next;
    });
  };

  const handleCompare = () => {
    if (!canCompare) return;
    const arr = Array.from(selectedIds) as [string, string];
    setCompareIds(arr);
    loadImages(arr);
  };

  const loadImages = async (ids: [string, string]) => {
    const left = receipts.find((r) => r.id === ids[0]);
    const right = receipts.find((r) => r.id === ids[1]);
    const [leftUrl, rightUrl] = await Promise.all([
      getReceiptImageUrl(left?.image_url),
      getReceiptImageUrl(right?.image_url),
    ]);
    setImageUrls({ [ids[0]]: leftUrl, [ids[1]]: rightUrl });
  };

  const handleBack = () => {
    setCompareIds(null);
    setSelectedIds(new Set());
    setImageUrls({});
  };

  const [leftReceipt, rightReceipt] = useMemo<[ReceiptRow | null, ReceiptRow | null]>(() => {
    if (!compareIds) return [null, null];
    return [
      receipts.find((r) => r.id === compareIds[0]) ?? null,
      receipts.find((r) => r.id === compareIds[1]) ?? null,
    ];
  }, [receipts, compareIds]);

  const diffFields = useMemo(() => {
    if (!leftReceipt || !rightReceipt) return new Set<string>();
    const set = new Set<string>();
    for (const field of FIELDS) {
      if (field.getValue(leftReceipt) !== field.getValue(rightReceipt)) {
        set.add(field.label);
      }
    }
    return set;
  }, [leftReceipt, rightReceipt]);

  return (
    <div className="space-y-5 fade-in">
      <PageHeader
        title="Receipt Comparison"
        subtitle="Compare two receipts side by side"
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
          <Scale className="h-10 w-10 text-text-muted/50" />
          <p className="text-sm text-text-muted">No receipts to compare.</p>
          <p className="text-xs text-text-muted/70">
            Upload at least two receipts, then select them to see a side-by-side comparison.
          </p>
        </div>
      )}

      {!isLoading && !error && receipts.length > 0 && !compareIds && (
        <>
          <div className="flex items-center justify-between">
            <p className="text-xs text-text-muted">
              {selectedCount === 0
                ? 'Select two receipts to compare'
                : selectedCount === 1
                  ? 'Select one more receipt'
                  : 'Ready to compare'}
            </p>
            <button
              type="button"
              onClick={handleCompare}
              disabled={!canCompare}
              className={cn(
                'flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-semibold transition-all',
                canCompare
                  ? 'bg-champagne text-black hover:bg-champagne-dim shadow-sm'
                  : 'bg-surface text-text-muted border border-glass-border cursor-not-allowed opacity-50'
              )}
            >
              <Scale className="h-4 w-4" />
              Compare
            </button>
          </div>

          <div className="space-y-2">
            {receipts.map((r, i) => {
              const checked = selectedIds.has(r.id);
              return (
                <motion.div
                  key={r.id}
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.015, duration: 0.15 }}
                  onClick={() => toggleSelection(r.id)}
                  className={cn(
                    'flex cursor-pointer items-center justify-between rounded-xl border px-4 py-3 shadow-sm transition-all',
                    checked
                      ? 'border-champagne/40 bg-champagne/5'
                      : 'border-glass-border bg-card hover:bg-surface/50'
                  )}
                >
                  <div className="flex items-center gap-3 min-w-0 flex-1">
                    <span
                      className={cn(
                        'flex h-5 w-5 shrink-0 items-center justify-center rounded-md border text-[10px] transition-colors',
                        checked
                          ? 'bg-champagne border-champagne text-black'
                          : 'border-glass-border'
                      )}
                    >
                      {checked && <Check className="h-3 w-3" />}
                    </span>
                    <div className="min-w-0">
                      <p className="truncate text-sm font-semibold text-text-primary">
                        {r.vendor_name || 'Unknown Vendor'}
                      </p>
                      <p className="text-xs text-text-muted">
                        {formatDate(r.transaction_date)}
                      </p>
                    </div>
                  </div>
                  <span className="ml-4 text-sm font-semibold tabular-nums text-text-primary shrink-0">
                    {formatCurrency(r.total_amount, r.currency)}
                  </span>
                </motion.div>
              );
            })}
          </div>
        </>
      )}

      <AnimatePresence mode="wait">
        {compareIds && leftReceipt && rightReceipt && (
          <motion.div
            key="comparison-view"
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -12 }}
            transition={{ duration: 0.2 }}
          >
            <button
              type="button"
              onClick={handleBack}
              className="mb-4 flex items-center gap-1.5 text-sm font-semibold text-text-secondary hover:text-text-primary transition-colors"
            >
              <ArrowLeft className="h-4 w-4" />
              Back to selection
            </button>

            <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
              {([leftReceipt, rightReceipt] as const).map((receipt, idx) => {
                const receiptId = compareIds[idx];
                const imgUrl = imageUrls[receiptId];
                return (
                  <div
                    key={receiptId}
                    className="rounded-2xl border border-glass-border bg-card p-5 shadow-sm"
                  >
                    <h3 className="mb-4 text-base font-bold tracking-tight text-text-primary">
                      Receipt {idx + 1}
                    </h3>

                    {imgUrl && (
                      <div className="mb-4 overflow-hidden rounded-xl border border-glass-border bg-surface">
                        {/* eslint-disable-next-line @next/next/no-img-element -- dynamic blob URL, Image doesn't support blob: protocol */}
                        <img
                          src={imgUrl}
                          alt={`Receipt from ${receipt.vendor_name}`}
                          className="h-48 w-full object-contain"
                          loading="lazy"
                        />
                      </div>
                    )}

                    <div className="space-y-2">
                      {FIELDS.map((field) => {
                        const val = field.getValue(receipt);
                        const isDiff = diffFields.has(field.label);
                        return (
                          <div
                            key={field.label}
                            className={cn(
                              'flex items-start justify-between rounded-lg px-3 py-2 text-sm',
                              isDiff && 'bg-danger/5 ring-1 ring-danger/20'
                            )}
                          >
                            <span className="text-text-muted font-medium">{field.label}</span>
                            <span
                              className={cn(
                                'ml-3 text-right font-medium max-w-[60%] truncate',
                                isDiff ? 'text-danger' : 'text-text-primary'
                              )}
                            >
                              {val}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>

            {diffFields.size > 0 && (
              <div className="mt-4 rounded-xl bg-warning/10 px-4 py-3 text-xs text-warning border border-warning/20">
                <AlertCircle className="inline h-3.5 w-3.5 mr-1.5" />
                {diffFields.size} difference{diffFields.size !== 1 ? 's' : ''} found:{' '}
                {Array.from(diffFields).join(', ')}
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
