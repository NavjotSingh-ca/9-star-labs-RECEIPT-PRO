'use client';

import React, { useMemo, useState } from 'react';
import {
  AlertCircle,
  CalendarDays,
  CheckCircle2,
  ChevronRight,
  ChevronDown,
  CreditCard,
  DollarSign,
  Edit3,
  Eye,
  Fingerprint,
  Loader2,
  MapPin,
  Receipt,
  RefreshCw,
  Save,
  Tag,
  Trash2,
  X,
  XCircle,
  BrainCircuit,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Drawer } from 'vaul';

import { semanticSearchAction } from '@/app/actions/semantic-search';
import { updateReceiptApproval, updateReceiptNotes, deleteReceipt, getReceiptsPaginated } from '@/lib/services/receipts';
import { CATEGORIES } from '@/components/scanner/types';
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
  role?: UserRole;
  userId?: string | null;
};

export default function History({
  receipts: initialReceipts,
  activeFilter = 'all',
  onUpdate,
  role = 'Owner',
  userId,
}: HistoryProps) {
  const [selectedReceipt, setSelectedReceipt] = useState<ReceiptRow | null>(null);
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
    if (!confirm('Permanently delete this audit record?')) return;
    try {
      if (!userId) return;
      await deleteReceipt(id, userId);
      if (onUpdate) await onUpdate();
      refetch();
    } catch (err) {
      console.error('Delete error:', err);
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
        {/* Header Section */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between px-2">
          <div>
            <h2 className="text-3xl font-black tracking-tighter text-text-primary sm:text-4xl">
              Audit <span className="text-champagne">Ledger</span>
            </h2>
            <p className="mt-1 text-sm font-medium text-text-secondary">
              Managing <span className="text-text-primary font-bold">{totalCount}</span> secure financial records
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Button
              onClick={() => refetch()}
              variant="outline"
              className="rounded-[2rem] border-glass-border bg-surface px-4 font-bold hover:bg-surface-raised"
            >
              <RefreshCw className={cn("mr-2 h-4 w-4", isFetchingNextPage ? "animate-spin" : "")} />
              Sync
            </Button>
            <Button
              onClick={() => setSemanticMode(!semanticMode)}
              className={cn(
                "rounded-[2rem] font-bold transition-all",
                semanticMode ? "bg-champagne text-obsidian shadow-lg shadow-champagne/20" : "bg-surface-raised text-text-primary border border-glass-border rounded-[2rem]"
              )}
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
              <div className="rounded-[2rem] border border-champagne/30 bg-champagne/5 p-4 backdrop-blur-md">
                <div className="flex items-center gap-3">
                  <div className="flex h-8 w-8 items-center justify-center rounded-[2rem] bg-champagne text-obsidian">
                    <BrainCircuit className="h-4 w-4" />
                  </div>
                  <div className="flex-1">
                    <p className="text-xs font-black uppercase tracking-widest text-champagne">Semantic Audit Engine Active</p>
                    <input 
                      type="text"
                      placeholder="Describe what you're looking for (e.g. 'Fuel receipts over $100 from last March')"
                      className="mt-2 w-full bg-transparent text-sm font-medium text-text-primary outline-none placeholder:text-text-muted"
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') handleSemanticSearch(e.currentTarget.value);
                      }}
                    />
                    {semanticLoading && (
                      <div className="mt-2 flex items-center gap-2 text-[10px] text-champagne font-bold uppercase tracking-widest animate-pulse">
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
          <div className="flex min-h-[40vh] flex-col items-center justify-center gap-6 rounded-[3rem] border border-dashed border-glass-border bg-surface/30 p-12 text-center backdrop-blur-sm">
            <div className="flex h-20 w-20 items-center justify-center rounded-[2rem] bg-surface-raised text-text-muted opacity-20">
              <Receipt className="h-10 w-10" />
            </div>
            <div>
              <h3 className="text-xl font-bold text-text-primary tracking-tight">
                {emptyStateMap[activeFilter]?.title || 'No records found'}
              </h3>
              <p className="mt-2 text-sm text-text-secondary max-w-xs">
                {emptyStateMap[activeFilter]?.subtitle || 'Adjust your filters or scan a new receipt to populate the ledger.'}
              </p>
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
                  className="rounded-full border-glass-border bg-surface px-8 font-bold hover:bg-surface-raised"
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
          <Drawer.Content className="fixed bottom-0 left-0 right-0 z-[160] flex flex-col rounded-t-[3rem] border-t border-glass-border bg-surface outline-none focus:ring-0 sm:max-w-3xl sm:mx-auto sm:mb-6 sm:rounded-[3rem] sm:max-h-[95vh] bottom-nav">
            <div className="mx-auto mt-4 h-1.5 w-12 flex-shrink-0 rounded-full bg-glass-border" />
            
            {selectedReceipt && (
              <div className="flex-1 overflow-y-auto px-2">
                <ReceiptDetailModal
                  key={`detail-${selectedReceipt.id}`}
                  receipt={selectedReceipt}
                  onClose={() => setSelectedReceipt(null)}
                  role={role}
                  onUpdate={onUpdate}
                />
              </div>
            )}
          </Drawer.Content>
        </Drawer.Portal>
      </Drawer.Root>
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
        receipt.transaction_date || '',
        role
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

      const { updateReceipt } = await import('@/lib/services/receipts');
      
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
            <Card className="rounded-[2rem] border-glass-border bg-surface p-6">
              <div className="flex items-center gap-3 mb-4 text-xs font-black uppercase tracking-widest text-text-muted">
                <BrainCircuit className="h-4 w-4 text-champagne" />
                AI Analysis
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm font-bold text-text-primary">Confidence Score</span>
                <span className={cn("text-xl font-black tabular-nums", tone.label.includes('High') ? 'text-emerald-light' : 'text-amber-400')}>
                  {score}%
                </span>
              </div>
              <div className="mt-4 h-2 w-full bg-glass-border rounded-full overflow-hidden">
                <motion.div 
                  initial={{ width: 0 }}
                  animate={{ width: `${score}%` }}
                  className={cn("h-full", tone.label.includes('High') ? 'bg-emerald-light' : 'bg-amber-400')}
                />
              </div>
            </Card>

            {/* Total Card */}
            <Card className="rounded-[2rem] border-glass-border bg-champagne p-6">
              <div className="flex items-center gap-3 mb-4 text-xs font-black uppercase tracking-widest text-obsidian/60">
                <DollarSign className="h-4 w-4" />
                Gross Total
              </div>
              <p className="text-4xl font-black text-obsidian tracking-tighter tabular-nums">
                {formatCurrency(toNumber(receipt.total_amount), receipt.currency ?? 'CAD')}
              </p>
            </Card>
          </div>

          {/* Audit Data Fields */}
          <Card className="rounded-[3rem] border-glass-border bg-surface/50 overflow-hidden shadow-sm">
            <div className="border-b border-glass-border bg-surface-raised px-6 py-4">
              <p className="text-xs font-black uppercase tracking-widest text-text-muted">Compliance Records</p>
            </div>
            <div className="grid gap-x-8 gap-y-6 p-8 sm:grid-cols-2">
              <div>
                <p className="text-[10px] font-bold uppercase tracking-widest text-text-muted mb-1">Vendor Entity</p>
                <p className="text-sm font-bold text-text-primary">{vendorName || '—'}</p>
              </div>
              <div>
                <p className="text-[10px] font-bold uppercase tracking-widest text-text-muted mb-1">Tax Identification (BN)</p>
                <p className="text-sm font-bold text-text-primary">{vendorTaxNumber || '—'}</p>
              </div>
              <div>
                <p className="text-[10px] font-bold uppercase tracking-widest text-text-muted mb-1">Transaction Node</p>
                <p className="text-sm font-bold text-text-primary">{formatDate(transactionDate)}</p>
              </div>
              <div>
                <p className="text-[10px] font-bold uppercase tracking-widest text-text-muted mb-1">Ledger Category</p>
                <Badge variant="outline" className={cn("mt-1 rounded-full px-3 py-1 font-black uppercase tracking-widest", categoryColor(category))}>
                  {category}
                </Badge>
              </div>
            </div>
          </Card>
        </div>
      </div>
  );
}