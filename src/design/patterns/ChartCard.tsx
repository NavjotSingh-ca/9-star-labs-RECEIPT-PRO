/**
 * ChartCard — Wrapper for charts with consistent header, actions, and loading states.
 */

import { type ReactNode } from 'react';
import { cn } from '@design/utils/helpers';
import { Card, CardHeader, CardContent } from '@design/primitives/Card';
import { Button } from '@design/primitives/Button';
import { Skeleton } from '@design/primitives/Skeleton';

export interface ChartCardProps {
  title: string;
  description?: string;
  children: ReactNode;
  action?: ReactNode;
  loading?: boolean;
  error?: string;
  onRetry?: () => void;
  className?: string;
  headerClassName?: string;
}

export function ChartCard({
  title,
  description,
  children,
  action,
  loading = false,
  error,
  onRetry,
  className,
  headerClassName,
}: ChartCardProps) {
  return (
    <Card variant="default" padding="none" className={cn('overflow-hidden', className)}>
      <CardHeader className={cn('p-4 border-b border-glass-border', headerClassName)}>
        <h3 className="text-lg font-semibold text-text-primary">{title}</h3>
        {description && <p className="mt-1 text-sm text-text-muted">{description}</p>}
        {action && <div className="mt-2">{action}</div>}
      </CardHeader>
      <CardContent className="p-4">
        {error && (
          <div className="flex flex-col items-center justify-center gap-3 p-8 text-center">
            <p className="text-text-muted">{error}</p>
            {onRetry && (
              <Button variant="outline" size="sm" onClick={onRetry}>
                Try again
              </Button>
            )}
          </div>
        )}
        {loading && !error ? (
          <div className="space-y-4" role="status" aria-label="Loading chart">
            <Skeleton variant="rectangular" className="h-[200px] w-full" />
            <Skeleton variant="text" lines={2} className="w-1/2" />
          </div>
        ) : (
          <div style={{ width: '100%', height: '100%' }}>
            {children}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export default ChartCard;