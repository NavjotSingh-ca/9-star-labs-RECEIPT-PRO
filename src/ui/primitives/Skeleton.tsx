'use client';

import { cn } from '../utils/cn';

export interface SkeletonProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: 'text' | 'circular' | 'rectangular' | 'card';
  animation?: 'pulse' | 'wave' | 'none';
}

export function Skeleton({ className, variant = 'text', animation = 'pulse', ...props }: SkeletonProps) {
  const baseStyles = 'bg-surface-raised rounded overflow-hidden';

  const variantStyles = {
    text: 'h-4 w-full',
    circular: 'rounded-full aspect-square',
    rectangular: 'rounded-xl',
    card: 'rounded-2xl',
  };

  const animationStyles = {
    pulse: 'animate-pulse',
    wave: 'animate-[shimmer_1.5s_ease-in-out_infinite] bg-gradient-to-r from-surface-raised via-surface-hover to-surface-raised bg-[length:200%_100%]',
    none: '',
  };

  return (
    <div
      className={cn(baseStyles, variantStyles[variant], animationStyles[animation], className)}
      {...props}
    />
  );
}

export function SkeletonCard({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div className={cn('flex flex-col gap-4 p-5', className)} {...props}>
      <Skeleton variant="circular" className="h-10 w-10" />
      <div className="space-y-3">
        <Skeleton variant="text" className="h-4 w-3/4" />
        <Skeleton variant="text" className="h-4 w-1/2" />
        <Skeleton variant="text" className="h-4 w-5/6" />
      </div>
    </div>
  );
}

export function SkeletonTableRow({ columns = 4, className, ...props }: React.HTMLAttributes<HTMLDivElement> & { columns?: number }) {
  return (
    <div className={cn('flex items-center gap-4 p-3', className)} {...props}>
      {Array.from({ length: columns }).map((_, i) => (
        <Skeleton key={i} variant="text" className="h-4 w-24" />
      ))}
    </div>
  );
}