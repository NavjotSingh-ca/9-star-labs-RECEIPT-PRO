'use client';

import React, { useState } from 'react';
import { FileText, Download, Calendar, TrendingUp } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { formatCurrency } from '@/lib/ui-utils';
import { supabase, getOrgIdString } from '@/lib/supabase';

interface TaxSummary {
  totalSpent: number;
  gstClaimable: number;
  pstClaimable: number;
  deductibleCategories: { category: string; amount: number }[];
  quarterlyBreakdown: { quarter: string; amount: number }[];
}

/**
 * TaxReportingDashboard - CRA-ready tax reporting with automatic calculations
 * Shows deductible amounts, GST/PST recovery, and quarterly breakdowns
 */
export default function TaxReportingDashboard() {
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());

  const { data: taxSummary, isLoading, error } = useQuery({
    queryKey: ['tax-summary', selectedYear],
    queryFn: async (): Promise<TaxSummary> => {
      const orgId = await getOrgIdString();
      if (!orgId) return { totalSpent: 0, gstClaimable: 0, pstClaimable: 0, deductibleCategories: [], quarterlyBreakdown: [] };

      const startDate = `${selectedYear}-01-01`;
      const endDate = `${selectedYear}-12-31`;

      const { data: receipts } = await supabase
        .from('receipts')
        .select('category, total_amount, gst_amount, pst_amount, transaction_date')
        .eq('org_id', orgId)
        .eq('is_deleted', false)
        .gte('transaction_date', startDate)
        .lte('transaction_date', endDate);

      const deductibleCategories = new Map<string, number>();
      let gstClaimable = 0;
      let pstClaimable = 0;

      receipts?.forEach(r => {
        const amount = Number(r.total_amount);
        const cat = r.category || 'Other';
        deductibleCategories.set(cat, (deductibleCategories.get(cat) || 0) + amount);
        gstClaimable += Number(r.gst_amount || 0);
        pstClaimable += Number(r.pst_amount || 0);
      });

      // Quarterly breakdown
      const quarters = ['Q1', 'Q2', 'Q3', 'Q4'];
      const quarterRanges = [
        ['01-01', '03-31'],
        ['04-01', '06-30'],
        ['07-01', '09-30'],
        ['10-01', '12-31'],
      ];

      const quarterlyBreakdown = quarters.map((q, i) => {
        const [start, end] = quarterRanges[i];
        const qTotal =
          receipts
            ?.filter(r => r.transaction_date >= `${selectedYear}-${start}` && r.transaction_date <= `${selectedYear}-${end}`)
            .reduce((sum, r) => sum + Number(r.total_amount), 0) ?? 0;
        return { quarter: q, amount: qTotal };
      });

      return {
        totalSpent: receipts?.reduce((sum, r) => sum + Number(r.total_amount), 0) ?? 0,
        gstClaimable,
        pstClaimable,
        deductibleCategories: Array.from(deductibleCategories.entries())
          .map(([category, amount]) => ({ category, amount }))
          .sort((a, b) => b.amount - a.amount),
        quarterlyBreakdown,
      };
    },
    staleTime: 5 * 60 * 1000,
  });

  if (isLoading) {
    return (
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4" role="status" aria-label="Loading tax summary">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="rounded-xl border border-glass-border bg-surface p-4">
            <div className="skeleton skeleton-sm mb-2" />
            <div className="skeleton skeleton-xl" />
          </div>
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-xl border border-danger/20 bg-danger/[0.06] p-6 text-center" role="alert">
        <FileText className="h-8 w-8 text-danger mx-auto mb-2" aria-hidden="true" />
        <p className="text-sm text-danger font-medium">Unable to load tax summary</p>
      </div>
    );
  }

  // Pre-calculate max for chart
  const chartData = taxSummary
    ? {
        quarterlyBreakdown: taxSummary.quarterlyBreakdown,
        maxAmount: Math.max(...taxSummary.quarterlyBreakdown.map(q => q.amount), 1),
      }
    : null;

  return (
    <div className="space-y-6" role="region" aria-label="Tax reporting dashboard">
      {/* Year Selector */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Calendar className="h-4 w-4 text-text-muted" aria-hidden="true" />
          <span className="text-sm font-medium text-text-primary">Tax Year {selectedYear}</span>
        </div>
        <select
          value={selectedYear}
          onChange={e => setSelectedYear(Number(e.target.value))}
          className="rounded-lg border border-glass-border bg-surface px-3 py-1.5 text-sm"
          aria-label="Select tax year"
        >
          {Array.from({ length: 5 }, (_, i) => new Date().getFullYear() - i).map(year => (
            <option key={year} value={year}>
              {year}
            </option>
          ))}
        </select>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="rounded-xl border border-glass-border bg-surface p-4">
          <p className="text-xs text-text-muted mb-1">Total Spending</p>
          <p className="text-xl font-bold text-champagne">{formatCurrency(taxSummary?.totalSpent ?? 0)}</p>
        </div>
        <div className="rounded-xl border border-glass-border bg-surface p-4">
          <p className="text-xs text-text-muted mb-1">GST Claimable</p>
          <p className="text-xl font-bold text-emerald-light">{formatCurrency(taxSummary?.gstClaimable ?? 0)}</p>
        </div>
        <div className="rounded-xl border border-glass-border bg-surface p-4">
          <p className="text-xs text-text-muted mb-1">PST Claimable</p>
          <p className="text-xl font-bold text-emerald-light">{formatCurrency(taxSummary?.pstClaimable ?? 0)}</p>
        </div>
        <div className="rounded-xl border border-glass-border bg-surface p-4">
          <p className="text-xs text-text-muted mb-1">Deductible Categories</p>
          <p className="text-xl font-bold text-text-primary">{taxSummary?.deductibleCategories.length ?? 0}</p>
        </div>
      </div>

      {/* Quarterly Chart */}
      <div>
        <h3 className="text-sm font-semibold text-text-primary mb-3 flex items-center gap-2">
          <TrendingUp className="h-4 w-4" aria-hidden="true" />
          Quarterly Breakdown
        </h3>
        <div className="flex gap-2" role="img" aria-label="Quarterly spending visualization">
          {taxSummary?.quarterlyBreakdown.map(q => (
            <div key={q.quarter} className="flex-1 text-center">
              <div className="relative h-24 bg-surface-raised rounded-lg overflow-hidden">
                <div
                  className="absolute bottom-0 left-0 right-0 bg-champagne transition-all"
                  style={{
                    height: chartData
                      ? `${Math.min(100, (q.amount / chartData.maxAmount) * 100)}%`
                      : '0%',
                  }}
                  aria-label={`${q.quarter}: ${formatCurrency(q.amount)}`}
                />
              </div>
              <p className="text-xs font-medium text-text-primary mt-2">{q.quarter}</p>
              <p className="text-[10px] text-text-muted">{formatCurrency(q.amount)}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Export Button */}
      <button
        type="button"
        className="inline-flex items-center gap-2 rounded-xl bg-champagne px-4 py-2 text-sm font-bold text-obsidian transition hover:bg-champagne-dim focus:outline-none focus:ring-2 focus:ring-champagne/40"
        aria-label="Export tax summary to Excel"
      >
        <Download className="h-4 w-4" aria-hidden="true" />
        Export T2125 Data
      </button>
    </div>
  );
}