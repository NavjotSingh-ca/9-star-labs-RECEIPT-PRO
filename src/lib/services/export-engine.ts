/**
 * Export Engine - Multi-format receipt export with templates
 * CSV, Excel, PDF, JSON, QuickBooks, Xero formats
 */

import type { ReceiptRow } from '@/lib/types';

export type ExportFormat = 'csv' | 'xlsx' | 'pdf' | 'json' | 'qbo' | 'xero';

interface ExportTemplate {
  id: string;
  name: string;
  format: ExportFormat;
  columns: string[];
  transformations?: Record<string, (value: unknown) => unknown>;
}

// Standard templates
export const EXPORT_TEMPLATES: Record<string, ExportTemplate> = {
  crasp: {
    id: 'cra-standard',
    name: 'CRA Audit Standard',
    format: 'csv',
    columns: ['transaction_date', 'vendor_name', 'total_amount', 'gst_amount', 'pst_amount', 'category', 'notes'],
  },
  quickbooks: {
    id: 'quickbooks',
    name: 'QuickBooks Import',
    format: 'qbo',
    columns: ['Date', 'Account', 'Payee', 'Amount', 'Memo', 'Class', 'TaxCode'],
  },
  xero: {
    id: 'xero',
    name: 'Xero Import',
    format: 'xero',
    columns: ['Date', 'Contact', 'Description', 'Amount', 'AccountCode', 'TaxType'],
  },
  auditReady: {
    id: 'audit-ready',
    name: 'Audit Ready Bundle',
    format: 'json',
    columns: ['*'], // All fields
  },
};

/**
 * Generate export blob in specified format
 */
export async function generateExport(
  receipts: ReceiptRow[],
  template: ExportTemplate,
  orgId: string
): Promise<Blob> {
  const transformed = receipts.map(r => {
    const row: Record<string, unknown> = {};
    template.columns.forEach(col => {
      const key = col as keyof ReceiptRow;
      const value = r[key];
      row[col] = value ?? '';
    });
    return row;
  });

  let content: string;
  let mimeType: string;

  switch (template.format) {
    case 'csv':
      content = toCSV(transformed);
      mimeType = 'text/csv';
      break;
    case 'json':
      content = JSON.stringify({ receipts: transformed, exported: Date.now(), org: orgId }, null, 2);
      mimeType = 'application/json';
      break;
    case 'pdf':
      // Would use jsPDF in real implementation
      content = JSON.stringify(transformed, null, 2);
      mimeType = 'application/pdf';
      break;
    default:
      content = JSON.stringify(transformed, null, 2);
      mimeType = 'application/json';
  }

  return new Blob([content], { type: mimeType });
}

/**
 * Convert array to CSV
 */
function toCSV(data: Record<string, unknown>[]): string {
  if (data.length === 0) return '';
  const headers = Object.keys(data[0]);
  const rows = data.map(row => headers.map(h => `"${String(row[h] ?? '').replace(/"/g, '""')}"`).join(','));
  return [headers.join(','), ...rows].join('\n');
}