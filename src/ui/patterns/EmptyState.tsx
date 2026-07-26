'use client';

import * as React from 'react';
import { cn } from '../utils/cn';

interface EmptyStateProps {
  icon?: React.ReactNode;
  title: string;
  description?: string;
  action?: React.ReactNode;
  secondaryAction?: React.ReactNode;
  className?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
}

const sizeClasses = {
  sm: 'py-8 px-4',
  md: 'py-12 px-6',
  lg: 'py-16 px-8',
  xl: 'py-20 px-10',
};

export function EmptyState({ icon, title, description, action, secondaryAction, className, size = 'md' }: EmptyStateProps) {
  return (
    <div className={cn('flex flex-col items-center justify-center text-center rounded-2xl border border-glass-border bg-card', sizeClasses[size], className)}>
      {icon && (
        <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-xl bg-champagne/10 text-champagne" aria-hidden="true">
          {icon}
        </div>
      )}
      <h3 className="text-xl font-semibold text-text-primary mb-2">{title}</h3>
      {description && <p className="text-base text-text-muted max-w-md mx-auto mb-6">{description}</p>}
      <div className="flex flex-col sm:flex-row items-center justify-center gap-3 w-full max-w-xs">
        {action}
        {secondaryAction}
      </div>
    </div>
  );
}
export default EmptyState;