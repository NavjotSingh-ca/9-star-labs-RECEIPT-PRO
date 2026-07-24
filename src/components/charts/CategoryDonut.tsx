'use client';

import { motion } from 'framer-motion';
import { fadeUp, springGentle } from '@/lib/animations';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { PieChartIcon } from 'lucide-react';

interface CategoryDonutProps {
  /** Array of category spend entries sorted descending by amount */
  data: { name: string; amount: number }[];
}

const cad = new Intl.NumberFormat('en-CA', { style: 'currency', currency: 'CAD', maximumFractionDigits: 0 });

/**
 * Champagne-toned monochrome palette (oklch) — single hue, varying lightness + chroma.
 * Keeps the donut cohesive and on-brand rather than using 8 disparate colours.
 */
const CHAMPAGNE_SCALE = [
  'oklch(0.72 0.06 75)',   // full champagne
  'oklch(0.65 0.045 75)',  // 70% impression
  'oklch(0.59 0.035 75)',  // 50% impression
  'oklch(0.53 0.025 75)',  // 35% impression
  'oklch(0.47 0.015 75)',  // 20% impression
  'oklch(0.42 0.008 75)',  // "Other" — nearly neutral
];

const MERGE_AFTER = 5; // merge all categories beyond the top 5 into "Other"

export function CategoryDonut({ data }: CategoryDonutProps) {
  const sorted = [...data].sort((a, b) => b.amount - a.amount);
  const top = sorted.slice(0, MERGE_AFTER);
  const rest = sorted.slice(MERGE_AFTER);
  const othersTotal = rest.reduce((s, c) => s + c.amount, 0);

  const chartData = othersTotal > 0
    ? [...top, { name: 'Other', amount: othersTotal }]
    : top;

  const total = chartData.reduce((s, c) => s + c.amount, 0);
  const maxPct = total > 0 ? Math.round((chartData[0]?.amount ?? 0) / total * 100) : 0;

  if (chartData.length < 2) {
    return (
      <motion.div
        variants={fadeUp}
        initial="hidden"
        animate="show"
        transition={{ ...springGentle, delay: 0.05 }}
      >
        <Card className="rounded-card border border-dashed border-glass-border bg-surface/30 p-6 shadow-card min-h-[300px] flex flex-col items-center justify-center text-center">
          <PieChartIcon className="h-10 w-10 text-text-muted/30 mb-3" />
          <p className="text-sm font-semibold text-text-muted">Category Breakdown</p>
          <p className="text-xs text-text-muted mt-1 max-w-[260px]">
            Categorise at least 2 receipts to see a breakdown of where your money is going.
          </p>
        </Card>
      </motion.div>
    );
  }

  const topName = chartData[0]?.name ?? '';
  const takeaway = maxPct >= 50
    ? `${maxPct}% from ${topName}`
    : `Top ${Math.min(chartData.length, MERGE_AFTER)} categories`;

  return (
    <motion.div
      variants={fadeUp}
      initial="hidden"
      animate="show"
      transition={{ ...springGentle, delay: 0.05 }}
    >
      <Card className="rounded-card border border-glass-border bg-surface/50 shadow-card overflow-hidden group">
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-lg font-bold tracking-tight text-text-primary">
                Spend by Category
              </CardTitle>
              <p className="text-xs text-text-muted">
                {takeaway} &middot; {cad.format(total)} total
              </p>
            </div>
            <div className="flex h-10 w-10 items-center justify-center rounded-card bg-champagne/10 text-champagne shadow-inner group-hover:scale-110 transition-transform duration-500">
              <PieChartIcon className="h-5 w-5" />
            </div>
          </div>
        </CardHeader>
        <CardContent className="pt-4">
          <div className="flex flex-col sm:flex-row items-center gap-6">
            <div
              className="h-[220px] w-[220px] flex-shrink-0"
              role="img"
              aria-label={`Spending by category: ${chartData.map(c => `${c.name} ${Math.round((c.amount / total) * 100)}%`).join(', ')}`}
            >
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={chartData}
                    cx="50%"
                    cy="50%"
                    innerRadius={55}
                    outerRadius={90}
                    paddingAngle={2}
                    dataKey="amount"
                    animationDuration={320}
                  >
                    {chartData.map((_, i) => (
                      <Cell key={i} fill={CHAMPAGNE_SCALE[i % CHAMPAGNE_SCALE.length]} />
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
              {chartData.map((cat, i) => (
                <div key={cat.name} className="flex items-center gap-2 text-sm">
                  <span
                    className="h-3 w-3 rounded-sm flex-shrink-0"
                    style={{ backgroundColor: CHAMPAGNE_SCALE[i % CHAMPAGNE_SCALE.length] }}
                  />
                  <span className="flex-1 truncate text-text-secondary">{cat.name}</span>
                  <span className="font-semibold tabular-nums text-text-primary">
                    {total > 0 ? `${Math.round((cat.amount / total) * 100)}%` : '0%'}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}
