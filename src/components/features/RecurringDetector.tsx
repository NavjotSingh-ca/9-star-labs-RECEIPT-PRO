'use client';

import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { AlertCircle, Loader2, RefreshCw } from 'lucide-react';
import { motion } from 'framer-motion';
import PageHeader from '@/components/layout/PageHeader';
import { Badge } from '@/components/ui/badge';
import { supabase, getOrgIdString } from '@/lib/supabase';
import { formatCurrency } from '@/lib/ui-utils';
import type { ReceiptRow } from '@/lib/types';

interface RecurringVendor {
  vendor_name: string;
  occurrences: ReceiptRow[];
  count: number;
  totalAmount: number;
  avgAmount: number;
  estimatedMonthly: number;
  frequency: 'monthly' | 'weekly' | 'irregular';
  monthsActive: number;
}

const AMOUNT_TOLERANCE = 5;

function detectFrequency(dates: string[]): RecurringVendor['frequency'] {
  if (dates.length < 2) return 'irregular';
  const sorted = [...dates].sort();
  const gaps: number[] = [];
  for (let i = 1; i < sorted.length; i++) {
    const d1 = new Date(sorted[i - 1]);
    const d2 = new Date(sorted[i]);
    const days = (d2.getTime() - d1.getTime()) / (1000 * 60 * 60 * 24);
    if (days > 0) gaps.push(days);
  }
  if (gaps.length === 0) return 'irregular';
  const avgGap = gaps.reduce((a, b) => a + b, 0) / gaps.length;
  if (avgGap >= 20 && avgGap <= 40) return 'monthly';
  if (avgGap >= 5 && avgGap <= 10) return 'weekly';
  return 'irregular';
}

function analyzeVendors(receipts: ReceiptRow[]): RecurringVendor[] {
  const byVendor = new Map<string, ReceiptRow[]>();
  for (const r of receipts) {
    const name = r.vendor_name?.trim();
    if (!name) continue;
    const list = byVendor.get(name) || [];
    list.push(r);
    byVendor.set(name, list);
  }

  const results: RecurringVendor[] = [];

  for (const [vendor_name, occurrences] of byVendor) {
    if (occurrences.length < 3) continue;

    const amounts = occurrences.map((r) => r.total_amount);
    const minAmount = Math.min(...amounts);
    const maxAmount = Math.max(...amounts);

    if (maxAmount - minAmount > AMOUNT_TOLERANCE) continue;

    const totalAmount = amounts.reduce((a, b) => a + b, 0);
    const avgAmount = totalAmount / occurrences.length;
    const dates = occurrences.map((r) => r.transaction_date).filter(Boolean);
    const frequency = detectFrequency(dates);
    const uniqueMonths = new Set(dates.map((d) => d.slice(0, 7)));
    const monthsActive = uniqueMonths.size;

    let estimatedMonthly = avgAmount;
    if (frequency === 'weekly') {
      estimatedMonthly = avgAmount * 4.33;
    } else if (frequency === 'irregular' && monthsActive > 0) {
      estimatedMonthly = totalAmount / monthsActive;
    }

    results.push({
      vendor_name,
      occurrences,
      count: occurrences.length,
      totalAmount,
      avgAmount: Math.round(avgAmount * 100) / 100,
      estimatedMonthly: Math.round(estimatedMonthly * 100) / 100,
      frequency,
      monthsActive,
    });
  }

  return results.sort((a, b) => b.estimatedMonthly - a.estimatedMonthly);
}

async function fetchAllReceipts(orgId: string): Promise<ReceiptRow[]> {
  const { data, error } = await supabase
    .from('receipts')
    .select('*')
    .eq('org_id', orgId)
    .eq('is_deleted', false)
    .order('transaction_date', { ascending: false });
  if (error) throw new Error('Failed to load receipts');
  return (data || []) as ReceiptRow[];
}

