'use client';

import { motion } from 'framer-motion';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { PieChartIcon } from 'lucide-react';

interface CategoryDonutProps {
  /** Array of category spend entries sorted descending by amount */
  data: { name: string; amount: number }[];
}

const cad = new Intl.NumberFormat('en-CA', { style: 'currency', currency: 'CAD', maximumFractionDigits: 0 });

const CHART_COLORS = [
  'var(--chart-1)',
  'var(--chart-2)',
  'var(--chart-3)',
  'var(--chart-4)',
  'var(--chart-5)',
  'var(--chart-6)',
  'var(--chart-7)',
  'var(--chart-8)',
];

export function CategoryDonut({ data }: CategoryDonutProps) {
  const hasData = data.length >= 3;
  const sorted = [...data].sort((a, b) => b.amount - a.amount);
  const total = sorted.reduce((s, c) => s + c.amount, 0);

  if (!hasData) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35, ease: 'easeOut', delay: 0.05 }}
      >
      <Card className="rounded-card border border-dashed border-glass-border bg-surface/30 p-6 shadow-card min-h-[300px] flex flex-col items-center justify-center text-center">
        <PieChartIcon className="h-10 w-10 text-text-muted/30 mb-3" />
        <p className="text-sm font-semibold text-text-muted">Category Breakdown</p>
        <p className="text-xs text-text-muted mt-1">Not enough data yet — categorize at least 3 receipts to see your spend breakdown.</p>
      </Card>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, ease: 'easeOut', delay: 0.05 }}
    >
    <Card className="rounded-card border border-glass-border bg-surface/50 shadow-card overflow-hidden group">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-lg font-bold tracking-tight text-text-primary">Spend by Category</CardTitle>
            <p className="text-xs text-text-muted">{sorted.length} categories · {cad.format(total)} total</p>
          </div>
          <div className="flex h-10 w-10 items-center justify-center rounded-card bg-champagne/10 text-champagne shadow-inner group-hover:scale-110 transition-transform duration-500">
            <PieChartIcon className="h-5 w-5" />
          </div>
        </div>
      </CardHeader>
      <CardContent className="pt-4">
        <div className="flex flex-col sm:flex-row items-center gap-6">
          <div className="h-[220px] w-[220px] flex-shrink-0" role="img" aria-label={`Spending by category: ${sorted.slice(0, 5).map(c => `${c.name} ${Math.round((c.amount / total) * 100)}%`).join(', ')}`}>
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
                    <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{
                    backgroundColor: 'var(--surface)',
                    borderColor: 'var(--glass-border)',
                    borderRadius: 'var(--radius-lg)',
                    fontSize: '12px',
                    fontWeight: 'bold',
                    boxShadow: 'var(--shadow-dropdown)',
                  }}
                  formatter={(value) => [cad.format(Number(value)), 'Spend']}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="flex-1 space-y-2 w-full">
            {sorted.slice(0, 5).map((cat, i) => (
              <div key={cat.name} className="flex items-center gap-2 text-sm">
                <span
                  className="h-3 w-3 rounded-sm flex-shrink-0"
                  style={{ backgroundColor: CHART_COLORS[i % CHART_COLORS.length] }}
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
    </motion.div>
  );
}
