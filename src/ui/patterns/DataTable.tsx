'use client';

import * as React from 'react';
import { cn } from '../utils/cn';

export interface ColumnDef<T> {
  key: string;
  header: string;
  accessor: keyof T | ((row: T) => React.ReactNode);
  width?: string;
  align?: 'left' | 'center' | 'right';
  sortable?: boolean;
  render?: (value: unknown, row: T) => React.ReactNode;
}

export interface DataTableProps<T> {
  columns: ColumnDef<T>[];
  data: T[];
  keyExtractor: (row: T) => string;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
  onSort?: (key: string) => void;
  selection?: string[];
  onSelectionChange?: (keys: string[]) => void;
  selectable?: boolean;
  loading?: boolean;
  emptyMessage?: string;
  emptyIcon?: React.ReactNode;
  rowClassName?: (row: T) => string;
  striped?: boolean;
  hoverable?: boolean;
  className?: string;
}

function DataTable<T>({
  columns,
  data,
  keyExtractor,
  sortBy,
  sortOrder,
  onSort,
  selection = [],
  onSelectionChange,
  selectable = false,
  loading = false,
  emptyMessage = 'No data available',
  emptyIcon,
  rowClassName,
  striped = true,
  hoverable = true,
  className,
}: DataTableProps<T>) {
  const [selectAll, setSelectAll] = React.useState(false);

  React.useEffect(() => {
    if (selectable && data.length > 0) {
      setSelectAll(selection.length === data.length && data.length > 0);
    } else {
      setSelectAll(false);
    }
  }, [selection, data, selectable]);

  const handleSelectAll = () => {
    if (selectAll) {
      onSelectionChange?.([]);
    } else {
      onSelectionChange?.(data.map(keyExtractor));
    }
  };

  const handleRowSelect = (key: string) => {
    if (selection.includes(key)) {
      onSelectionChange?.(selection.filter(k => k !== key));
    } else {
      onSelectionChange?.([...selection, key]);
    }
  };

  if (loading) {
    return (
      <div className={cn('rounded-xl border border-glass-border bg-card p-6', className)}>
        <div className="flex items-center justify-center min-h-[200px]">
          <div className="animate-spin rounded-full h-8 w-8 border-3 border-champagne/30 border-t-champagne" />
        </div>
      </div>
    );
  }

  if (data.length === 0) {
    return (
      <div className={cn('rounded-xl border border-glass-border bg-card p-12 text-center', className)}>
        {emptyIcon || (
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-champagne/10 text-champagne">
            <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
          </div>
        )}
        <h3 className="text-lg font-semibold text-text-primary mb-1">No data</h3>
        <p className="text-text-muted">{emptyMessage}</p>
      </div>
    );
  }

  return (
    <div className={cn('rounded-xl border border-glass-border bg-card overflow-hidden', className)}>
      <div className="overflow-x-auto">
        <table className="w-full caption-bottom text-sm">
          <thead className="[&_tr]:border-b border-glass-border">
            <tr className="border-b border-glass-border">
              {selectable && (
                <th className="h-10 px-3 text-left align-middle font-medium text-text-muted [&:has([role=checkbox])]:pr-0">
                  <label className="flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      className="peer h-4 w-4 shrink-0 rounded-[0.25rem] border border-glass-border bg-surface-raised text-champagne shadow-xs focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-champagne/40 focus-visible:ring-offset-2 focus-visible:ring-offset-obsidian disabled:cursor-not-allowed disabled:opacity-50 data-[state=checked]:bg-champagne data-[state=checked]:border-champagne"
                      checked={selectAll}
                      onChange={handleSelectAll}
                      aria-label="Select all rows"
                    />
                  </label>
                </th>
              )}
              {columns.map((column) => (
                <th
                  key={column.key}
                  className={cn(
                    'h-10 px-3 text-left align-middle font-medium text-text-muted',
                    column.width && `w-[${column.width}]`,
                    column.align === 'center' && 'text-center',
                    column.align === 'right' && 'text-right',
                    column.sortable && 'cursor-pointer select-none hover:text-champagne transition-colors'
                  )}
                  style={{ width: column.width }}
                  onClick={column.sortable ? () => onSort?.(column.key) : undefined}
                  aria-sort={sortBy === column.key ? (sortOrder === 'asc' ? 'ascending' : 'descending') : 'none'}
                >
                  <div className="flex items-center gap-1">
                    {column.header}
                    {column.sortable && sortBy === column.key && (
                      <span className={cn('inline-flex', sortOrder === 'asc' ? 'rotate-180' : '')} aria-hidden="true">
                        ▼
                      </span>
                    )}
                  </div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="[&_tr:last-child]:border-0">
            {data.map((row) => {
              const key = keyExtractor(row);
              const isSelected = selection.includes(key);
              return (
                <tr
                  key={key}
                  className={cn(
                    'border-b border-glass-border transition-colors',
                    striped && 'even:bg-surface/50',
                    hoverable && 'hover:bg-surface-hover/50',
                    isSelected && 'bg-champagne/5',
                    rowClassName?.(row)
                  )}
                >
                  {selectable && (
                    <td className="px-3">
                      <label className="flex items-center cursor-pointer">
                        <input
                          type="checkbox"
                          className="peer h-4 w-4 shrink-0 rounded-[0.25rem] border border-glass-border bg-surface-raised text-champagne shadow-xs focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-champagne/40 focus-visible:ring-offset-2 focus-visible:ring-offset-obsidian disabled:cursor-not-allowed disabled:opacity-50 data-[state=checked]:bg-champagne data-[state=checked]:border-champagne"
                          checked={isSelected}
                          onChange={() => handleRowSelect(key)}
                          aria-label={`Select row ${key}`}
                        />
                      </label>
                    </td>
                  )}
                  {columns.map((column) => (
                    <td
                      key={column.key}
                      className={cn(
                        'p-3 align-middle',
                        column.align === 'center' && 'text-center',
                        column.align === 'right' && 'text-right'
                      )}
                    >
                      {column.render
                        ? column.render((row as Record<string, unknown>)[column.accessor as string], row)
                        : typeof column.accessor === 'function'
                        ? column.accessor(row)
                        : String((row as Record<string, unknown>)[column.accessor as string] ?? '')}
                    </td>
                  ))}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export { DataTable };