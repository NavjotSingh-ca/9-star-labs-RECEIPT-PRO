'use client';

import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { PieChartIcon } from 'lucide-react';

interface CategoryDonutProps {
  data: { name: string; amount: number }[];
}

const cad = new Intl.NumberFormat('en-CA', { style: 'currency', currency: 'CAD', maximumFractionDigits: 0 });

const COLORS = [
  '#bea98e', '#8b5cf6', '#ef4444', '#f59e0b',
  '#06b6d4', '#ec4899', '#60a5fa', '#10b981',
  '#a855f7', '#f97316', '#14b8a6', '#e11d48',
];

export function CategoryDonut({ data }: CategoryDonutProps) {
  const hasData = data.length >= 3;
  const sorted = [...data].sort((a, b) => b.amount - a.amount);
  const total = sorted.reduce((s, c) => s + c.amount, 0);

  if (!hasData) {
    return (
      <Card className="rounded-[3rem] border border-dashed border-glass-border bg-surface/30 p-6 shadow-sm min-h-[300px] flex flex-col items-center justify-center text-center">
        <PieChartIcon className="h-10 w-10 text-text-muted/30 mb-3" />
        <p className="text-sm font-semibold text-text-muted">Category Breakdown</p>
        <p className="text-xs text-text-muted mt-1">Not enough data yet — categorize at least 3 receipts to see your spend breakdown.</p>
      </Card>
    );
  }

  return (
    <Card className="rounded-[3rem] border border-glass-border bg-surface/50 backdrop-blur-xl shadow-2xl overflow-hidden group">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-lg font-bold tracking-tight text-text-primary">Spend by Category</CardTitle>
            <p className="text-xs text-text-muted">{sorted.length} categories · {cad.format(total)} total</p>
          </div>
          <div className="flex h-10 w-10 items-center justify-center rounded-[2rem] bg-champagne/10 text-champagne shadow-inner group-hover:scale-110 transition-transform duration-500">
            <PieChartIcon className="h-5 w-5" />
          </div>
        </div>
      </CardHeader>
      <CardContent className="pt-4">
        <div className="flex flex-col sm:flex-row items-center gap-6">
          <div className="h-[220px] w-[220px] flex-shrink-0" role="img" aria-label="Spending by category">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={sorted}
                  cx="50%"
                  cy="50%"
                  innerRadius={55}
                  outerRadius={90}
                  paddingAngle={2}
                  dataKey="amount"
                  animationDuration={320}
                >
                  {sorted.map((_, i) => (
                    <Cell key={i} fill={COLORS[i % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{
                    backgroundColor: 'var(--surface)',
                    borderColor: 'var(--glass-border)',
                    borderRadius: '1rem',
                    fontSize: '12px',
                    fontWeight: 'bold',
                    boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)',
                  }}
                  formatter={(value: any) => [cad.format(Number(value)), 'Spend']}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="flex-1 space-y-2 w-full">
            {sorted.slice(0, 5).map((cat, i) => (
              <div key={cat.name} className="flex items-center gap-2 text-sm">
                <span
                  className="h-3 w-3 rounded-sm flex-shrink-0"
                  style={{ backgroundColor: COLORS[i % COLORS.length] }}
                />
                <span className="flex-1 truncate text-text-secondary">{cat.name}</span>
                <span className="font-semibold tabular-nums text-text-primary">
                  {total > 0 ? `${Math.round((cat.amount / total) * 100)}%` : '0%'}
                </span>
              </div>
            ))}
            {sorted.length > 5 && (
              <p className="text-xs text-text-muted pt-1">+{sorted.length - 5} more categories</p>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
