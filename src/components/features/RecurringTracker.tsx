'use client';

import React from 'react';
import { Repeat, AlertCircle, Plus, Trash2 } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { formatCurrency } from '@/lib/ui-utils';
import { supabase, getOrgIdString } from '@/lib/supabase';

interface RecurringExpense {
  id: string;
  vendor_name: string;
  amount: number;
  frequency: 'weekly' | 'monthly' | 'quarterly' | 'annual';
  next_date: string;
  category: string;
  is_active: boolean;
}

/**
 * RecurringTracker - Track subscriptions and regular payments
 * Helps users monitor recurring expenses and avoid unwanted charges
 */
export default function RecurringTracker() {
  const { data: expenses, dataUpdatedAt } = useQuery({
    queryKey: ['recurring-expenses'],
    queryFn: async (): Promise<RecurringExpense[]> => {
      const orgId = await getOrgIdString();
      if (!orgId) return [];

      const { data } = await supabase
        .from('recurring_expenses')
        .select('*')
        .eq('org_id', orgId)
        .eq('is_active', true)
        .order('next_date', { ascending: true });

      return (data as RecurringExpense[]) ?? [];
    },
    staleTime: 300000,
  });

  const frequencyLabels = {
    weekly: 'Weekly',
    monthly: 'Monthly',
    quarterly: 'Quarterly',
    annual: 'Annual',
  };

  const monthlyAverage = expenses?.reduce((sum, e) => {
    const multiplier = {
      weekly: 4.33,
      monthly: 1,
      quarterly: 1 / 3,
      annual: 1 / 12,
    };
    return sum + e.amount * multiplier[e.frequency];
  }, 0) ?? 0;

  // Calculate upcoming payments based on dataUpdatedAt timestamp (pure value)
  const upcomingPayments = expenses?.filter(e => {
    const now = dataUpdatedAt;
    const daysUntil = Math.ceil((new Date(e.next_date).getTime() - now) / 86400000);
    return daysUntil <= 7;
  }).length ?? 0;

  return (
    <div className="space-y-4" role="region" aria-label="Recurring expenses tracker">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-text-secondary">Recurring Expenses</p>
          <p className="text-lg font-bold text-champagne">{formatCurrency(monthlyAverage)}/month avg</p>
        </div>
        <button
          type="button"
          className="rounded-xl border border-glass-border bg-surface px-3 py-1.5 text-xs font-medium text-text-secondary transition hover:bg-surface-hover focus:outline-none focus:ring-2 focus:ring-champagne/40"
          aria-label="Add recurring expense (opens add form)"
        >
          <Plus className="h-3.5 w-3.5 inline mr-1" aria-hidden="true" />
          Add
        </button>
      </div>

      {/* Expense List */}
      <div className="space-y-2" role="list">
        {expenses?.map(expense => (
          <div
            key={expense.id}
            className="flex items-center justify-between rounded-lg border border-glass-border bg-surface p-3"
            role="listitem"
          >
            <div className="flex items-center gap-3">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-champagne/15">
                <Repeat className="h-4 w-4 text-champagne" aria-hidden="true" />
              </div>
              <div>
                <p className="text-sm font-medium text-text-primary">{expense.vendor_name}</p>
                <p className="text-xs text-text-muted">
                  {frequencyLabels[expense.frequency]} · Next: {new Date(expense.next_date).toLocaleDateString()}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-sm font-semibold text-text-primary">
                {formatCurrency(expense.amount)}
              </span>
              <button
                type="button"
                className="rounded-lg p-1 text-danger transition hover:bg-danger/10 focus:outline-none focus:ring-2 focus:ring-danger/40"
                aria-label={`Remove ${expense.vendor_name}`}
              >
                <Trash2 className="h-3.5 w-3.5" aria-hidden="true" />
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Alerts for upcoming payments */}
      {upcomingPayments > 0 && (
        <div className="rounded-lg border border-warning/20 bg-warning/[0.06] p-3" role="alert">
          <div className="flex items-start gap-2">
            <AlertCircle className="h-4 w-4 text-warning mt-0.5" aria-hidden="true" />
            <p className="text-xs text-warning">
              {upcomingPayments} payments due in the next 7 days
            </p>
          </div>
        </div>
      )}
    </div>
  );
}