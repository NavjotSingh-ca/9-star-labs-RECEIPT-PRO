'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { handleSupabaseError } from '@/lib/supabase-error-handler';
import { AlertTriangle, TrendingUp, SearchX, Calculator, CopySlash, Loader2, FileWarning } from 'lucide-react';
import { formatDineroIntl } from '@/lib/finance-utils';
import type { ReceiptRow } from '@/lib/types';
import { toNumber } from '@/lib/ui-utils';
import { format } from 'date-fns';

interface SpendAnomaly {
  vendor_name: string;
  latest_amount: number;
  avg_amount: number;
  ratio: number;
  receipt_id: string;
  transaction_date: string;
}

export default function AnomalyDashboard() {
  const [loading, setLoading] = useState(true);
  const [fraudReceipts, setFraudReceipts] = useState<ReceiptRow[]>([]);
  const [mathErrors, setMathErrors] = useState<ReceiptRow[]>([]);
  const [missingBN, setMissingBN] = useState<ReceiptRow[]>([]);
  const [duplicates, setDuplicates] = useState<ReceiptRow[]>([]);
  const [spendAnomalies, setSpendAnomalies] = useState<SpendAnomaly[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;

    async function loadAnomalies() {
      try {
        const { data: orgData } = await supabase.rpc('get_user_org');
        const orgId = orgData as unknown as string;
        if (!orgId) return;

        // 1. Fetch AI Fraud Suspicion
        const { data: fraudData } = await supabase
          .from('receipts')
          .select('*')
          .eq('org_id', orgId)
          .eq('is_deleted', false)
          .eq('fraud_suspicion', true)
          .order('created_at', { ascending: false });

        // 2. Fetch Math Errors
        const { data: mathData } = await supabase
          .from('receipts')
          .select('*')
          .eq('org_id', orgId)
          .eq('is_deleted', false)
          .eq('math_mismatch_warning', true)
          .order('created_at', { ascending: false });

        // 3. Fetch Missing BN (> $100)
        const { data: bnData } = await supabase
          .from('receipts')
          .select('*')
          .eq('org_id', orgId)
          .eq('is_deleted', false)
          .gte('total_amount', 100)
          .is('vendor_tax_number', null)
          .order('created_at', { ascending: false });

        // 4. Fetch Duplicate Warnings
        const { data: dupData } = await supabase
          .from('receipts')
          .select('*')
          .eq('org_id', orgId)
          .eq('is_deleted', false)
          .eq('duplicate_warning', true)
          .order('created_at', { ascending: false });

        // 5. Fetch Spend Anomalies (RPC)
        const { data: spendData } = await supabase.rpc('get_spend_anomalies', { p_org_id: orgId });

        if (active) {
          setFraudReceipts(fraudData as ReceiptRow[] || []);
          setMathErrors(mathData as ReceiptRow[] || []);
          // Filter out missing BN rows that actually have empty strings instead of null
          setMissingBN((bnData as ReceiptRow[] || []).filter(r => !r.vendor_tax_number || r.vendor_tax_number.trim() === ''));
          setDuplicates(dupData as ReceiptRow[] || []);
          setSpendAnomalies(spendData as SpendAnomaly[] || []);
        }
      } catch (err) {
        if (active) setError(handleSupabaseError(err).userMessage);
      } finally {
        if (active) setLoading(false);
      }
    }

    loadAnomalies();
    return () => { active = false; };
  }, []);

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-champagne" />
      </div>
    );
  }

  const totalAnomalies = fraudReceipts.length + mathErrors.length + missingBN.length + duplicates.length + spendAnomalies.length;

  return (
    <div className="space-y-6 fade-in">
      <div>
        <p className="text-xs font-semibold uppercase tracking-[0.16em] text-red-400">Security & Compliance</p>
        <h2 className="mt-1 text-2xl font-bold tracking-tight text-text-primary">AI Anomaly Detection</h2>
        <p className="mt-2 text-sm text-text-secondary">
          {totalAnomalies > 0 
            ? `Found ${totalAnomalies} potential issues requiring attention.` 
            : 'No anomalies detected. Your ledgers are clean.'}
        </p>
      </div>

      {error && (
        <div className="rounded-[2rem] bg-red-500/10 p-4 text-sm text-red-400 border border-red-500/20">
          {error}
        </div>
      )}

      <div className="grid gap-6 md:grid-cols-2">
        
        {/* Fraud Suspicion */}
        <div className="rounded-[2rem] border border-red-500/20 bg-surface p-5 shadow-sm">
          <div className="flex items-center gap-3 mb-4">
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-red-500/10 text-red-500">
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
              <p className="text-sm text-text-muted text-center py-4">No fraud flags detected.</p>
            ) : (
              fraudReceipts.map(r => (
                <div key={r.id} className="rounded-xl bg-surface-raised p-3 text-sm">
                  <div className="flex justify-between font-medium">
                    <span>{r.vendor_name || 'Unknown'}</span>
                    <span>{formatDineroIntl(toNumber(r.total_amount))}</span>
                  </div>
                  <p className="text-xs text-red-400 mt-1">{r.fraud_reason}</p>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Spend Anomalies */}
        <div className="rounded-[2rem] border border-amber-500/20 bg-surface p-5 shadow-sm">
          <div className="flex items-center gap-3 mb-4">
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-amber-500/10 text-amber-500">
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
              <p className="text-sm text-text-muted text-center py-4">No spend anomalies detected.</p>
            ) : (
              spendAnomalies.map(s => (
                <div key={s.receipt_id} className="rounded-xl bg-surface-raised p-3 text-sm">
                  <div className="flex justify-between font-medium">
                    <span>{s.vendor_name}</span>
                    <span className="text-amber-400">{formatDineroIntl(toNumber(s.latest_amount))}</span>
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
              <p className="text-sm text-text-muted text-center py-4">No math errors detected.</p>
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
              <p className="text-sm text-text-muted text-center py-4">No major BN omissions.</p>
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
              <p className="text-sm text-text-muted text-center py-4">No forced duplicates.</p>
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
