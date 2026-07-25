/**
 * DropdownMenu — Accessible popup menu primitive.
 * Uses Portal for DOM placement, useClickOutside for dismiss,
 * ArrowKeys for keyboard nav, AnimatePresence for enter/exit animation.
 *
 * Subcomponents: DropdownMenu, DropdownMenuTrigger, DropdownMenuContent,
 * DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuGroup.
 */

'use client';

import {
  createContext,
  useContext,
  forwardRef,
  useState,
  useRef,
  useEffect,
  useCallback,
  type ReactNode,
  type ButtonHTMLAttributes,
} from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '../utils';
import { Portal } from '../primitives/Portal';
import { useClickOutside } from '../hooks';

/* ─── Context ─── */

interface DropdownMenuContextValue {
  open: boolean;
  setOpen: (open: boolean) => void;
  triggerRef: React.RefObject<HTMLButtonElement | null>;
  contentRef: React.RefObject<HTMLDivElement | null>;
}

const DropdownMenuContext = createContext<DropdownMenuContextValue | null>(null);

function useDropdownMenuContext() {
  const context = useContext(DropdownMenuContext);
  if (!context) {
    throw new Error('DropdownMenu components must be used within a DropdownMenu');
  }
  return context;
}

/* ─── Root ─── */

export interface DropdownMenuProps {
  children: ReactNode;
  className?: string;
}

export const DropdownMenu = ({ children, className }: DropdownMenuProps) => {
  const [open, setOpen] = useState(false);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);

  return (
    <DropdownMenuContext.Provider value={{ open, setOpen, triggerRef, contentRef }}>
      <div className={cn('relative inline-block', className)}>{children}</div>
    </DropdownMenuContext.Provider>
  );
};

/* ─── Trigger ─── */

export interface DropdownMenuTriggerProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  children: ReactNode;
}

export const DropdownMenuTrigger = forwardRef<HTMLButtonElement, DropdownMenuTriggerProps>(
  ({ children, className, ...props }, ref) => {
    const { setOpen, open, triggerRef: contextTriggerRef } = useDropdownMenuContext();
    const mergedRef = (el: HTMLButtonElement | null) => {
      if (typeof ref === 'function') {
        ref(el);
      } else if (ref && 'current' in ref) {
        ref.current = el;
      }
      contextTriggerRef.current = el;
    };

    return (
      <button
        ref={mergedRef}
        type="button"
        className={cn('flex items-center gap-1 cursor-pointer', className)}
        aria-haspopup="menu"
        aria-expanded={open}
        onClick={() => setOpen(!open)}
        {...props}
      >
        {children}
      </button>
    );
  }
);
DropdownMenuTrigger.displayName = 'DropdownMenuTrigger';

/* ─── Content ─── */

export interface DropdownMenuContentProps {
  children: ReactNode;
  className?: string;
  side?: 'top' | 'bottom';
  align?: 'start' | 'center' | 'end';
}

export const DropdownMenuContent = ({
  children,
  className,
  side = 'bottom',
  align: _align = 'start',
}: DropdownMenuContentProps) => {
  const { open, setOpen, contentRef } = useDropdownMenuContext();
  const [menuItems, setMenuItems] = useState<HTMLElement[]>([]);

  const collectItems = useCallback(() => {
    if (contentRef.current) {
      const items = Array.from(
        contentRef.current.querySelectorAll<HTMLElement>('[role="menuitem"]:not([disabled])')
      );
      setMenuItems(items);
    }
  }, [contentRef]);

  useEffect(() => {
    if (open) {
      const timer = setTimeout(collectItems, 50);
      return () => clearTimeout(timer);
    }
  }, [open, children, collectItems]);

  useEffect(() => {
    if (!open) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        setOpen(false);
        return;
      }

      const currentItems = Array.from(
        contentRef.current?.querySelectorAll<HTMLElement>('[role="menuitem"]:not([disabled])') ?? []
      );
      if (currentItems.length === 0) return;

      const activeEl = document.activeElement;
      const currentIdx = currentItems.indexOf(activeEl as HTMLElement);

      if (e.key === 'ArrowDown') {
        e.preventDefault();
        const nextIdx = currentIdx < currentItems.length - 1 ? currentIdx + 1 : 0;
        currentItems[nextIdx]?.focus();
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        const prevIdx = currentIdx > 0 ? currentIdx - 1 : currentItems.length - 1;
        currentItems[prevIdx]?.focus();
      } else if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        (activeEl as HTMLElement)?.click();
        setOpen(false);
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [open, setOpen, contentRef]);

  useEffect(() => {
    if (open && menuItems.length > 0) {
      menuItems[0]?.focus();
    }
  }, [open, menuItems]);

  useClickOutside(contentRef, () => setOpen(false));

  return (
    <AnimatePresence>
      {open && (
        <Portal>
          <motion.div
            ref={contentRef}
            initial={{ opacity: 0, scale: 0.95, y: side === 'top' ? 8 : -8 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: side === 'top' ? 8 : -8 }}
            transition={{ duration: 0.15, ease: 'easeOut' }}
            className={cn(
              'fixed z-50 min-w-[180px] max-w-[280px]',
              'bg-surface-raised rounded-xl border border-glass-border shadow-lg',
              'p-1.5 overflow-hidden',
              className
            )}
            role="menu"
            aria-orientation="vertical"
          >
            {children}
          </motion.div>
        </Portal>
      )}
    </AnimatePresence>
  );
};
DropdownMenuContent.displayName = 'DropdownMenuContent';

/* ─── Item ─── */

export interface DropdownMenuItemProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  inset?: boolean;
  destructive?: boolean;
}

export const DropdownMenuItem = forwardRef<HTMLButtonElement, DropdownMenuItemProps>(
  ({ children, inset = false, destructive = false, disabled, className, onClick, ...props }, ref) => (
    <button
      ref={ref}
      type="button"
      disabled={disabled}
      role="menuitem"
      tabIndex={-1}
      className={cn(
        'flex w-full items-center gap-2 px-3 py-2 text-sm rounded-lg text-left',
        'text-text-primary hover:bg-surface-hover',
        'focus:outline-none focus:bg-surface-hover',
        'disabled:opacity-50 disabled:cursor-not-allowed',
        destructive && 'text-danger hover:bg-danger-soft',
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

/* ─── Label ─── */

export interface DropdownMenuLabelProps {
  children: ReactNode;
  className?: string;
}

export function DropdownMenuLabel({ children, className }: DropdownMenuLabelProps) {
  return (
    <div
      className={cn(
        'px-3 py-1.5 text-xs font-semibold uppercase tracking-wider text-text-muted',
        className
      )}
      role="presentation"
    >
      {children}
    </div>
  );
}

/* ─── Separator ─── */

export interface DropdownMenuSeparatorProps {
  className?: string;
}

export function DropdownMenuSeparator({ className }: DropdownMenuSeparatorProps) {
  return (
    <hr
      className={cn('-mx-1.5 my-1 border-glass-border', className)}
      role="separator"
      aria-orientation="horizontal"
    />
  );
}

/* ─── Group ─── */

export interface DropdownMenuGroupProps {
  children: ReactNode;
  className?: string;
}

export function DropdownMenuGroup({ children, className }: DropdownMenuGroupProps) {
  return <div className={cn('space-y-0.5', className)} role="group">{children}</div>;
}

export default DropdownMenu;