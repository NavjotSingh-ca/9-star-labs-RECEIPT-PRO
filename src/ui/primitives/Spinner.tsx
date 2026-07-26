'use client';

import { cn } from '../utils/cn';

export interface SpinnerProps extends React.SVGAttributes<SVGSVGElement> {
  size?: 'sm' | 'md' | 'lg' | 'xl';
  variant?: 'default' | 'brand' | 'inverse';
}

export function Spinner({ className, size = 'md', variant = 'default', ...props }: SpinnerProps) {
  const sizeClasses = {
    sm: 'h-4 w-4',
    md: 'h-6 w-6',
    lg: 'h-8 w-8',
    xl: 'h-10 w-10',
  };

  const variantClasses = {
    default: 'text-champagne',
    brand: 'text-champagne',
    inverse: 'text-obsidian',
  };

  return (
    <svg
      className={cn('animate-spin', sizeClasses[size], variantClasses[variant], className)}
      xmlns="http://www.w3.org/2000/svg"
      fill="none"
      viewBox="0 0 24 24"
      aria-hidden="true"
      {...props}
    >
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" />
      <path
        className="opacity-75"
        fill="currentColor"
        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
      />
    </svg>
  );
}

export function PremiumSpinner({ className, size = 'md', ...props }: React.HTMLAttributes<HTMLDivElement> & { size?: 'sm' | 'md' | 'lg' }) {
  const sizeClasses = {
    sm: 'h-6 w-6',
    md: 'h-10 w-10',
    lg: 'h-14 w-14',
  };

  return (
    <div className={cn('relative', sizeClasses[size], className)} {...props}>
      <svg className="absolute inset-0 animate-spin text-champagne/30" viewBox="0 0 40 40" aria-hidden="true">
        <circle cx="20" cy="20" r="18" fill="none" strokeWidth="3" />
      </svg>
      <svg className="relative text-champagne" viewBox="0 0 40 40" aria-hidden="true">
        <circle cx="20" cy="20" r="18" fill="none" strokeWidth="3" strokeLinecap="round">
          <animate
            attributeName="stroke-dasharray"
            dur="1.5s"
            repeatCount="indefinite"
            values="0,150; 75,75; 150,0; 0,150"
          />
          <animate
            attributeName="stroke-dashoffset"
            dur="1.5s"
            repeatCount="indefinite"
            values="0; -45; -180"
          />
        </circle>
      </svg>
    </div>
  );
}