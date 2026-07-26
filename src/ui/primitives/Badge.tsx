'use client';

import * as React from 'react';
import { cn } from '../utils/cn';

export const badgeVariants = {
  default: 'bg-surface-raised text-text-secondary border border-glass-border',
  primary: 'bg-champagne/10 text-champagne border-champagne/20',
  secondary: 'bg-surface-hover text-text-secondary border-glass-border',
  success: 'bg-success-soft text-success border-success/20',
  warning: 'bg-warning-soft text-warning border-warning/20',
  danger: 'bg-danger-soft text-danger border-danger/20',
  info: 'bg-info-soft text-info border-info/20',
  outline: 'bg-transparent border-glass-border text-text-secondary',
  ghost: 'bg-transparent border-none text-text-muted',
} as const;

export type BadgeVariant = keyof typeof badgeVariants;

export const badgeSizes = {
  xs: 'px-2 py-0.5 text-[10px]',
  sm: 'px-2.5 py-1 text-xs',
  md: 'px-3 py-1 text-sm',
  lg: 'px-4 py-1.5 text-base',
} as const;

export type BadgeSize = keyof typeof badgeSizes;

interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: BadgeVariant;
  size?: BadgeSize;
  dot?: boolean;
  dotColor?: string;
}

const Badge = React.forwardRef<HTMLSpanElement, BadgeProps>(
  ({ className, variant = 'default', size = 'md', dot, dotColor, children, ...props }, ref) => {
    return (
      <span
        ref={ref}
        className={cn(
          'inline-flex items-center gap-1.5 font-medium rounded-full',
          badgeVariants[variant],
          badgeSizes[size],
          className
        )}
        {...props}
      >
        {dot && <span className={cn('h-1.5 w-1.5 rounded-full', dotColor ? `bg-[${dotColor}]` : 'bg-current')} aria-hidden="true" />}
        {children}
      </span>
    );
  }
);
Badge.displayName = 'Badge';

export { Badge };
export type { BadgeProps };