'use client';

import { motion } from 'framer-motion';
import { fadeUp } from '@/lib/animations';
import { useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { AlertCircle, ChevronRight, Loader2 } from 'lucide-react';
import dynamic from 'next/dynamic';
import { Badge } from '@/components/ui/badge';
import PageHeader from '@/components/layout/PageHeader';
import { supabase, getOrgIdString } from '@/lib/supabase';
import { formatCurrency, formatDate, categoryColor } from '@/lib/ui-utils';
import { cn } from '@/lib/utils';
import type { ReceiptRow } from '@/lib/types';

const ReceiptDetailDrawer = dynamic(
  () => import('@/components/history/ReceiptDetailDrawer'),
  { loading: () => <div className="flex justify-center p-8"><Loader2 className="h-6 w-6 animate-spin text-champagne" /></div> }
);

interface WeekGroup {
  label: string;
  start: string;
  receipts: ReceiptRow[];
  total: number;
}

function groupByWeek(receipts: ReceiptRow[]): WeekGroup[] {
  const groups = new Map<string, ReceiptRow[]>();
  receipts.forEach((r: ReceiptRow) => {
    const d = new Date(r.transaction_date);
    const startOfWeek = new Date(d);
    startOfWeek.setDate(d.getDate() - d.getDay());
    const key = startOfWeek.toISOString().slice(0, 10);
    const existing = groups.get(key) || [];
    existing.push(r);
    groups.set(key, existing);
  });

  return Array.from(groups.entries())
    .map(([start, rs]) => {
      const end = new Date(start);
      end.setDate(end.getDate() + 6);
      const endStr = end.toISOString().slice(0, 10);
      const label = `${formatDate(start)} – ${formatDate(endStr)}`;
      const total = rs.reduce((sum, r) => sum + (r.total_amount || 0), 0);
      return { label, start, receipts: rs, total };
    })
    .sort((a, b) => b.start.localeCompare(a.start));
}

export default function ReceiptTimeline() {
  const [selectedReceipt, setSelectedReceipt] = useState<ReceiptRow | null>(null);

  const { data: orgId } = useQuery({
    queryKey: ['timeline-org-id'],
    queryFn: () => getOrgIdString(),
    staleTime: Infinity,
  });

  const { data: receipts = [], isLoading, error } = useQuery({
    queryKey: ['timeline-receipts', orgId],
    queryFn: async (): Promise<ReceiptRow[]> => {
      if (!orgId) return [];
      const { data, error: err } = await supabase
        .from('receipts')
        .select('*')
        .eq('org_id', orgId)
        .eq('is_deleted', false)
        .order('transaction_date', { ascending: false });
      if (err) throw new Error('Failed to load receipts');
      return (data || []) as ReceiptRow[];
    },
    enabled: !!orgId,
    staleTime: 60 * 1000,
  });

  const weeks = useMemo(() => groupByWeek(receipts), [receipts]);

  return (
    <motion.div
      variants={fadeUp}
      initial="hidden"
      animate="show"
      className="space-y-5"
    >
      <PageHeader title="Receipt Timeline" subtitle="Browse receipts grouped by week" />

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

      {!isLoading && !error && weeks.length === 0 && (
        <div className="flex flex-col items-center gap-3 rounded-3xl border border-dashed border-glass-border bg-surface/30 py-16 text-center">
          <p className="text-sm text-text-muted">No receipts found.</p>
        </div>
      )}

      {!isLoading && !error && weeks.length > 0 && (
        <div className="overflow-x-auto pb-4 -mx-1">
          <div className="flex gap-4 px-1 min-w-max">
            {weeks.map((week) => (
              <div
                key={week.start}
                className="w-72 flex-shrink-0 rounded-2xl border border-glass-border bg-card p-4 shadow-sm"
              >
                <div className="mb-3">
                  <p className="text-xs font-semibold text-text-muted uppercase tracking-wider">
                    {week.label}
                  </p>
                  <p className="mt-0.5 text-lg font-bold tabular-nums text-text-primary">
                    {formatCurrency(week.total)}
                  </p>
                  <p className="text-[11px] text-text-muted">
                    {week.receipts.length} receipt{week.receipts.length !== 1 ? 's' : ''}
                  </p>
                </div>
                <div className="space-y-2">
                  {week.receipts.map((r) => (
                    <button
                      key={r.id}
                      type="button"
                      onClick={() => setSelectedReceipt(r)}
                      className="w-full rounded-xl border border-glass-border bg-surface p-3 text-left transition-colors hover:bg-surface-raised"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-sm font-semibold text-text-primary">
                            {r.vendor_name || 'Unknown'}
                          </p>
                          <p className="mt-0.5 text-[11px] text-text-muted">
                            {formatDate(r.transaction_date)}
                          </p>
                        </div>
                        <span className="shrink-0 text-sm font-semibold tabular-nums text-text-primary">
                          {formatCurrency(r.total_amount, r.currency)}
                        </span>
                      </div>
                      <div className="mt-2 flex items-center gap-2">
                        {r.category && (
                          <Badge variant="outline" className={cn('rounded-full px-2 py-0.5 text-[10px] font-semibold', categoryColor(r.category))}>
                            {r.category}
                          </Badge>
                        )}
                        <ChevronRight className="ml-auto h-3.5 w-3.5 text-text-muted" />
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {selectedReceipt && (
        <div className="fixed inset-0 z-50 flex justify-end">
          <div className="absolute inset-0 bg-black/40" onClick={() => setSelectedReceipt(null)} />
          <div className="relative w-full max-w-lg bg-card shadow-2xl overflow-y-auto">
            <ReceiptDetailDrawer
              receipt={selectedReceipt}
              onClose={() => setSelectedReceipt(null)}
            />
          </div>
        </div>
      )}
    </motion.div>
  );
}
