'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useAutoAnimate } from '@formkit/auto-animate/react';
import {
  flexRender,
  getCoreRowModel,
  getSortedRowModel,
  getFilteredRowModel,
  useReactTable,
  type ColumnDef,
  type SortingState,
} from '@tanstack/react-table';
import {
  ArrowUpDown,
  ChevronDown,
  Eye,
  FileDown,
  MoreHorizontal,
  Search,
  Trash2,
} from 'lucide-react';

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

import { ReceiptRow } from '@/lib/types';
import { formatCurrency, formatDate, categoryColor, approvalBadge } from '@/lib/ui-utils';
import { motion } from 'framer-motion';

interface ProfessionalLedgerProps {
  data: ReceiptRow[];
  onSelect: (receipt: ReceiptRow) => void;
  onDelete: (id: string) => void;
}

export const ProfessionalLedger = React.memo(function ProfessionalLedger({ data, onSelect, onDelete }: ProfessionalLedgerProps) {
  const [sorting, setSorting] = useState<SortingState>([]);
  const [globalFilter, setGlobalFilter] = useState('');

  const columns: ColumnDef<ReceiptRow>[] = [
    {
      accessorKey: 'vendor_name',
      header: ({ column }) => (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
          className="p-0 font-bold hover:bg-transparent"
        >
          Vendor
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      ),
      cell: ({ row }) => (
        <div className="flex flex-col">
          <span className="font-bold text-foreground">{row.getValue('vendor_name') || 'Unknown Vendor'}</span>
          <span className="text-[10px] text-muted-foreground">{row.original.business_unit_id || 'Main Unit'}</span>
        </div>
      ),
    },
    {
      accessorKey: 'transaction_date',
      header: 'Date',
      cell: ({ row }) => <span className="text-sm font-medium">{formatDate(row.getValue('transaction_date'))}</span>,
    },
    {
      accessorKey: 'category',
      header: 'Category',
      cell: ({ row }) => {
        const category = row.getValue('category') as string;
        return (
          <Badge variant="outline" className={`${categoryColor(category)} border-none px-3 py-1 text-[10px] font-bold uppercase`}>
            {category}
          </Badge>
        );
      },
    },
    {
      accessorKey: 'total_amount',
      header: () => <div className="text-right font-bold">Total</div>,
      cell: ({ row }) => {
        const amount = parseFloat(row.getValue('total_amount'));
        return <div className="text-right font-mono font-bold tracking-tight text-foreground tabular-nums">{formatCurrency(amount)}</div>;
      },
    },
    {
      accessorKey: 'approval_status',
      header: 'Status',
      cell: ({ row }) => {
        const status = row.getValue('approval_status') as string;
        const config = approvalBadge(status);
        return (
          <div className="flex items-center gap-2">
            <div className={`h-2 w-2 rounded-full ${config.cls.includes('emerald') ? 'bg-emerald-500' : 'bg-amber-500 animate-pulse'}`} />
            <span className="text-[10px] font-bold uppercase tracking-wider">{status}</span>
          </div>
        );
      },
    },
    {
      id: 'actions',
      cell: ({ row }) => {
        const receipt = row.original;

        return (
          <div className="flex justify-end">
            <DropdownMenu>
              <DropdownMenuTrigger className="inline-flex items-center justify-center rounded-full h-8 w-8 p-0 hover:bg-muted focus:outline-none">
                <MoreHorizontal className="h-4 w-4" />
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-48 rounded-xl p-2 shadow-md">
                <DropdownMenuLabel className="text-xs font-bold text-muted-foreground">Actions</DropdownMenuLabel>
                <DropdownMenuItem 
                  onClick={(e) => { e.stopPropagation(); onSelect(receipt); }}
                  className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm transition cursor-pointer"
                >
                  <Eye className="h-4 w-4" /> View Details
                </DropdownMenuItem>
                <DropdownMenuItem 
                  onClick={(e) => { e.stopPropagation(); }}
                  className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm transition cursor-pointer"
                >
                  <FileDown className="h-4 w-4" /> Export PDF
                </DropdownMenuItem>
                <DropdownMenuSeparator className="my-1" />
                <DropdownMenuItem 
                  onClick={(e) => { e.stopPropagation(); onDelete(receipt.id); }}
                  className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm text-destructive focus:text-destructive transition cursor-pointer"
                >
                  <Trash2 className="h-4 w-4" /> Delete Record
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        );
      },
    },
  ];

  const [tableRef] = useAutoAnimate<HTMLTableElement>();

  const table = useReactTable({
    data,
    columns,
    getCoreRowModel: getCoreRowModel(),
    onSortingChange: setSorting,
    getSortedRowModel: getSortedRowModel(),
    onGlobalFilterChange: setGlobalFilter,
    getFilteredRowModel: getFilteredRowModel(),
    state: {
      sorting,
      globalFilter,
    },
  });

  return (
    <div className="w-full space-y-4">
      <div className="flex items-center justify-between gap-4">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search vendor, category, or amount..."
            value={globalFilter ?? ''}
            onChange={(event) => setGlobalFilter(event.target.value)}
            className="pl-10 rounded-xl bg-surface"
          />
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" className="rounded-xl font-bold">
            Filters <ChevronDown className="ml-2 h-4 w-4" />
          </Button>
        </div>
      </div>

      <div className="rounded-xl border bg-card overflow-auto max-h-[65vh]">
        <Table ref={tableRef} className="relative">
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id} className="hover:bg-transparent bg-surface-raised/50 border-b border-glass-border">
                {headerGroup.headers.map((header) => (
                  <TableHead key={header.id} className="text-[10px] font-bold uppercase tracking-tight text-text-muted px-6 h-12 sticky top-0 bg-surface-raised backdrop-blur z-10">
                    {header.isPlaceholder
                      ? null
                      : flexRender(
                          header.column.columnDef.header,
                          header.getContext()
                        )}
                  </TableHead>
                ))}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {table.getRowModel().rows?.length ? (
              table.getRowModel().rows.map((row, i) => (
                <motion.tr
                  key={row.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.03 }}
                  whileHover={{ scale: 1.005, backgroundColor: 'rgba(190, 169, 142, 0.04)' }}
                  onClick={() => onSelect(row.original)}
                  className={`group cursor-pointer transition-colors border-b border-glass-border ${i % 2 === 0 ? 'bg-surface-raised/50' : 'bg-surface-raised/30'} hover:bg-champagne/5`}
                >
                  {row.getVisibleCells().map((cell) => (
                    <TableCell key={cell.id} className="px-6 py-3">
                      {flexRender(cell.column.columnDef.cell, cell.getContext())}
                    </TableCell>
                  ))}
                </motion.tr>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={columns.length} className="h-64 text-center">
                  <div className="flex flex-col items-center justify-center gap-3 text-muted-foreground">
                    <div className="h-16 w-16 rounded-xl bg-muted flex items-center justify-center mb-2">
                      <Search className="h-8 w-8 opacity-40" />
                    </div>
                    <p className="font-bold">No records matching your search</p>
                    <Button variant="link" onClick={() => setGlobalFilter('')} className="text-primary">
                      Clear all filters
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
});
