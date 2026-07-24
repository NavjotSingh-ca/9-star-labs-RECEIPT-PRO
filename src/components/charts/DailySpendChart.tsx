'use client';

import {
  Bar,
  BarChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import type { BarShapeProps } from 'recharts';
import { motion } from 'framer-motion';
import { fadeUp } from '@/lib/animations';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { TrendingDown, TrendingUp, Minus } from 'lucide-react';

interface DailySpendChartProps {
  /** Array of daily spend entries sorted by date */
  data: { date: string; amount: number }[];
}

const cad = new Intl.NumberFormat('en-CA', { style: 'currency', currency: 'CAD', maximumFractionDigits: 0 });

function formatDateLabel(dateStr: string): string {
  const d = new Date(dateStr + 'T00:00:00');
  const today = new Date();
  const diff = Math.round((today.getTime() - d.getTime()) / (1000 * 60 * 60 * 24));
  if (diff === 0) return 'Today';
  if (diff === 1) return 'Yesterday';
  return d.toLocaleDateString('en-CA', { weekday: 'short', month: 'short', day: 'numeric' });
}

/**
 * Compute a trend direction + percentage from the data by comparing
 * the first half average to the second half average.
 */
function computeTrend(data: { date: string; amount: number }[]): { direction: 'up' | 'down' | 'flat'; pct: number } {
  if (data.length < 4) return { direction: 'flat', pct: 0 };
  const mid = Math.floor(data.length / 2);
  const firstHalf = data.slice(0, mid);
  const secondHalf = data.slice(mid);
  const avg1 = firstHalf.reduce((s, d) => s + d.amount, 0) / firstHalf.length;
  const avg2 = secondHalf.reduce((s, d) => s + d.amount, 0) / secondHalf.length;
  if (avg1 === 0 && avg2 === 0) return { direction: 'flat', pct: 0 };
  const pct = avg1 === 0 ? 100 : Math.round(((avg2 - avg1) / avg1) * 100);
  if (pct > 5) return { direction: 'up', pct };
  if (pct < -5) return { direction: 'down', pct: Math.abs(pct) };
  return { direction: 'flat', pct: 0 };
}

export function DailySpendChart({ data }: DailySpendChartProps) {
  const todayStr = new Date().toISOString().split('T')[0];
  const hasData = data.length >= 3;
  const trend = computeTrend(data);
  const maxAmount = Math.max(...data.map(d => d.amount), 1);

  if (!hasData) {
    return (
      <Card className="rounded-2xl border border-dashed border-glass-border bg-surface/30 p-6 shadow-sm min-h-[300px] flex flex-col items-center justify-center text-center">
        <TrendingUp className="h-10 w-10 text-text-muted/30 mb-3" />
        <p className="text-sm font-semibold text-text-muted">Daily Spend Trend</p>
        <p className="text-xs text-text-muted mt-1 max-w-[260px]">
          Not enough data yet — scan at least 3 receipts to see your daily spending pattern.
        </p>
      </Card>
    );
  }

  const TrendIcon = trend.direction === 'up' ? TrendingUp : trend.direction === 'down' ? TrendingDown : Minus;
  const trendColor = trend.direction === 'up' ? 'text-champagne' : trend.direction === 'down' ? 'text-emerald-success' : 'text-text-muted';

  return (
    <motion.div
      variants={fadeUp}
      initial="hidden"
      animate="show"
    >
      <Card className="rounded-2xl border border-glass-border bg-surface/50 backdrop-blur-xl shadow-2xl overflow-hidden group relative before:absolute before:inset-x-0 before:top-0 before:h-0.5 before:bg-champagne/40">
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-lg font-bold tracking-tight text-text-primary">Daily Spend</CardTitle>
              <p className="text-xs text-text-muted flex items-center gap-1.5 mt-0.5">
                <TrendIcon className="h-3.5 w-3.5 inline-block" />
                <span className={trendColor}>
                  {trend.direction === 'up' ? 'Up ' : trend.direction === 'down' ? 'Down ' : 'Flat '}
                  {trend.pct > 0 ? `${trend.pct}%` : ''}
                </span>
                <span className="text-text-muted/60">over the last 30 days</span>
              </p>
            </div>
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-champagne/10 text-champagne shadow-inner group-hover:scale-110 transition-transform duration-500">
              <TrendingUp className="h-5 w-5" />
            </div>
          </div>
        </CardHeader>
        <CardContent className="h-[300px] w-full pt-4" role="img" aria-label="Daily spending for the last 30 days">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <XAxis
                dataKey="date"
                tickFormatter={(dateStr: string) => formatDateLabel(dateStr)}
                axisLine={false}
                tickLine={false}
                tick={{ fill: 'var(--text-muted)', fontSize: 9, fontWeight: 600 }}
                interval="preserveStartEnd"
                dy={10}
              />
              <YAxis
                axisLine={false}
                tickLine={false}
                tick={{ fill: 'var(--text-muted)', fontSize: 10, fontWeight: 600 }}
                tickFormatter={(v: number) => `$${v >= 1000 ? `${(v / 1000).toFixed(0)}k` : v.toFixed(0)}`}
                domain={[0, maxAmount * 1.15]}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: 'var(--surface)',
                  borderColor: 'var(--glass-border)',
                  borderRadius: '1rem',
                  fontSize: '12px',
                  fontWeight: 'bold',
                  boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)',
                }}
                labelFormatter={(dateStr) => formatDateLabel(String(dateStr))}
                formatter={(value) => [cad.format(Number(value)), 'Spend']}
                itemStyle={{ color: 'var(--champagne)' }}
              />
              <Bar
                dataKey="amount"
                fill="var(--champagne)"
                radius={[4, 4, 0, 0]}
                animationDuration={320}
                shape={(props: BarShapeProps) => {
                  const payload = props.payload as { date?: string } | undefined;
                  const isToday = String(payload?.date ?? '') === todayStr;
                  return (
                    <rect
                      x={Number(props.x ?? 0)}
                      y={Number(props.y ?? 0)}
                      width={Number(props.width ?? 0)}
                      height={Number(props.height ?? 0)}
                      fill={isToday ? 'var(--emerald-light)' : 'var(--champagne)'}
                      rx={4}
                      ry={4}
                      opacity={isToday ? 1 : 0.35}
                    />
                  );
                }}
              />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
    </motion.div>
  );
}
