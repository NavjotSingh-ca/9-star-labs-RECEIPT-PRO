'use client';

import React from 'react';
import { PiggyBank, Check } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { formatCurrency } from '@/lib/ui-utils';
import { supabase, getOrgIdString } from '@/lib/supabase';

interface TaxOptimization {
  category: string;
  currentSpend: number;
  potentialClaim: number;
  suggestions: string[];
}

/**
 * TaxOptimizer - AI-powered tax optimization suggestions
 * Shows potential savings and deduction opportunities
 */
export default function TaxOptimizer() {
  const { data: optimizations, isLoading } = useQuery({
    queryKey: ['tax-optimizations'],
    queryFn: async (): Promise<TaxOptimization[]> => {
      const orgId = await getOrgIdString();
      if (!orgId) return [];

      const currentYear = new Date().getFullYear();
      const { data: receipts } = await supabase
        .from('receipts')
        .select('category, total_amount, gst_amount, pst_amount')
        .eq('org_id', orgId)
        .eq('is_deleted', false)
        .gte('transaction_date', `${currentYear}-01-01`);

      const categorySpend = new Map<string, { total: number; gst: number; pst: number }>();

      receipts?.forEach(r => {
        const cat = r.category || 'Other';
        const current = categorySpend.get(cat) || { total: 0, gst: 0, pst: 0 };
        current.total += Number(r.total_amount);
        current.gst += Number(r.gst_amount || 0);
        current.pst += Number(r.pst_amount || 0);
        categorySpend.set(cat, current);
      });

      const optimizations: TaxOptimization[] = [];

      for (const [category, data] of categorySpend) {
        const suggestions: string[] = [];
        let potentialClaim = 0;

        // GST/HST recovery
        if (data.gst > 0) {
          potentialClaim += data.gst;
          suggestions.push('Full GST/HST claim available');
        }

        // PST recovery (varies by province)
        if (data.pst > 0) {
          potentialClaim += data.pst;
          suggestions.push('PST claim available in most provinces');
        }

        // High-value categories with tax implications
        if (data.total > 1000) {
          suggestions.push('Consider capital cost allowance for large purchases');
        }

        optimizations.push({
          category,
          currentSpend: data.total,
          potentialClaim,
          suggestions,
        });
      }

      return optimizations
        .filter(o => o.potentialClaim > 0)
        .sort((a, b) => b.potentialClaim - a.potentialClaim)
        .slice(0, 6);
    },
    staleTime: 300000,
  });

  if (isLoading) {
    return (
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4" role="status" aria-label="Loading tax optimizations">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="rounded-xl border border-glass-border bg-surface p-4">
            <div className="skeleton skeleton-md mb-2" />
            <div className="skeleton skeleton-xl mb-2" />
            <div className="skeleton skeleton-sm" />
          </div>
        ))}
      </div>
    );
  }

  const totalPotential = optimizations?.reduce((sum, o) => sum + o.potentialClaim, 0) ?? 0;

  return (
    <div className="space-y-4" role="region" aria-label="Tax optimization suggestions">
      <div className="flex items-center gap-3">
        <PiggyBank className="h-6 w-6 text-champagne" aria-hidden="true" />
        <div>
          <p className="text-xs text-text-muted">Potential Tax Savings</p>
          <p className="text-2xl font-bold text-champagne">{formatCurrency(totalPotential)}</p>
        </div>
      </div>

      <div className="space-y-3" role="list">
        {optimizations?.map(opt => (
          <div
            key={opt.category}
            className="rounded-xl border border-glass-border bg-surface p-4"
            role="listitem"
          >
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-semibold text-text-primary">{opt.category}</span>
              <span className="text-sm font-bold text-emerald-light">
                {formatCurrency(opt.potentialClaim)}
              </span>
            </div>
            <p className="text-xs text-text-muted mb-2">{formatCurrency(opt.currentSpend)} spent</p>
            <div className="space-y-1">
              {opt.suggestions.map((s, i) => (
                <div key={i} className="flex items-start gap-2 text-[10px]">
                  <Check className="h-3 w-3 text-emerald-light mt-0.5" aria-hidden="true" />
                  <span className="text-text-secondary">{s}</span>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}