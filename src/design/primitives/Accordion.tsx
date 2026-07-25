/**
 * Accordion — Accessible collapsible sections primitive.
 * Uses @base-ui/react/accordion for ARIA compliance.
 *
 * Subcomponents: Accordion, AccordionItem, AccordionTrigger, AccordionContent.
 */

'use client';

import { Accordion as AccordionPrimitive } from '@base-ui/react/accordion';
import { forwardRef, type ReactNode } from 'react';
import { cn } from '../utils';

/* ─── Root ─── */

export interface AccordionProps extends AccordionPrimitive.Root.Props {
  collapsible?: boolean;
}

export const Accordion = ({ className, collapsible: _collapsible = true, ...props }: AccordionProps) => {
  return (
    <AccordionPrimitive.Root
      data-slot="accordion"
      className={cn('flex flex-col gap-1', className)}
      // @base-ui/react accordion: multiple=false + keepMounted for collapsible behavior
      {...props}
    />
  );
};

/* ─── Item ─── */

export type AccordionItemProps = AccordionPrimitive.Item.Props;

export const AccordionItem = ({ className, ...props }: AccordionItemProps) => {
  return (
    <AccordionPrimitive.Item
      data-slot="accordion-item"
      className={cn(
        'border border-glass-border rounded-xl overflow-hidden',
        'bg-surface',
        className
      )}
      {...props}
    />
  );
};

/* ─── Trigger ─── */

export interface AccordionTriggerProps extends AccordionPrimitive.Trigger.Props {
  children: ReactNode;
}

export const AccordionTrigger = forwardRef<HTMLButtonElement, AccordionTriggerProps>(
  ({ className, children, ...props }, ref) => {
    return (
      <AccordionPrimitive.Trigger
        ref={ref}
        data-slot="accordion-trigger"
        className={cn(
          'flex w-full items-center justify-between gap-3 px-4 py-3',
          'text-sm font-semibold text-text-primary text-left',
          'transition-colors hover:bg-surface-hover',
          'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-champagne/40 focus-visible:ring-offset-2 focus-visible:ring-offset-surface',
          'disabled:pointer-events-none disabled:opacity-50',
          '[&[data-panel-open]>svg]:rotate-180',
          className
        )}
        {...props}
      >
        {children}
        <svg
          className="h-4 w-4 shrink-0 text-text-muted transition-transform duration-200"
          xmlns="http://www.w3.org/2000/svg"
          width="24"
          height="24"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden="true"
        >
          <path d="m6 9 6 6 6-6" />
        </svg>
      </AccordionPrimitive.Trigger>
    );
  }
);
AccordionTrigger.displayName = 'AccordionTrigger';

/* ─── Content ─── */

export type AccordionContentProps = AccordionPrimitive.Panel.Props;

export const AccordionContent = ({ className, children, ...props }: AccordionContentProps) => {
  return (
    <AccordionPrimitive.Panel
      data-slot="accordion-content"
      className={cn(
        'px-4 pb-4 pt-0 text-sm text-text-secondary',
        'data-[closed]:animate-accordion-up data-[open]:animate-accordion-down',
        className
      )}
      {...props}
    >
      {children}
    </AccordionPrimitive.Panel>
  );
};

export default Accordion;