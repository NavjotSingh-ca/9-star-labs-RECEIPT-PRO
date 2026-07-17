'use client';

import { useState, useMemo, useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { AlertCircle, Check, ChevronDown, Download, Loader2, Square, Trash2, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'sonner';
import { fadeUp } from '@/lib/animations';
import PageHeader from '@/components/layout/PageHeader';
import { Badge } from '@/components/ui/badge';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { supabase, getOrgIdString } from '@/lib/supabase';
import { formatCurrency, formatDate } from '@/lib/ui-utils';
import { cn } from '@/lib/utils';
import { logError } from '@/lib/logger';
import type { ReceiptRow } from '@/lib/types';
import { bulkDeleteReceipts, undeleteReceipts } from '@/lib/services/receipts';

const TAG_DEFS = [
  { value: 'important', label: 'Important' },
  { value: 'work', label: 'Work' },
  { value: 'personal', label: 'Personal' },
  { value: 'tax', label: 'Tax' },
  { value: 'client', label: 'Client' },
  { value: 'other', label: 'Other' },
] as const;

function tagNotes(notes: string | null | undefined, tag: string): string {
  const current = (() => {
    if (!notes) return {};
    try { return JSON.parse(notes); } catch { return {}; }
  })();
  const tags: string[] = Array.isArray(current?.tags) ? current.tags : [];
  if (tags.includes(tag)) return notes ?? '';
  return JSON.stringify({ ...current, tags: [...tags, tag] });
}

/**
 * Process `items` in chunks, awaiting each chunk concurrently and reporting
 * progress so large bulk edits can show a live counter instead of freezing.
 */
async function runChunked<T>(
  items: T[],
  worker: (item: T) => PromiseLike<unknown>,
  onProgress: (done: number, total: number) => void,
  chunkSize = 15,
): Promise<void> {
  for (let i = 0; i < items.length; i += chunkSize) {
    const slice = items.slice(i, i + chunkSize);
    await Promise.all(slice.map(worker));
    onProgress(Math.min(i + chunkSize, items.length), items.length);
  }
}

function exportCSV(receipts: ReceiptRow[]): void {
  const headers = ['Vendor', 'Date', 'Amount', 'Currency', 'Category', 'Notes'];
  const rows = receipts.map((r) => [
    r.vendor_name,
    r.transaction_date,
    r.total_amount.toString(),
    r.currency,
    r.category,
    r.notes ?? '',
  ]);
  const csv = [headers, ...rows]
    .map((row) => row.map((v) => `"${String(v ?? '').replace(/"/g, '""')}"`).join(','))
    .join('\n');
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `receipts-export-${Date.now()}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}

async function fetchCategories(orgId: string): Promise<string[]> {
  const { data, error } = await supabase
    .from('receipts')
    .select('category')
    .eq('org_id', orgId)
    .eq('is_deleted', false)
    .not('category', 'is', null)
    .not('category', 'eq', '');
  if (error) throw new Error('Failed to load categories');
  const set = new Set<string>();
  (data || []).forEach((r) => { if (r.category) set.add(r.category); });
  return Array.from(set).sort();
}

async function fetchRecentReceipts(orgId: string): Promise<ReceiptRow[]> {
  const { data, error } = await supabase
    .from('receipts')
    .select('*')
    .eq('org_id', orgId)
    .eq('is_deleted', false)
    .order('transaction_date', { ascending: false })
    .limit(50);
  if (error) throw new Error('Failed to load receipts');
  return (data || []) as ReceiptRow[];
}

export default function BatchOperations() {
  const queryClient = useQueryClient();
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [showCategoryPicker, setShowCategoryPicker] = useState(false);
  const [showTagPicker, setShowTagPicker] = useState(false);
  const [progress, setProgress] = useState<{ current: number; total: number } | null>(null);

  const { data: orgId } = useQuery({
    queryKey: ['batch-org'],
    queryFn: async () => {
      const id = await getOrgIdString();
      if (!id) throw new Error('No organization found');
      return id;
    },
    staleTime: Infinity,
  });

  const { data: receipts = [], isLoading, error } = useQuery({
    queryKey: ['batch-receipts', orgId],
    queryFn: () => fetchRecentReceipts(orgId!),
    enabled: !!orgId,
    staleTime: 30 * 1000,
  });

  const { data: categories = [] } = useQuery({
    queryKey: ['batch-categories', orgId],
    queryFn: () => fetchCategories(orgId!),
    enabled: !!orgId,
    staleTime: 10 * 60 * 1000,
  });

  const allSelected = receipts.length > 0 && selectedIds.size === receipts.length;
  const selectedReceipts = useMemo(
    () => receipts.filter((r) => selectedIds.has(r.id)),
    [receipts, selectedIds]
  );

  const toggleAll = useCallback(() => {
    if (allSelected) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(receipts.map((r) => r.id)));
    }
  }, [receipts, allSelected]);

  const toggleOne = useCallback((id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }, []);

  const clearSelection = useCallback(() => setSelectedIds(new Set()), []);

  /** Re-apply captured per-receipt values (used by Undo for category/tag edits). */
  const restoreReceipts = useCallback(
    async (patchMap: Map<string, { category?: string | null; notes?: string | null }>) => {
      if (!orgId) return;
      const updates = Array.from(patchMap.entries()).map(([id, patch]) =>
        supabase
          .from('receipts')
          .update({ ...patch, updated_at: new Date().toISOString() })
          .eq('id', id)
          .eq('org_id', orgId)
      );
      await Promise.all(updates);
      queryClient.invalidateQueries({ queryKey: ['batch-receipts'] });
    },
    [orgId, queryClient]
  );

  const categoryMutation = useMutation({
    mutationFn: async (category: string) => {
      if (!orgId) throw new Error('No organization found');
      const prev = new Map(selectedReceipts.map((r) => [r.id, { category: r.category }]));
      await runChunked(
        selectedReceipts,
        (r) =>
          supabase
            .from('receipts')
            .update({ category, updated_at: new Date().toISOString() })
            .eq('id', r.id)
            .eq('org_id', orgId),
        (done, total) => setProgress({ current: done, total })
      );
      return prev;
    },
    onSuccess: (prev) => {
      queryClient.invalidateQueries({ queryKey: ['batch-receipts'] });
      setShowCategoryPicker(false);
      setProgress(null);
      const ids = selectedReceipts.map((r) => r.id);
      clearSelection();
      toast.success(`Categorized ${ids.length} receipts`, {
        action: { label: 'Undo', onClick: () => undoCategory(prev) },
      });
    },
    onError: (err) => {
      setProgress(null);
      logError(err, { action: 'batch_category_update' });
    },
  });

  const undoCategory = useCallback(
    async (prev: Map<string, { category?: string | null }>) => {
      const patchMap = new Map<string, { category?: string | null }>();
      prev.forEach((v, k) => patchMap.set(k, { category: v.category ?? null }));
      await restoreReceipts(patchMap);
      toast('Category change undone');
    },
    [restoreReceipts]
  );

  const tagMutation = useMutation({
    mutationFn: async (tag: string) => {
      if (!orgId) throw new Error('No organization found');
      const prev = new Map(selectedReceipts.map((r) => [r.id, { notes: r.notes }]));
      await runChunked(
        selectedReceipts,
        (r) =>
          supabase
            .from('receipts')
            .update({ notes: tagNotes(r.notes, tag), updated_at: new Date().toISOString() })
            .eq('id', r.id)
            .eq('org_id', orgId),
        (done, total) => setProgress({ current: done, total })
      );
      return prev;
    },
    onSuccess: (prev) => {
      queryClient.invalidateQueries({ queryKey: ['batch-receipts'] });
      setShowTagPicker(false);
      setProgress(null);
      const ids = selectedReceipts.map((r) => r.id);
      clearSelection();
      toast.success(`Tagged ${ids.length} receipts`, {
        action: { label: 'Undo', onClick: () => undoTag(prev) },
      });
    },
    onError: (err) => {
      setProgress(null);
      logError(err, { action: 'batch_tag_update' });
    },
  });

  const undoTag = useCallback(
    async (prev: Map<string, { notes?: string | null }>) => {
      const patchMap = new Map<string, { notes?: string | null }>();
      prev.forEach((v, k) => patchMap.set(k, { notes: v.notes ?? null }));
      await restoreReceipts(patchMap);
      toast('Tag change undone');
    },
    [restoreReceipts]
  );

  const deleteMutation = useMutation({
    mutationFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');
      const ids = Array.from(selectedIds);
      await bulkDeleteReceipts(ids, user.id);
      return ids;
    },
    onSuccess: (ids) => {
      queryClient.invalidateQueries({ queryKey: ['batch-receipts'] });
      clearSelection();
      toast(`Moved ${ids.length} receipts to trash`, {
        description: 'You can undo this for 30 days.',
        action: { label: 'Undo', onClick: () => undoDelete(ids) },
        duration: 8000,
      });
    },
    onError: (err) => logError(err, { action: 'batch_delete' }),
  });

  const undoDelete = useCallback(
    async (ids: string[]) => {
      try {
        await undeleteReceipts(ids);
        queryClient.invalidateQueries({ queryKey: ['batch-receipts'] });
        toast.success('Receipts restored');
      } catch (err) {
        logError(err, { action: 'undo_delete' });
        toast.error('Could not restore receipts');
      }
    },
    [queryClient]
  );

  return (
    <motion.div
      variants={fadeUp}
      initial="hidden"
      animate="show"
      className="space-y-5"
    >
      <PageHeader
        title="Batch Operations"
        subtitle="Edit, tag, export, or delete multiple receipts at once"
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
          <Square className="h-10 w-10 text-text-muted/50" />
          <p className="text-sm text-text-muted">No receipts available.</p>
          <p className="text-xs text-text-muted/70">
            Upload receipts first, then use batch operations to manage them efficiently.
          </p>
        </div>
      )}

      {!isLoading && !error && receipts.length > 0 && (
        <>
          <div className="flex items-center justify-between">
            <button
              type="button"
              onClick={toggleAll}
              className="flex items-center gap-2 text-sm font-semibold text-text-secondary hover:text-text-primary transition-colors"
            >
              <span
                className={cn(
                  'flex h-5 w-5 items-center justify-center rounded-md border text-[10px] transition-colors',
                  allSelected
                    ? 'bg-champagne border-champagne text-black'
                    : 'border-glass-border hover:border-champagne/50'
                )}
              >
                {allSelected && <Check className="h-3 w-3" />}
              </span>
              {allSelected ? 'Deselect All' : 'Select All'}
            </button>
            <span className="text-xs text-text-muted">
              {receipts.length} receipts shown (most recent 50)
            </span>
          </div>

          <div className="overflow-hidden rounded-2xl border border-glass-border bg-card shadow-sm">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-glass-border bg-surface-raised">
                  <th className="w-10 px-3 py-3" />
                  <th className="px-3 py-3 text-left text-xs font-semibold text-text-muted uppercase tracking-tight">
                    Vendor
                  </th>
                  <th className="px-3 py-3 text-left text-xs font-semibold text-text-muted uppercase tracking-tight">
                    Date
                  </th>
                  <th className="px-3 py-3 text-right text-xs font-semibold text-text-muted uppercase tracking-tight">
                    Amount
                  </th>
                  <th className="px-3 py-3 text-left text-xs font-semibold text-text-muted uppercase tracking-tight">
                    Category
                  </th>
                </tr>
              </thead>
              <tbody>
                {receipts.map((r, i) => {
                  const checked = selectedIds.has(r.id);
                  return (
                    <tr
                      key={r.id}
                      onClick={() => toggleOne(r.id)}
                      onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); toggleOne(r.id); } }}
                      tabIndex={0}
                      role="button"
                      className={cn(
                        'border-b border-glass-border transition-colors cursor-pointer',
                        i % 2 === 0 ? 'bg-surface' : 'bg-surface-raised/50',
                        checked ? 'bg-champagne/5 hover:bg-champagne/10' : 'hover:bg-champagne/5'
                      )}
                    >
                      <td className="px-3 py-3" role="presentation">
                        <button
                          type="button"
                          onClick={(e) => { e.stopPropagation(); toggleOne(r.id); }}
                          className={cn(
                            'flex h-5 w-5 items-center justify-center rounded-md border text-[10px] transition-colors',
                            checked
                              ? 'bg-champagne border-champagne text-black'
                              : 'border-glass-border hover:border-champagne/50'
                          )}
                        >
                          {checked && <Check className="h-3 w-3" />}
                        </button>
                      </td>
                      <td className="px-3 py-3 font-semibold text-text-primary">
                        {r.vendor_name || 'Unknown'}
                      </td>
                      <td className="px-3 py-3 text-xs text-text-muted">
                        {formatDate(r.transaction_date)}
                      </td>
                      <td className="px-3 py-3 text-right tabular-nums font-semibold text-text-primary">
                        {formatCurrency(r.total_amount, r.currency)}
                      </td>
                      <td className="px-3 py-3">
                        {r.category && (
                          <Badge variant="outline" className="rounded-full text-[10px]">
                            {r.category}
                          </Badge>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          <AnimatePresence>
            {selectedIds.size > 0 && (
              <motion.div
                initial={{ y: 80, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                exit={{ y: 80, opacity: 0 }}
                transition={{ type: 'spring', stiffness: 300, damping: 30 }}
                className="fixed bottom-6 left-1/2 z-50 flex -translate-x-1/2 items-center gap-3 rounded-2xl border border-glass-border bg-card px-5 py-3 shadow-modal"
              >
                <span className="text-sm font-semibold text-text-primary whitespace-nowrap">
                  {selectedIds.size} selected
                </span>
                {progress && (
                  <span className="flex items-center gap-1.5 text-xs font-medium text-champagne whitespace-nowrap">
                    <Loader2 className="h-3 w-3 animate-spin" />
                    {progress.current}/{progress.total}
                  </span>
                )}
                <div className="h-5 w-px bg-glass-border" />

                <div className="relative">
                  <button
                    type="button"
                    onClick={() => { setShowCategoryPicker(!showCategoryPicker); setShowTagPicker(false); }}
                    className="flex items-center gap-1 rounded-xl bg-surface px-3 py-1.5 text-xs font-semibold text-text-secondary hover:text-text-primary transition-colors border border-glass-border"
                  >
                    Category <ChevronDown className="h-3 w-3" />
                  </button>
                  {showCategoryPicker && (
                    <div className="absolute bottom-full left-0 mb-2 w-48 rounded-xl border border-glass-border bg-card p-2 shadow-dropdown z-10 max-h-60 overflow-y-auto">
                      {categories.map((cat) => (
                        <button
                          key={cat}
                          type="button"
                          onClick={() => categoryMutation.mutate(cat)}
                          disabled={categoryMutation.isPending}
                          className="w-full rounded-lg px-3 py-1.5 text-left text-xs font-medium text-text-secondary hover:bg-surface-hover hover:text-text-primary transition-colors"
                        >
                          {cat}
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                <div className="relative">
                  <button
                    type="button"
                    onClick={() => { setShowTagPicker(!showTagPicker); setShowCategoryPicker(false); }}
                    className="flex items-center gap-1 rounded-xl bg-surface px-3 py-1.5 text-xs font-semibold text-text-secondary hover:text-text-primary transition-colors border border-glass-border"
                  >
                    Add Tag <ChevronDown className="h-3 w-3" />
                  </button>
                  {showTagPicker && (
                    <div className="absolute bottom-full left-0 mb-2 w-44 rounded-xl border border-glass-border bg-card p-2 shadow-dropdown z-10">
                      {TAG_DEFS.map((def) => (
                        <button
                          key={def.value}
                          type="button"
                          onClick={() => tagMutation.mutate(def.value)}
                          disabled={tagMutation.isPending}
                          className="w-full rounded-lg px-3 py-1.5 text-left text-xs font-medium text-text-secondary hover:bg-surface-hover hover:text-text-primary transition-colors"
                        >
                          {def.label}
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                <button
                  type="button"
                  onClick={() => exportCSV(selectedReceipts)}
                  disabled={progress !== null}
                  className="flex items-center gap-1 rounded-xl bg-surface px-3 py-1.5 text-xs font-semibold text-text-secondary hover:text-text-primary transition-colors border border-glass-border disabled:opacity-50"
                >
                  <Download className="h-3 w-3" /> Export CSV
                </button>

                <div className="h-5 w-px bg-glass-border" />

                <AlertDialog>
                  <AlertDialogTrigger>
                    <button
                      type="button"
                      className="flex items-center gap-1 rounded-xl bg-danger/10 px-3 py-1.5 text-xs font-semibold text-danger hover:bg-danger/20 transition-colors border border-danger/20"
                    >
                      <Trash2 className="h-3 w-3" /> Delete
                    </button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Delete {selectedIds.size} receipts?</AlertDialogTitle>
                      <AlertDialogDescription>
                        This action moves the selected receipts to the trash. You can recover them
                        within 30 days before permanent deletion.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel />
                      <AlertDialogAction>
                        <button
                          type="button"
                          onClick={() => deleteMutation.mutate()}
                          disabled={deleteMutation.isPending || progress !== null}
                          className="rounded-xl bg-danger px-4 py-2 text-xs font-semibold text-white hover:bg-danger/80 transition-colors disabled:opacity-50"
                        >
                          {deleteMutation.isPending ? 'Deleting...' : 'Delete'}
                        </button>
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>

                <button
                  type="button"
                  onClick={clearSelection}
                  className="ml-1 text-text-muted hover:text-text-primary transition-colors"
                  title="Clear selection"
                >
                  <X className="h-4 w-4" />
                </button>
              </motion.div>
            )}
          </AnimatePresence>
        </>
      )}
    </motion.div>
  );
}
