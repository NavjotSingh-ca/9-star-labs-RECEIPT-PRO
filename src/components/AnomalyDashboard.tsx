'use client';

import { useQuery } from '@tanstack/react-query';
import { supabase, getOrgIdString } from '@/lib/supabase';
import { TrendingUp, SearchX, Calculator, CopySlash, Loader2, FileWarning, ShieldCheck, CheckCircle2, Receipt } from 'lucide-react';
import { motion } from 'framer-motion';
import { fadeUp } from '@/lib/animations';
import { formatDineroIntl } from '@/lib/finance-utils';
import type { ReceiptRow } from '@/lib/types';
import { toNumber } from '@/lib/ui-utils';

interface SpendAnomaly {
  vendor_name: string;
  latest_amount: number;
  avg_amount: number;
  ratio: number;
  receipt_id: string;
  transaction_date: string;
}

interface AnomaliesResult {
  fraudReceipts: ReceiptRow[];
  mathErrors: ReceiptRow[];
  missingBN: ReceiptRow[];
  duplicates: ReceiptRow[];
  spendAnomalies: SpendAnomaly[];
}

async function fetchAnomalies(): Promise<AnomaliesResult> {
  const orgId = await getOrgIdString();
  if (!orgId) throw new Error('No organization found');

  const columns = 'id, vendor_name, total_amount, fraud_reason, created_at, transaction_date, vendor_tax_number, subtotal, tax_amount, pst_amount, duplicate_hash';
  const base = supabase.from('receipts').select(columns).eq('org_id', orgId).eq('is_deleted', false);

  const [fraudData, mathData, bnData, dupData, spendData] = await Promise.all([
    base.eq('fraud_suspicion', true).order('created_at', { ascending: false }),
    base.eq('math_mismatch_warning', true).order('created_at', { ascending: false }),
    supabase.from('receipts').select(columns).eq('org_id', orgId).eq('is_deleted', false).gte('total_amount', 100).is('vendor_tax_number', null).order('created_at', { ascending: false }),
    base.eq('duplicate_warning', true).order('created_at', { ascending: false }),
    supabase.rpc('get_spend_anomalies', { p_org_id: orgId }),
  ]);

  const fraudReceipts = (fraudData.data as ReceiptRow[]) || [];
  const mathErrors = (mathData.data as ReceiptRow[]) || [];
  const missingBN = ((bnData.data as ReceiptRow[]) || []).filter(r => !r.vendor_tax_number || r.vendor_tax_number.trim() === '');
  const duplicates = (dupData.data as ReceiptRow[]) || [];
  const spendAnomalies = (spendData.data as SpendAnomaly[]) || [];

  return { fraudReceipts, mathErrors, missingBN, duplicates, spendAnomalies };
}

/**
 * AnomalyDashboard — Security & compliance panel showing AI-detected anomalies.
 * Categories: fraud suspicion, spend anomalies (>2x vendor avg), math errors,
 * missing business numbers (over $100), and duplicate warnings.
 *
 * Accessibility: Each section has proper heading hierarchy, ARIA live regions
 * for error states, and keyboard-focusable cards for interactive elements.
 */
