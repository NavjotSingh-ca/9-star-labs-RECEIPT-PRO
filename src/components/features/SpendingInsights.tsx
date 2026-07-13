'use client';

import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { AlertCircle, Loader2, TrendingUp, TrendingDown, DollarSign, Calendar, Store } from 'lucide-react';
import { motion } from 'framer-motion';
import PageHeader from '@/components/layout/PageHeader';
import { supabase, getOrgIdString } from '@/lib/supabase';
import { formatCurrency } from '@/lib/ui-utils';
import type { ReceiptRow } from '@/lib/types';

interface Insight {
  icon: typeof DollarSign;
  title: string;
  body: string;
  color: string;
}

async function fetchReceipts(orgId: string): Promise<ReceiptRow[]> {
  const { data, error } = await supabase
    .from('receipts')
    .select('*')
    .eq('org_id', orgId)
    .eq('is_deleted', false)
    .order('transaction_date', { ascending: false });
  if (error) throw new Error('Failed to load receipts');
  return (data || []) as ReceiptRow[];
}

function getDayName(dateStr: string): string {
  const [y, m, d] = dateStr.split('-').map(Number);
  return new Date(y, m - 1, d).toLocaleDateString('en-CA', { weekday: 'long' });
}

function computeInsights(receipts: ReceiptRow[]): Insight[] {
  if (receipts.length === 0) return [];

  const insights: Insight[] = [];

  // Top categories
  const catMap = new Map<string, number>();
  for (const r of receipts) {
    const cat = r.category || 'Uncategorized';
    catMap.set(cat, (catMap.get(cat) || 0) + r.total_amount);
  }
  const sortedCats = [...catMap.entries()].sort((a, b) => b[1] - a[1]);
  const totalSpend = receipts.reduce((s, r) => s + r.total_amount, 0);
  if (sortedCats.length >= 2) {
    const top2Total = sortedCats[0][1] + sortedCats[1][1];
    const pct = totalSpend > 0 ? Math.round((top2Total / totalSpend) * 100) : 0;
    insights.push({
      icon: DollarSign,
      title: 'Top Categories Dominance',
      body: `${sortedCats[0][0]} and ${sortedCats[1][0]} make up ${pct}% of total spending.`,
      color: 'text-champagne',
    });
  }

  // Busiest day of week
  const dayCount = new Map<string, number>();
  for (const r of receipts) {
    if (r.transaction_date) {
      const day = getDayName(r.transaction_date);
      dayCount.set(day, (dayCount.get(day) || 0) + 1);
    }
  }
  const busiestDay = [...dayCount.entries()].sort((a, b) => b[1] - a[1])[0];
  if (busiestDay) {
    insights.push({
      icon: Calendar,
      title: 'Busiest Spending Day',
      body: `${busiestDay[0]} sees the most transactions (${busiestDay[1]} receipt${busiestDay[1] !== 1 ? 's' : ''}).`,
      color: 'text-info',
    });
  }

  // Average transaction value trend
  const now = new Date();
  const thirtyDaysAgo = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 30);
  const sixtyDaysAgo = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 60);

  const recent = receipts.filter((r) => {
    if (!r.transaction_date) return false;
    const [y, m, d] = r.transaction_date.split('-').map(Number);
    const date = new Date(y, m - 1, d);
    return date >= thirtyDaysAgo && date <= now;
  });
  const previous = receipts.filter((r) => {
    if (!r.transaction_date) return false;
    const [y, m, d] = r.transaction_date.split('-').map(Number);
    const date = new Date(y, m - 1, d);
    return date >= sixtyDaysAgo && date < thirtyDaysAgo;
  });

  const avgRecent = recent.length > 0 ? recent.reduce((s, r) => s + r.total_amount, 0) / recent.length : 0;
  const avgPrev = previous.length > 0 ? previous.reduce((s, r) => s + r.total_amount, 0) / previous.length : 0;
  const direction = avgRecent >= avgPrev ? 'up' : 'down';

  insights.push({
    icon: direction === 'up' ? TrendingUp : TrendingDown,
    title: 'Average Transaction Value',
    body: direction === 'up'
      ? `Average spend is up to ${formatCurrency(avgRecent)} (was ${formatCurrency(avgPrev)}) over the last 30 days.`
      : `Average spend is down to ${formatCurrency(avgRecent)} (was ${formatCurrency(avgPrev)}) over the last 30 days.`,
    color: direction === 'up' ? 'text-danger' : 'text-emerald-success',
  });

  // Most frequent vendor
  const vendorCount = new Map<string, number>();
  for (const r of receipts) {
    const v = r.vendor_name || 'Unknown';
    vendorCount.set(v, (vendorCount.get(v) || 0) + 1);
  }
  const topVendor = [...vendorCount.entries()].sort((a, b) => b[1] - a[1])[0];
  if (topVendor) {
    insights.push({
      icon: Store,
      title: 'Most Frequent Vendor',
      body: `${topVendor[0]} appears ${topVendor[1]} time${topVendor[1] !== 1 ? 's' : ''} — more than any other vendor.`,
      color: 'text-warning',
    });
  }

  return insights;
}

export default function SpendingInsights() {
  const { data: orgId } = useQuery({
    queryKey: ['insights-org'],
    queryFn: async () => {
      const id = await getOrgIdString();
      if (!id) throw new Error('No organization found');
      return id;
    },
    staleTime: Infinity,
  });

  const { data: receipts = [], isLoading, error } = useQuery({
    queryKey: ['insights-receipts', orgId],
    queryFn: () => fetchReceipts(orgId!),
    enabled: !!orgId,
    staleTime: 5 * 60 * 1000,
  });

  const insights = useMemo(() => computeInsights(receipts), [receipts]);

  return (
    <div className="space-y-5 fade-in">
      <PageHeader
        title="Spending Insights"
        subtitle="Key observations from your receipt data"
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
          <DollarSign className="h-10 w-10 text-text-muted/50" />
          <p className="text-sm text-text-muted">No receipts yet.</p>
          <p className="text-xs text-text-muted/70">Add receipts to see spending insights.</p>
        </div>
      )}

      {!isLoading && !error && insights.length > 0 && (
        <div className="grid gap-4 sm:grid-cols-2">
          {insights.map((insight, i) => (
            <motion.div
              key={insight.title}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.1, duration: 0.3 }}
              className="flex gap-4 rounded-2xl border border-glass-border bg-card p-5 shadow-sm"
            >
              <div className={`mt-0.5 ${insight.color}`}>
                <insight.icon className="h-6 w-6" />
              </div>
              <div className="min-w-0 flex-1">
                <h3 className="text-sm font-semibold text-text-primary">{insight.title}</h3>
                <p className="mt-1 text-sm text-text-secondary leading-relaxed">{insight.body}</p>
              </div>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}
