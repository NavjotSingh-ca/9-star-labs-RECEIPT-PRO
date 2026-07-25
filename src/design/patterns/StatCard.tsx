/**
 * StatCard — Key metric display card with trend indicator.
 */

import { type ReactNode } from 'react';
import { cn } from '@design/utils/helpers';
import { Card, CardContent } from '@design/primitives/Card';
import { Badge } from '@design/primitives/Badge';
import { Sparkline } from './Sparkline';

export interface StatCardProps {
  label: string;
  value: string | number;
  trend?: {
    value: number;
    label?: string;
    positive?: boolean;
  } | null;
  sparklineData?: number[];
  icon?: ReactNode;
  variant?: 'default' | 'highlight' | 'warning';
  className?: string;
  onClick?: () => void;
}

export function StatCard({
  label,
  value,
  trend,
  sparklineData,
  icon,
  variant = 'default',
  className,
  onClick,
}: StatCardProps) {
  const variantStyles = {
    default: '',
    highlight: 'border-champagne/30 bg-champagne-soft/30',
    warning: 'border-warning/30 bg-warning-soft/30',
  };

  return (
    <Card
      variant="default"
      padding="md"
      className={cn(
        'transition-all duration-200',
        onClick && 'cursor-pointer hover:shadow-md hover:border-glass-border-hover',
        variantStyles[variant],
        className
      )}
      onClick={onClick}
      role={onClick ? 'button' : undefined}
      tabIndex={onClick ? 0 : undefined}
      onKeyDown={onClick ? (e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onClick(); }} : undefined}
    >
      <CardContent className="space-y-3">
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1 min-w-0">
            <p className="text-xs font-medium text-text-muted uppercase tracking-wider">
              {label}
            </p>
            <p className="mt-1 text-3xl font-bold text-text-primary tabular-nums">
              {value}
            </p>
            {trend && (
              <div className="mt-2 flex items-center gap-1.5">
                <Badge
                  variant={trend.positive ? 'success' : 'danger'}
                  size="sm"
                  dot
                  className="text-xs"
                >
                  {trend.value >= 0 ? '+' : ''}{trend.value.toFixed(1)}%
                </Badge>
                {trend.label && (
                  <span className="text-xs text-text-muted">{trend.label}</span>
                )}
              </div>
            )}
          </div>
          {icon && (
            <div className="flex-shrink-0 flex h-12 w-12 items-center justify-center rounded-xl bg-champagne/10 text-champagne">
              {icon}
            </div>
          )}
        </div>
        {sparklineData && sparklineData.length > 0 && (
          <Sparkline data={sparklineData} height={40} className="mt-2" />
        )}
      </CardContent>
    </Card>
  );
}

export default StatCard;