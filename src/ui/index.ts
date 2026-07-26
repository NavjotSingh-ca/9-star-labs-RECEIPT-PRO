/**
 * UI Library — Main Exports
 * import { Button, Card, cn } from '@/ui'
 */

// Tokens
export * from './tokens';

// Providers
export { ThemeProvider, useTheme } from './providers/ThemeProvider';

// Utils
export {
  cn,
  createVariants,
  deepMerge,
  cssVar,
  formatCurrency,
  formatNumber,
  truncate,
  generateId,
  debounce,
  throttle,
  clamp,
  lerp,
  mapRange,
  type VariantProps,
} from './utils/cn';

// Primitive Components
export {
  Button,
  buttonVariants,
  Card,
  CardHeader,
  CardFooter,
  CardTitle,
  CardDescription,
  CardContent,
  Input,
  Textarea,
  Label,
  Badge,
  badgeVariants,
  badgeSizes,
  Avatar,
  AvatarImage,
  AvatarFallback,
  Dialog,
  DialogPortal,
  DialogOverlay,
  DialogClose,
  DialogTrigger,
  DialogContent,
  DialogHeader,
  DialogFooter,
  DialogTitle,
  DialogDescription,
  Sheet,
  SheetPortal,
  SheetOverlay,
  SheetTrigger,
  SheetClose,
  SheetContent,
  SheetHeader,
  SheetFooter,
  SheetTitle,
  SheetDescription,
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuCheckboxItem,
  DropdownMenuRadioItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuShortcut,
  DropdownMenuGroup,
  DropdownMenuPortal,
  DropdownMenuSub,
  DropdownMenuRadioGroup,
  Popover,
  PopoverTrigger,
  PopoverContent,
  PopoverPortal,
  HoverCard,
  HoverCardTrigger,
  HoverCardContent,
  Tooltip,
  TooltipTrigger,
  TooltipContent,
  TooltipProvider,
  AlertDialog,
  AlertDialogTrigger,
  AlertDialogPortal,
  AlertDialogOverlay,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogCancel,
  AlertDialogAction,
  Tabs,
  TabsList,
  TabsTrigger,
  TabsContent,
  Toggle,
  ToggleGroup,
  ToggleGroupItem,
  toggleVariants,
  Table,
  TableHeader,
  TableBody,
  TableFooter,
  TableHead,
  TableRow,
  TableCell,
  TableCaption,
  Skeleton,
  SkeletonCard,
  SkeletonTableRow,
  Spinner,
  PremiumSpinner,
  Progress,
  Accordion,
  AccordionItem,
  AccordionTrigger,
  AccordionContent,
  Checkbox,
  RadioGroup,
  RadioGroupItem,
  Switch,
  Slider,
  Select,
  SelectGroup,
  SelectValue,
  SelectTrigger,
  SelectContent,
  SelectLabel,
  SelectItem,
  SelectSeparator,
  SelectScrollUpButton,
  SelectScrollDownButton,
} from './primitives';

// Primitive Types (only types that actually exist)
export type {
  ButtonProps,
  InputProps,
  BadgeProps,
  BadgeVariant,
  BadgeSize,
  SkeletonProps,
  SpinnerProps,
  ToggleVariant,
} from './primitives';

// Pattern Components (only ones that exist)
export { DataTable, type ColumnDef, type DataTableProps } from './patterns/DataTable';
export { StatCard } from './patterns/StatCard';
export { ChartCard } from './patterns/ChartCard';
export { EmptyState } from './patterns/EmptyState';

// Landing Components
export { FeatureCard } from './components/landing/FeatureCard';
export { HeroSection } from './components/landing/HeroSection';
export { FeatureHighlights } from './components/landing/FeatureHighlights';
export { StatsSection } from './components/landing/StatsSection';
export { FeaturesSection } from './components/landing/FeaturesSection';
export { TestimonialsSection } from './components/landing/TestimonialsSection';
export { PricingSection } from './components/landing/PricingSection';
export { FAQSection } from './components/landing/FAQSection';
export { CTASection } from './components/landing/CTASection';
export { Footer } from './components/landing/Footer';
export { AnimatedCounter } from './components/landing/AnimatedCounter';

// Magnetic CTA
export { MagneticCTA } from './components/MagneticCTA';

// Hooks
export * from './hooks';