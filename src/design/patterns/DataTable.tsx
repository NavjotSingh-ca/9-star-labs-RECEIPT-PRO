/**
 * DataTable — Accessible, sortable, paginated data table.
 */

import { type HTMLAttributes, type ReactNode, useState, useMemo, useRef, useEffect } from 'react';
import { cn } from '@design/utils/helpers';
import { Button } from '@design/primitives/Button';

export interface Column<T> {
  key: string;
  header: string;
  accessor: (row: T) => ReactNode;
  sortable?: boolean;
  width?: string;
  align?: 'left' | 'center' | 'right';
  render?: (value: ReactNode, row: T) => ReactNode;
}

export interface DataTableProps<T> extends HTMLAttributes<HTMLTableElement> {
  columns: Column<T>[];
  data: T[];
  keyAccessor: (row: T) => string;
  selection?: {
    selectedKeys: Set<string>;
    onSelectionChange: (keys: Set<string>) => void;
  };
  sort?: {
    column: string;
    direction: 'asc' | 'desc';
    onSort: (column: string, direction: 'asc' | 'desc') => void;
  };
  pagination?: {
    page: number;
    pageSize: number;
    total: number;
    onPageChange: (page: number) => void;
    onPageSizeChange: (pageSize: number) => void;
  };
  emptyMessage?: string;
  loading?: boolean;
  rowActions?: (row: T) => ReactNode;
  striped?: boolean;
  hoverable?: boolean;
}

function TableHeaderCell<T>({
  column,
  sorted,
  direction,
  onSort,
}: {
  column: Column<T>;
  sorted: boolean;
  direction: 'asc' | 'desc';
  onSort: (key: string) => void;
}) {
  if (!column.sortable) {
    return (
      <th
        className={cn(
          'px-4 py-3 text-left font-medium text-text-secondary text-sm uppercase tracking-wider',
          column.align === 'center' && 'text-center',
          column.align === 'right' && 'text-right'
        )}
        style={{ width: column.width }}
      >
        {column.header}
      </th>
    );
  }

  return (
    <button
      type="button"
      onClick={() => onSort(column.key)}
      className={cn(
        'px-4 py-3 text-left font-medium text-text-secondary text-sm uppercase tracking-wider',
        'hover:text-text-primary transition-colors',
        'flex items-center gap-1',
        column.align === 'center' && 'justify-center',
        column.align === 'right' && 'justify-end'
      )}
      style={{ width: column.width }}
    >
      {column.header}
      {sorted && (
        <span aria-hidden="true">
          {direction === 'asc' ? '▲' : '▼'}
        </span>
      )}
    </button>
  );
}

function TableCheckbox({
  checked,
  indeterminate,
  onChange,
  disabled,
}: {
  checked: boolean;
  indeterminate: boolean;
  onChange: () => void;
  disabled?: boolean;
}) {
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (inputRef.current) {
      inputRef.current.indeterminate = indeterminate;
    }
  }, [indeterminate]);

  return (
    <input
      ref={inputRef}
      type="checkbox"
      checked={checked}
      onChange={onChange}
      disabled={disabled}
      className="h-4 w-4 rounded border-glass-border text-champagne focus:ring-2 focus:ring-champagne/40 transition-colors cursor-pointer"
      aria-label="Select row"
    />
  );
}

