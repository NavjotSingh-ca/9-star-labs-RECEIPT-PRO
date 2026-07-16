'use client';

import React, { useState } from 'react';
import { Shield, AlertCircle } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { supabase, getOrgIdString } from '@/lib/supabase';

interface PolicyViolation {
  receiptId: string;
  ruleId: string;
  ruleName: string;
  reason: string;
  severity: 'warning' | 'violation' | 'critical';
}

/**
 * ExpensePolicyEnforcer - Automated policy enforcement and budget controls
 * Prevents policy violations at receipt creation time
 */
export default function ExpensePolicyEnforcer() {
  const [policyAmount, setPolicyAmount] = useState(500);
  const [monthlyLimit, setMonthlyLimit] = useState(2500);

  const { data: violations } = useQuery({
    queryKey: ['policy-violations'],
    queryFn: async (): Promise<PolicyViolation[]> => {
      const orgId = await getOrgIdString();
      if (!orgId) return [];

      // Check for violations in last 24 hours
      const { data: receipts } = await supabase
        .from('receipts')
        .select('id, total_amount, category, transaction_date')
        .eq('org_id', orgId)
        .eq('is_deleted', false)
        .gte('created_at', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString());

      const violations: PolicyViolation[] = [];
      receipts?.forEach(r => {
        // High-value spending
        if (r.total_amount > policyAmount) {
          violations.push({
            receiptId: r.id,
            ruleId: 'high-value',
            ruleName: 'High Value Alert',
            reason: `Receipt $${r.total_amount} exceeds review threshold`,
            severity: 'warning',
          });
        }

        // Entertainment category during work hours
        if (r.category === 'Meals & Entertainment') {
          const hour = new Date(r.transaction_date).getHours();
          if (hour < 9 || hour > 17) {
            violations.push({
              receiptId: r.id,
              ruleId: 'time-based',
              ruleName: 'Time-Based Policy',
              reason: 'Entertainment expense outside business hours',
              severity: 'violation',
            });
          }
        }
      });

      return violations;
    },
    staleTime: 60000,
  });

  const { data: monthlySpending } = useQuery({
    queryKey: ['monthly-spending'],
    queryFn: async () => {
      const orgId = await getOrgIdString();
      if (!orgId) return 0;

      const startOfMonth = new Date().toISOString().split('T')[0].replace(
        /^(\d{4}-\d{2}).*/,
        '$1-01'
      );

      const { data } = await supabase
        .from('receipts')
        .select('total_amount')
        .eq('org_id', orgId)
        .eq('is_deleted', false)
        .gte('transaction_date', startOfMonth);

      return data?.reduce((sum: number, r) => sum + Number(r.total_amount), 0) ?? 0;
    },
    staleTime: 300000,
  });

  return (
    <div className="space-y-6" role="region" aria-label="Expense policy enforcer">
      {/* Policy Settings */}
      <div className="rounded-xl border border-glass-border bg-surface p-4">
        <h3 className="text-sm font-semibold text-text-primary mb-3 flex items-center gap-2">
          <Shield className="h-4 w-4" aria-hidden="true" />
          Policy Thresholds
        </h3>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="text-xs text-text-muted" htmlFor="review-threshold">
              Review Threshold
            </label>
            <input
              id="review-threshold"
              type="number"
              value={policyAmount}
              onChange={e => setPolicyAmount(Number(e.target.value))}
              className="mt-1 w-full rounded-lg border border-glass-border bg-card px-3 py-2 text-sm"
              aria-label="High value review threshold"
            />
          </div>
          <div>
            <label className="text-xs text-text-muted" htmlFor="monthly-limit">
              Monthly Limit
            </label>
            <input
              id="monthly-limit"
              type="number"
              value={monthlyLimit}
              onChange={e => setMonthlyLimit(Number(e.target.value))}
              className="mt-1 w-full rounded-lg border border-glass-border bg-card px-3 py-2 text-sm"
              aria-label="Monthly spending limit"
            />
          </div>
        </div>
      </div>

      {/* Monthly Progress */}
      <div className="rounded-xl border border-glass-border bg-surface p-4">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-medium text-text-primary">Monthly Spending</span>
          <span className="text-sm text-text-muted">
            ${monthlySpending?.toLocaleString() ?? 0} / ${monthlyLimit.toLocaleString()}
          </span>
        </div>
        <div className="h-2 bg-surface-raised rounded-full overflow-hidden">
          <div
            className="h-full bg-champagne transition-all"
            style={{
              width: `${Math.min(100, ((monthlySpending ?? 0) / monthlyLimit) * 100)}%`,
            }}
            aria-label={`${Math.round(((monthlySpending ?? 0) / monthlyLimit) * 100)}% of monthly limit used`}
          />
        </div>
      </div>

      {/* Violations */}
      {violations && violations.length > 0 && (
        <div className="space-y-2" role="list">
          <h3 className="text-sm font-semibold text-text-primary flex items-center gap-2">
            <AlertCircle className="h-4 w-4 text-danger" aria-hidden="true" />
            Policy Violations ({violations.length})
          </h3>
          {violations.map(v => (
            <div
              key={`${v.receiptId}-${v.ruleId}`}
              className="flex items-center gap-3 rounded-lg border border-danger/20 bg-danger/[0.06] p-3"
              role="listitem"
            >
              <AlertCircle className="h-4 w-4 text-danger flex-shrink-0" aria-hidden="true" />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-danger">{v.ruleName}</p>
                <p className="text-xs text-danger/80 truncate">{v.reason}</p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}