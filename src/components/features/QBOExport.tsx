'use client';

import { motion } from 'framer-motion';
import { fadeUp } from '@/lib/animations';
import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase, getOrgIdString } from '@/lib/supabase';
import PageHeader from '@/components/layout/PageHeader';
import { Loader2, AlertCircle, Download, FileSpreadsheet } from 'lucide-react';
import { formatDineroIntl } from '@/lib/finance-utils';

export default function QBOExport() {
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');

  const { data: receipts = [], isLoading, error } = useQuery({
    queryKey: ['qbo-export', fromDate, toDate],
    queryFn: async () => {
      const orgId = await getOrgIdString();
      if (!orgId) throw new Error('No organization found');
      let query = supabase
        .from('receipts')
        .select('id, vendor_name, transaction_date, total_amount, tax_amount, category, notes')
        .eq('org_id', orgId)
        .is('deleted_at', null)
        .order('transaction_date', { ascending: false });
      if (fromDate) query = query.gte('transaction_date', fromDate);
      if (toDate) query = query.lte('transaction_date', toDate);
      const { data, error: err } = await query;
      if (err) throw err;
      return data || [];
    },
    enabled: true,
  });

  const generateCSV = () => {
    const header = 'Date,Payee,Category,Amount,Tax,Memo';
    const rows = receipts.map((r) =>
      [
        r.transaction_date || '',
        `"${(r.vendor_name || '').replace(/"/g, '""')}"`,
        r.category || '',
        r.total_amount || 0,
        r.tax_amount || 0,
        '',
      ].join(',')
    );
    return [header, ...rows].join('\n');
  };

  const downloadCSV = () => {
    const blob = new Blob([generateCSV()], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `qbo-export-${fromDate || 'all'}-${toDate || 'all'}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <motion.div
      variants={fadeUp}
      initial="hidden"
      animate="show"
      className="space-y-5"
    >
      <PageHeader
        title="QBO Export"
        subtitle="Export receipts in QuickBooks Online CSV format"
      />

      {/* Date Range */}
      <div className="flex flex-wrap gap-3 items-center rounded-2xl border border-glass-border bg-surface p-4">
        <div>
          <label htmlFor="qbo-from" className="block text-xs font-medium text-text-muted mb-1">From</label>
          <input
            id="qbo-from"
            type="date"
            value={fromDate}
            onChange={(e) => setFromDate(e.target.value)}
            className="rounded-lg border border-glass-border bg-surface-raised px-3 py-1.5 text-sm text-text-primary"
          />
        </div>
        <div>
          <label htmlFor="qbo-to" className="block text-xs font-medium text-text-muted mb-1">To</label>
          <input
            id="qbo-to"
            type="date"
            value={toDate}
            onChange={(e) => setToDate(e.target.value)}
            className="rounded-lg border border-glass-border bg-surface-raised px-3 py-1.5 text-sm text-text-primary"
          />
        </div>
        <button
          type="button"
          onClick={downloadCSV}
          disabled={receipts.length === 0}
          className="ml-auto inline-flex items-center gap-2 rounded-xl bg-champagne px-4 py-2 text-sm font-bold text-obsidian hover:bg-champagne-dim transition disabled:opacity-50"
        >
          <Download className="h-4 w-4" />
          Download CSV
        </button>
      </div>

      {isLoading && (
        <div className="flex justify-center p-8"><Loader2 className="h-8 w-8 animate-spin text-champagne" /></div>
      )}
      {error && (
        <div className="rounded-[2rem] bg-danger/10 p-4 text-sm text-danger border border-danger/20"><AlertCircle className="inline h-4 w-4 mr-2" />{error.message}</div>
      )}

      {!isLoading && !error && receipts.length === 0 && (
        <div className="flex flex-col items-center gap-3 rounded-3xl border border-dashed border-glass-border bg-surface/30 py-16 text-center">
          <FileSpreadsheet className="h-10 w-10 text-text-muted/40" />
          <p className="text-sm text-text-muted">No receipts found for this period. Select dates and try again.</p>
        </div>
      )}

      {receipts.length > 0 && (
        <div className="rounded-2xl border border-glass-border bg-surface overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-surface-raised text-left text-xs font-semibold text-text-muted uppercase tracking-wider">
                <th className="px-4 py-3">Date</th>
                <th className="px-4 py-3">Payee</th>
                <th className="px-4 py-3">Category</th>
                <th className="px-4 py-3 text-right">Amount</th>
                <th className="px-4 py-3 text-right">Tax</th>
              </tr>
            </thead>
            <tbody>
              {receipts.slice(0, 50).map((r) => (
                <tr key={r.id} className="border-t border-glass-border hover:bg-champagne/5">
                  <td className="px-4 py-2.5 text-text-secondary">{r.transaction_date}</td>
                  <td className="px-4 py-2.5 font-medium text-text-primary">{r.vendor_name || '—'}</td>
                  <td className="px-4 py-2.5 text-text-secondary">{r.category || '—'}</td>
                  <td className="px-4 py-2.5 text-right font-semibold tabular-nums">{formatDineroIntl(Number(r.total_amount) || 0)}</td>
                  <td className="px-4 py-2.5 text-right font-semibold tabular-nums text-emerald-success">{formatDineroIntl(Number(r.tax_amount) || 0)}</td>
                </tr>
              ))}
            </tbody>
          </table>
          <p className="px-4 py-2 text-xs text-text-muted border-t border-glass-border">
            Showing {Math.min(receipts.length, 50)} of {receipts.length} receipts
          </p>
        </div>
      )}

      {/* Import Instructions */}
      <div className="rounded-2xl border border-glass-border bg-surface p-5">
        <h3 className="text-sm font-bold text-text-primary mb-2">QBO Import Instructions</h3>
        <ol className="list-decimal list-inside space-y-1.5 text-sm text-text-secondary">
          <li>Go to <strong>QuickBooks Online</strong> → <strong>Gear icon</strong> → <strong>Import Data</strong></li>
          <li>Select <strong>Expenses</strong> → <strong>Import CSV</strong></li>
          <li>Upload the downloaded CSV file</li>
          <li>Map columns: Date → Date, Payee → Payee, Category → Category, Amount → Amount</li>
          <li>Review and confirm the import</li>
        </ol>
      </div>
    </motion.div>
  );
}
