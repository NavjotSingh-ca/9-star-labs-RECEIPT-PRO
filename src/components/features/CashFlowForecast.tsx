'use client';

import { motion } from 'framer-motion';
import { fadeUp } from '@/lib/animations';
import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { AlertCircle, Loader2, TrendingUp } from 'lucide-react';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
} from 'recharts';
import PageHeader from '@/components/layout/PageHeader';
import { supabase, getOrgIdString } from '@/lib/supabase';
import { formatCurrency } from '@/lib/ui-utils';
import type { ReceiptRow } from '@/lib/types';

function formatDateStr(d: Date): string {
  return d.toISOString().slice(0, 10);
}

function addDays(d: Date, days: number): Date {
  const r = new Date(d);
  r.setDate(r.getDate() + days);
  return r;
}

function parseDate(s: string): Date {
  const [y, m, day] = s.split('-').map(Number);
  return new Date(y, m - 1, day);
}

function formatXAxis(val: string): string {
  const d = parseDate(val);
  return d.toLocaleDateString('en-CA', { month: 'short', day: 'numeric' });
}

function CashFlowTooltip({ active, payload, label }: { active?: boolean; payload?: Array<{ value: number; dataKey: string }>; label?: string }) {
  if (!active || !payload || !label) return null;
  return (
    <div className="rounded-xl border border-glass-border bg-card px-3 py-2 shadow-md text-xs">
      <p className="font-semibold text-text-primary mb-1">{formatXAxis(label)}</p>
      {payload.map((entry, i) => (
        <p key={i} className="tabular-nums text-text-secondary">
          {entry.dataKey === 'actual' ? 'Actual: ' : 'Forecast: '}
          {formatCurrency(entry.value)}
        </p>
      ))}
    </div>
  );
}

async function fetchReceipts90(orgId: string): Promise<ReceiptRow[]> {
  const cutoff = addDays(new Date(), -90).toISOString().slice(0, 10);
  const { data, error } = await supabase
    .from('receipts')
    .select('transaction_date, total_amount, cad_equivalent')
    .eq('org_id', orgId)
    .eq('is_deleted', false)
    .gte('transaction_date', cutoff)
    .order('transaction_date', { ascending: true });
  if (error) throw new Error('Failed to load cash flow data');
  return (data || []) as ReceiptRow[];
}

interface ChartPoint {
  date: string;
  actual?: number;
  forecast?: number;
  isForecast: boolean;
}

export default function CashFlowForecast() {
  const { data: orgId } = useQuery({
    queryKey: ['cashflow-org'],
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
    queryKey: ['cashflow-receipts', orgId],
    queryFn: () => fetchReceipts90(orgId!),
    enabled: !!orgId,
    staleTime: 5 * 60 * 1000,
  });

  const chartData = useMemo((): ChartPoint[] => {
    if (receipts.length === 0) return [];

    // Build daily spend map for last 90 days
    const today = new Date();
    const dailySpend = new Map<string, number>();
    for (const r of receipts) {
      const date = r.transaction_date;
      if (!date) continue;
      const amount = r.cad_equivalent ?? r.total_amount ?? 0;
      dailySpend.set(date, (dailySpend.get(date) || 0) + amount);
    }

    // Calculate moving average from last 90 days
    const spendValues = Array.from(dailySpend.values());
    const avgDailySpend =
      spendValues.length > 0
        ? spendValues.reduce((a, b) => a + b, 0) / spendValues.length
        : 0;

    const points: ChartPoint[] = [];

    // Actual: last 30 days
    for (let i = 29; i >= 0; i--) {
      const d = addDays(today, -i);
      const dateStr = formatDateStr(d);
      const actual = dailySpend.get(dateStr) || 0;
      points.push({ date: dateStr, actual, isForecast: false });
    }

    // Forecast: next 60 days
    for (let i = 1; i <= 60; i++) {
      const d = addDays(today, i);
      const dateStr = formatDateStr(d);
      points.push({ date: dateStr, forecast: avgDailySpend, isForecast: true });
    }

    return points;
  }, [receipts]);

  const projectedSpend = useMemo(() => {
    if (chartData.length === 0) return 0;
    return chartData
      .filter((p) => p.isForecast)
      .reduce((sum, p) => sum + (p.forecast || 0), 0);
  }, [chartData]);

  return (
    <motion.div
      variants={fadeUp}
      initial="hidden"
      animate="show"
      className="space-y-5"
    >
      <PageHeader
        title="Cash Flow Forecast"
        subtitle="90-day projected spend based on moving average"
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
          <TrendingUp className="h-10 w-10 text-text-muted/50" />
          <p className="text-sm text-text-muted">No receipt data available for the last 90 days.</p>
        </div>
      )}

      {chartData.length > 0 && (
        <>
          <div className="rounded-2xl border border-glass-border bg-card p-3 sm:p-5 shadow-sm before:absolute before:h-0.5 before:bg-champagne/40 relative overflow-hidden">
            <ResponsiveContainer width="100%" height={320}>
              <AreaChart data={chartData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="actualGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="var(--champagne-light)" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="var(--champagne-light)" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="forecastGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="var(--champagne-dim)" stopOpacity={0.2} />
                    <stop offset="95%" stopColor="var(--champagne-dim)" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--glass-border)" vertical={false} />
                <XAxis
                  dataKey="date"
                  tickFormatter={formatXAxis}
                  tick={{ fontSize: 11, fill: 'var(--text-muted)' }}
                  axisLine={false}
                  tickLine={false}
                  interval="preserveStartEnd"
                />
                <YAxis
                  tickFormatter={(v: number) => `$${v}`}
                  tick={{ fontSize: 11, fill: 'var(--text-muted)' }}
                  axisLine={false}
                  tickLine={false}
                  width={50}
                />
                <Tooltip content={<CashFlowTooltip />} />
                <Area
                  type="monotone"
                  dataKey="actual"
                  stroke="var(--champagne-light)"
                  strokeWidth={2}
                  fill="url(#actualGradient)"
                  dot={false}
                  activeDot={{ r: 4, fill: 'var(--champagne-light)' }}
                />
                <Area
                  type="monotone"
                  dataKey="forecast"
                  stroke="var(--champagne-dim)"
                  strokeWidth={2}
                  strokeDasharray="6 3"
                  fill="url(#forecastGradient)"
                  dot={false}
                  activeDot={{ r: 4, fill: '#8b7355' }}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>

          <div className="rounded-2xl border border-glass-border bg-card p-4 shadow-sm text-center">
            <p className="text-sm text-text-secondary">
              Projected spend:{' '}
              <span className="font-semibold tabular-nums text-text-primary">
                {formatCurrency(projectedSpend)}
              </span>{' '}
              over next 90 days
            </p>
          </div>
        </>
      )}
    </motion.div>
  );
}
