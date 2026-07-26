'use client';

import * as React from 'react';
import { cn } from '../utils/cn';

interface StatCardProps {
  title: string;
  value: string | number;
  change?: {
    value: number;
    label?: string;
    positive?: boolean;
  };
  icon?: React.ReactNode;
  trend?: 'up' | 'down' | 'neutral';
  sparkline?: number[];
  className?: string;
  children?: React.ReactNode;
}

export function StatCard({
  title,
  value,
  change,
  icon,
  trend,
  sparkline,
  className,
  children,
}: StatCardProps) {
  return (
    <div className={cn('rounded-2xl border border-glass-border bg-card p-6 transition-all duration-200 hover:shadow-md hover:border-glass-border-hover', className)}>
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1 min-w-0">
          <p className="text-xs font-medium uppercase tracking-[0.1em] text-text-muted/70">{title}</p>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-3xl font-bold tracking-tight text-text-primary tabular-nums">{value}</span>
            {change && (
              <span className={cn(
                'inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold',
                change.positive ? 'bg-success-soft text-success' : 'bg-danger-soft text-danger'
              )}>
                {change.positive ? '↑' : '↓'}
                {Math.abs(change.value).toFixed(1)}%
                {change.label && <span className="text-text-muted/70">{change.label}</span>}
              </span>
            )}
          </div>
          {children && <div className="mt-3">{children}</div>}
        </div>
        <div className="flex-shrink-0 flex items-center justify-center">
          {icon && <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-champagne/10 text-champagne">{icon}</div>}
          {trend && !icon && (
            <div className={cn('text-2xl font-bold', trend === 'up' ? 'text-success' : trend === 'down' ? 'text-danger' : 'text-text-muted')}>
              {trend === 'up' ? '↑' : trend === 'down' ? '↓' : '→'}
            </div>
          )}
        </div>
      </div>
      {sparkline && sparkline.length > 1 && (
        <div className="mt-4 h-12" aria-hidden="true">
          <svg viewBox={`0 0 ${sparkline.length * 10} 40`} className="w-full h-full" preserveAspectRatio="none">
            <defs>
              <linearGradient id="sparkline-gradient" x1="0%" y1="0%" x2="0%" y2="100%">
                <stop offset="0%" stopColor="currentColor" stopOpacity="0.3" />
                <stop offset="100%" stopColor="currentColor" stopOpacity="0" />
              </linearGradient>
            </defs>
            <path
              d={sparkline.map((point, i) => {
                const x = i * 10;
                const y = 40 - (point / Math.max(...sparkline)) * 35;
                return `${i === 0 ? 'M' : 'L'} ${x} ${y}`;
              }).join(' ')}
              stroke="currentColor"
              strokeWidth="2"
              fill="url(#sparkline-gradient)"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="text-champagne/50"
            />
          </svg>
        </div>
      )}
    </div>
  );
}
export default StatCard;