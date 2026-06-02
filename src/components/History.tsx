'use client';

import React, { useMemo, useState } from 'react';
import {
  ChevronDown,
  DollarSign,
  Loader2,
  Receipt,
  RefreshCw,
  Trash2,
  X,
  BrainCircuit,
  MessageSquare,
  Send,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Drawer } from 'vaul';

import { semanticSearchAction } from '@/app/actions/semantic-search';
import { updateReceiptApproval, updateReceipt, deleteReceipt, getReceiptsPaginated } from '@/lib/services/receipts';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { ProfessionalLedger } from '@/components/history/ProfessionalLedger';
import { ReceiptTableSkeleton } from '@/components/ui/PremiumSkeletons';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { getReceiptImageUrl } from '@/lib/supabase';

import type { ReceiptRow } from '@/lib/types';
import type { UserRole } from '@/lib/types';
import { supabase } from '@/lib/supabase';
import { useInfiniteQuery } from '@tanstack/react-query';
import {
  toNumber,
  formatCurrency,
  formatDate,
  categoryColor,
  confidenceTone,
  approvalBadge,
  reimbursementBadge,
} from '@/lib/ui-utils';

/* ─── Contextual Empty States ─── */
const emptyStateMap: Record<string, { title: string; subtitle: string }> = {
  'flagged-audit': { title: 'No flagged receipts', subtitle: 'All receipts pass your audit rules.' },
  'reimbursement': { title: 'No pending reimbursements', subtitle: 'All employee expenses are settled.' },
  'approved': { title: 'No approved receipts', subtitle: 'Receipts will appear here once approved by the owner.' },
  'review': { title: 'No receipts pending review', subtitle: 'All submissions have been processed.' },
  'missing': { title: 'No incomplete receipts', subtitle: 'All receipts have complete information.' },
  'all': { title: 'No receipts yet', subtitle: 'Scan your first receipt to start building your CRA-compliant ledger.' },
};

type HistoryProps = {
  receipts: ReceiptRow[];
  activeFilter?: string;
  onUpdate?: () => Promise<void> | void;
  onScan?: () => void;
  role?: UserRole;
  userId?: string | null;
};

