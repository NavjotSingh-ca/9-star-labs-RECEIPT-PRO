/**
 * Spinner — Loading indicator with multiple sizes and styles.
 */

import { forwardRef, type HTMLAttributes } from 'react';
import { cn } from '../utils';

export interface SpinnerProps extends HTMLAttributes<HTMLDivElement> {
  size?: 'sm' | 'md' | 'lg' | 'xl';
  color?: 'champagne' | 'primary' | 'white' | 'muted';
  thickness?: number;
}

const sizeStyles = {
  sm: 'h-4 w-4',
  md: 'h-6 w-6',
  lg: 'h-8 w-8',
  xl: 'h-12 w-12',
} as const;

const colorStyles = {
  champagne: 'text-champagne',
  primary: 'text-text-primary',
  white: 'text-white',
  muted: 'text-text-muted',
} as const;

export const Spinner = forwardRef<HTMLDivElement, SpinnerProps>(
  ({ size = 'md', color = 'champagne', thickness = 3, className, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn('inline-flex', className)}
        role="status"
        aria-label="Loading"
        {...props}
      >
        <svg
          className={cn('animate-spin', sizeStyles[size], colorStyles[color])}
          viewBox="0 0 24 24"
          fill="none"
          aria-hidden="true"
        >
          <circle
            className="opacity-25"
            cx="12"
            cy="12"
            r="10"
            stroke="currentColor"
            strokeWidth={thickness}
          />
          <path
            className="opacity-75"
            fill="currentColor"
            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
          />
        </svg>
      </div>
    );
  }
);

Spinner.displayName = 'Spinner';

/**
 * SpinnerOverlay — Full-screen or container-centered spinner.
 */
export const SpinnerOverlay = ({ size = 'lg', color = 'champagne', className, ...props }: SpinnerProps) => (
  <div
    className={cn(
      'fixed inset-0 z-50 flex items-center justify-center bg-obsidian/50 backdrop-blur-sm',
      className
    )}
    role="status"
    aria-label="Loading"
    {...props}
  >
    <Spinner size={size} color={color} />
  </div>
);

export default Spinner;