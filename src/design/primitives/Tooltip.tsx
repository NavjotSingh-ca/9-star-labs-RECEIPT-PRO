/**
 * Tooltip — Accessible tooltip component using CSS-only approach with Radix-like patterns.
 */

import { forwardRef, type HTMLAttributes, type ReactNode, useState, useRef, useEffect } from 'react';
import { cn } from '../utils';
import { Portal } from './Portal';

export interface TooltipProps extends Omit<HTMLAttributes<HTMLDivElement>, 'content'> {
  content: ReactNode;
  children: ReactNode;
  side?: 'top' | 'bottom' | 'left' | 'right';
  align?: 'start' | 'center' | 'end';
  delay?: number;
  disabled?: boolean;
}

const sideOffset = 8;

export const Tooltip = forwardRef<HTMLDivElement, TooltipProps>(
  (
    {
      content,
      children,
      side = 'top',
      align = 'center',
      delay = 200,
      disabled = false,
      className,
      ...props
    },
    ref
  ) => {
    const [open, setOpen] = useState<boolean>(false);
    const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    const contentRef = useRef<HTMLDivElement>(null);
    const triggerRef = useRef<HTMLElement>(null);

    const show = () => {
      if (disabled) return;
      timeoutRef.current = setTimeout(() => setOpen(true), delay);
    };

    const hide = () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
      setOpen(false);
    };

    // Position tooltip
    useEffect(() => {
      if (!open || !contentRef.current || !triggerRef.current) return;

      const trigger = triggerRef.current.getBoundingClientRect();
      const tooltip = contentRef.current.getBoundingClientRect();
      const viewport = { width: window.innerWidth, height: window.innerHeight };

      let top = 0, left = 0;

      switch (side) {
        case 'top':
          top = trigger.top - tooltip.height - sideOffset;
          if (align === 'start') left = trigger.left;
          else if (align === 'end') left = trigger.right - tooltip.width;
          else left = trigger.left + (trigger.width - tooltip.width) / 2;
          break;
        case 'bottom':
          top = trigger.bottom + sideOffset;
          if (align === 'start') left = trigger.left;
          else if (align === 'end') left = trigger.right - tooltip.width;
          else left = trigger.left + (trigger.width - tooltip.width) / 2;
          break;
        case 'left':
          left = trigger.left - tooltip.width - sideOffset;
          top = trigger.top + (trigger.height - tooltip.height) / 2;
          break;
        case 'right':
          left = trigger.right + sideOffset;
          top = trigger.top + (trigger.height - tooltip.height) / 2;
          break;
      }

      // Clamp to viewport
      left = Math.max(8, Math.min(left, viewport.width - tooltip.width - 8));
      top = Math.max(8, Math.min(top, viewport.height - tooltip.height - 8));

      contentRef.current.style.top = `${top}px`;
      contentRef.current.style.left = `${left}px`;
    }, [open, side, align]);

    return (
      <div ref={ref} className={cn('relative inline-flex', className)} {...props}>
        <span
          ref={triggerRef}
          onMouseEnter={show}
          onMouseLeave={hide}
          onFocus={show}
          onBlur={hide}
          tabIndex={0}
        >
          {children}
        </span>
        {open && (
          <Portal>
            <div
              ref={contentRef}
              className={cn(
                'fixed z-[9999] px-3 py-2 text-xs font-medium text-white bg-obsidian rounded-lg shadow-lg',
                'whitespace-nowrap pointer-events-none animate-in fade-in-0 zoom-in-95 duration-150',
                'data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=closed]:zoom-out-95 data-[state=closed]:duration-100'
              )}
              role="tooltip"
              aria-hidden="true"
            >
              {content}
              <TooltipArrow side={side} />
            </div>
          </Portal>
        )}
      </div>
    );
  }
);

Tooltip.displayName = 'Tooltip';

interface TooltipArrowProps {
  side: 'top' | 'bottom' | 'left' | 'right';
}

const TooltipArrow = ({ side }: TooltipArrowProps) => {
  const positions = {
    top: 'bottom-[-4px] left-1/2 -translate-x-1/2 rotate-45',
    bottom: 'top-[-4px] left-1/2 -translate-x-1/2 rotate-45',
    left: 'right-[-4px] top-1/2 -translate-y-1/2 rotate-45',
    right: 'left-[-4px] top-1/2 -translate-y-1/2 rotate-45',
  };

  return (
    <div
      className={cn(
        'absolute w-2 h-2 bg-obsidian',
        positions[side]
      )}
      aria-hidden="true"
    />
  );
};

export default Tooltip;