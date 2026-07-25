"use client";

import { type ComponentProps } from 'react';
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuGroup,
  type DropdownMenuProps,
  type DropdownMenuTriggerProps,
  type DropdownMenuContentProps,
  type DropdownMenuItemProps,
  type DropdownMenuLabelProps,
  type DropdownMenuSeparatorProps,
  type DropdownMenuGroupProps,
} from '@design/primitives';

// Re-export all subcomponents with same names
export {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuGroup,
};

export type {
  DropdownMenuProps,
  DropdownMenuTriggerProps,
  DropdownMenuContentProps,
  DropdownMenuItemProps,
  DropdownMenuLabelProps,
  DropdownMenuSeparatorProps,
  DropdownMenuGroupProps,
};

// These components are not in the new design DropdownMenu - provide no-ops or omit
export const DropdownMenuPortal = () => null;
export const DropdownMenuCheckboxItem = ({ children, ...props }: ComponentProps<typeof DropdownMenuItem>) => (
  <DropdownMenuItem {...props}>{children}</DropdownMenuItem>
);
export const DropdownMenuRadioGroup = ({ children, ...props }: ComponentProps<'div'>) => <div {...props}>{children}</div>;
export const DropdownMenuRadioItem = ({ children, ...props }: ComponentProps<typeof DropdownMenuItem>) => <DropdownMenuItem {...props}>{children}</DropdownMenuItem>;
export const DropdownMenuSub = ({ children, ...props }: ComponentProps<'div'>) => <div {...props}>{children}</div>;
export const DropdownMenuSubTrigger = ({ children, ...props }: ComponentProps<typeof DropdownMenuItem>) => <DropdownMenuItem {...props}>{children}</DropdownMenuItem>;
export const DropdownMenuSubContent = ({ children, ...props }: ComponentProps<typeof DropdownMenuContent>) => <DropdownMenuContent {...props}>{children}</DropdownMenuContent>;
export const DropdownMenuShortcut = ({ children, ...props }: ComponentProps<'span'>) => <span {...props}>{children}</span>;