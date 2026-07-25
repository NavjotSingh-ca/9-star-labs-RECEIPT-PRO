/**
 * Table — Accessible table primitive with subcomponents.
 * Subcomponents: Table, TableHeader, TableBody, TableFooter, TableRow, TableHead, TableCell, TableCaption.
 */

'use client';

import { cn } from '../utils';

export type TableProps = React.ComponentProps<'table'>;

export const Table = ({ className, ...props }: TableProps) => {
  return (
    <div data-slot="table-container" className="relative w-full overflow-x-auto rounded-xl border border-glass-border">
      <table
        data-slot="table"
        className={cn('w-full caption-bottom text-sm', className)}
        {...props}
      />
    </div>
  );
};

export type TableHeaderProps = React.ComponentProps<'thead'>;

export const TableHeader = ({ className, ...props }: TableHeaderProps) => {
  return (
    <thead
      data-slot="table-header"
      className={cn('border-b border-glass-border', className)}
      {...props}
    />
  );
};

export type TableBodyProps = React.ComponentProps<'tbody'>;

export const TableBody = ({ className, ...props }: TableBodyProps) => {
  return (
    <tbody
      data-slot="table-body"
      className={cn('[&_tr:last-child]:border-0', className)}
      {...props}
    />
  );
};

export type TableFooterProps = React.ComponentProps<'tfoot'>;

export const TableFooter = ({ className, ...props }: TableFooterProps) => {
  return (
    <tfoot
      data-slot="table-footer"
      className={cn(
        'border-t border-glass-border bg-surface font-medium [&>tr]:last:border-b-0',
        className
      )}
      {...props}
    />
  );
};

export type TableRowProps = React.ComponentProps<'tr'> & {
  selected?: boolean;
  clickable?: boolean;
};

export const TableRow = ({ className, selected = false, clickable = false, ...props }: TableRowProps) => {
  return (
    <tr
      data-slot="table-row"
      data-state={selected ? 'selected' : undefined}
      className={cn(
        'border-b border-glass-border transition-colors',
        'data-[state=selected]:bg-champagne/5',
        clickable && 'hover:bg-champagne/5 cursor-pointer',
        !clickable && 'hover:bg-surface-hover',
        className
      )}
      {...props}
    />
  );
};

export type TableHeadProps = React.ComponentProps<'th'>;

export const TableHead = ({ className, ...props }: TableHeadProps) => {
  return (
    <th
      scope="col"
      data-slot="table-head"
      className={cn(
        'h-10 px-3 text-left align-middle font-semibold text-xs text-text-secondary whitespace-nowrap uppercase tracking-wider',
        '[&:has([role=checkbox])]:pr-0',
        className
      )}
      {...props}
    />
  );
};

export type TableCellProps = React.ComponentProps<'td'>;

export const TableCell = ({ className, ...props }: TableCellProps) => {
  return (
    <td
      data-slot="table-cell"
      className={cn(
        'p-3 align-middle whitespace-nowrap',
        '[&:has([role=checkbox])]:pr-0',
        className
      )}
      {...props}
    />
  );
};

export type TableCaptionProps = React.ComponentProps<'caption'>;

export const TableCaption = ({ className, ...props }: TableCaptionProps) => {
  return (
    <caption
      data-slot="table-caption"
      className={cn('mt-3 text-sm text-text-muted', className)}
      {...props}
    />
  );
};

export default Table;