/**
 * Primitives Index — Export all UI primitives from a single entry point.
 */

export { Button, type ButtonProps } from './Button';
export { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter, type CardProps } from './Card';
export { Badge, type BadgeProps } from './Badge';
export { Skeleton, SkeletonCard, type SkeletonProps } from './Skeleton';
export { Spinner, SpinnerOverlay, type SpinnerProps } from './Spinner';
export { Input, Textarea, Select, type InputProps, type TextareaProps, type SelectProps } from './Input';
export { Dialog, DialogTrigger, type DialogProps } from './Dialog';
export { Sheet, type SheetProps } from './Sheet';
export { default as Toast, type ToastProps, type ToastVariant } from './Toast';
export { ToastContainer, type ToastContainerProps } from './Toast';
export { ToastProvider, useToast } from './Toast';
export { Tooltip, type TooltipProps } from './Tooltip';
export { Portal } from './Portal';

// New primitives — Phase 1 completion
export { Avatar, AvatarImage, AvatarFallback, type AvatarProps, type AvatarImageProps, type AvatarFallbackProps } from './Avatar';
export {
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
} from './DropdownMenu';
export {
  Table,
  TableHeader,
  TableBody,
  TableFooter,
  TableRow,
  TableHead,
  TableCell,
  TableCaption,
  type TableProps,
  type TableHeaderProps,
  type TableBodyProps,
  type TableFooterProps,
  type TableRowProps,
  type TableHeadProps,
  type TableCellProps,
  type TableCaptionProps,
} from './Table';
export { Tabs, TabsList, TabsTrigger, TabsContent, type TabsProps, type TabsListProps, type TabsTriggerProps, type TabsContentProps } from './Tabs';
export { Accordion, AccordionItem, AccordionTrigger, AccordionContent, type AccordionProps, type AccordionItemProps, type AccordionTriggerProps, type AccordionContentProps } from './Accordion';