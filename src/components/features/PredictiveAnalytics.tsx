'use client';

import React from 'react';
import { TrendingUp, TrendingDown, Calendar, AlertCircle } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { formatCurrency } from '@/lib/ui-utils';
import { supabase, getOrgIdString } from '@/lib/supabase';

interface SpendingPrediction {
  category: string;
  currentSpend: number;
  predictedEndMonth: number;
  trend: 'up' | 'down' | 'stable';
  daysUntilReset: number;
  confidence: number;
}

/**
 * PredictiveAnalytics - Shows spending forecasts and trend analysis
 * Helps users anticipate budget overruns before month-end
 */
export default function PredictiveAnalytics() {
  const { data: predictions, isLoading, error } = useQuery({
    queryKey: ['spending-predictions'],
    queryFn: async (): Promise<SpendingPrediction[]> => {
      const orgId = await getOrgIdString();
      if (!orgId) return [];

      // Get current month's spending
      const today = new Date();
      const monthStart = new Date(today.getFullYear(), today.getMonth(), 1).toISOString().split('T')[0];

      const { data: receipts } = await supabase
        .from('receipts')
        .select('category, total_amount, transaction_date')
        .eq('org_id', orgId)
        .eq('is_deleted', false)
        .gte('transaction_date', monthStart);

      const categorySpend = new Map<string, number>();
      receipts?.forEach(r => {
        const cat = r.category || 'Uncategorized';
        categorySpend.set(cat, (categorySpend.get(cat) || 0) + Number(r.total_amount));
      });

      // Calculate predictions based on current spending rate
      const daysElapsed = today.getDate();
      const predictions: SpendingPrediction[] = [];

      for (const [category, total] of categorySpend) {
        const dailyRate = total / daysElapsed;
        const predictedEndMonth = dailyRate * 30;
        const trend = dailyRate > 50 ? 'up' : dailyRate < 20 ? 'down' : 'stable';
        const confidence = Math.min(0.95, daysElapsed / 30);

        predictions.push({
          category,
          currentSpend: total,
          predictedEndMonth,
          trend,
          daysUntilReset: 30 - daysElapsed,
          confidence,
        });
      }

      return predictions
        .sort((a, b) => b.predictedEndMonth - a.predictedEndMonth)
        .slice(0, 8);
    },
    staleTime: 5 * 60 * 1000,
  });

  if (isLoading) {
    return (
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4" role="status" aria-label="Loading predictions">
        {Array.from({ length: 8 }).map((_, i) => (
          <div key={i} className="rounded-xl border border-glass-border bg-surface p-4 animate-pulse">
            <div className="h-3 w-16 bg-surface-raised rounded mb-2" />
            <div className="h-5 w-20 bg-surface-raised rounded mb-1" />
            <div className="h-2 w-full bg-surface-raised rounded" />
          </div>
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-xl border border-danger/20 bg-danger/[0.06] p-6 text-center" role="alert">
        <AlertCircle className="h-8 w-8 text-danger mx-auto mb-2" aria-hidden="true" />
        <p className="text-sm text-danger font-medium">Unable to load spending predictions</p>
        <p className="text-xs text-text-muted mt-1">Check your connection and try again</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4" role="region" aria-label="Spending predictions">
      {predictions?.map(pred => (
        <div
          key={pred.category}
          className="rounded-xl border border-glass-border bg-surface p-4 hover:bg-surface-hover transition group"
        >
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-text-primary truncate" title={pred.category}>
              {pred.category}
            </span>
            {pred.trend === 'up' ? (
              <TrendingUp className="h-3 w-3 text-emerald-light flex-shrink-0" aria-hidden="true" />
            ) : pred.trend === 'down' ? (
              <TrendingDown className="h-3 w-3 text-warning flex-shrink-0" aria-hidden="true" />
            ) : (
              <Calendar className="h-3 w-3 text-text-muted flex-shrink-0" aria-hidden="true" />
            )}
          </div>

          <div className="space-y-1">
            <p className="text-lg font-bold text-champagne" aria-label={`Predicted end of month: ${formatCurrency(pred.predictedEndMonth)}`}>
              {formatCurrency(pred.predictedEndMonth)}
            </p>
            <p className="text-[10px] text-text-muted" aria-label={`Current: ${formatCurrency(pred.currentSpend)}, ${pred.confidence * 100}% confidence`}>
              {formatCurrency(pred.currentSpend)} current · {Math.round(pred.confidence * 100)}% confidence
            </p>
            <div className="pt-1" aria-label={`${pred.daysUntilReset} days until month reset`}>
              <Calendar className="h-3 w-3 inline text-text-muted mr-1" aria-hidden="true" />
              <span className="text-[10px] text-text-muted">{pred.daysUntilReset}d</span>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}