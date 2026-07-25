/**
 * Badge — Status indicator and label component.
 */

import { forwardRef, type HTMLAttributes, type ReactNode } from 'react';
import { cn } from '../utils';

export interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
  variant?: 'default' | 'success' | 'warning' | 'danger' | 'info' | 'outline' | 'champagne';
  size?: 'sm' | 'md' | 'lg';
  dot?: boolean;
  children: ReactNode;
}

const variantStyles = {
  default: 'bg-text-muted/10 text-text-secondary border border-glass-border',
  success: 'bg-success-soft text-success border border-success/20',
  warning: 'bg-warning-soft text-warning border border-warning/20',
  danger: 'bg-danger-soft text-danger border border-danger/20',
  info: 'bg-info-soft text-info border border-info/20',
  outline: 'bg-transparent text-text-secondary border border-glass-border',
  champagne: 'bg-champagne-soft text-champagne-dim border border-champagne/20',
} as const;

const sizeStyles = {
  sm: 'px-2 py-0.5 text-xs',
  md: 'px-2.5 py-1 text-xs',
  lg: 'px-3 py-1 text-sm',
} as const;

export const Badge = forwardRef<HTMLSpanElement, BadgeProps>(
  ({ children, variant = 'default', size = 'md', dot = false, className, ...props }, ref) => {
    return (
      <span
        ref={ref}
        className={cn(
          'inline-flex items-center gap-1.5 font-medium rounded-full',
          'transition-colors duration-200',
          variantStyles[variant],
          sizeStyles[size],
          className
        )}
        {...props}
      >
        {dot && (
          <span
            className={cn(
              'h-1.5 w-1.5 rounded-full flex-shrink-0',
              variant === 'success' && 'bg-success',
              variant === 'warning' && 'bg-warning',
              variant === 'danger' && 'bg-danger',
              variant === 'info' && 'bg-info',
              variant === 'champagne' && 'bg-champagne',
              variant === 'default' && 'bg-text-muted',
              variant === 'outline' && 'bg-text-muted'
            )}
            aria-hidden="true"
          />
        )}
        {children}
      </span>
    );
  }
);

Badge.displayName = 'Badge';

export default Badge;