export function DataTable<T>({
  columns,
  data,
  keyAccessor,
  selection,
  sort,
  pagination,
  emptyMessage = 'No data available',
  loading = false,
  rowActions,
  striped = true,
  hoverable = true,
  className,
  ...props
}: DataTableProps<T>) {
  const [sortColumn, setSortColumn] = useState<string | null>(null);

  const sortedData = useMemo(() => {
    if (!sort?.column) return data;
    return [...data].sort((a, b) => {
      const aVal = columns.find(c => c.key === sort.column)?.accessor(a);
      const bVal = columns.find(c => c.key === sort.column)?.accessor(b);
      if (aVal == null && bVal == null) return 0;
      if (aVal == null) return 1;
      if (bVal == null) return -1;
      const cmp = String(aVal).localeCompare(String(bVal));
      return sort.direction === 'asc' ? cmp : -cmp;
    });
  }, [data, columns, sort]);

  const handleSort = (columnKey: string) => {
    if (!columns.find(c => c.key === columnKey)?.sortable) return;
    if (sortColumn === columnKey) {
      sort?.onSort(columnKey, sort.direction === 'asc' ? 'desc' : 'asc');
    } else {
      setSortColumn(columnKey);
      sort?.onSort(columnKey, 'asc');
    }
  };

  const allSelected = Boolean(selection && data.length > 0 && data.every(row => selection.selectedKeys.has(keyAccessor(row))));
  const someSelected = Boolean(selection && data.some(row => selection.selectedKeys.has(keyAccessor(row))));

  if (loading) {
    return (
      <div className="overflow-x-auto rounded-2xl border border-glass-border">
        <table className="w-full" role="grid" aria-busy="true">
          <thead>
            <tr className="bg-surface border-b border-glass-border">
              {columns.map(col => (
                <th key={col.key} className="px-4 py-3 text-left font-medium text-text-secondary text-sm uppercase tracking-wider">
                  {col.header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {Array.from({ length: 5 }).map((_, i) => (
              <tr key={i} className="border-b border-glass-border">
                {columns.map(col => (
                  <td key={col.key} className="px-4 py-4">
                    <div className="h-4 bg-text-muted/20 animate-pulse rounded w-3/4" />
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  }

  if (data.length === 0) {
    return (
      <div className="rounded-2xl border border-glass-border bg-surface p-12 text-center">
        <svg className="mx-auto h-12 w-12 text-text-muted/50" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
        </svg>
        <p className="mt-4 text-text-muted">{emptyMessage}</p>
      </div>
    );
  }

  return (
    <div className={cn('overflow-x-auto rounded-2xl border border-glass-border', className)} {...props}>
      <table className="w-full" role="grid">
        <thead>
          <tr className="bg-surface border-b border-glass-border">
            {selection && (
              <th className="px-4 py-3">
                <TableCheckbox
                  checked={allSelected}
                  indeterminate={someSelected && !allSelected}
                  onChange={() => {
                    if (allSelected) {
                      selection.onSelectionChange(new Set());
                    } else {
                      selection.onSelectionChange(new Set(data.map(keyAccessor)));
                    }
                  }}
                />
              </th>
            )}
            {columns.map(column => (
              <TableHeaderCell
                key={column.key}
                column={column}
                sorted={sort?.column === column.key}
                direction={sort?.direction || 'asc'}
                onSort={handleSort}
              />
            ))}
            {rowActions && <th className="px-4 py-3 text-right font-medium text-text-secondary text-sm uppercase tracking-wider">Actions</th>}
          </tr>
        </thead>
        <tbody>
          {sortedData.map((row, rowIndex) => {
            const rowKey = keyAccessor(row);
            const isSelected = Boolean(selection?.selectedKeys.has(rowKey));
            return (
              <tr
                key={rowKey}
                className={cn(
                  'border-b border-glass-border/50 last:border-0 transition-colors',
                  striped && rowIndex % 2 === 1 && 'bg-surface/50',
                  hoverable && 'hover:bg-champagne/5',
                  isSelected && 'bg-champagne/10'
                )}
              >
                {selection && (
                  <td className="px-4 py-3">
                    <TableCheckbox
                      checked={isSelected}
                      indeterminate={false}
                      onChange={() => {
                        const newKeys = new Set(selection.selectedKeys);
                        if (isSelected) newKeys.delete(rowKey);
                        else newKeys.add(rowKey);
                        selection.onSelectionChange(newKeys);
                      }}
                    />
                  </td>
                )}
                {columns.map(column => (
                  <td
                    key={column.key}
                    className={cn(
                      'px-4 py-3 text-text-primary',
                      column.align === 'center' && 'text-center',
                      column.align === 'right' && 'text-right'
                    )}
                  >
                    {column.render
                      ? column.render(column.accessor(row), row)
                      : column.accessor(row)}
                  </td>
                ))}
                {rowActions && (
                  <td className="px-4 py-3 text-right">
                    {rowActions(row)}
                  </td>
                )}
              </tr>
            );
          })}
        </tbody>
      </table>

      {pagination && (
        <div className="flex items-center justify-between px-4 py-3 border-t border-glass-border bg-surface/50">
          <div className="text-sm text-text-muted">
            Showing {(pagination.page - 1) * pagination.pageSize + 1} to{' '}
            {Math.min(pagination.page * pagination.pageSize, pagination.total)} of{' '}
            {pagination.total} results
          </div>
          <div className="flex items-center gap-2">
            <select
              value={pagination.pageSize}
              onChange={e => pagination.onPageSizeChange(Number(e.target.value))}
              className="h-8 px-3 text-sm border border-glass-border rounded-lg bg-surface-raised focus:outline-none focus:ring-2 focus:ring-champagne/40"
            >
              {[10, 25, 50, 100].map(size => (
                <option key={size} value={size}>
                  {size} per page
                </option>
              ))}
            </select>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => pagination.onPageChange(pagination.page - 1)}
              disabled={pagination.page === 1}
              aria-label="Previous page"
            >
              ← Prev
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => pagination.onPageChange(pagination.page + 1)}
              disabled={pagination.page * pagination.pageSize >= pagination.total}
              aria-label="Next page"
            >
              Next →
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}

export default DataTable;