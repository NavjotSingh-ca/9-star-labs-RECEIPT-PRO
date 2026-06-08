import type { ReceiptRow } from '@/lib/types';
import { toNumber } from '@/lib/ui-utils';
import { format } from 'date-fns';

export function getVendor(r: ReceiptRow): string {
  return String(r.vendor_name ?? 'Unknown Vendor').trim() || 'Unknown Vendor';
}

export function getDate(r: ReceiptRow): string {
  return String(r.transaction_date ?? '').trim();
}

export function getCategory(r: ReceiptRow): string {
  return String(r.category ?? 'Uncategorized').trim() || 'Uncategorized';
}

export function getTotal(r: ReceiptRow): number {
  return toNumber(r.total_amount);
}

export function getGST(r: ReceiptRow): number {
  return toNumber(r.tax_amount);
}

export function getPST(r: ReceiptRow): number {
  return toNumber(r.pst_amount);
}

export function getBN(r: ReceiptRow): string {
  return String(r.vendor_tax_number ?? '').trim();
}

export function getImageUrl(r: ReceiptRow): string {
  return String(r.image_url ?? '').trim();
}

export function getHash(r: ReceiptRow): string {
  return String(r.integrity_hash ?? '').trim();
}

export function formatDateInput(date: Date): string {
  return format(date, 'yyyy-MM-dd');
}

export function withinRange(r: ReceiptRow, from: string, to: string): boolean {
  const date = getDate(r);
  if (!date) return false;
  if (from && date < from) return false;
  if (to && date > to) return false;
  return true;
}

export function csvEscape(value: unknown): string {
  const s = value === null || value === undefined ? '' : String(value);
  return `"${s.replace(/"/g, '""')}"`;
}

export function stringifyLineItems(lineItems: ReceiptRow['line_items']): string {
  if (!lineItems) return '';
  if (typeof lineItems === 'string') return lineItems;
  try {
    return JSON.stringify(lineItems);
  } catch {
    return '';
  }
}

export function buildCSV(receipts: ReceiptRow[]): string {
  const headers = [
    'Date', 'Vendor', 'Vendor Address', 'Category', 'Payment Method',
    'Card Last 4', 'Currency', 'Exchange Rate', 'CAD Equivalent',
    'Subtotal', 'GST', 'PST', 'Total',
    'Business Number (GST/BN)', 'Business Use %', 'Job Code', 'Vehicle ID',
    'Document Type', 'Notes', 'Paid By', 'Reimbursement Status', 'Approval Status',
    'AI Fraud Suspicion', 'AI Fraud Reason', 'Blur Score',
    'Line Items', 'Integrity Hash', 'Image URL', 'Is Reconciled',
  ];

  const rows = receipts.map((r) => [
    getDate(r),
    getVendor(r),
    String(r.vendor_address ?? ''),
    getCategory(r),
    String(r.payment_method ?? ''),
    String(r.card_last_four ?? ''),
    String(r.currency ?? 'CAD'),
    toNumber(r.exchange_rate ?? 1).toFixed(4),
    r.cad_equivalent != null ? toNumber(r.cad_equivalent).toFixed(2) : '',
    toNumber(r.subtotal).toFixed(2),
    getGST(r).toFixed(2),
    getPST(r).toFixed(2),
    getTotal(r).toFixed(2),
    getBN(r),
    toNumber(r.business_use_percent ?? 100).toFixed(0),
    String(r.job_code ?? ''),
    String(r.vehicle_id ?? ''),
    String(r.document_type ?? 'receipt'),
    String(r.notes ?? ''),
    String(r.paid_by ?? ''),
    String(r.reimbursement_status ?? ''),
    String(r.approval_status ?? ''),
    r.fraud_suspicion ? 'TRUE' : 'FALSE',
    String(r.fraud_reason ?? ''),
    r.blur_score != null ? toNumber(r.blur_score).toFixed(1) : '',
    stringifyLineItems(r.line_items),
    getHash(r),
    getImageUrl(r),
    'is_reconciled' in r ? 'TRUE' : 'FALSE',
  ]);

  return '\ufeff' + [headers.map(csvEscape).join(','), ...rows.map((row) => row.map(csvEscape).join(','))].join('\n');
}

export function buildIDEACSV(receipts: ReceiptRow[]): string {
  const headers = [
    'Integrity Hash (SHA-256)', 'User ID', 'Transaction Date', 'Vendor Name',
    'Vendor Tax Number', 'Subtotal', 'Taxes', 'Total Amount', 'Job Code', 'Approval Status'
  ];

  const rows = receipts.map((r) => [
    getHash(r),
    String(r.user_id ?? 'Unknown'),
    getDate(r),
    getVendor(r),
    getBN(r),
    toNumber(r.subtotal).toFixed(2),
    (getGST(r) + getPST(r)).toFixed(2),
    getTotal(r).toFixed(2),
    String(r.job_code ?? ''),
    String(r.approval_status ?? ''),
  ]);

  return '\ufeff' + [headers.map(csvEscape).join(','), ...rows.map((row) => row.map(csvEscape).join(','))].join('\n');
}

export function buildLogbook(receipts: ReceiptRow[]): string {
  const headers = [
    'Filename', 'Date', 'Vendor', 'Total (Original)', 'Currency',
    'CAD Equivalent', 'Exchange Rate', 'Document Type', 'SHA-256 Hash',
    'Blur Score', 'Approval Status', 'Estimate Warning',
  ];

  const rows = receipts
    .filter((r) => getImageUrl(r) || getHash(r))
    .map((r) => {
      const filename = (() => {
        const url = getImageUrl(r);
        if (url) {
          const last = url.split('/').pop() || `${r.id}.jpg`;
          return last.split('?')[0];
        }
        return `${r.id}.jpg`;
      })();

      return [
        filename,
        getDate(r),
        getVendor(r),
        getTotal(r).toFixed(2),
        String(r.currency ?? 'CAD'),
        r.cad_equivalent != null ? toNumber(r.cad_equivalent).toFixed(2) : getTotal(r).toFixed(2),
        toNumber(r.exchange_rate ?? 1).toFixed(4),
        String(r.document_type ?? 'receipt'),
        getHash(r),
        r.blur_score != null ? toNumber(r.blur_score).toFixed(1) : 'N/A',
        String(r.approval_status ?? 'submitted'),
        r.document_type === 'estimate' ? 'NON-DEDUCTIBLE ESTIMATE' : '',
      ];
    });

  return '\ufeff' + [headers.map(csvEscape).join(','), ...rows.map((row) => row.map(csvEscape).join(','))].join('\n');
}
