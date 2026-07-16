'use client';

import React from 'react';
import { Check, AlertCircle, Info } from 'lucide-react';

interface DataQualityIndicatorProps {
  score: number; // 0-100
  missingFields?: string[];
}

/**
 * DataQualityIndicator - Visual indicator for receipt data quality
 * Helps users understand completeness and CRA readiness
 */
export default function DataQualityIndicator({
  score,
  missingFields = [],
}: DataQualityIndicatorProps) {
  const getColor = (): string => {
    if (score >= 90) return 'text-emerald-light';
    if (score >= 70) return 'text-warning';
    return 'text-danger';
  };

  const bgColor = (): string => {
    if (score >= 90) return 'bg-emerald-light/10';
    if (score >= 70) return 'bg-warning/10';
    return 'bg-danger/10';
  };

  return (
    <div className="flex items-center gap-3 rounded-xl border border-glass-border bg-surface p-4" role="status">
      <div className={`flex h-10 w-10 items-center justify-center rounded-full ${bgColor()}`}>
        {score >= 90 ? (
          <Check className={`h-5 w-5 ${getColor()}`} aria-hidden="true" />
        ) : score >= 70 ? (
          <Info className={`h-5 w-5 ${getColor()}`} aria-hidden="true" />
        ) : (
          <AlertCircle className={`h-5 w-5 ${getColor()}`} aria-hidden="true" />
        )}
      </div>
      <div className="flex-1">
        <div className="flex items-center justify-between mb-1">
          <span className="text-sm font-medium text-text-primary">Data Quality</span>
          <span className={`text-sm font-bold ${getColor()}`}>{score}%</span>
        </div>
        <div className="h-1.5 bg-surface-raised rounded-full overflow-hidden">
          <div
            className={`h-full ${getColor().replace('text-', 'bg-')} transition-all`}
            style={{ width: `${score}%` }}
            aria-label={`Data quality score: ${score}%`}
          />
        </div>
        {missingFields.length > 0 && (
          <p className="mt-2 text-xs text-text-muted">
            Missing: {missingFields.slice(0, 3).join(', ')}
            {missingFields.length > 3 && ' ...'}
          </p>
        )}
      </div>
    </div>
  );
}