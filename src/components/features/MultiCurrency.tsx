'use client';

import { motion } from 'framer-motion';
import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { AlertCircle, Loader2, Globe } from 'lucide-react';
import PageHeader from '@/components/layout/PageHeader';
import { supabase, getOrgIdString } from '@/lib/supabase';
import { formatCurrency } from '@/lib/ui-utils';
import { cn } from '@/lib/utils';
import type { ReceiptRow } from '@/lib/types';

async function fetchNonCadReceipts(orgId: string): Promise<ReceiptRow[]> {
  const { data, error } = await supabase
    .from('receipts')
    .select('*')
    .eq('org_id', orgId)
    .eq('is_deleted', false)
    .neq('currency', 'CAD')
    .order('transaction_date', { ascending: false });
  if (error) throw new Error('Failed to load multi-currency data');
  return (data || []) as ReceiptRow[];
}

export default function MultiCurrency() {
  const { data: orgId } = useQuery({
    queryKey: ['multicurrency-org'],
    queryFn: async () => {
      const id = await getOrgIdString();
      if (!id) throw new Error('No organization found');
      return id;
    },
    staleTime: Infinity,
  });

  const {
    data: receipts = [],
    isLoading,
    error,
  } = useQuery({
    queryKey: ['multicurrency-receipts', orgId],
    queryFn: () => fetchNonCadReceipts(orgId!),
    enabled: !!orgId,
    staleTime: 5 * 60 * 1000,
  });

  const byCurrency = useMemo(() => {
    const map = new Map<string, { originalTotal: number; cadTotal: number; count: number }>();
    for (const r of receipts) {
      const cur = r.currency || 'UNKNOWN';
      const entry = map.get(cur) || { originalTotal: 0, cadTotal: 0, count: 0 };
      entry.originalTotal += r.total_amount ?? 0;
      entry.cadTotal += r.cad_equivalent ?? r.total_amount ?? 0;
      entry.count += 1;
      map.set(cur, entry);
    }
    return map;
  }, [receipts]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, ease: 'easeOut' }}
      className="space-y-5"
    >
      <PageHeader
        title="Multi-Currency"
        subtitle="Track and manage non-CAD receipts"
      />

      {isLoading && (
        <div className="flex justify-center p-8">
          <Loader2 className="h-8 w-8 animate-spin text-champagne" />
        </div>
      )}

      {error && (
        <div className="rounded-[2rem] bg-danger/10 p-4 text-sm text-danger">
          <AlertCircle className="inline h-4 w-4 mr-2" />
          {error.message}
        </div>
      )}

      {!isLoading && !error && receipts.length === 0 && (
        <div className="flex flex-col items-center gap-3 rounded-3xl border border-dashed border-glass-border bg-surface/30 py-16 text-center">
          <Globe className="h-10 w-10 text-text-muted/50" />
          <p className="text-sm text-text-muted">No non-CAD receipts found.</p>
          <p className="text-xs text-text-muted/70">
            Receipts entered in other currencies will appear here with their exchange rates and CAD equivalents.
          </p>
        </div>
      )}

      {byCurrency.size > 0 && (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from(byCurrency.entries()).map(([currency, info]) => (
            <div
              key={currency}
              className="rounded-2xl border border-glass-border bg-card p-4 shadow-sm transition-all hover:shadow-md"
            >
              <div className="flex items-center gap-2 mb-2">
                <span className="text-lg font-bold text-text-primary">{currency}</span>
                <span className="rounded-full bg-champagne/10 px-2 py-0.5 text-[10px] font-semibold text-champagne">
                  {info.count} receipt{info.count !== 1 ? 's' : ''}
                </span>
              </div>
              <p className="text-xs text-text-muted">Original total</p>
              <p className="text-xl font-semibold tracking-tight tabular-nums text-text-primary">
                {formatCurrency(info.originalTotal, currency)}
              </p>
              <p className="mt-1 text-xs text-text-muted">CAD equivalent</p>
              <p className="text-lg font-semibold tracking-tight tabular-nums text-text-primary">
                {formatCurrency(info.cadTotal, 'CAD')}
              </p>
            </div>
          ))}
        </div>
      )}

      {receipts.length > 0 && (
        <div className="overflow-x-auto rounded-2xl border border-glass-border bg-card shadow-sm">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-glass-border bg-surface-raised">
                <th className="px-4 py-3 text-left text-xs font-semibold text-text-muted uppercase tracking-tight">Currency</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-text-muted uppercase tracking-tight">Vendor</th>
                <th className="px-4 py-3 text-right text-xs font-semibold text-text-muted uppercase tracking-tight">Original</th>
                <th className="px-4 py-3 text-right text-xs font-semibold text-text-muted uppercase tracking-tight">Exchange Rate</th>
                <th className="px-4 py-3 text-right text-xs font-semibold text-text-muted uppercase tracking-tight">CAD Equivalent</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-text-muted uppercase tracking-tight">Date</th>
              </tr>
            </thead>
            <tbody>
              {receipts.map((r, i) => (
                <tr
                  key={r.id}
                  className={cn(
                    'border-b border-glass-border transition-colors hover:bg-champagne/5',
                    i % 2 === 0 ? 'bg-surface' : 'bg-surface-raised/50'
                  )}
                >
                  <td className="px-4 py-3 font-semibold text-text-primary">{r.currency}</td>
                  <td className="px-4 py-3 text-text-secondary">{r.vendor_name || 'Unknown'}</td>
                  <td className="px-4 py-3 text-right tabular-nums font-semibold text-text-primary">
                    {formatCurrency(r.total_amount ?? 0, r.currency)}
                  </td>
                  <td className="px-4 py-3 text-right tabular-nums text-text-secondary">
                    {r.exchange_rate != null ? r.exchange_rate.toFixed(4) : '—'}
                  </td>
                  <td className="px-4 py-3 text-right tabular-nums font-semibold text-text-primary">
                    {formatCurrency(r.cad_equivalent ?? r.total_amount ?? 0, 'CAD')}
                  </td>
                  <td className="px-4 py-3 text-text-muted text-xs">
                    {r.transaction_date || '—'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </motion.div>
  );
}
