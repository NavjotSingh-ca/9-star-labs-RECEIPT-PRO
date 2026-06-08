'use client';

import { useMemo } from 'react';
import { Receipt, DollarSign } from 'lucide-react';
import { motion } from 'framer-motion';
import { toNumber, formatCurrency } from '@/lib/ui-utils';
import type { ReceiptRow } from '@/lib/types';

interface StatCardsProps {
  receipts: ReceiptRow[];
}

export function StatCards({ receipts }: StatCardsProps) {
  const stats = useMemo(() => {
    const totalSpend = receipts.reduce((s, r) => s + toNumber(r.total_amount), 0);
    const avgSpend = receipts.length > 0 ? totalSpend / receipts.length : 0;
    const pendingCount = receipts.filter(r => r.approval_status === 'submitted').length;
    return [
      { label: 'Total Receipts', value: receipts.length.toString(), icon: Receipt, color: 'text-champagne' },
      { label: 'Total Spend', value: formatCurrency(totalSpend), icon: DollarSign, color: 'text-emerald-light' },
      { label: 'Avg per Receipt', value: formatCurrency(avgSpend), icon: DollarSign, color: 'text-champagne' },
      { label: 'Pending', value: pendingCount.toString(), icon: DollarSign, color: 'text-warning' },
    ];
  }, [receipts]);

  return (
    <motion.div
      initial={{ opacity: 0, y: -8 }}
      animate={{ opacity: 1, y: 0 }}
      className="mb-4 grid grid-cols-2 gap-3 sm:grid-cols-4"
    >
      {stats.map((stat) => (
        <div
          key={stat.label}
          className="flex items-center gap-3 rounded-xl border border-glass-border bg-card px-4 py-3 transition hover:border-glass-border-hover"
        >
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-surface-raised">
            <stat.icon className={`h-4 w-4 ${stat.color}`} />
          </div>
          <div>
            <p className="text-[11px] font-medium text-text-muted">{stat.label}</p>
            <p className="text-sm font-bold tracking-tight text-text-primary tabular-nums">{stat.value}</p>
          </div>
        </div>
      ))}
    </motion.div>
  );
}