export default function History({
  receipts: initialReceipts,
  activeFilter = 'all',
  onUpdate,
  onScan,
  role = 'Owner',
  userId,
}: HistoryProps) {
  const [selectedReceipt, setSelectedReceipt] = useState<ReceiptRow | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [refreshing, setRefreshing] = useState(false);
  const [semanticMode, setSemanticMode] = useState(false);
  const [semanticResults, setSemanticResults] = useState<string[] | null>(null);
  const [semanticLoading, setSemanticLoading] = useState(false);

  const {
    data: infiniteData,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    isLoading,
    refetch
  } = useInfiniteQuery({
    initialPageParam: 0,
    queryKey: ['receipts_paginated', role, userId, activeFilter, search, semanticResults, semanticMode],
    queryFn: async ({ pageParam = 0 }) => {
      if (!userId) return { receipts: [], totalCount: 0 };
      
      let approvalStatus: string | undefined = undefined;
      let filterCategory: string | undefined = undefined;
      
      const normalizedFilter = activeFilter.toLowerCase();
      if (normalizedFilter === 'approved') approvalStatus = 'approved';
      else if (normalizedFilter === 'review' || normalizedFilter === 'pending-review') approvalStatus = 'submitted';
      else if (normalizedFilter !== 'all' && normalizedFilter !== 'missing' && normalizedFilter !== 'missing-bn' && normalizedFilter !== 'flagged-audit' && normalizedFilter !== 'reimbursement') {
        filterCategory = activeFilter;
      }

      // If semanticMode is on but we have no results from AI yet, don't fetch from DB
      if (semanticMode && !semanticResults) return { receipts: [], totalCount: 0 };

      return getReceiptsPaginated({
        role,
        userId,
        limit: 25,
        offset: pageParam,
        category: filterCategory,
        approvalStatus: approvalStatus,
        search: search.trim() ? search.trim() : undefined,
        semanticIds: semanticMode && semanticResults ? semanticResults : undefined,
      });
    },
    getNextPageParam: (lastPage, pages) => {
      if (lastPage.receipts.length < 25) return undefined;
      return pages.length * 25;
    },
    enabled: !!userId,
  });

  const receipts = React.useMemo(() => {
    if (!infiniteData) return [];
    return infiniteData.pages.flatMap((page) => page.receipts);
  }, [infiniteData]);

  const totalCount = infiniteData?.pages[0]?.totalCount || 0;

  const filteredReceipts = useMemo(() => {
    let items = [...receipts];
    const normalizedFilter = activeFilter.toLowerCase();

    if (normalizedFilter !== 'all') {
      if (normalizedFilter === 'missing' || normalizedFilter === 'missing-bn') {
        items = items.filter(
          (r) =>
            !String(r.vendor_tax_number ?? '').trim() ||
            !String(r.vendor_name ?? '').trim() ||
            !String(r.transaction_date ?? '').trim() ||
            toNumber(r.total_amount) <= 0
        );
      } else if (normalizedFilter === 'flagged-audit') {
        items = items.filter(
          (r) =>
            r.flagged_for_audit ||
            r.math_mismatch_warning ||
            r.duplicate_warning ||
            r.thermal_warning ||
            (toNumber(r.cra_readiness_score) > 0 && toNumber(r.cra_readiness_score) < 70)
        );
      } else if (normalizedFilter === 'reimbursement') {
        items = items.filter((r) => r.paid_by === 'employee_cash');
      }
    }

    if (semanticMode && semanticResults) {
      items = items.filter((r) => semanticResults.includes(r.id));
    }

    return items;
  }, [receipts, activeFilter, semanticMode, semanticResults]);

  const handleDelete = async (id: string) => {
    setDeleteTarget(id);
  };

  const confirmDelete = async () => {
    if (!deleteTarget || !userId) return;
    try {
      await deleteReceipt(deleteTarget, userId);
      if (onUpdate) await onUpdate();
      refetch();
    } catch (err) {
      console.error('Delete error:', err);
    } finally {
      setDeleteTarget(null);
    }
  };

  const handleSemanticSearch = async (query: string) => {
    if (!query.trim()) {
      setSemanticResults(null);
      return;
    }
    setSemanticLoading(true);
    try {
      const results = await semanticSearchAction(query);
      setSemanticResults(results.map(r => r.id));
    } catch (err) {
      console.error('Semantic search failed:', err);
    } finally {
      setSemanticLoading(false);
    }
  };

  return (
    <>
      <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-1000">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between px-2">
          <div>
            <h2 className="text-3xl font-bold tracking-tight">
              {new Date().toLocaleDateString('en-CA', { month: 'long', year: 'numeric' })} Receipts
            </h2>
            <p className="mt-1 text-sm font-medium text-muted-foreground">
              <span className="font-bold">{totalCount}</span> record{totalCount === 1 ? '' : 's'} · {activeFilter === 'all' ? 'All entries' : activeFilter}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Button
              onClick={() => refetch()}
              variant="outline"
              className="px-4 font-bold"
            >
              <RefreshCw className={cn("mr-2 h-4 w-4", isFetchingNextPage ? "animate-spin" : "")} />
              Sync
            </Button>
            <Button
              onClick={() => setSemanticMode(!semanticMode)}
              variant={semanticMode ? "default" : "outline"}
              className="font-bold transition-all"
            >
              <BrainCircuit className="mr-2 h-4 w-4" />
              AI Search
            </Button>
          </div>
        </div>

        {/* Semantic Search Pulse */}
        <AnimatePresence>
          {semanticMode && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="px-2"
            >
              <div className="rounded-xl border bg-muted/20 p-4">
                <div className="flex items-center gap-3">
                  <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
                    <BrainCircuit className="h-4 w-4" />
                  </div>
                  <div className="flex-1">
                    <p className="text-xs font-bold uppercase tracking-widest text-primary">Semantic Audit Engine Active</p>
                    <input 
                      type="text"
                      placeholder="Describe what you're looking for (e.g. 'Fuel receipts over $100 from last March')"
                      className="mt-2 w-full bg-transparent text-sm font-medium outline-none placeholder:text-muted-foreground"
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') handleSemanticSearch(e.currentTarget.value);
                      }}
                    />
                    {semanticLoading && (
                      <div className="mt-2 flex items-center gap-2 text-[10px] text-primary font-bold uppercase tracking-widest animate-pulse">
                        Analyzing patterns...
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* The Ledger */}
        {isLoading && !receipts.length ? (
          <ReceiptTableSkeleton />
        ) : receipts.length === 0 ? (
          <div className="flex min-h-[40vh] flex-col items-center justify-center gap-6 rounded-xl border border-dashed bg-muted/10 p-12 text-center">
            <div className="flex h-20 w-20 items-center justify-center rounded-xl bg-muted text-muted-foreground">
              <Receipt className="h-10 w-10" />
            </div>
            <div>
              <h3 className="text-xl font-bold tracking-tight">
                {emptyStateMap[activeFilter]?.title || 'No records found'}
              </h3>
              <p className="mt-2 text-sm text-muted-foreground max-w-xs">
                {emptyStateMap[activeFilter]?.subtitle || 'Adjust your filters or scan a new receipt to populate the ledger.'}
              </p>
              {onScan && activeFilter === 'all' && (
                <Button onClick={onScan} className="rounded-full px-6">
                  Scan Receipt
                </Button>
              )}
            </div>
          </div>
        ) : (
          <div className="animate-in fade-in slide-in-from-bottom-4 duration-700">
            <ProfessionalLedger 
              data={filteredReceipts} 
              onSelect={setSelectedReceipt}
              onDelete={handleDelete}
            />
            
            {/* Infinite Scroll Trigger */}
            {hasNextPage && (
              <div className="mt-8 flex justify-center pb-8">
                <Button
                  onClick={() => fetchNextPage()}
                  disabled={isFetchingNextPage}
                  variant="outline"
                  className="px-8 font-bold"
                >
                  {isFetchingNextPage ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : (
                    <ChevronDown className="mr-2 h-4 w-4" />
                  )}
                  Load More Audit Records
                </Button>
              </div>
            )}
          </div>
        )}
      </div>

      <Drawer.Root 
        open={!!selectedReceipt} 
        onOpenChange={(open) => !open && setSelectedReceipt(null)}
        shouldScaleBackground
      >
        <Drawer.Portal>
          <Drawer.Overlay className="fixed inset-0 z-[150] bg-black/60 backdrop-blur-sm" />
          <Drawer.Content className="fixed bottom-0 left-0 right-0 z-[160] flex flex-col rounded-t-2xl border-t bg-background outline-none focus:ring-0 sm:max-w-3xl sm:mx-auto sm:mb-6 sm:rounded-2xl sm:max-h-[95vh] bottom-nav">
            <div className="mx-auto mt-4 h-1.5 w-12 flex-shrink-0 rounded-full bg-muted" />
            
            {selectedReceipt && (
              <div className="flex-1 overflow-y-auto px-2">
                <ErrorBoundary componentName="ReceiptDetailModal">
                  <ReceiptDetailModal
                    key={`detail-${selectedReceipt.id}`}
                    receipt={selectedReceipt}
                    onClose={() => setSelectedReceipt(null)}
                    role={role}
                    onUpdate={onUpdate}
                  />
                </ErrorBoundary>
              </div>
            )}
          </Drawer.Content>
        </Drawer.Portal>
      </Drawer.Root>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={!!deleteTarget} onOpenChange={(open) => { if (!open) setDeleteTarget(null); }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Receipt Record</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently remove this receipt from the ledger. The original data will be preserved in the audit trail, but this entry will no longer appear in reports or searches.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel
              render={<Button variant="outline" className="rounded-xl font-semibold" />}
            />
            <AlertDialogAction
              render={<Button variant="destructive" className="rounded-xl font-semibold" />}
              onClick={confirmDelete}
            >
              Delete Record
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}

/* ─── Detail Modal ─── */

type ReceiptDetailModalProps = {
  receipt: ReceiptRow;
  onClose: () => void;
  role?: UserRole;
  onUpdate?: () => Promise<void> | void;
};

function ReceiptDetailModal({ receipt, onClose, role = 'Owner', onUpdate }: ReceiptDetailModalProps) {
  const score = toNumber(receipt.confidence_score);
  const tone = confidenceTone(score);
  const [editing, setEditing] = useState(false);
  
  // Full Edit State
  const [vendorName, setVendorName] = useState(receipt.vendor_name ?? '');
  const [vendorTaxNumber, setVendorTaxNumber] = useState(receipt.vendor_tax_number ?? receipt.business_number ?? '');
  const [totalAmount, setTotalAmount] = useState(receipt.total_amount ?? 0);
  const [transactionDate, setTransactionDate] = useState(receipt.transaction_date ?? '');
  const [category, setCategory] = useState(receipt.category ?? '');
  const [notesValue, setNotesValue] = useState(receipt.notes ?? '');

  const [editSaving, setEditSaving] = useState(false);
  const [editError, setEditError] = useState('');
  const [editSuccess, setEditSuccess] = useState(false);
  const [approvalLoading, setApprovalLoading] = useState(false);
  const [localApproval, setLocalApproval] = useState(receipt.approval_status ?? 'submitted');

  // Comments State
  const [commentText, setCommentText] = useState('');
  const [comments, setComments] = useState<{ id: string; comment: string; created_at: string; user_id?: string; user?: { email: string } }[]>([]);
  const [commentLoading, setCommentLoading] = useState(false);

  React.useEffect(() => {
    fetch(`/api/receipts/comments?receiptId=${receipt.id}`)
      .then(res => res.json())
      .then(data => { if (data.data) setComments(data.data) })
      .catch(console.error);
  }, [receipt.id]);

  async function handlePostComment() {
    if (!commentText.trim()) return;
    setCommentLoading(true);
    try {
      const res = await fetch('/api/receipts/comments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ receiptId: receipt.id, comment: commentText })
      });
      if (res.ok) {
        setCommentText('');
        const { data } = await res.json();
        setComments(prev => [...prev, data]);
        
        // Also set status to needs_clarification if Accountant
        if (role === 'Accountant' && localApproval !== 'needs_clarification') {
          handleApproval('needs_clarification' as 'approved' | 'rejected'); // cast for now if type doesn't support it
        }
      }
    } finally {
      setCommentLoading(false);
    }
  }

  const approval = approvalBadge(localApproval);
  const needsReimburse = receipt.paid_by === 'employee_cash';
  const reimburse = needsReimburse ? reimbursementBadge(receipt.reimbursement_status) : null;

  async function handleApproval(status: 'approved' | 'rejected') {
    setApprovalLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      await updateReceiptApproval(
        receipt.id,
        status,
        user.id,
        needsReimburse,
        receipt.vendor_name || 'Unknown',
        receipt.transaction_date || ''
      );

      setLocalApproval(status);
      if (onUpdate) await onUpdate();
    } catch (err) {
      setEditError(err instanceof Error ? err.message : 'Approval failed.');
    } finally {
      setApprovalLoading(false);
    }
  }

  async function handleSaveEdit() {
    setEditSaving(true);
    setEditError('');
    setEditSuccess(false);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      await updateReceipt(receipt.id, {
        vendor_name: vendorName,
        vendor_tax_number: vendorTaxNumber,
        business_number: vendorTaxNumber, // Maintain backward compatibility
        total_amount: Number(totalAmount),
        transaction_date: transactionDate,
        category: category,
        notes: notesValue,
      }, user.id, receipt);

      setEditSuccess(true);
      setEditing(false);
      if (onUpdate) await onUpdate();
    } catch (err: unknown) {
      setEditError(err instanceof Error ? err.message : 'Edit failed.');
    } finally {
      setEditSaving(false);
    }
  }

  const [deleteLoading, setDeleteLoading] = useState(false);

  async function handleDelete() {
    if (!window.confirm("Are you sure you want to delete this receipt? This action will move it to the trash.")) return;
    setDeleteLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      await deleteReceipt(receipt.id, user.id);
      
      onClose();
      if (onUpdate) await onUpdate();
    } catch (err) {
      setEditError(err instanceof Error ? err.message : 'Delete failed.');
    } finally {
      setDeleteLoading(false);
    }
  }

  const [syncLoading, setSyncLoading] = useState<string | null>(null);

  async function handleAccountingSync(provider: 'qbo' | 'xero') {
    setSyncLoading(provider);
    try {
      const resp = await fetch(`/api/integrations/${provider}?action=sync&receiptId=${receipt.id}`, { method: 'POST' });
      const result = await resp.json();
      if (!resp.ok) throw new Error(result.error || 'Sync failed');
      alert(`Successfully synced to ${provider.toUpperCase()}`);
    } catch (err: unknown) {
      alert(`Sync Error: ${err instanceof Error ? err.message : 'Unknown error'}`);
    } finally {
      setSyncLoading(null);
    }
  }

  const [displayUrl, setDisplayUrl] = useState<string | null>(null);

  React.useEffect(() => {
    async function getFreshUrl() {
      if (!receipt.image_url) return;
      const freshUrl = await getReceiptImageUrl(receipt.image_url);
      setDisplayUrl(freshUrl);
    }
    getFreshUrl();
  }, [receipt.image_url]);

  const imageUrl = displayUrl ?? '';

  return (
      <div className="flex w-full flex-col overflow-hidden pb-12">
        <div className="flex items-center justify-between gap-3 px-5 py-6">
          <div className="min-w-0">
            <h3 className="truncate text-2xl font-black text-text-primary tracking-tight">
              {receipt.vendor_name ?? 'Unknown Vendor'}
            </h3>
            <div className="mt-1 flex flex-wrap items-center gap-2">
              <p className="text-xs font-bold text-text-muted uppercase tracking-widest">{formatDate(receipt.transaction_date)}</p>
              <Badge variant="outline" className={cn("rounded-full px-3 py-1 font-black uppercase tracking-widest", approval.cls)}>
                {approval.label}
              </Badge>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="icon"
              onClick={handleDelete}
              disabled={deleteLoading}
              className="h-12 w-12 rounded-[2rem] bg-red-500/10 text-red-400 border-red-500/20 hover:bg-red-500/20"
            >
              {deleteLoading ? <Loader2 className="h-5 w-5 animate-spin" /> : <Trash2 className="h-5 w-5" />}
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={onClose}
              className="h-12 w-12 rounded-[2rem] bg-surface-raised"
            >
              <X className="h-6 w-6" />
            </Button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto px-5 space-y-8">
          {imageUrl && (
            <div className="relative rounded-[3rem] border border-glass-border bg-obsidian/20 overflow-hidden shadow-2xl">
              <img 
                src={imageUrl} 
                alt="Receipt" 
                className="max-h-[60vh] w-full object-contain" 
              />
            </div>
          )}

          <div className="grid gap-6 sm:grid-cols-2">
            {/* AI Context Card */}
            <Card className="rounded-xl border bg-card p-6 shadow-sm">
              <div className="flex items-center gap-3 mb-4 text-xs font-bold uppercase tracking-widest text-muted-foreground">
                <BrainCircuit className="h-4 w-4 text-primary" />
                AI Analysis
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm font-bold">Confidence Score</span>
                <span className={cn("text-xl font-bold tabular-nums", tone.label.includes('High') ? 'text-emerald-600 dark:text-emerald-400' : 'text-amber-500')}>
                  {score}%
                </span>
              </div>
              <div className="mt-4 h-2 w-full bg-muted rounded-full overflow-hidden">
                <motion.div 
                  initial={{ width: 0 }}
                  animate={{ width: `${score}%` }}
                  className={cn("h-full", tone.label.includes('High') ? 'bg-emerald-500' : 'bg-amber-500')}
                />
              </div>
            </Card>

            {/* Total Card */}
            <Card className="rounded-xl border bg-primary/10 p-6 shadow-sm">
              <div className="flex items-center gap-3 mb-4 text-xs font-bold uppercase tracking-widest text-primary/80">
                <DollarSign className="h-4 w-4" />
                Gross Total
              </div>
              <p className="text-4xl font-bold tracking-tight tabular-nums text-primary">
                {formatCurrency(toNumber(receipt.total_amount), receipt.currency ?? 'CAD')}
              </p>
            </Card>
          </div>

          {/* Audit Data Fields */}
          <Card className="rounded-xl border bg-card overflow-hidden shadow-sm">
            <div className="border-b bg-muted/20 px-6 py-4">
              <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Compliance Records</p>
            </div>
            <div className="grid gap-x-8 gap-y-6 p-6 sm:grid-cols-2">
              <div>
                <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-1">Vendor Entity</p>
                <p className="text-sm font-bold">{vendorName || '—'}</p>
              </div>
              <div>
                <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-1">Tax Identification (BN)</p>
                <p className="text-sm font-bold">{vendorTaxNumber || '—'}</p>
              </div>
              <div>
                <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-1">Transaction Date</p>
                <p className="text-sm font-bold">{formatDate(transactionDate)}</p>
              </div>
              <div>
                <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-1">Ledger Category</p>
                <Badge variant="outline" className={cn("mt-1 rounded-full px-3 py-1 font-bold uppercase tracking-widest", categoryColor(category))}>
                  {category}
                </Badge>
              </div>
            </div>
          </Card>

          {/* Clarification Comments Section */}
          <Card className="rounded-xl border bg-card overflow-hidden shadow-sm">
            <div className="border-b bg-muted/20 px-6 py-4 flex items-center gap-3">
              <MessageSquare className="h-4 w-4 text-primary" />
              <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Clarification & Comments</p>
            </div>
            <div className="p-6 flex flex-col gap-4">
              <div className="space-y-4 max-h-40 overflow-y-auto pr-2 custom-scrollbar">
                {comments.length === 0 ? (
                  <p className="text-xs text-muted-foreground italic">No comments yet.</p>
                ) : (
                  comments.map(c => (
                    <div key={c.id} className="rounded-lg bg-muted/30 p-3 text-sm">
                      <p className="text-xs font-bold text-muted-foreground mb-1">{c.user?.email || 'User'} <span className="font-normal opacity-70 ml-2">{new Date(c.created_at).toLocaleString()}</span></p>
                      <p>{c.comment}</p>
                    </div>
                  ))
                )}
              </div>
              <div className="flex items-center gap-2 mt-2">
                <input
                  type="text"
                  placeholder="Ask for clarification or add a note..."
                  value={commentText}
                  onChange={(e) => setCommentText(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handlePostComment()}
                  className="flex-1 rounded-lg border bg-background px-4 py-2 text-sm outline-none focus:ring-2 focus:ring-primary"
                />
                <Button
                  onClick={handlePostComment}
                  disabled={commentLoading || !commentText.trim()}
                  size="icon"
                >
                  {commentLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                </Button>
              </div>
            </div>
          </Card>
        </div>
      </div>
  );
}