'use client';

import {
  Bar,
  BarChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
  CartesianGrid,
} from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Receipt } from 'lucide-react';

interface DailySpendChartProps {
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

export function DailySpendChart({ data }: DailySpendChartProps) {
  const todayStr = new Date().toISOString().split('T')[0];
  const hasData = data.length >= 3;

  if (!hasData) {
    return (
      <Card className="rounded-[3rem] border border-dashed border-glass-border bg-surface/30 p-6 shadow-sm min-h-[300px] flex flex-col items-center justify-center text-center">
        <Receipt className="h-10 w-10 text-text-muted/30 mb-3" />
        <p className="text-sm font-semibold text-text-muted">Daily Spend Trend</p>
        <p className="text-xs text-text-muted mt-1">Not enough data yet — scan at least 3 receipts to see your daily spending pattern.</p>
      </Card>
    );
  }

  const maxAmount = Math.max(...data.map(d => d.amount), 1);

  return (
    <Card className="rounded-[3rem] border border-glass-border bg-surface/50 backdrop-blur-xl shadow-2xl overflow-hidden group relative before:absolute before:inset-x-0 before:top-0 before:h-0.5 before:bg-champagne/40">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-lg font-bold tracking-tight text-text-primary">Daily Spend</CardTitle>
            <p className="text-xs text-text-muted">Last 30 days · bar height = daily total</p>
          </div>
          <div className="flex h-10 w-10 items-center justify-center rounded-[2rem] bg-champagne/10 text-champagne shadow-inner group-hover:scale-110 transition-transform duration-500">
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="18" height="18" rx="2"/><path d="M3 9h18"/><path d="M9 21V9"/></svg>
          </div>
        </div>
      </CardHeader>
      <CardContent className="h-[300px] w-full pt-4">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--glass-border)" />
            <XAxis
              dataKey="date"
              tickFormatter={(dateStr: any) => formatDateLabel(String(dateStr))}
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
              labelFormatter={(dateStr: any) => formatDateLabel(String(dateStr))}
              formatter={(value: any) => [cad.format(Number(value)), 'Spend']}
              itemStyle={{ color: 'var(--champagne)' }}
            />
            <Bar
              dataKey="amount"
              fill="var(--champagne)"
              radius={[4, 4, 0, 0]}
              animationDuration={320}
              shape={(props: any) => {
                const isToday = props.payload.date === todayStr;
                return (
                  <rect
                    x={props.x}
                    y={props.y}
                    width={props.width}
                    height={props.height}
                    fill={isToday ? 'var(--emerald-light)' : 'var(--champagne)'}
                    rx={4}
                    ry={4}
                    opacity={isToday ? 1 : 0.7}
                  />
                );
              }}
            />
          </BarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}
