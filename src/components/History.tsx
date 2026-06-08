'use client';

import { useMemo, useState, useCallback } from 'react';
import {
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Loader2,
  RefreshCw,
  SearchX,
} from 'lucide-react';
import { toast } from 'sonner';
import { AnimatePresence } from 'framer-motion';
import { Drawer } from 'vaul';
import dynamic from 'next/dynamic';

import { semanticSearchAction } from '@/app/actions/semantic-search';
import { getReceiptsPaginated, deleteReceipt } from '@/lib/services/receipts';
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
import { StatCards } from '@/components/history/StatCards';
import { SemanticSearchBar } from '@/components/history/SemanticSearchBar';
import { ReceiptTableSkeleton } from '@/components/ui/PremiumSkeletons';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

import type { ReceiptRow } from '@/lib/types';
import type { UserRole } from '@/lib/types';
import { useInfiniteQuery } from '@tanstack/react-query';

const ReceiptDetailDrawer = dynamic(() => import('@/components/history/ReceiptDetailDrawer'), {
  ssr: false,
  loading: () => (
    <div className="flex min-h-[300px] items-center justify-center" role="status" aria-live="polite" aria-label="Loading receipt details">
      <Loader2 className="h-8 w-8 animate-spin text-champagne" />
    </div>
  ),
});

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
  const [receiptIndex, setReceiptIndex] = useState(0);
  const [deleteTarget, setDeleteTarget] = useState<string | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);
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
    isRefetching,
    refetch
  } = useInfiniteQuery({
    initialPageParam: 0,
    queryKey: ['receipts_paginated', role, userId, activeFilter, search, semanticResults, semanticMode],
    queryFn: async ({ pageParam = 0 }) => {
      if (!userId) return { receipts: [], totalCount: 0 };
      
      let approvalStatus: string | undefined = undefined;
      let filterCategory: string | undefined = undefined;
      let specialFilter: 'missing-bn' | 'flagged-audit' | 'reimbursement' | undefined = undefined;
      
      const normalizedFilter = activeFilter.toLowerCase();
      if (normalizedFilter === 'approved') approvalStatus = 'approved';
      else if (normalizedFilter === 'review' || normalizedFilter === 'pending-review') approvalStatus = 'submitted';
      else if (normalizedFilter === 'missing-bn' || normalizedFilter === 'missing') specialFilter = 'missing-bn';
      else if (normalizedFilter === 'flagged-audit') specialFilter = 'flagged-audit';
      else if (normalizedFilter === 'reimbursement') specialFilter = 'reimbursement';
      else if (normalizedFilter !== 'all') filterCategory = activeFilter;

      // If semanticMode is on but we have no results from AI yet, don't fetch from DB
      if (semanticMode && !semanticResults) return { receipts: [], totalCount: 0 };

      return getReceiptsPaginated({
        role,
        userId,
        limit: 25,
        offset: pageParam,
        category: filterCategory,
        approvalStatus: approvalStatus,
        specialFilter,
        search: search.trim() ? search.trim() : undefined,
        semanticIds: semanticMode && semanticResults ? semanticResults : undefined,
      });
    },
    getNextPageParam: (lastPage, pages) => {
      if (lastPage.receipts.length < 25) return undefined;
      return pages.length * 25;
    },
    enabled: !!userId,
    staleTime: 30_000,
    refetchOnWindowFocus: false,
  });

  const receipts = useMemo(() => {
    if (!infiniteData) return [];
    return infiniteData.pages.flatMap((page) => page.receipts);
  }, [infiniteData]);

  const totalCount = infiniteData?.pages[0]?.totalCount || 0;

  const handleSelectReceipt = useCallback((receipt: ReceiptRow) => {
    const idx = receipts.findIndex(r => r.id === receipt.id);
    setReceiptIndex(idx >= 0 ? idx : 0);
    setSelectedReceipt(receipt);
  }, [receipts]);

  const handleDelete = useCallback((id: string) => {
    setDeleteTarget(id);
  }, []);

  const confirmDelete = useCallback(async () => {
    if (!deleteTarget || !userId) return;
    setDeleteLoading(true);
    try {
      await deleteReceipt(deleteTarget, userId);
      if (onUpdate) await onUpdate();
      refetch();
    } catch (err) {
      console.error('Confirm delete error:', err);
      toast.error(err instanceof Error ? err.message : 'Failed to delete this receipt. It may be protected by retention rules.');
    } finally {
      setDeleteLoading(false);
      setDeleteTarget(null);
    }
  }, [deleteTarget, userId, onUpdate, refetch]);

  const handlePrevReceipt = useCallback(() => {
    const newIdx = receiptIndex > 0 ? receiptIndex - 1 : receipts.length - 1;
    setReceiptIndex(newIdx);
    setSelectedReceipt(receipts[newIdx]);
  }, [receiptIndex, receipts]);

  const handleNextReceipt = useCallback(() => {
    const newIdx = receiptIndex < receipts.length - 1 ? receiptIndex + 1 : 0;
    setReceiptIndex(newIdx);
    setSelectedReceipt(receipts[newIdx]);
  }, [receiptIndex, receipts]);

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
      toast.error('AI search failed. Please try a simpler query or check your connection.');
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
          <div className="flex items-center gap-2 flex-wrap">
            <Button
              onClick={() => refetch()}
              variant="outline"
              className="px-4 font-bold"
            >
              <RefreshCw className={cn("mr-2 h-4 w-4", (isFetchingNextPage || isRefetching) ? "animate-spin" : "")} />
              Sync
            </Button>
            <SemanticSearchBar
              semanticMode={semanticMode}
              semanticLoading={semanticLoading}
              onToggle={() => setSemanticMode(!semanticMode)}
              onSearch={handleSemanticSearch}
              onClear={() => { setSemanticMode(false); setSemanticResults(null); setSearch(''); }}
            />
          </div>
        </div>

        {/* Receipt Quick Stats */}
        {receipts.length > 0 && <StatCards receipts={receipts} />}

        {/* The Ledger */}
        {isLoading && !receipts.length ? (
          <div role="status" aria-live="polite" aria-label="Loading receipts">
            <ReceiptTableSkeleton />
          </div>
        ) : receipts.length === 0 ? (
          <div className="flex min-h-[40vh] flex-col items-center justify-center gap-6 rounded-xl border border-dashed bg-muted/10 p-12 text-center" aria-live="polite">
            <div className="flex h-20 w-20 items-center justify-center rounded-xl bg-muted text-muted-foreground">
              <SearchX className="h-10 w-10" />
            </div>
            <div>
              <h3 className="text-xl font-bold tracking-tight">
                {semanticMode && semanticResults !== null && semanticResults.length === 0
                  ? 'No AI matches found'
                  : (emptyStateMap[activeFilter]?.title || 'No records found')}
              </h3>
              <p className="mt-2 text-sm text-muted-foreground max-w-xs">
                {semanticMode && semanticResults !== null && semanticResults.length === 0
                  ? 'Try a different search query or use the traditional search bar.'
                  : (emptyStateMap[activeFilter]?.subtitle || 'Adjust your filters or scan a new receipt to populate the ledger.')}
              </p>
              {semanticMode && semanticResults !== null && semanticResults.length === 0 ? (
                <Button onClick={() => { setSemanticMode(false); setSemanticResults(null); setSearch(''); }} variant="outline" className="rounded-full px-6">
                  Clear AI Search
                </Button>
              ) : (onScan && activeFilter === 'all' && (
                <Button onClick={onScan} className="rounded-full px-6">
                  Scan Receipt
                </Button>
              ))}
            </div>
          </div>
        ) : (
          <div className="animate-in fade-in slide-in-from-bottom-4 duration-700" aria-live="polite" aria-atomic="true">
            <ProfessionalLedger 
              data={receipts} 
              onSelect={handleSelectReceipt}
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
            
            {selectedReceipt && receipts.length > 1 && (
              <div className="flex items-center justify-between border-b border-glass-border px-4 py-2">
                <button
                  type="button"
                  onClick={handlePrevReceipt}
                  className="flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-medium text-text-secondary transition hover:bg-surface-hover hover:text-text-primary"
                >
                  <ChevronLeft className="h-3.5 w-3.5" />
                  Previous
                </button>
                <span className="text-xs font-medium text-text-muted tabular-nums">
                  {receiptIndex + 1} of {receipts.length}
                </span>
                <button
                  type="button"
                  onClick={handleNextReceipt}
                  className="flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-medium text-text-secondary transition hover:bg-surface-hover hover:text-text-primary"
                >
                  Next
                  <ChevronRight className="h-3.5 w-3.5" />
                </button>
              </div>
            )}

            {selectedReceipt && (
              <div className="flex-1 overflow-y-auto px-2">
                <ErrorBoundary componentName="ReceiptDetailDrawer">
                  <ReceiptDetailDrawer
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
              disabled={deleteLoading}
              render={<Button variant="destructive" className="rounded-xl font-semibold" />}
              onClick={confirmDelete}
            >
              {deleteLoading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
              Delete Record
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}

