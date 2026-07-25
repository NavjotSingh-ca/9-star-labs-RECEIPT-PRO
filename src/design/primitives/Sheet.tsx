/**
 * Sheet — Mobile-first slide-up drawer/sidebar.
 * Supports bottom sheet on mobile, sidebar on desktop.
 */

import { forwardRef, type HTMLAttributes, type ReactNode, useEffect, useRef } from 'react';
import { cn } from '@design/utils/helpers';
import { X } from 'lucide-react';
import { Button } from './Button';

export interface SheetProps extends HTMLAttributes<HTMLDivElement> {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title?: string;
  description?: string;
  children: ReactNode;
  side?: 'bottom' | 'left' | 'right' | 'top';
  size?: 'sm' | 'md' | 'lg' | 'xl' | 'full';
  closeOnOverlayClick?: boolean;
  showClose?: boolean;
  showHandle?: boolean;
}

const sideStyles = {
  bottom: 'bottom-0 left-0 right-0 rounded-t-2xl',
  left: 'left-0 top-0 bottom-0 rounded-r-2xl',
  right: 'right-0 top-0 bottom-0 rounded-l-2xl',
  top: 'top-0 left-0 right-0 rounded-b-2xl',
} as const;

const sizeStyles = {
  sm: 'max-h-[30vh] w-full',
  md: 'max-h-[50vh] w-full',
  lg: 'max-h-[70vh] w-full',
  xl: 'max-h-[85vh] w-full',
  full: 'h-full w-full',
} as const;

export const Sheet = forwardRef<HTMLDivElement, SheetProps>(
  (
    {
      open,
      onOpenChange,
      title,
      description,
      children,
      side = 'bottom',
      size = 'md',
      closeOnOverlayClick = true,
      showClose = true,
      showHandle = side === 'bottom',
      className,
      ...props
    },
    _ref
  ) => {
    const sheetRef = useRef<HTMLDivElement>(null);
    const previousActiveElement = useRef<HTMLElement | null>(null);

    useEffect(() => {
      if (open) {
        previousActiveElement.current = document.activeElement as HTMLElement;
        document.body.style.overflow = 'hidden';
        // Focus first focusable element
        setTimeout(() => {
          const focusable = sheetRef.current?.querySelector<HTMLElement>(
            'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
          );
          focusable?.focus();
        }, 0);
      } else {
        document.body.style.overflow = '';
        previousActiveElement.current?.focus();
      }

      return () => {
        document.body.style.overflow = '';
      };
    }, [open]);

    const handleKeyDown = (e: React.KeyboardEvent) => {
      if (e.key === 'Escape') {
        onOpenChange(false);
      }
    };

    const handleOverlayClick = (e: React.MouseEvent) => {
      if (e.target === e.currentTarget && closeOnOverlayClick) {
        onOpenChange(false);
      }
    };

    if (!open) return null;

    return (
      <div
        className={cn(
          'fixed inset-0 z-50 flex',
          side === 'bottom' && 'items-end',
          side === 'top' && 'items-start',
          side === 'left' && 'items-start justify-start',
          side === 'right' && 'items-start justify-end'
        )}
        onClick={handleOverlayClick}
        role="dialog"
        aria-modal="true"
        aria-labelledby={title ? 'sheet-title' : undefined}
        aria-describedby={description ? 'sheet-description' : undefined}
      >
        {/* Backdrop */}
        <div
          className="absolute inset-0 bg-obsidian/50 backdrop-blur-sm transition-opacity"
          aria-hidden="true"
        />

        {/* Sheet content */}
        <div
          ref={sheetRef}
          className={cn(
            'relative z-10 w-full bg-surface shadow-2xl border border-glass-border overflow-hidden flex flex-col',
            sideStyles[side],
            sizeStyles[size],
            className
          )}
          onKeyDown={handleKeyDown}
          tabIndex={-1}
          {...props}
        >
          {(title || showClose || showHandle) && (
            <div className="flex items-center justify-between gap-4 p-4 border-b border-glass-border sticky top-0 bg-surface/95 backdrop-blur z-10">
              {showHandle && (
                <div
                  className="w-8 h-1 bg-border-default rounded-full mx-auto"
                  aria-hidden="true"
                />
              )}
              <div className="flex-1 min-w-0">
                {title && (
                  <h2 id="sheet-title" className="text-lg font-semibold text-text-primary truncate">
                    {title}
                  </h2>
                )}
                {description && (
                  <p id="sheet-description" className="mt-1 text-sm text-text-muted truncate">
                    {description}
                  </p>
                )}
              </div>
              {showClose && (
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => onOpenChange(false)}
                  aria-label="Close sheet"
                  className="flex-shrink-0"
                >
                  <X className="h-5 w-5" aria-hidden="true" />
                </Button>
              )}
            </div>
          )}
          <div className="flex-1 overflow-y-auto p-4" role="document">
            {children}
          </div>
        </div>
      </div>
    );
  }
);

Sheet.displayName = 'Sheet';

export default Sheet;