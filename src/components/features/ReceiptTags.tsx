'use client';

import { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { AlertCircle, Loader2, Tags, X } from 'lucide-react';
import { motion } from 'framer-motion';
import PageHeader from '@/components/layout/PageHeader';
import { supabase, getOrgIdString } from '@/lib/supabase';
import { formatCurrency, formatDate } from '@/lib/ui-utils';
import { cn } from '@/lib/utils';
import type { ReceiptRow } from '@/lib/types';

const TAG_DEFS = [
  { value: 'important', label: 'Important', cls: 'bg-danger/15 text-danger border-danger/20 hover:bg-danger/25' },
  { value: 'work', label: 'Work', cls: 'bg-info/15 text-info border-info/20 hover:bg-info/25' },
  { value: 'personal', label: 'Personal', cls: 'bg-success/15 text-success border-success/20 hover:bg-success/25' },
  { value: 'tax', label: 'Tax', cls: 'bg-warning/15 text-warning border-warning/20 hover:bg-warning/25' },
  { value: 'client', label: 'Client', cls: 'bg-chart-6/15 text-chart-6 border-chart-6/20 hover:bg-chart-6/25' },
  { value: 'other', label: 'Other', cls: 'bg-chart-3/15 text-chart-3 border-chart-3/20 hover:bg-chart-3/25' },
] as const;

type TagValue = (typeof TAG_DEFS)[number]['value'];

function parseTags(notes: string | null | undefined): TagValue[] {
  if (!notes) return [];
  try {
    const parsed = JSON.parse(notes);
    if (Array.isArray(parsed?.tags)) {
      return parsed.tags.filter((t: string) => TAG_DEFS.some((d) => d.value === t));
    }
  } catch { /* notes is not JSON — ignore */ }
  return [];
}

function toggleTagInNotes(notes: string | null | undefined, tag: TagValue): string {
  const current = (() => {
    if (!notes) return {};
    try { return JSON.parse(notes); } catch { return {}; }
  })();
  const tags: TagValue[] = Array.isArray(current?.tags) ? current.tags : [];
  const next = tags.includes(tag) ? tags.filter((t) => t !== tag) : [...tags, tag];
  return JSON.stringify({ ...current, tags: next });
}

async function fetchReceiptsWithTags(orgId: string): Promise<ReceiptRow[]> {
  const { data, error } = await supabase
    .from('receipts')
    .select('*')
    .eq('org_id', orgId)
    .eq('is_deleted', false)
    .order('transaction_date', { ascending: false });
  if (error) throw new Error('Failed to load receipts');
  return (data || []) as ReceiptRow[];
}

export default function ReceiptTags() {
  const queryClient = useQueryClient();
  const [activeTag, setActiveTag] = useState<TagValue | null>(null);

  const { data: orgId } = useQuery({
    queryKey: ['tags-org'],
    queryFn: async () => {
      const id = await getOrgIdString();
      if (!id) throw new Error('No organization found');
      return id;
    },
    staleTime: Infinity,
  });

  const { data: receipts = [], isLoading, error } = useQuery({
    queryKey: ['tags-receipts', orgId],
    queryFn: () => fetchReceiptsWithTags(orgId!),
    enabled: !!orgId,
    staleTime: 5 * 60 * 1000,
  });

  const receiptsWithParsed = useMemo(
    () => receipts.map((r) => ({ ...r, _tags: parseTags(r.notes) })),
    [receipts]
  );

  const allUsedTags = useMemo(() => {
    const set = new Set<TagValue>();
    for (const r of receiptsWithParsed) r._tags.forEach((t) => set.add(t));
    return TAG_DEFS.filter((d) => set.has(d.value));
  }, [receiptsWithParsed]);

  const filtered = useMemo(() => {
    if (!activeTag) return receiptsWithParsed;
    return receiptsWithParsed.filter((r) => r._tags.includes(activeTag));
  }, [receiptsWithParsed, activeTag]);

  const toggleMutation = useMutation({
    mutationFn: async ({ receipt, tag }: { receipt: ReceiptRow; tag: TagValue }) => {
      const newNotes = toggleTagInNotes(receipt.notes, tag);
      const { error } = await supabase
        .from('receipts')
        .update({ notes: newNotes, updated_at: new Date().toISOString() })
        .eq('id', receipt.id)
        .eq('org_id', orgId);
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['tags-receipts'] }),
  });

  const hasTagFilter = activeTag !== null;

  return (
    <div className="space-y-5 fade-in">
      <PageHeader
        title="Receipt Tags"
        subtitle="Color-code receipts for quick sorting and filtering"
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
          <Tags className="h-10 w-10 text-text-muted/50" />
          <p className="text-sm text-text-muted">No receipts to tag yet.</p>
          <p className="text-xs text-text-muted/70">
            Upload receipts, then assign color-coded tags to organize them.
          </p>
        </div>
      )}

      {!isLoading && !error && receipts.length > 0 && (
        <>
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => setActiveTag(null)}
              className={cn(
                'rounded-full border px-3 py-1 text-xs font-semibold transition-colors',
                !hasTagFilter
                  ? 'bg-champagne/15 text-champagne border-champagne/30'
                  : 'bg-surface text-text-muted border-glass-border hover:bg-surface-hover'
              )}
            >
              All ({receipts.length})
            </button>
            {allUsedTags.map((def) => (
              <button
                key={def.value}
                type="button"
                onClick={() => setActiveTag(activeTag === def.value ? null : def.value)}
                className={cn(
                  'rounded-full border px-3 py-1 text-xs font-semibold transition-colors',
                  activeTag === def.value
                    ? def.cls
                    : 'bg-surface text-text-muted border-glass-border hover:bg-surface-hover'
                )}
              >
                {def.label}
                {' '}
                <span className="opacity-70">
                  ({receiptsWithParsed.filter((r) => r._tags.includes(def.value)).length})
                </span>
              </button>
            ))}
          </div>

          <div className="space-y-2">
            <p className="text-xs text-text-muted px-1">
              {filtered.length} receipt{filtered.length !== 1 ? 's' : ''}
              {hasTagFilter && ' tagged'}
              {' '}· Click a tag chip to toggle it on a receipt
            </p>

            {filtered.map((receipt, i) => (
              <motion.div
                key={receipt.id}
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.02, duration: 0.15 }}
                className="flex items-center justify-between rounded-xl border border-glass-border bg-card px-4 py-3 shadow-sm transition-colors hover:bg-surface/50"
              >
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold text-text-primary">
                    {receipt.vendor_name || 'Unknown Vendor'}
                  </p>
                  <p className="mt-0.5 text-xs text-text-muted">
                    {formatDate(receipt.transaction_date)}
                  </p>
                </div>
                <div className="flex items-center gap-2 ml-4">
                  <span className="text-sm font-semibold tabular-nums text-text-primary">
                    {formatCurrency(receipt.total_amount, receipt.currency)}
                  </span>
                  <div className="flex items-center gap-1">
                    {TAG_DEFS.map((def) => {
                      const active = receipt._tags.includes(def.value);
                      return (
                        <button
                          key={def.value}
                          type="button"
                          onClick={() =>
                            toggleMutation.mutate({ receipt, tag: def.value })
                          }
                          disabled={toggleMutation.isPending}
                          title={`${active ? 'Remove' : 'Add'} "${def.label}" tag`}
                          className={cn(
                            'rounded-full border px-2 py-0.5 text-[10px] font-semibold transition-all',
                            active
                              ? def.cls
                              : 'border-glass-border text-text-muted/50 bg-transparent hover:bg-surface-hover hover:text-text-muted'
                          )}
                        >
                          {def.label}
                          {active && (
                            <X className="inline h-2.5 w-2.5 ml-0.5" />
                          )}
                        </button>
                      );
                    })}
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
