'use client';

import React from 'react';
import { Shield, Check, AlertTriangle, Download } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { getOrgIdString } from '@/lib/supabase';
import { runComplianceAudit } from '@/lib/services/compliance-monitoring';

interface ComplianceDashboardProps {
  orgId?: string;
}

/**
 * ComplianceDashboard - Enterprise compliance monitoring
 * Shows SOC 2, CRA, and audit readiness status
 */
export default function ComplianceDashboard({ orgId }: ComplianceDashboardProps) {
  const { data: compliance, isLoading } = useQuery({
    queryKey: ['compliance-status', orgId],
    queryFn: async () => {
      const currentOrgId = orgId ?? (await getOrgIdString());
      if (!currentOrgId) return null;
      return runComplianceAudit(currentOrgId);
    },
    staleTime: 5 * 60000,
  });

  // Severity colors available for future use with rule styling

  if (isLoading) {
    return (
      <div className="space-y-4" role="status" aria-label="Loading compliance status">
        <div className="h-6 w-48 bg-surface-raised rounded" />
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="h-12 bg-surface-raised rounded" />
        ))}
      </div>
    );
  }

  if (!compliance) {
    return (
      <div className="rounded-xl border border-danger/20 bg-danger/[0.06] p-4" role="alert">
        <p className="text-sm text-danger">Unable to load compliance status</p>
      </div>
    );
  }

  return (
    <div className="space-y-6" role="region" aria-label="Compliance dashboard">
      {/* Overall Status */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-champagne/15">
            <Shield className="h-6 w-6 text-champagne" aria-hidden="true" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-text-primary">Compliance Status</h2>
            <p className="text-sm text-text-muted">
              Last checked: {new Date(compliance.generatedAt).toLocaleString()}
            </p>
          </div>
        </div>
        <div className="text-right">
          <p className="text-3xl font-bold text-text-primary">{compliance.overallScore}%</p>
          <p className="text-xs text-text-muted">Compliance Score</p>
        </div>
      </div>

      {/* Critical Alerts */}
      {compliance.criticalFailures > 0 && (
        <div className="rounded-xl border border-danger/20 bg-danger/[0.06] p-4" role="alert">
          <div className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-danger" aria-hidden="true" />
            <span className="font-medium text-danger">
              {compliance.criticalFailures} critical compliance failures detected
            </span>
          </div>
        </div>
      )}

      {/* Rule Details */}
      <div className="space-y-3" role="list">
        {compliance.rules.map(rule => (
          <div
            key={rule.ruleId}
            className="flex items-center justify-between rounded-lg border border-glass-border bg-surface p-3"
            role="listitem"
          >
            <div className="flex items-center gap-3">
              {rule.passed ? (
                <Check className="h-4 w-4 text-emerald-light" aria-hidden="true" />
              ) : (
                <AlertTriangle className="h-4 w-4 text-danger" aria-hidden="true" />
              )}
              <div>
                <p className="text-sm font-medium text-text-primary">{rule.details}</p>
                {rule.evidence && (
                  <p className="text-xs text-text-muted">Evidence: {rule.evidence.join(', ')}</p>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Export Button */}
      <button
        type="button"
        className="inline-flex items-center gap-2 rounded-xl bg-champagne px-4 py-2 text-sm font-bold text-obsidian transition hover:bg-champagne-dim focus:outline-none focus:ring-2 focus:ring-champagne/40"
        aria-label="Download compliance report"
      >
        <Download className="h-4 w-4" aria-hidden="true" />
        Export SOC 2 Package
      </button>
    </div>
  );
}