/**
 * Skeleton — Loading placeholder with animation.
 */

import { forwardRef, type HTMLAttributes } from 'react';
import { cn } from '../utils';

export interface SkeletonProps extends HTMLAttributes<HTMLDivElement> {
  variant?: 'text' | 'circular' | 'rectangular' | 'card';
  width?: string | number;
  height?: string | number;
  lines?: number;
}

const variantStyles = {
  text: 'h-4 rounded-full',
  circular: 'rounded-full',
  rectangular: 'rounded-xl',
  card: 'rounded-2xl',
} as const;

export const Skeleton = forwardRef<HTMLDivElement, SkeletonProps>(
  ({ variant = 'text', width, height, lines, className, style, ...props }, ref) => {
    if (lines && lines > 1) {
      return (
        <div ref={ref} className={cn('space-y-3', className)} {...props}>
          {Array.from({ length: lines }).map((_, i) => (
            <div
              key={i}
              className={cn(variantStyles[variant], i === lines - 1 && 'w-3/4')}
              style={{
                ...style,
                width: i === lines - 1 ? width : undefined,
                height,
              }}
            />
          ))}
        </div>
      );
    }

    return (
      <div
        ref={ref}
        className={cn(
          'animate-pulse bg-text-muted/20',
          variantStyles[variant],
          className
        )}
        style={{
          ...style,
          width,
          height: height || (variant === 'text' ? '1rem' : variant === 'circular' ? '1rem' : undefined),
        }}
        aria-hidden="true"
        {...props}
      />
    );
  }
);

Skeleton.displayName = 'Skeleton';

/**
 * SkeletonCard — Pre-built card skeleton for content loading.
 */
export const SkeletonCard = () => (
  <div className="rounded-2xl border border-glass-border bg-surface p-6 space-y-4 animate-pulse">
    <div className="flex items-center gap-4">
      <div className="h-12 w-12 rounded-xl bg-text-muted/20" />
      <div className="flex-1 space-y-2">
        <div className="h-4 w-3/4 rounded bg-text-muted/20" />
        <div className="h-3 w-1/2 rounded bg-text-muted/20" />
      </div>
    </div>
    <div className="h-24 w-full rounded-xl bg-text-muted/20" />
    <div className="flex items-center gap-2">
      <div className="h-8 w-20 rounded-full bg-text-muted/20" />
      <div className="h-8 w-20 rounded-full bg-text-muted/20" />
    </div>
  </div>
);

export default Skeleton;