export default function RecurringDetector() {
  const { data: orgId } = useQuery({
    queryKey: ['recurring-org'],
    queryFn: async () => {
      const id = await getOrgIdString();
      if (!id) throw new Error('No organization found');
      return id;
    },
    staleTime: Infinity,
  });

  const { data: receipts = [], isLoading, error } = useQuery({
    queryKey: ['recurring-receipts', orgId],
    queryFn: () => fetchAllReceipts(orgId!),
    enabled: !!orgId,
    staleTime: 5 * 60 * 1000,
  });

  const recurring = useMemo(() => analyzeVendors(receipts), [receipts]);

  return (
    <div className="space-y-5 fade-in">
      <PageHeader
        title="Recurring Detector"
        subtitle="Auto-detect recurring expenses from your receipt history"
      />

      {isLoading && (
        <div className="flex justify-center p-8">
          <Loader2 className="h-8 w-8 animate-spin text-champagne" />
        </div>
      )}

      {error && (
        <div className="rounded-[2rem] bg-danger/10 p-4 text-sm text-danger border border-danger/20">
          <AlertCircle className="inline h-4 w-4 mr-2" />
          {error.message}
        </div>
      )}

      {!isLoading && !error && receipts.length === 0 && (
        <div className="flex flex-col items-center gap-3 rounded-3xl border border-dashed border-glass-border bg-surface/30 py-16 text-center">
          <RefreshCw className="h-10 w-10 text-text-muted/50" />
          <p className="text-sm text-text-muted">Not enough data yet.</p>
          <p className="text-xs text-text-muted/70">
            Upload at least 3 receipts from the same vendor within a similar price range to detect recurring expenses.
          </p>
        </div>
      )}

      {!isLoading && !error && receipts.length > 0 && recurring.length === 0 && (
        <div className="flex flex-col items-center gap-3 rounded-3xl border border-dashed border-glass-border bg-surface/30 py-16 text-center">
          <RefreshCw className="h-10 w-10 text-text-muted/50" />
          <p className="text-sm text-text-muted">No recurring patterns detected.</p>
          <p className="text-xs text-text-muted/70">
            Analyzed {receipts.length} receipt{receipts.length !== 1 ? 's' : ''}. No vendor
            has 3+ transactions within the {formatCurrency(AMOUNT_TOLERANCE)} amount tolerance.
          </p>
        </div>
      )}

      {recurring.length > 0 && (
        <>
          <p className="text-xs text-text-muted px-1">
            Found {recurring.length} recurring vendor{recurring.length !== 1 ? 's' : ''} from{' '}
            {receipts.length} receipt{receipts.length !== 1 ? 's' : ''}
          </p>

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {recurring.map((vendor, i) => (
              <motion.div
                key={vendor.vendor_name}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.04, duration: 0.2 }}
                className="relative rounded-2xl border border-glass-border bg-card p-5 shadow-sm transition-all hover:shadow-md"
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="min-w-0 flex-1">
                    <h3 className="text-base font-bold tracking-tight text-text-primary truncate">
                      {vendor.vendor_name}
                    </h3>
                    <p className="text-xs text-text-muted mt-0.5">
                      {vendor.count} transaction{vendor.count !== 1 ? 's' : ''}
                      {vendor.monthsActive > 1 && ` over ${vendor.monthsActive} months`}
                    </p>
                  </div>
                  <Badge
                    variant="outline"
                    className="ml-3 shrink-0 rounded-full bg-champagne/10 text-champagne border-champagne/20 text-[10px] font-semibold"
                  >
                    Potential Recurring
                  </Badge>
                </div>

                <p className="text-sm text-text-secondary">
                  You&apos;ve spent{' '}
                  <span className="font-semibold text-text-primary tabular-nums">
                    {formatCurrency(vendor.totalAmount)}
                  </span>{' '}
                  at {vendor.vendor_name} over {vendor.count} transaction
                  {vendor.count !== 1 ? 's' : ''}.
                </p>

                <div className="mt-4 grid grid-cols-2 gap-3 rounded-xl bg-surface p-3">
                  <div>
                    <p className="text-[10px] font-semibold text-text-muted uppercase tracking-tight">
                      Est. Monthly
                    </p>
                    <p className="text-base font-semibold tracking-tight tabular-nums text-text-primary">
                      {formatCurrency(vendor.estimatedMonthly)}
                    </p>
                  </div>
                  <div>
                    <p className="text-[10px] font-semibold text-text-muted uppercase tracking-tight">
                      Frequency
                    </p>
                    <p className="text-base font-semibold tracking-tight text-text-primary capitalize">
                      {vendor.frequency}
                    </p>
                  </div>
                </div>

                <div className="mt-3 flex flex-wrap gap-1">
                  {vendor.occurrences.slice(0, 5).map((r) => (
                    <span
                      key={r.id}
                      className="rounded-md bg-surface-raised px-2 py-0.5 text-[10px] tabular-nums text-text-muted border border-glass-border"
                    >
                      {formatCurrency(r.total_amount, r.currency)}
                    </span>
                  ))}
                  {vendor.occurrences.length > 5 && (
                    <span className="text-[10px] text-text-muted self-center ml-1">
                      +{vendor.occurrences.length - 5} more
                    </span>
                  )}
                </div>
              </motion.div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
