'use client';

import * as React from 'react';
import * as TogglePrimitive from '@radix-ui/react-toggle';
import * as ToggleGroupPrimitive from '@radix-ui/react-toggle-group';
import { cn } from '../utils/cn';

const toggleVariants = {
  default: 'bg-surface-raised text-text-primary border border-glass-border hover:bg-surface-hover hover:border-glass-border-hover data-[state=on]:bg-champagne data-[state=on]:text-obsidian data-[state=on]:border-champagne/30',
  outline: 'bg-transparent text-text-primary border border-glass-border hover:bg-surface-hover hover:border-glass-border-hover data-[state=on]:bg-champagne/10 data-[state=on]:border-champagne/30',
  ghost: 'bg-transparent text-text-primary hover:bg-surface-hover data-[state=on]:bg-champagne/10 data-[state=on]:text-champagne',
} as const;

export type ToggleVariant = keyof typeof toggleVariants;

const Toggle = React.forwardRef<
  React.ElementRef<typeof TogglePrimitive.Root>,
  React.ComponentPropsWithoutRef<typeof TogglePrimitive.Root> & { variant?: ToggleVariant }
>(({ className, variant = 'default', ...props }, ref) => (
  <TogglePrimitive.Root
    ref={ref}
    className={cn(
      'inline-flex items-center justify-center rounded-xl px-3 py-2 text-sm font-medium transition-all duration-200 ease-[0.32,0.72,0,1] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-champagne/40 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50',
      toggleVariants[variant],
      className
    )}
    {...props}
  />
));
Toggle.displayName = TogglePrimitive.Root.displayName;

const ToggleGroup = React.forwardRef<
  React.ElementRef<typeof ToggleGroupPrimitive.Root>,
  React.ComponentPropsWithoutRef<typeof ToggleGroupPrimitive.Root>
>(({ className, ...props }, ref) => (
  <ToggleGroupPrimitive.Root ref={ref} className={cn('flex items-center gap-1', className)} {...props} />
));
ToggleGroup.displayName = ToggleGroupPrimitive.Root.displayName;

const ToggleGroupItem = React.forwardRef<
  React.ElementRef<typeof ToggleGroupPrimitive.Item>,
  React.ComponentPropsWithoutRef<typeof ToggleGroupPrimitive.Item> & { variant?: ToggleVariant }
>(({ className, variant = 'default', ...props }, ref) => (
  <ToggleGroupPrimitive.Item
    ref={ref}
    className={cn(
      'flex items-center justify-center rounded-xl px-3 py-2 text-sm font-medium transition-all duration-200 ease-[0.32,0.72,0,1] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-champagne/40 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50',
      toggleVariants[variant],
      className
    )}
    {...props}
  />
));
ToggleGroupItem.displayName = ToggleGroupPrimitive.Item.displayName;

export { Toggle, ToggleGroup, ToggleGroupItem, toggleVariants };