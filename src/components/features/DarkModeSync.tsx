'use client';

import { useState, useCallback } from 'react';
import { useQuery } from '@tanstack/react-query';
import { AlertCircle, Loader2, RefreshCw, Clock } from 'lucide-react';
import { motion } from 'framer-motion';
import { toast } from 'sonner';
import PageHeader from '@/components/layout/PageHeader';
import { supabase, getOrgIdString } from '@/lib/supabase';
import { formatCurrency } from '@/lib/ui-utils';
import { cn } from '@/lib/utils';
import type { ReceiptRow } from '@/lib/types';

const SYNC_KEY = 'dark-mode-sync-timestamp';

function loadSyncTimestamp(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem(SYNC_KEY);
}

function saveSyncTimestamp(): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem(SYNC_KEY, new Date().toISOString());
}

function formatTimestamp(iso: string | null): string {
  if (!iso) return 'Never';
  const d = new Date(iso);
  return d.toLocaleDateString('en-CA', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

async function fetchReceipts(
  orgId: string,
  range: '7d' | 'all'
): Promise<ReceiptRow[]> {
  let query = supabase
    .from('receipts')
    .select('*')
    .eq('org_id', orgId)
    .eq('is_deleted', false)
    .order('transaction_date', { ascending: false });

  if (range === '7d') {
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    const cutoff = sevenDaysAgo.toISOString().split('T')[0];
    query = query.gte('transaction_date', cutoff);
  }

  const { data, error } = await query;
  if (error) throw new Error('Failed to load receipts');
  return (data || []) as ReceiptRow[];
}

export default function DarkModeSync() {
  const [range, setRange] = useState<'7d' | 'all'>('7d');
  const [lastSync, setLastSync] = useState<string | null>(() => loadSyncTimestamp());

  const { data: orgId } = useQuery({
    queryKey: ['dmsync-org'],
    queryFn: async () => {
      const id = await getOrgIdString();
      if (!id) throw new Error('No organization found');
      return id;
    },
    staleTime: Infinity,
  });

  const { data: receipts = [], isLoading, error, refetch } = useQuery({
    queryKey: ['dmsync-receipts', orgId, range],
    queryFn: () => fetchReceipts(orgId!, range),
    enabled: !!orgId,
    staleTime: 0,
  });

  const total = receipts.reduce((s, r) => s + r.total_amount, 0);

  const handleSync = useCallback(async () => {
    saveSyncTimestamp();
    setLastSync(loadSyncTimestamp());
    await refetch();
    toast.success('Data synced successfully');
  }, [refetch]);

  return (
    <div className="space-y-5 fade-in">
      <PageHeader
        title="Receipt Overview"
        subtitle="Quick summary of your recent receipt activity"
      />

      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={() => setRange('7d')}
          className={cn(
            'rounded-full border px-4 py-1.5 text-xs font-semibold transition-colors',
            range === '7d'
              ? 'bg-champagne/15 text-champagne border-champagne/30'
              : 'bg-surface text-text-muted border-glass-border hover:bg-surface-hover'
          )}
        >
          Last 7 Days
        </button>
        <button
          type="button"
          onClick={() => setRange('all')}
          className={cn(
            'rounded-full border px-4 py-1.5 text-xs font-semibold transition-colors',
            range === 'all'
              ? 'bg-champagne/15 text-champagne border-champagne/30'
              : 'bg-surface text-text-muted border-glass-border hover:bg-surface-hover'
          )}
        >
          All Time
        </button>
      </div>

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
          <Clock className="h-10 w-10 text-text-muted/50" />
          <p className="text-sm text-text-muted">No receipts in this period.</p>
          <p className="text-xs text-text-muted/70">
            Upload receipts to see your data here.
          </p>
        </div>
      )}

      {!isLoading && !error && receipts.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          className="grid gap-4 sm:grid-cols-2"
        >
          <div className="rounded-2xl border border-glass-border bg-card p-5 shadow-sm">
            <p className="text-xs text-text-muted">Receipt Count</p>
            <p className="mt-1 text-3xl font-semibold tabular-nums text-text-primary">
              {receipts.length}
            </p>
          </div>
          <div className="rounded-2xl border border-glass-border bg-card p-5 shadow-sm">
            <p className="text-xs text-text-muted">Total ({range === '7d' ? '7 days' : 'All time'})</p>
            <p className="mt-1 text-3xl font-semibold tabular-nums text-text-primary">
              {formatCurrency(total)}
            </p>
          </div>
        </motion.div>
      )}

      <div className="flex items-center justify-between rounded-2xl border border-glass-border bg-card p-4 shadow-sm">
        <div className="flex items-center gap-2 text-sm text-text-muted">
          <Clock className="h-4 w-4" />
          Last synced: {formatTimestamp(lastSync)}
        </div>
        <button
          type="button"
          onClick={handleSync}
          disabled={isLoading}
          className="inline-flex items-center gap-2 rounded-xl bg-champagne px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-champagne-dim disabled:opacity-50"
        >
          <RefreshCw className={cn('h-4 w-4', isLoading && 'animate-spin')} />
          Sync Now
        </button>
      </div>
    </div>
  );
}
