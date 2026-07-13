'use client';

import { useState, useMemo, useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { AlertCircle, Check, ChevronDown, Download, Loader2, Square, Trash2, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
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
import { bulkDeleteReceipts } from '@/lib/services/receipts';

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

  const categoryMutation = useMutation({
    mutationFn: async (category: string) => {
      const updates = selectedReceipts.map((r) =>
        supabase
          .from('receipts')
          .update({ category, updated_at: new Date().toISOString() })
          .eq('id', r.id)
          .eq('org_id', orgId)
      );
      await Promise.all(updates);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['batch-receipts'] });
      setShowCategoryPicker(false);
      clearSelection();
    },
    onError: (err) => logError(err, { action: 'batch_category_update' }),
  });

  const tagMutation = useMutation({
    mutationFn: async (tag: string) => {
      const updates = selectedReceipts.map((r) => {
        const newNotes = tagNotes(r.notes, tag);
        return supabase
          .from('receipts')
          .update({ notes: newNotes, updated_at: new Date().toISOString() })
          .eq('id', r.id)
          .eq('org_id', orgId);
      });
      await Promise.all(updates);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['batch-receipts'] });
      setShowTagPicker(false);
      clearSelection();
    },
    onError: (err) => logError(err, { action: 'batch_tag_update' }),
  });

  const deleteMutation = useMutation({
    mutationFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');
      await bulkDeleteReceipts(Array.from(selectedIds), user.id);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['batch-receipts'] });
      clearSelection();
    },
    onError: (err) => logError(err, { action: 'batch_delete' }),
  });

  return (
    <div className="space-y-5 fade-in">
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
                    ? 'bg-champagne border-champagne text-white'
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
                      className={cn(
                        'border-b border-glass-border transition-colors cursor-pointer',
                        i % 2 === 0 ? 'bg-surface' : 'bg-surface-raised/50',
                        checked ? 'bg-champagne/5 hover:bg-champagne/10' : 'hover:bg-champagne/5'
                      )}
                    >
                      <td className="px-3 py-3" onClick={(e) => e.stopPropagation()}>
                        <button
                          type="button"
                          onClick={() => toggleOne(r.id)}
                          className={cn(
                            'flex h-5 w-5 items-center justify-center rounded-md border text-[10px] transition-colors',
                            checked
                              ? 'bg-champagne border-champagne text-white'
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
                  className="flex items-center gap-1 rounded-xl bg-surface px-3 py-1.5 text-xs font-semibold text-text-secondary hover:text-text-primary transition-colors border border-glass-border"
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
                          disabled={deleteMutation.isPending}
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
    </div>
  );
}
