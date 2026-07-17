'use client';

import { useState, useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  AlertCircle, Loader2, Clock, CheckCircle2, XCircle, GripVertical,
} from 'lucide-react';
import { motion } from 'framer-motion';
import { fadeUp, springGentle } from '@/lib/animations';
import { toast } from 'sonner';
import PageHeader from '@/components/layout/PageHeader';
import { supabase, getOrgIdString } from '@/lib/supabase';
import { formatCurrency, formatDate, categoryColor } from '@/lib/ui-utils';
import { cn } from '@/lib/utils';
import type { ReceiptRow } from '@/lib/types';

type ColumnKey = 'pending' | 'approved' | 'rejected';

const COLUMNS: { key: ColumnKey; label: string; icon: typeof Clock }[] = [
  { key: 'pending', label: 'Pending', icon: Clock },
  { key: 'approved', label: 'Approved', icon: CheckCircle2 },
  { key: 'rejected', label: 'Rejected', icon: XCircle },
];

function mapStatus(status: string | null | undefined): ColumnKey {
  const s = (status ?? '').toLowerCase();
  if (s === 'approved') return 'approved';
  if (s === 'rejected') return 'rejected';
  return 'pending';
}

async function fetchReceipts(orgId: string): Promise<ReceiptRow[]> {
  const { data, error } = await supabase
    .from('receipts')
    .select('*')
    .eq('org_id', orgId)
    .eq('is_deleted', false)
    .order('transaction_date', { ascending: false })
    .limit(100);
  if (error) throw new Error('Failed to load receipts');
  return (data || []) as ReceiptRow[];
}

export default function KanbanWorkflow() {
  const queryClient = useQueryClient();
  const [draggingId, setDraggingId] = useState<string | null>(null);
  const [dragOverCol, setDragOverCol] = useState<ColumnKey | null>(null);

  const { data: orgId } = useQuery({
    queryKey: ['kanban-org'],
    queryFn: async () => {
      const id = await getOrgIdString();
      if (!id) throw new Error('No organization found');
      return id;
    },
    staleTime: Infinity,
  });

  const { data: receipts = [], isLoading, error } = useQuery({
    queryKey: ['kanban-receipts', orgId],
    queryFn: () => fetchReceipts(orgId!),
    enabled: !!orgId,
    staleTime: 5 * 60 * 1000,
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: ColumnKey }) => {
      const dbStatus = status === 'pending' ? 'submitted' : status;
      const { error } = await supabase
        .from('receipts')
        .update({ approval_status: dbStatus, updated_at: new Date().toISOString() })
        .eq('id', id)
        .eq('org_id', orgId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['kanban-receipts'] });
      toast.success('Receipt status updated');
    },
    onError: (err) => {
      toast.error(err instanceof Error ? err.message : 'Failed to update status');
    },
  });

  const columns: Record<ColumnKey, ReceiptRow[]> = {
    pending: receipts.filter((r) => mapStatus(r.approval_status) === 'pending'),
    approved: receipts.filter((r) => mapStatus(r.approval_status) === 'approved'),
    rejected: receipts.filter((r) => mapStatus(r.approval_status) === 'rejected'),
  };

  const handleDragStart = useCallback((id: string) => {
    setDraggingId(id);
  }, []);

  function handleDragOver(e: React.DragEvent, col: ColumnKey) {
    e.preventDefault();
    setDragOverCol(col);
  }

  function handleDrop(col: ColumnKey) {
    if (draggingId) {
      const receipt = receipts.find((r) => r.id === draggingId);
      const currentCol = receipt ? mapStatus(receipt.approval_status) : null;
      if (currentCol !== col) {
        updateMutation.mutate({ id: draggingId, status: col });
      }
    }
    setDraggingId(null);
    setDragOverCol(null);
  }

  function handleDragEnd() {
    setDraggingId(null);
    setDragOverCol(null);
  }

  return (
    <div className="space-y-5 fade-in">
      <PageHeader
        title="Approval Workflow"
        subtitle="Drag receipts between columns to update their approval status"
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
          <CheckCircle2 className="h-10 w-10 text-text-muted/50" />
          <p className="text-sm text-text-muted">No receipts yet.</p>
          <p className="text-xs text-text-muted/70">Upload receipts to start the approval workflow.</p>
        </div>
      )}

      {!isLoading && !error && receipts.length > 0 && (
        <div className="grid gap-4 md:grid-cols-3">
          {COLUMNS.map((col) => {
            const Icon = col.icon;
            const items = columns[col.key];
            return (
              <div
                key={col.key}
                onDragOver={(e) => handleDragOver(e, col.key)}
                onDrop={() => handleDrop(col.key)}
                className={cn(
                  'flex flex-col rounded-2xl border border-glass-border bg-surface/50 p-3 transition-colors',
                  dragOverCol === col.key && 'border-champagne/40 bg-champagne/5'
                )}
              >
                <div className="flex items-center gap-2 px-2 pb-3">
                  <Icon className="h-4 w-4 text-text-muted" />
                  <span className="text-sm font-semibold text-text-primary">{col.label}</span>
                  <span className="ml-auto text-xs text-text-muted bg-surface-raised rounded-full px-2 py-0.5">
                    {items.length}
                  </span>
                </div>

                <div className="flex flex-col gap-2 overflow-y-auto max-h-[65vh] pr-1">
                  {items.map((receipt, i) => (
                    <motion.div
                      key={receipt.id}
                      variants={fadeUp}
                      initial="hidden"
                      animate="show"
                      transition={{ ...springGentle, delay: i * 0.015 }}
                      draggable
                      onDragStart={() => handleDragStart(receipt.id)}
                      onDragEnd={handleDragEnd}
                      className={cn(
                        'cursor-grab rounded-xl border bg-card p-3 shadow-sm transition-all active:cursor-grabbing',
                        draggingId === receipt.id ? 'opacity-50 shadow-md' : 'hover:shadow-md',
                        col.key === 'pending' && 'border-l-4 border-l-warning',
                        col.key === 'approved' && 'border-l-4 border-l-emerald-success',
                        col.key === 'rejected' && 'border-l-4 border-l-danger',
                      )}
                    >
                      <div className="flex items-start gap-2">
                        <GripVertical className="mt-0.5 h-4 w-4 shrink-0 text-text-muted/30" />
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-sm font-semibold text-text-primary">
                            {receipt.vendor_name || 'Unknown Vendor'}
                          </p>
                          <p className="mt-0.5 text-xs text-text-muted">
                            {formatDate(receipt.transaction_date)}
                          </p>
                          <div className="mt-2 flex items-center gap-2">
                            <span className={cn(
                              'rounded-full border px-2 py-0.5 text-[10px] font-semibold',
                              categoryColor(receipt.category)
                            )}>
                              {receipt.category || 'Uncategorized'}
                            </span>
                            <span className="ml-auto text-sm font-semibold tabular-nums text-text-primary">
                              {formatCurrency(receipt.total_amount, receipt.currency)}
                            </span>
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  ))}

                  {items.length === 0 && (
                    <div className="flex flex-col items-center gap-2 rounded-xl border border-dashed border-glass-border bg-surface/30 py-8 text-center">
                      <p className="text-xs text-text-muted/60">No receipts</p>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
