"use client";

import {
  Tabs,
  TabsList,
  TabsTrigger,
  TabsContent,
  type TabsProps,
  type TabsListProps,
  type TabsTriggerProps,
  type TabsContentProps,
} from '@design/primitives';

// Re-export all subcomponents with same names
export {
  Tabs,
  TabsList,
  TabsTrigger,
  TabsContent,
};

export type {
  TabsProps,
  TabsListProps,
  TabsTriggerProps,
  TabsContentProps,
};

// tabsListVariants was exported - provide a compatible re-export (no-op since we don't use CVA)
export const tabsListVariants = {
  defaultVariants: { variant: 'default' },
};