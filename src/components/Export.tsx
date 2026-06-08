'use client';

import { useMemo, useState } from 'react';
import { APP_NAME } from '@/lib/constants';
import { toast } from 'sonner';
import { usePlan } from '@/hooks/use-plan';
import { PlanGate } from '@/components/plan-gate';
import {
  AlertTriangle,
  Download,
  FileArchive,
  FileText,
  Fingerprint,
  Loader2,
  ShieldCheck,
} from 'lucide-react';

import type { ReceiptRow } from '@/lib/types';
import { formatDineroIntl } from '@/lib/finance-utils';
import { getReceiptImageUrl } from '@/lib/supabase';
import {
  getVendor, getDate, getCategory, getTotal, getGST, getPST, getBN, getImageUrl, getHash,
  formatDateInput, withinRange, buildCSV, buildIDEACSV, buildLogbook,
} from '@/lib/export-cra';

interface ExportProps {
  receipts: ReceiptRow[];
}

export default function Export({ receipts }: ExportProps) {
  const { plan } = usePlan();
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');
  const [zipping, setZipping] = useState(false);
  const [generatingPdf, setGeneratingPdf] = useState(false);

  const filteredReceipts = useMemo(
    () => receipts.filter((r) => withinRange(r, fromDate, toDate)),
    [receipts, fromDate, toDate]
  );

  const totals = useMemo(() => {
    const total = filteredReceipts.reduce((sum, r) => sum + getTotal(r), 0);
    const gst = filteredReceipts.reduce((sum, r) => sum + getGST(r), 0);
    const pst = filteredReceipts.reduce((sum, r) => sum + getPST(r), 0);
    const reimbursementPending = filteredReceipts.filter(
      (r) => r.paid_by === 'employee_cash' && r.reimbursement_status === 'pending'
    ).length;
    return { total, gst, pst, count: filteredReceipts.length, reimbursementPending };
  }, [filteredReceipts]);

  async function downloadCSV() {
    if (filteredReceipts.length === 0) return;

    const csv = buildCSV(filteredReceipts);
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);

    const a = document.createElement('a');
    a.href = url;
    a.download = `receipt-pro-export-${formatDateInput(new Date())}.csv`;
    a.click();

    URL.revokeObjectURL(url);
  }

  async function downloadIDEAExport() {
    if (filteredReceipts.length === 0) return;

    const csv = buildIDEACSV(filteredReceipts);
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);

    const a = document.createElement('a');
    a.href = url;
    a.download = `receipt-pro-idea-export-${formatDateInput(new Date())}.csv`;
    a.click();

    URL.revokeObjectURL(url);
  }

  async function downloadCRAPDF() {
    try {
      setGeneratingPdf(true);
      const year = new Date().getFullYear() - 1; // Default to last year
      const params = new URLSearchParams({ year: String(year) });
      if (fromDate) params.set('fromDate', fromDate);
      if (toDate) params.set('toDate', toDate);
      const response = await fetch(`/api/cra/generate?${params}`);
      
      if (!response.ok) {
        throw new Error('Failed to generate PDF');
      }
      
      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      
      const a = document.createElement('a');
      a.href = url;
      a.download = `CRA-Package-${year}.pdf`;
      a.click();
      
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error('CRA PDF download error:', err);
      toast.error(err instanceof Error ? err.message : 'Failed to generate CRA PDF. The server may be unavailable.');
    } finally {
      setGeneratingPdf(false);
    }
  }

  async function downloadAuditPackage() {
    if (filteredReceipts.length === 0 || zipping) return;

    setZipping(true);

    try {
      const JSZip = (await import('jszip')).default;
      const zip = new JSZip();

      zip.file('receipts.csv', buildCSV(filteredReceipts));
      zip.file('LOGBOOK.csv', buildLogbook(filteredReceipts));
      zip.file(
        'README.txt',
        [
          '{APP_NAME} — CRA Audit Package',
          '================================================',
          '',
          'This package is prepared for CRA recordkeeping and audit support under IC05-1R1.',
          '',
          'Contents:',
          '- receipts.csv: Full transaction register with GST/PST, exchange rates, document types,',
          '  payment context, reimbursement and approval status, line items, and integrity hashes.',
          '- LOGBOOK.csv: Chain-of-custody log mapping filenames to SHA-256 hashes, blur scores,',
          '  document types, and operators. ESTIMATE rows are flagged NON-DEDUCTIBLE.',
          '- images/: Source receipt images for the selected period.',
          '',
          'Chain of Custody:',
          '- Each receipt image filename maps to a SHA-256 hash in LOGBOOK.csv.',
          '- Hashes are computed from the raw binary of the image at the moment of capture.',
          '- To verify integrity: recompute the SHA-256 of each image and compare to LOGBOOK.',
          '',
          'Non-Deductible Items:',
          '- Rows with Document Type = \'estimate\' are flagged as NON-DEDUCTIBLE ESTIMATE.',
          '- Do not submit estimates as final expense claims to CRA.',
          '',
          'Retention Policy:',
          '- Retain original records for a minimum of 6 years (Income Tax Act, s. 230).',
          '- Do not delete source files while an audit hold is active.',
          '- Keep exported packages alongside original source records.',
          '',
          'Generated by {APP_NAME} — CRA-Ready Receipt Intelligence',
          'Contact: 9starlaba@gmail.com',
        ].join('\n')
      );

      const imageFolder = zip.folder('images');
      if (imageFolder) {
        const batchSize = 10;
        for (let i = 0; i < filteredReceipts.length; i += batchSize) {
          const batch = filteredReceipts.slice(i, i + batchSize);
          await Promise.allSettled(
            batch.map(async (r) => {
              const imageUrl = getImageUrl(r);
              if (!imageUrl) return;

              try {
                const freshImageUrl = await getReceiptImageUrl(imageUrl);
                if (!freshImageUrl) {
                  imageFolder.file(`${r.id}.txt`, 'Image unavailable for this record.');
                  return;
                }
                const response = await fetch(freshImageUrl);
                const blob = await response.blob();
                const filename = imageUrl.split('/').pop()?.split('?')[0] || `${r.id}.jpg`;
                imageFolder.file(filename, blob);
              } catch {
                imageFolder.file(`${r.id}.txt`, 'Image unavailable for this record.');
              }
            })
          );
        }
      }

      const zipBlob = await zip.generateAsync({ type: 'blob' });
      const url = URL.createObjectURL(zipBlob);

      const a = document.createElement('a');
      a.href = url;
      a.download = `9starlabs-cra-audit-package-${formatDateInput(new Date())}.zip`;
      a.click();

      URL.revokeObjectURL(url);
    } finally {
      setZipping(false);
    }
  }

  return (
    <PlanGate plan={plan} feature="hasExports">
      <section className="space-y-5 fade-in" role="region" aria-label="Export receipts">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-champagne">Export center</p>
          <h2 className="mt-1 text-2xl font-bold tracking-tight text-text-primary sm:text-3xl">CRA Export — {APP_NAME}</h2>
        </div>

        <div className="rounded-[3rem] border border-glass-border bg-surface px-3 py-2 text-xs font-medium text-text-secondary shadow-sm">
          {filteredReceipts.length} receipt{filteredReceipts.length === 1 ? '' : 's'} in range
        </div>
      </div>

      <div className="grid gap-3 rounded-3xl border border-glass-border bg-surface p-4 shadow-sm sm:grid-cols-2">
        <div>
          <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-text-muted">From</label>
          <input
            type="date"
            value={fromDate}
            onChange={(e) => setFromDate(e.target.value)}
            className="w-full rounded-[2rem] border border-glass-border bg-surface-raised px-4 py-3 text-sm text-text-primary outline-none transition focus:border-champagne/40 focus:ring-2 focus:ring-champagne/15"
          />
        </div>

        <div>
          <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-text-muted">To</label>
          <input
            type="date"
            value={toDate}
            onChange={(e) => setToDate(e.target.value)}
            className="w-full rounded-[2rem] border border-glass-border bg-surface-raised px-4 py-3 text-sm text-text-primary outline-none transition focus:border-champagne/40 focus:ring-2 focus:ring-champagne/15"
          />
        </div>
      </div>

      <div className="grid gap-3 lg:grid-cols-3">
        <button
          type="button"
          onClick={downloadCSV}
          disabled={filteredReceipts.length === 0}
          className="rounded-3xl border border-glass-border bg-surface p-4 text-left shadow-sm transition hover:border-glass-border-hover hover:bg-surface-raised disabled:cursor-not-allowed disabled:opacity-50"
        >
          <div className="flex items-start gap-3">
            <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-[2rem] bg-emerald-success/10 text-emerald-light">
              <FileText className="h-6 w-6" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-bold text-text-primary">Download CSV Spreadsheet</p>
              <p className="mt-1 text-sm leading-relaxed text-text-secondary">
                Includes date, vendor, taxes, payment context, reimbursement status, job codes, line items, and integrity hash.
              </p>
            </div>
            <Download className="mt-1 h-4 w-4 flex-shrink-0 text-text-muted" />
          </div>
        </button>

        <button
          type="button"
          onClick={downloadAuditPackage}
          disabled={filteredReceipts.length === 0 || zipping}
          className="rounded-3xl border border-glass-border bg-surface p-4 text-left shadow-sm transition hover:border-glass-border-hover hover:bg-surface-raised disabled:cursor-not-allowed disabled:opacity-50"
        >
          <div className="flex items-start gap-3">
            <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-[2rem] bg-champagne/10 text-champagne">
              {zipping ? <Loader2 className="h-6 w-6 animate-spin" /> : <FileArchive className="h-6 w-6" />}
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-bold text-text-primary">Download CRA Audit Package (ZIP)</p>
              <p className="mt-1 text-sm leading-relaxed text-text-secondary">
                Contains receipts.csv, LOGBOOK.csv, README.txt, and the images/ folder with source images for chain-of-custody.
              </p>
            </div>
            <Download className="mt-1 h-4 w-4 flex-shrink-0 text-text-muted" />
          </div>
        </button>

        <button
          type="button"
          onClick={downloadIDEAExport}
          disabled={filteredReceipts.length === 0}
          className="rounded-3xl border border-glass-border bg-surface p-4 text-left shadow-sm transition hover:border-glass-border-hover hover:bg-surface-raised disabled:cursor-not-allowed disabled:opacity-50"
        >
          <div className="flex items-start gap-3">
            <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-[2rem] bg-warning/10 text-warning">
              <FileArchive className="h-6 w-6" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-bold text-text-primary">Generate Structured Audit Export</p>
              <p className="mt-1 text-sm leading-relaxed text-text-secondary">
                Flat CSV mapped for the CRA IDEA audit software framework. 
              </p>
            </div>
            <Download className="mt-1 h-4 w-4 flex-shrink-0 text-text-muted" />
          </div>
        </button>

        <button
          type="button"
          onClick={downloadCRAPDF}
          disabled={filteredReceipts.length === 0 || generatingPdf}
          className="rounded-3xl border border-glass-border bg-surface p-4 text-left shadow-sm transition hover:border-glass-border-hover hover:bg-surface-raised disabled:cursor-not-allowed disabled:opacity-50"
        >
          <div className="flex items-start gap-3">
            <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-[2rem] bg-champagne/10 text-champagne">
              {generatingPdf ? <Loader2 className="h-6 w-6 animate-spin" /> : <FileText className="h-6 w-6" />}
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-bold text-text-primary">Generate CRA Package</p>
              <p className="mt-1 text-sm leading-relaxed text-text-secondary">
                Download a PDF package with T2125/T777 pre-fill data and top vendor summary.
              </p>
            </div>
            <Download className="mt-1 h-4 w-4 flex-shrink-0 text-text-muted" />
          </div>
        </button>
      </div>

      <div className="grid gap-3 sm:grid-cols-4">
        <div className="rounded-3xl border border-glass-border bg-surface p-4 shadow-sm">
          <p className="text-xs font-semibold uppercase tracking-[0.14em] text-text-muted">Total</p>
          <p className="mt-2 text-2xl font-bold tabular-nums text-text-primary">{formatDineroIntl(totals.total)}</p>
        </div>
        <div className="rounded-3xl border border-glass-border bg-surface p-4 shadow-sm">
          <p className="text-xs font-semibold uppercase tracking-[0.14em] text-text-muted">GST</p>
          <p className="mt-2 text-2xl font-bold tabular-nums text-champagne">{formatDineroIntl(totals.gst)}</p>
        </div>
        <div className="rounded-3xl border border-glass-border bg-surface p-4 shadow-sm">
          <p className="text-xs font-semibold uppercase tracking-[0.14em] text-text-muted">PST</p>
          <p className="mt-2 text-2xl font-bold tabular-nums text-text-primary">{formatDineroIntl(totals.pst)}</p>
        </div>
        <div className="rounded-3xl border border-glass-border bg-surface p-4 shadow-sm">
          <p className="text-xs font-semibold uppercase tracking-[0.14em] text-text-muted">Pending Claims</p>
          <p className="mt-2 text-2xl font-bold tabular-nums text-warning">{totals.reimbursementPending}</p>
        </div>
      </div>

      <div className="rounded-3xl border border-warning/15 bg-warning/[0.04] p-4 shadow-sm">
        <div className="flex items-start gap-3">
          <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-[2rem] bg-warning/10 text-warning shadow-sm">
            <AlertTriangle className="h-5 w-5" />
          </div>
          <div>
            <p className="text-sm font-bold text-text-primary">6-Year Retention Policy</p>
            <p className="mt-1 text-sm leading-relaxed text-text-secondary">
              CRA recordkeeping expects original receipt records to be retained for at least 6 years. This export helps
              preserve a complete, auditable package with the source images, hash log, and spreadsheet data.
            </p>
          </div>
        </div>
      </div>

      <div className="rounded-3xl border border-glass-border bg-surface p-4 shadow-sm">
        <div className="flex items-start gap-3">
          <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-[2rem] bg-champagne/10 text-champagne">
            <ShieldCheck className="h-5 w-5" />
          </div>
          <div className="min-w-0">
            <p className="text-sm font-bold text-text-primary">Audit package contents</p>
            <p className="mt-1 text-sm leading-relaxed text-text-secondary">
              LOGBOOK.csv includes the filename, date, vendor, total, SHA-256 hash, and approval status for each image so the package can be
              verified against the source records for legal chain-of-custody.
            </p>
            <div className="mt-3 flex items-center gap-2 text-xs text-text-muted">
              <Fingerprint className="h-4 w-4 text-emerald-light" />
              <span>Integrity hashes included on every eligible receipt.</span>
            </div>
          </div>
        </div>
      </div>
      </section>
    </PlanGate>
  );
}
