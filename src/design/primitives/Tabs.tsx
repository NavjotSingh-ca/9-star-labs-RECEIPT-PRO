/**
 * Tabs — Accessible tabbed interface primitive.
 * Uses @base-ui/react/tabs for ARIA compliance and keyboard navigation.
 * Supports horizontal and vertical orientation, default and line variants.
 *
 * Subcomponents: Tabs, TabsList, TabsTrigger, TabsContent.
 */

'use client';

import { Tabs as TabsPrimitive } from '@base-ui/react/tabs';
import { type ReactNode } from 'react';
import { cn } from '../utils';

/* ─── Root ─── */

export interface TabsProps extends TabsPrimitive.Root.Props {
  orientation?: 'horizontal' | 'vertical';
}

export const Tabs = ({ className, orientation = 'horizontal', ...props }: TabsProps) => {
  return (
    <TabsPrimitive.Root
      data-slot="tabs"
      data-orientation={orientation}
      className={cn('group/tabs flex gap-2 data-[orientation=horizontal]:flex-col', className)}
      orientation={orientation}
      {...props}
    />
  );
};

/* ─── List ─── */

export interface TabsListProps extends TabsPrimitive.List.Props {
  variant?: 'default' | 'line';
}

const listVariantStyles = {
  default:
    'bg-surface rounded-[2rem] p-[3px]',
  line:
    'bg-transparent gap-1',
} as const;

export const TabsList = ({ className, variant = 'default', ...props }: TabsListProps) => {
  return (
    <TabsPrimitive.List
      data-slot="tabs-list"
      data-variant={variant}
      className={cn(
        'group/tabs-list inline-flex w-fit items-center justify-center',
        'text-text-muted',
        'group-data-[orientation=horizontal]/tabs:h-10',
        'group-data-[orientation=vertical]/tabs:flex-col group-data-[orientation=vertical]/tabs:h-fit',
        listVariantStyles[variant],
        className
      )}
      {...props}
    />
  );
};

/* ─── Trigger ─── */

export interface TabsTriggerProps extends TabsPrimitive.Tab.Props {
  icon?: ReactNode;
}

export const TabsTrigger = ({ className, children, icon, ...props }: TabsTriggerProps) => {
  return (
    <TabsPrimitive.Tab
      data-slot="tabs-trigger"
      className={cn(
        'relative inline-flex h-[calc(100%-1px)] flex-1 items-center justify-center gap-1.5',
        'rounded-[2rem] border border-transparent px-3 py-1.5 text-sm font-medium whitespace-nowrap',
        'text-text-muted transition-all',
        'group-data-[orientation=vertical]/tabs:w-full group-data-[orientation=vertical]/tabs:justify-start',
        'hover:text-text-primary',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-champagne/40 focus-visible:ring-offset-2',
        'disabled:pointer-events-none disabled:opacity-50',
        'data-[active]:bg-surface-raised data-[active]:text-text-primary data-[active]:shadow-sm',
        'group-data-[variant=line]/tabs-list:bg-transparent',
        'group-data-[variant=line]/tabs-list:rounded-none group-data-[variant=line]/tabs-list:px-0',
        'group-data-[variant=line]/tabs-list:data-[active]:bg-transparent group-data-[variant=line]/tabs-list:data-[active]:shadow-none',
        // Active underline for line variant
        'group-data-[variant=line]/tabs-list:after:absolute',
        'group-data-[variant=line]/tabs-list:after:bg-champagne',
        'group-data-[variant=line]/tabs-list:after:opacity-0',
        'group-data-[variant=line]/tabs-list:after:transition-opacity',
        'group-data-[orientation=horizontal]/tabs:group-data-[variant=line]/tabs-list:after:inset-x-0',
        'group-data-[orientation=horizontal]/tabs:group-data-[variant=line]/tabs-list:after:bottom-0',
        'group-data-[orientation=horizontal]/tabs:group-data-[variant=line]/tabs-list:after:h-0.5',
        'group-data-[orientation=vertical]/tabs:group-data-[variant=line]/tabs-list:after:inset-y-0',
        'group-data-[orientation=vertical]/tabs:group-data-[variant=line]/tabs-list:after:right-0',
        'group-data-[orientation=vertical]/tabs:group-data-[variant=line]/tabs-list:after:w-0.5',
        'group-data-[variant=line]/tabs-list:data-[active]:after:opacity-100',
        '[&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*="size-"])]:size-4',
        className
      )}
      {...props}
    >
      {icon}
      {children}
    </TabsPrimitive.Tab>
  );
};

/* ─── Content ─── */

export type TabsContentProps = TabsPrimitive.Panel.Props;

export const TabsContent = ({ className, ...props }: TabsContentProps) => {
  return (
    <TabsPrimitive.Panel
      data-slot="tabs-content"
      className={cn('flex-1 text-sm outline-none', 'data-[active]:animate-in data-[active]:fade-in-0', className)}
      {...props}
    />
  );
};

export default Tabs;