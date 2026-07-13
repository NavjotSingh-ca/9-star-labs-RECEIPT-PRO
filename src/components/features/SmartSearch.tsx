'use client';

import { useMemo, useState, useCallback } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useQueryState } from 'nuqs';
import { AlertCircle, Loader2, Search, X } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import PageHeader from '@/components/layout/PageHeader';
import { supabase, getOrgIdString } from '@/lib/supabase';
import { formatCurrency, formatDate, approvalBadge } from '@/lib/ui-utils';
import { cn } from '@/lib/utils';
import type { ReceiptRow } from '@/lib/types';

function getTodayISO(): string {
  const d = new Date();
  return d.toISOString().slice(0, 10);
}

function getStartOfMonth(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-01`;
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
  const cats = new Set<string>();
  (data || []).forEach((r) => { if (r.category) cats.add(r.category); });
  return Array.from(cats).sort();
}

async function fetchSearchResults(filters: {
  orgId: string;
  search: string;
  fromDate: string;
  toDate: string;
  minAmount: string;
  maxAmount: string;
  category: string;
}): Promise<ReceiptRow[]> {
  let query = supabase
    .from('receipts')
    .select('*')
    .eq('org_id', filters.orgId)
    .eq('is_deleted', false);

  if (filters.search) {
    const escaped = filters.search.replace(/'/g, "''");
    query = query.or(
      `vendor_name.ilike.%${escaped}%,category.ilike.%${escaped}%,notes.ilike.%${escaped}%`
    );
  }
  if (filters.fromDate) query = query.gte('transaction_date', filters.fromDate);
  if (filters.toDate) query = query.lte('transaction_date', filters.toDate);
  if (filters.minAmount) query = query.gte('total_amount', Number(filters.minAmount));
  if (filters.maxAmount) query = query.lte('total_amount', Number(filters.maxAmount));
  if (filters.category) query = query.eq('category', filters.category);

  const { data, error } = await query.order('transaction_date', { ascending: false });
  if (error) throw new Error('Search failed');
  return (data || []) as ReceiptRow[];
}

export default function SmartSearch() {
  const [searchText, setSearchText] = useQueryState('q', { defaultValue: '', history: 'push' });
  const [fromDate, setFromDate] = useQueryState('from', { defaultValue: '', history: 'push' });
  const [toDate, setToDate] = useQueryState('to', { defaultValue: '', history: 'push' });
  const [minAmount, setMinAmount] = useQueryState('min', { defaultValue: '', history: 'push' });
  const [maxAmount, setMaxAmount] = useQueryState('max', { defaultValue: '', history: 'push' });
  const [category, setCategory] = useQueryState('cat', { defaultValue: '', history: 'push' });

  const [orgIdState, setOrgIdState] = useState<string | null>(null);

  const { data: orgId } = useQuery({
    queryKey: ['smart-search-org-id'],
    queryFn: async () => {
      const id = await getOrgIdString();
      if (!id) throw new Error('No organization found');
      setOrgIdState(id);
      return id;
    },
    staleTime: Infinity,
  });

  const { data: categories = [], isLoading: catLoading } = useQuery({
    queryKey: ['smart-search-categories', orgId],
    queryFn: () => fetchCategories(orgId!),
    enabled: !!orgId,
    staleTime: 10 * 60 * 1000,
  });

  const filters = { orgId: orgId || '', search: searchText, fromDate, toDate, minAmount, maxAmount, category };
  const hasFilters = searchText || fromDate || toDate || minAmount || maxAmount || category;

  const { data: results = [], isLoading, error } = useQuery({
    queryKey: ['smart-search-results', orgId, searchText, fromDate, toDate, minAmount, maxAmount, category],
    queryFn: () => fetchSearchResults(filters),
    enabled: !!orgId,
    staleTime: 30 * 1000,
  });

  const clearAll = useCallback(() => {
    setSearchText('');
    setFromDate('');
    setToDate('');
    setMinAmount('');
    setMaxAmount('');
    setCategory('');
  }, [setSearchText, setFromDate, setToDate, setMinAmount, setMaxAmount, setCategory]);

  const filterCount = [searchText, fromDate, toDate, minAmount, maxAmount, category].filter(Boolean).length;

  return (
    <div className="space-y-5 fade-in">
      <PageHeader title="Smart Search" subtitle="Find receipts by text, date, amount, or category" />

      <div className="rounded-2xl border border-glass-border bg-card p-4 space-y-4 shadow-sm">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-text-muted" />
          <input
            type="text"
            placeholder="Search vendor, category, notes..."
            value={searchText}
            onChange={(e) => setSearchText(e.target.value)}
            className="w-full rounded-xl border border-glass-border bg-surface py-2.5 pl-10 pr-4 text-sm outline-none focus:ring-2 focus:ring-champagne"
          />
          {searchText && (
            <button
              type="button"
              onClick={() => setSearchText('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-text-muted hover:text-text-primary"
              title="Clear search"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>

        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
          <div>
            <label className="mb-1 block text-xs font-semibold text-text-muted">From Date</label>
            <input
              type="date"
              value={fromDate}
              onChange={(e) => setFromDate(e.target.value)}
              max={toDate || getTodayISO()}
              className="w-full rounded-xl border border-glass-border bg-surface px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-champagne"
            />
          </div>
          <div>
            <label className="mb-1 block text-xs font-semibold text-text-muted">To Date</label>
            <input
              type="date"
              value={toDate}
              onChange={(e) => setToDate(e.target.value)}
              min={fromDate || undefined}
              max={getTodayISO()}
              className="w-full rounded-xl border border-glass-border bg-surface px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-champagne"
            />
          </div>
          <div>
            <label className="mb-1 block text-xs font-semibold text-text-muted">Min Amount ($)</label>
            <input
              type="number"
              min="0"
              step="0.01"
              placeholder="0.00"
              value={minAmount}
              onChange={(e) => setMinAmount(e.target.value)}
              className="w-full rounded-xl border border-glass-border bg-surface px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-champagne"
            />
          </div>
          <div>
            <label className="mb-1 block text-xs font-semibold text-text-muted">Max Amount ($)</label>
            <input
              type="number"
              min="0"
              step="0.01"
              placeholder="0.00"
              value={maxAmount}
              onChange={(e) => setMaxAmount(e.target.value)}
              className="w-full rounded-xl border border-glass-border bg-surface px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-champagne"
            />
          </div>
          <div>
            <label className="mb-1 block text-xs font-semibold text-text-muted">Category</label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="w-full rounded-xl border border-glass-border bg-surface px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-champagne"
            >
              <option value="">All Categories</option>
              {catLoading ? (
                <option disabled>Loading…</option>
              ) : (
                categories.map((c) => (
                  <option key={c} value={c}>{c}</option>
                ))
              )}
            </select>
          </div>
        </div>

        {hasFilters && (
          <div className="flex items-center justify-between border-t border-glass-border pt-3">
            <p className="text-xs text-text-muted">
              {filterCount} filter{filterCount !== 1 ? 's' : ''} active
              {!isLoading && ` · ${results.length} result${results.length !== 1 ? 's' : ''}`}
            </p>
            <button
              type="button"
              onClick={clearAll}
              className="text-xs font-semibold text-danger hover:text-danger/80"
            >
              Clear all
            </button>
          </div>
        )}
      </div>

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

      {!isLoading && !error && results.length === 0 && (
        <div className="flex flex-col items-center gap-3 rounded-3xl border border-dashed border-glass-border bg-surface/30 py-16 text-center">
          <Search className="h-10 w-10 text-text-muted/50" />
          <p className="text-sm text-text-muted">
            {hasFilters ? 'No receipts match your search.' : 'Start typing or apply filters to search receipts.'}
          </p>
        </div>
      )}

      {!isLoading && !error && results.length > 0 && (
        <div className="space-y-2">
          {results.map((receipt, i) => {
            const badge = approvalBadge(receipt.approval_status);
            return (
              <div
                key={receipt.id}
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
                <div className="flex items-center gap-3 ml-4">
                  <span className="text-sm font-semibold tabular-nums text-text-primary">
                    {formatCurrency(receipt.total_amount, receipt.currency)}
                  </span>
                  {receipt.category && (
                    <Badge variant="outline" className="rounded-full px-2.5 py-0.5 text-[10px] font-semibold">
                      {receipt.category}
                    </Badge>
                  )}
                  <Badge variant="outline" className={cn('rounded-full px-2.5 py-0.5 text-[10px] font-semibold', badge.cls)}>
                    {badge.label}
                  </Badge>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
