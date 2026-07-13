'use client';

import { useQuery } from '@tanstack/react-query';
import { AlertCircle, Loader2, Receipt, FileWarning } from 'lucide-react';
import { motion } from 'framer-motion';
import PageHeader from '@/components/layout/PageHeader';
import { supabase, getOrgIdString } from '@/lib/supabase';
import { formatDineroIntl } from '@/lib/finance-utils';
import type { ReceiptRow } from '@/lib/types';

async function fetchYearReceipts(orgId: string): Promise<ReceiptRow[]> {
  const year = new Date().getFullYear();
  const startDate = `${year}-01-01`;
  const { data, error } = await supabase
    .from('receipts')
    .select('*')
    .eq('org_id', orgId)
    .eq('is_deleted', false)
    .gte('transaction_date', startDate)
    .order('transaction_date', { ascending: false });
  if (error) throw new Error('Failed to load tax data');
  return (data || []) as ReceiptRow[];
}

const container = {
  hidden: { opacity: 0 },
  show: { transition: { staggerChildren: 0.05 } },
};

const fadeUp = {
  hidden: { opacity: 0, y: 12 },
  show: { opacity: 1, y: 0, transition: { duration: 0.3 } },
};

export default function TaxDashboard() {
  const { data: orgId } = useQuery({
    queryKey: ['tax-dashboard-org'],
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
    queryKey: ['tax-dashboard-receipts', orgId],
    queryFn: () => fetchYearReceipts(orgId!),
    enabled: !!orgId,
    staleTime: 5 * 60 * 1000,
  });

  const totals = receipts.reduce(
    (acc, r) => {
      const cadTotal = r.cad_equivalent ?? r.total_amount ?? 0;
      const gst = r.tax_amount ?? 0;
      const pst = r.pst_amount ?? 0;
      return {
        totalSpend: acc.totalSpend + cadTotal,
        totalGst: acc.totalGst + gst,
        totalPst: acc.totalPst + pst,
        count: acc.count + 1,
        missingBn: acc.missingBn + (r.business_number ? 0 : 1),
      };
    },
    { totalSpend: 0, totalGst: 0, totalPst: 0, count: 0, missingBn: 0 }
  );

  const quarterlyEstimate = totals.totalSpend / 4;

  const year = new Date().getFullYear();

  return (
    <div className="space-y-5 fade-in">
      <PageHeader
        title="Tax Dashboard"
        subtitle={`Year-to-date summary for ${year}`}
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
          <Receipt className="h-10 w-10 text-text-muted/50" />
          <p className="text-sm text-text-muted">No receipts found for {year}.</p>
        </div>
      )}

      {totals.missingBn > 0 && (
        <div className="rounded-[2rem] bg-danger/10 p-4 text-sm text-danger border border-danger/20">
          <FileWarning className="inline h-4 w-4 mr-2" />
          {totals.missingBn} receipt{totals.missingBn !== 1 ? 's' : ''} missing a Business Number.
          Add BN to improve CRA compliance.
        </div>
      )}

      {!isLoading && !error && receipts.length > 0 && (
        <motion.div
          variants={container}
          initial="hidden"
          animate="show"
          className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4"
        >
          <motion.div
            variants={fadeUp}
            className="rounded-2xl border border-glass-border bg-card p-5 shadow-sm transition-all hover:shadow-md"
          >
            <p className="text-xs font-semibold text-text-muted uppercase tracking-tight">YTD Total Spend</p>
            <p className="mt-1 text-4xl font-semibold tracking-tight tabular-nums text-text-primary">
              {formatDineroIntl(totals.totalSpend)}
            </p>
          </motion.div>

          <motion.div
            variants={fadeUp}
            className="rounded-2xl border border-glass-border bg-card p-5 shadow-sm transition-all hover:shadow-md"
          >
            <p className="text-xs font-semibold text-text-muted uppercase tracking-tight">YTD GST Recoverable</p>
            <p className="mt-1 text-4xl font-semibold tracking-tight tabular-nums text-text-primary">
              {formatDineroIntl(totals.totalGst)}
            </p>
          </motion.div>

          <motion.div
            variants={fadeUp}
            className="rounded-2xl border border-glass-border bg-card p-5 shadow-sm transition-all hover:shadow-md"
          >
            <p className="text-xs font-semibold text-text-muted uppercase tracking-tight">YTD PST</p>
            <p className="mt-1 text-4xl font-semibold tracking-tight tabular-nums text-text-primary">
              {formatDineroIntl(totals.totalPst)}
            </p>
          </motion.div>

          <motion.div
            variants={fadeUp}
            className="rounded-2xl border border-glass-border bg-card p-5 shadow-sm transition-all hover:shadow-md"
          >
            <p className="text-xs font-semibold text-text-muted uppercase tracking-tight">Receipts</p>
            <p className="mt-1 text-4xl font-semibold tracking-tight tabular-nums text-text-primary">
              {totals.count}
            </p>
          </motion.div>

          <motion.div
            variants={fadeUp}
            className="rounded-2xl border border-glass-border bg-card p-5 shadow-sm transition-all hover:shadow-md"
          >
            <p className="text-xs font-semibold text-text-muted uppercase tracking-tight">Quarterly Estimate</p>
            <p className="mt-1 text-4xl font-semibold tracking-tight tabular-nums text-text-primary">
              {formatDineroIntl(quarterlyEstimate)}
            </p>
            <p className="mt-0.5 text-[10px] text-text-muted">Per quarter ({formatDineroIntl(totals.totalSpend)} / 4)</p>
          </motion.div>
        </motion.div>
      )}
    </div>
  );
}
