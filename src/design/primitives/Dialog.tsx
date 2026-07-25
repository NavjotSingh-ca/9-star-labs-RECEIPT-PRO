/**
 * Dialog — Accessible modal dialog using native <dialog> element.
 * Uses Radix UI Dialog for advanced features, but this is a lightweight wrapper.
 */

import { forwardRef, type HTMLAttributes, type ReactNode, useEffect, useRef, useState } from 'react';
import React from 'react';
import { cn } from '@design/utils';
import { X } from 'lucide-react';
import { Button } from './Button';

export interface DialogProps extends HTMLAttributes<HTMLDialogElement> {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title?: string;
  description?: string;
  children: ReactNode;
  size?: 'sm' | 'md' | 'lg' | 'xl' | 'full';
  closeOnOverlayClick?: boolean;
  showClose?: boolean;
}

const sizeStyles = {
  sm: 'max-w-sm',
  md: 'max-w-md',
  lg: 'max-w-lg',
  xl: 'max-w-xl',
  full: 'max-w-4xl',
} as const;

export const Dialog = forwardRef<HTMLDialogElement, DialogProps>(
  (
    {
      open,
      onOpenChange,
      title,
      description,
      children,
      size = 'md',
      closeOnOverlayClick = true,
      showClose = true,
      className,
      ...props
    },
    _ref
  ) => {
    const dialogRef = useRef<HTMLDialogElement>(null);
    const previousActiveElement = useRef<HTMLElement | null>(null);

    useEffect(() => {
      const dialog = dialogRef.current;
      if (!dialog) return;

      if (open) {
        previousActiveElement.current = document.activeElement as HTMLElement;
        dialog.showModal();
        // Focus first focusable element
        setTimeout(() => {
          const focusable = dialog.querySelector<HTMLElement>(
            'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
          );
          focusable?.focus();
        }, 0);
      } else {
        dialog.close();
        previousActiveElement.current?.focus();
      }

      const handleClose = (e: Event) => {
        if (e.target === dialog && closeOnOverlayClick) {
          onOpenChange(false);
        }
      };

      dialog.addEventListener('click', handleClose);
      return () => {
        dialog.removeEventListener('click', handleClose);
      };
    }, [open, onOpenChange, closeOnOverlayClick]);

    const handleKeyDown = (e: React.KeyboardEvent) => {
      if (e.key === 'Escape') {
        onOpenChange(false);
      }
    };

    if (!open) return null;

    return (
      <dialog
        ref={dialogRef}
        className={cn(
          'fixed inset-0 z-50 m-auto rounded-2xl bg-surface p-0 shadow-2xl border border-glass-border',
          'max-h-[90vh] overflow-y-auto',
          sizeStyles[size],
          className
        )}
        onKeyDown={handleKeyDown}
        {...props}
      >
        <div className="relative">
          {(title || showClose) && (
            <div className="flex items-start justify-between gap-4 p-6 border-b border-glass-border sticky top-0 bg-surface/95 backdrop-blur z-10">
              <div>
                {title && (
                  <h2 id={title ? 'dialog-title' : undefined} className="text-lg font-semibold text-text-primary">
                    {title}
                  </h2>
                )}
                {description && (
                  <p id={description ? 'dialog-description' : undefined} className="mt-1 text-sm text-text-muted">
                    {description}
                  </p>
                )}
              </div>
              {showClose && (
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => onOpenChange(false)}
                  aria-label="Close dialog"
                >
                  <X className="h-5 w-5" aria-hidden="true" />
                </Button>
              )}
            </div>
          )}
          <div className="p-6" role="document" aria-labelledby={title ? 'dialog-title' : undefined} aria-describedby={description ? 'dialog-description' : undefined}>
            {children}
          </div>
        </div>
        <form method="dialog" className="hidden">
          <button>Close</button>
        </form>
      </dialog>
    );
  }
);

Dialog.displayName = 'Dialog';

/**
 * DialogTrigger — Button that opens a dialog.
 */
interface DialogTriggerProps {
  children: ReactNode;
  dialog: React.ReactElement<DialogProps>;
}

export const DialogTrigger = ({ children, dialog }: DialogTriggerProps) => {
  const [open, setOpen] = useState(false);

  return (
    <>
      {React.cloneElement(children as React.ReactElement<{ onClick: () => void }>, {
        onClick: () => setOpen(true),
      })}
      {React.cloneElement(dialog, { open, onOpenChange: setOpen })}
    </>
  );
};

DialogTrigger.displayName = 'DialogTrigger';

export default Dialog;