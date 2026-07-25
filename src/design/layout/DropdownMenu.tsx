/**
 * DropdownMenu — Accessible dropdown menu component.
 */

'use client';

import { type ReactNode, forwardRef, useRef, useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { cn } from '../utils/helpers';
import { Portal } from '../primitives/Portal';

interface DropdownMenuProps {
  children: ReactNode;
  className?: string;
}

export const DropdownMenu = ({ children, className }: DropdownMenuProps) => {
  return <div className={cn('relative inline-block', className)}>{children}</div>;
};

interface DropdownMenuTriggerProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  children: ReactNode;
}

export const DropdownMenuTrigger = forwardRef<HTMLButtonElement, DropdownMenuTriggerProps>(
  ({ children, className, ...props }, ref) => (
    <button
      ref={ref}
      type="button"
      className={cn('flex items-center gap-1', className)}
      aria-haspopup="menu"
      aria-expanded="false"
      {...props}
    >
      {children}
    </button>
  )
);
DropdownMenuTrigger.displayName = 'DropdownMenuTrigger';

interface DropdownMenuContentProps {
  children: ReactNode;
  className?: string;
  side?: 'top' | 'bottom' | 'left' | 'right';
  align?: 'start' | 'center' | 'end';
}

export const DropdownMenuContent = ({ children, className, side = 'bottom', align = 'start' }: DropdownMenuContentProps) => {
  const [open, setOpen] = useState(false);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false);
    };
    if (open) {
      document.addEventListener('keydown', handleKeyDown);
    }
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [open]);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (contentRef.current && !contentRef.current.contains(e.target as Node)) {
        if (triggerRef.current && !triggerRef.current.contains(e.target as Node)) {
          setOpen(false);
        }
      }
    };
    if (open) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [open]);

  return (
    <>
      <DropdownMenuTrigger
        ref={triggerRef}
        onClick={() => setOpen(!open)}
        aria-expanded={open}
      >
        {children}
      </DropdownMenuTrigger>

      {open && (
        <Portal>
          <motion.div
            ref={contentRef}
            initial={{ opacity: 0, scale: 0.95, y: side === 'top' ? 8 : -8 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: side === 'top' ? 8 : -8 }}
            transition={{ duration: 0.15 }}
            className={cn(
              'fixed z-50 min-w-[200px] bg-surface-raised rounded-xl border border-glass-border shadow-lg p-1',
              'data-[side=bottom]:top-full data-[side=top]:bottom-full data-[side=left]:right-full data-[side=right]:left-full',
              'data-[align=start]:left-0 data-[align=end]:right-0',
              className
            )}
            style={{
              top: side === 'bottom' ? 'calc(100% + 4px)' : undefined,
              bottom: side === 'top' ? 'calc(100% + 4px)' : undefined,
              left: align === 'start' ? 0 : undefined,
              right: align === 'end' ? 0 : undefined,
            }}
            role="menu"
          >
            {children}
          </motion.div>
        </Portal>
      )}
    </>
  );
};
DropdownMenuContent.displayName = 'DropdownMenuContent';

interface DropdownMenuItemProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  inset?: boolean;
  disabled?: boolean;
}

export const DropdownMenuItem = forwardRef<HTMLButtonElement, DropdownMenuItemProps>(
  ({ children, inset = false, disabled = false, className, onClick, ...props }, ref) => (
    <button
      ref={ref}
      type="button"
      disabled={disabled}
      role="menuitem"
      tabIndex={-1}
      className={cn(
        'flex w-full items-center gap-2 px-3 py-2 text-sm rounded-lg',
        'text-text-primary hover:bg-surface-hover',
        'focus:outline-none focus:bg-surface-hover',
        'disabled:opacity-50 disabled:cursor-not-allowed',
        inset && 'pl-8',
        className
      )}
      onClick={(e) => {
        if (!disabled) onClick?.(e);
      }}
      {...props}
    >
      {children}
    </button>
  )
);
DropdownMenuItem.displayName = 'DropdownMenuItem';

interface DropdownMenuLabelProps {
  children: ReactNode;
  className?: string;
}

export function DropdownMenuLabel({ children, className }: DropdownMenuLabelProps) {
  return (
    <p className={cn('px-3 py-1.5 text-xs font-semibold uppercase tracking-wider text-text-muted', className)}>
      {children}
    </p>
  );
}

interface DropdownMenuSeparatorProps {
  className?: string;
}

export function DropdownMenuSeparator({ className }: DropdownMenuSeparatorProps) {
  return <hr className={cn('my-1 border-glass-border', className)} />;
}

interface DropdownMenuGroupProps {
  children: ReactNode;
  className?: string;
}

export function DropdownMenuGroup({ children, className }: DropdownMenuGroupProps) {
  return <div className={cn('space-y-0.5', className)} role="group">{children}</div>;
}

export default DropdownMenu;