export default function AnomalyDashboard() {
  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['anomalies'],
    queryFn: fetchAnomalies,
    staleTime: 2 * 60 * 1000,
  });

  if (isLoading) {
    return (
      <div
        className="flex h-64 items-center justify-center"
        role="status"
        aria-live="polite"
        aria-label="Loading anomaly detection data"
      >
        <Loader2 className="h-8 w-8 animate-spin text-champagne" aria-hidden="true" />
        <span className="sr-only">Analyzing receipt data for anomalies...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div
        className="rounded-[2rem] bg-danger/10 p-6 text-sm text-danger border border-danger/20"
        role="alert"
        aria-live="assertive"
      >
        <div className="flex items-start gap-3">
          <FileWarning className="h-5 w-5 flex-shrink-0 mt-0.5" aria-hidden="true" />
          <div>
            <p className="font-semibold mb-1">Unable to load anomaly data</p>
            <p>{error.message}</p>
            <button
              onClick={() => refetch()}
              className="mt-3 px-3 py-1.5 rounded-lg text-xs font-medium bg-danger/15 text-danger hover:bg-danger/25 transition focus:outline-none focus:ring-2 focus:ring-danger/40"
            >
              Retry Analysis
            </button>
          </div>
        </div>
      </div>
    );
  }

  const fraudReceipts = data?.fraudReceipts ?? [];
  const mathErrors = data?.mathErrors ?? [];
  const missingBN = data?.missingBN ?? [];
  const duplicates = data?.duplicates ?? [];
  const spendAnomalies = data?.spendAnomalies ?? [];
  const totalAnomalies = fraudReceipts.length + mathErrors.length + missingBN.length + duplicates.length + spendAnomalies.length;

  return (
    <div className="space-y-6 fade-in" role="region" aria-label="Anomaly detection dashboard">
      <header>
        <p className="text-xs font-semibold uppercase tracking-[0.16em] text-danger">Security & Compliance</p>
        <h2 className="mt-1 text-2xl font-bold tracking-tight text-text-primary">AI Anomaly Detection</h2>
        <p className="mt-2 text-sm text-text-secondary" aria-live="polite">
          {totalAnomalies > 0
            ? `Found ${totalAnomalies} potential issues requiring attention.`
            : 'No anomalies detected. Your ledgers are clean.'}
        </p>
      </header>

      <div className="grid gap-6 md:grid-cols-2">
        
        {/* Fraud Suspicion */}
        <div className="rounded-[2rem] border border-danger/20 bg-surface p-5 shadow-sm">
          <div className="flex items-center gap-3 mb-4">
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-danger/10 text-danger">
              <FileWarning className="h-5 w-5" />
            </div>
            <div>
              <h3 className="font-bold text-text-primary">Suspicious Receipts</h3>
              <p className="text-xs text-text-secondary">AI flagged as potential fraud</p>
            </div>
            <div className="ml-auto flex h-8 w-8 items-center justify-center rounded-full bg-surface-raised font-bold text-text-primary">
              {fraudReceipts.length}
            </div>
          </div>
          <div className="space-y-3">
            {fraudReceipts.length === 0 ? (
              <motion.div variants={fadeUp} initial="hidden" animate="show" className="flex flex-col items-center gap-2 py-6 text-center" role="status" aria-live="polite">
                <ShieldCheck className="h-8 w-8 text-emerald-success/40" />
                <p className="text-sm text-text-muted">No fraud flags detected.</p>
              </motion.div>
            ) : (
              fraudReceipts.map(r => (
                <div key={r.id} className="rounded-xl bg-surface-raised p-3 text-sm">
                  <div className="flex justify-between font-medium">
                    <span>{r.vendor_name || 'Unknown'}</span>
                    <span>{formatDineroIntl(toNumber(r.total_amount))}</span>
                  </div>
                  <p className="text-xs text-danger mt-1">{r.fraud_reason}</p>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Spend Anomalies */}
        <div className="rounded-[2rem] border border-warning/20 bg-surface p-5 shadow-sm">
          <div className="flex items-center gap-3 mb-4">
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-warning/10 text-warning">
              <TrendingUp className="h-5 w-5" />
            </div>
            <div>
              <h3 className="font-bold text-text-primary">Spend Anomalies</h3>
              <p className="text-xs text-text-secondary">&gt;2x historical average for vendor</p>
            </div>
            <div className="ml-auto flex h-8 w-8 items-center justify-center rounded-full bg-surface-raised font-bold text-text-primary">
              {spendAnomalies.length}
            </div>
          </div>
          <div className="space-y-3">
            {spendAnomalies.length === 0 ? (
              <motion.div variants={fadeUp} initial="hidden" animate="show" className="flex flex-col items-center gap-2 py-6 text-center" role="status" aria-live="polite">
                <TrendingUp className="h-8 w-8 text-text-muted/30" />
                <p className="text-sm text-text-muted">No spend anomalies detected.</p>
              </motion.div>
            ) : (
              spendAnomalies.map(s => (
                <div key={s.receipt_id} className="rounded-xl bg-surface-raised p-3 text-sm">
                  <div className="flex justify-between font-medium">
                    <span>{s.vendor_name}</span>
                    <span className="text-warning">{formatDineroIntl(toNumber(s.latest_amount))}</span>
                  </div>
                  <p className="text-xs text-text-secondary mt-1">
                    Normal avg: {formatDineroIntl(toNumber(s.avg_amount))} ({toNumber(s.ratio).toFixed(1)}x higher)
                  </p>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Math Errors */}
        <div className="rounded-[2rem] border border-champagne/20 bg-surface p-5 shadow-sm">
          <div className="flex items-center gap-3 mb-4">
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-champagne/10 text-champagne">
              <Calculator className="h-5 w-5" />
            </div>
            <div>
              <h3 className="font-bold text-text-primary">Math Errors</h3>
              <p className="text-xs text-text-secondary">Subtotal + Tax ≠ Total</p>
            </div>
            <div className="ml-auto flex h-8 w-8 items-center justify-center rounded-full bg-surface-raised font-bold text-text-primary">
              {mathErrors.length}
            </div>
          </div>
          <div className="space-y-3">
            {mathErrors.length === 0 ? (
              <motion.div variants={fadeUp} initial="hidden" animate="show" className="flex flex-col items-center gap-2 py-6 text-center" role="status" aria-live="polite">
                <Calculator className="h-8 w-8 text-text-muted/30" />
                <p className="text-sm text-text-muted">No math errors detected.</p>
              </motion.div>
            ) : (
              mathErrors.map(r => (
                <div key={r.id} className="rounded-xl bg-surface-raised p-3 text-sm">
                  <div className="flex justify-between font-medium">
                    <span>{r.vendor_name || 'Unknown'}</span>
                    <span>{formatDineroIntl(toNumber(r.total_amount))}</span>
                  </div>
                  <p className="text-xs text-champagne mt-1">
                    Stated total: {formatDineroIntl(toNumber(r.total_amount))} vs Computed: {formatDineroIntl(toNumber(r.subtotal) + toNumber(r.tax_amount) + toNumber(r.pst_amount))}
                  </p>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Missing BN */}
        <div className="rounded-[2rem] border border-champagne/20 bg-surface p-5 shadow-sm">
          <div className="flex items-center gap-3 mb-4">
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-champagne/10 text-champagne">
              <SearchX className="h-5 w-5" />
            </div>
            <div>
              <h3 className="font-bold text-text-primary">Missing BN</h3>
              <p className="text-xs text-text-secondary">Over $100 but no Tax ID found</p>
            </div>
            <div className="ml-auto flex h-8 w-8 items-center justify-center rounded-full bg-surface-raised font-bold text-text-primary">
              {missingBN.length}
            </div>
          </div>
          <div className="space-y-3 max-h-60 overflow-y-auto pr-2 custom-scrollbar">
            {missingBN.length === 0 ? (
              <motion.div variants={fadeUp} initial="hidden" animate="show" className="flex flex-col items-center gap-2 py-6 text-center" role="status" aria-live="polite">
                <Receipt className="h-8 w-8 text-text-muted/30" />
                <p className="text-sm text-text-muted">No major BN omissions.</p>
              </motion.div>
            ) : (
              missingBN.map(r => (
                <div key={r.id} className="rounded-xl bg-surface-raised p-3 text-sm mb-2">
                  <div className="flex justify-between font-medium">
                    <span>{r.vendor_name || 'Unknown'}</span>
                    <span>{formatDineroIntl(toNumber(r.total_amount))}</span>
                  </div>
                  <p className="text-xs text-text-secondary mt-1">{r.transaction_date}</p>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Duplicates */}
        <div className="rounded-[2rem] border border-glass-border bg-surface p-5 shadow-sm md:col-span-2">
          <div className="flex items-center gap-3 mb-4">
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-surface-raised text-text-secondary">
              <CopySlash className="h-5 w-5" />
            </div>
            <div>
              <h3 className="font-bold text-text-primary">Duplicate Warnings</h3>
              <p className="text-xs text-text-secondary">User forced save after duplicate hash collision</p>
            </div>
            <div className="ml-auto flex h-8 w-8 items-center justify-center rounded-full bg-surface-raised font-bold text-text-primary">
              {duplicates.length}
            </div>
          </div>
          <div className="space-y-3">
            {duplicates.length === 0 ? (
              <motion.div variants={fadeUp} initial="hidden" animate="show" className="flex flex-col items-center gap-2 py-6 text-center" role="status" aria-live="polite">
                <CheckCircle2 className="h-8 w-8 text-emerald-success/40" />
                <p className="text-sm text-text-muted">No forced duplicates.</p>
              </motion.div>
            ) : (
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {duplicates.map(r => (
                  <div key={r.id} className="rounded-xl bg-surface-raised p-3 text-sm">
                    <div className="flex justify-between font-medium">
                      <span>{r.vendor_name || 'Unknown'}</span>
                      <span>{formatDineroIntl(toNumber(r.total_amount))}</span>
                    </div>
                    <p className="text-xs text-text-secondary mt-1">Hash: {r.duplicate_hash?.substring(0, 8)}...</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

      </div>
    </div>
  );
}
