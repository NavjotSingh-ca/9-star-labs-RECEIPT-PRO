'use client';

import * as React from 'react';
import { cn } from '../utils/cn';

interface ChartCardProps {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
  action?: React.ReactNode;
  className?: string;
  loading?: boolean;
  error?: string;
  emptyMessage?: string;
}

export function ChartCard({ title, subtitle, children, action, className, loading, error, emptyMessage = 'No data to display' }: ChartCardProps) {
  if (loading) {
    return (
      <div className={cn('rounded-2xl border border-glass-border bg-card p-6', className)}>
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-lg font-semibold text-text-primary">{title}</h3>
            {subtitle && <p className="text-sm text-text-muted">{subtitle}</p>}
          </div>
        </div>
        <div className="flex items-center justify-center min-h-[300px]">
          <div className="animate-spin rounded-full h-8 w-8 border-3 border-champagne/30 border-t-champagne" />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={cn('rounded-2xl border border-glass-border bg-card p-6', className)}>
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-lg font-semibold text-text-primary">{title}</h3>
            {subtitle && <p className="text-sm text-text-muted">{subtitle}</p>}
          </div>
        </div>
        <div className="flex flex-col items-center justify-center min-h-[200px] text-center p-4">
          <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-xl bg-danger/10 text-danger">
            <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          </div>
          <p className="text-text-primary font-medium">Failed to load chart</p>
          <p className="text-sm text-text-muted mt-1">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className={cn('rounded-2xl border border-glass-border bg-card overflow-hidden', className)}>
      <div className="flex items-center justify-between p-6 border-b border-glass-border">
        <div>
          <h3 className="text-lg font-semibold text-text-primary">{title}</h3>
          {subtitle && <p className="text-sm text-text-muted">{subtitle}</p>}
        </div>
        {action && <div>{action}</div>}
      </div>
      <div className="p-6">
        {React.Children.count(children) === 0 ? (
          <div className="flex flex-col items-center justify-center min-h-[200px] text-center p-4">
            <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-xl bg-surface-hover text-text-muted/50">
              <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
            </div>
            <p className="text-text-primary font-medium">{emptyMessage}</p>
          </div>
        ) : (
          <div style={{ width: '100%', height: '100%' }}>{children}</div>
        )}
      </div>
    </div>
  );
}
export default ChartCard;