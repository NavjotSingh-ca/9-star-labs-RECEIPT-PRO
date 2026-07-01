'use client';

import React, { useState, useRef, useMemo, useCallback } from 'react';
import { useVirtualizer } from '@tanstack/react-virtual';
import { ArrowUpDown, Eye, FileDown, MoreHorizontal, Search, Trash2 } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import type { ReceiptRow } from '@/lib/types';
import { formatCurrency, formatDate, categoryColor, approvalBadge } from '@/lib/ui-utils';
import { exportReceiptPdf } from '@/lib/export-receipt-pdf';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';

interface ProfessionalLedgerProps {
  data: ReceiptRow[];
  onSelect: (receipt: ReceiptRow) => void;
  onDelete: (id: string) => void;
  selectedIds?: string[];
  onSelectionChange?: (ids: string[]) => void;
}

export const ProfessionalLedger = React.memo(function ProfessionalLedger({ 
  data, 
  onSelect, 
  onDelete,
  selectedIds = [],
  onSelectionChange
}: ProfessionalLedgerProps) {
  const [sortField, setSortField] = useState<string | null>(null);
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('asc');
  const [globalFilter, setGlobalFilter] = useState('');
  const [debouncedFilter, setDebouncedFilter] = useState('');
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const parentRef = useRef<HTMLDivElement>(null);

  const handleSearchChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setGlobalFilter(value);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => setDebouncedFilter(value), 300);
  }, []);
  const { data: unitMap = {}, isLoading: unitsLoading } = useQuery({
    queryKey: ['business_units'],
    queryFn: async () => {
      const { data: units } = await supabase
        .from('business_units')
        .select('id, name');
      const map: Record<string, string> = {};
      (units || []).forEach(u => { map[u.id] = u.name; });
      return map;
    },
    staleTime: Infinity,
  });

  const filtered = useMemo(() => {
    if (!debouncedFilter) return data;
    const q = debouncedFilter.toLowerCase();
    return data.filter(r =>
      (r.vendor_name || '').toLowerCase().includes(q) ||
      (r.category || '').toLowerCase().includes(q) ||
      String(r.total_amount || '').includes(q)
    );
  }, [data, debouncedFilter]);

  const rows = useMemo(() => {
    if (!sortField) return filtered;
    return [...filtered].sort((a, b) => {
      const aVal = String(a[sortField as keyof ReceiptRow] ?? '');
      const bVal = String(b[sortField as keyof ReceiptRow] ?? '');
      const cmp = aVal.localeCompare(bVal, undefined, { numeric: true });
      return sortDir === 'asc' ? cmp : -cmp;
    });
  }, [filtered, sortField, sortDir]);

  function toggleSort(field: string) {
    if (sortField === field) {
      setSortDir(d => d === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDir('asc');
    }
  }

  const allSelected = useMemo(() => 
    rows.length > 0 && rows.every(r => selectedIds.includes(r.id)),
    [rows, selectedIds]
  );

  const someSelected = useMemo(() => 
    selectedIds.length > 0 && !allSelected,
    [selectedIds, allSelected]
  );

  function toggleAll() {
    if (allSelected) {
      onSelectionChange?.([]);
    } else {
      onSelectionChange?.(rows.map(r => r.id));
    }
  }

  function toggleOne(id: string, e?: React.MouseEvent | React.KeyboardEvent) {
    e?.stopPropagation();
    if (selectedIds.includes(id)) {
      onSelectionChange?.(selectedIds.filter(i => i !== id));
    } else {
      onSelectionChange?.([...selectedIds, id]);
    }
  }

  const virtualizer = useVirtualizer({
    count: rows.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => 56,
    overscan: 10,
  });

  return (
    <div className="w-full space-y-4">
      <div className="flex items-center justify-between gap-4">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search vendor, category, or amount..."
            value={globalFilter ?? ''}
            onChange={handleSearchChange}
            className="pl-10 rounded-xl bg-surface"
          />
        </div>
        <div className="flex items-center gap-2">
          <p className="text-xs text-text-muted font-medium">{data.length} records</p>
        </div>
      </div>

      <div ref={parentRef} className="rounded-xl border bg-card overflow-auto max-h-[65vh]">
        <div style={{ height: `${virtualizer.getTotalSize()}px`, position: 'relative', width: '100%', minWidth: 800 }}>
          {/* Header */}
          <div className="sticky top-0 z-10 flex items-stretch bg-surface-raised border-b border-glass-border text-[10px] font-bold uppercase tracking-tight text-text-muted">
            <div className="w-12 px-6 flex items-center justify-center">
              <Checkbox 
                checked={allSelected ? true : someSelected ? 'indeterminate' : false}
                onCheckedChange={() => toggleAll()}
                aria-label="Select all"
              />
            </div>
            <button type="button" onClick={() => toggleSort('vendor_name')} className="flex-[2] px-6 py-3 text-left flex items-center gap-1 hover:text-text-primary transition">
              Vendor {sortField === 'vendor_name' && <ArrowUpDown className="h-3 w-3" />}
            </button>
            <button type="button" onClick={() => toggleSort('transaction_date')} className="flex-[1] px-6 py-3 text-left flex items-center gap-1 hover:text-text-primary transition">
              Date {sortField === 'transaction_date' && <ArrowUpDown className="h-3 w-3" />}
            </button>
            <div className="flex-[1] px-6 py-3">Category</div>
            <button type="button" onClick={() => toggleSort('total_amount')} className="flex-[1] px-6 py-3 text-right flex items-center justify-end gap-1 hover:text-text-primary transition">
              Total {sortField === 'total_amount' && <ArrowUpDown className="h-3 w-3" />}
            </button>
            <div className="flex-[1] px-6 py-3">Status</div>
            <div className="flex-[0.5] px-6 py-3" />
          </div>

          {/* Virtualized rows */}
          {rows.length ? (
            virtualizer.getVirtualItems().map((virtualRow) => {
              const row = rows[virtualRow.index];
              const isSelected = selectedIds.includes(row.id);
              return (
                <div
                  key={row.id}
                  className={`absolute left-0 w-full flex items-stretch border-b border-glass-border cursor-pointer transition-colors ${
                    isSelected ? 'bg-champagne/10' : virtualRow.index % 2 === 0 ? 'bg-surface-raised/50' : 'bg-surface-raised/30'
                  } hover:bg-champagne/5 focus-visible:outline-2 focus-visible:outline-champagne/60 focus-visible:outline-offset-[-2px]`}
                  style={{ height: `${virtualRow.size}px`, transform: `translateY(${virtualRow.start}px)` }}
                  onClick={() => onSelect(row)}
                  onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onSelect(row); } }}
                  tabIndex={0}
                  role="button"
                  data-index={virtualRow.index}
                >
                  <div className="w-12 px-6 flex items-center justify-center" onClick={(e) => e.stopPropagation()}>
                    <Checkbox 
                      checked={isSelected}
                      onCheckedChange={() => toggleOne(row.id)}
                      aria-label={`Select receipt from ${row.vendor_name}`}
                    />
                  </div>
                  <div className="flex-[2] px-6 py-3 flex flex-col justify-center">
                    <span className="font-bold text-foreground text-sm">{row.vendor_name || 'Unknown Vendor'}</span>
                    <span className="text-[10px] text-muted-foreground">
                      {row.business_unit_id ? (unitsLoading ? 'Loading...' : unitMap[row.business_unit_id] || row.business_unit_id.slice(0, 8) + '...') : 'Main Unit'}
                    </span>
                  </div>
                  <div className="flex-[1] px-6 py-3 flex items-center text-sm font-medium">
                    {formatDate(row.transaction_date)}
                  </div>
                  <div className="flex-[1] px-6 py-3 flex items-center">
                    <Badge variant="outline" className={`${categoryColor(row.category)} border-none px-3 py-1 text-[10px] font-bold uppercase`}>
                      {row.category}
                    </Badge>
                  </div>
                  <div className="flex-[1] px-6 py-3 flex items-center justify-end font-mono font-bold tracking-tight text-foreground tabular-nums">
                    {formatCurrency(Number(row.total_amount))}
                  </div>
                  <div className="flex-[1] px-6 py-3 flex items-center gap-2">
                    <div className={`h-2 w-2 rounded-full ${approvalBadge(row.approval_status || '').cls.includes('emerald') ? 'bg-emerald-success' : 'bg-warning animate-pulse'}`} />
                    <span className="text-[10px] font-bold uppercase tracking-wider">{row.approval_status || ''}</span>
                  </div>
                  <div className="flex-[0.5] px-6 py-3 flex items-center justify-end">
                    <DropdownMenu>
                      <DropdownMenuTrigger className="inline-flex items-center justify-center rounded-full h-8 w-8 p-0 hover:bg-muted focus:outline-none">
                        <MoreHorizontal className="h-4 w-4" />
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="w-48 rounded-xl p-2 shadow-md">
                        <DropdownMenuLabel className="text-xs font-bold text-muted-foreground">Actions</DropdownMenuLabel>
                        <DropdownMenuItem 
                          onClick={(e) => { e.stopPropagation(); onSelect(row); }}
                          className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm transition cursor-pointer"
                        >
                          <Eye className="h-4 w-4" /> View Details
                        </DropdownMenuItem>
                        <DropdownMenuItem 
                          onClick={(e) => { e.stopPropagation(); exportReceiptPdf(row); }}
                          className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm transition cursor-pointer"
                        >
                          <FileDown className="h-4 w-4" /> Export PDF
                        </DropdownMenuItem>
                        <DropdownMenuSeparator className="my-1" />
                        <DropdownMenuItem 
                          onClick={(e) => { e.stopPropagation(); onDelete(row.id); }}
                          className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm text-destructive focus:text-destructive transition cursor-pointer"
                        >
                          <Trash2 className="h-4 w-4" /> Delete Record
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </div>
              );
            })
          ) : (
            <div className="absolute left-0 w-full flex items-center justify-center" style={{ top: 0, height: '16rem' }}>
              <div className="flex flex-col items-center gap-3 text-muted-foreground">
                <div className="h-16 w-16 rounded-xl bg-muted flex items-center justify-center mb-2">
                  <Search className="h-8 w-8 opacity-40" />
                </div>
                <p className="font-bold">No records matching your search</p>
                <button type="button" onClick={() => { setGlobalFilter(''); setDebouncedFilter(''); }} className="text-sm font-semibold text-champagne hover:underline">
                  Clear all filters
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
});
