/**
 * Feature Registry — single source of truth for all application features.
 * Each feature has a key, label, description, category, icon name, and core flag.
 * Used by the feature configuration system, sidebar gating, and onboarding wizard.
 */

import {
  LayoutDashboard,
  Camera,
  ReceiptText,
  Route,
  Clock,
  FileDown,
  Landmark,
  Users,
  Wallet,
  ScrollText,
  AlertTriangle,
  BarChart3,
  PiggyBank,
  Receipt,
  TrendingUp,
  DollarSign,
  Store,
  Share2,
  Tags,
  ListChecks,
  Search,
  CalendarDays,
  History,
  Kanban,
  Lightbulb,
  ClipboardCheck,
  Bell,
  Repeat,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';

/** Every available feature key — single source of truth */
export type FeatureKey =
  | 'dashboard'
  | 'scanning'
  | 'receipts'
  | 'mileage'
  | 'time_tracking'
  | 'export'
  | 'banking'
  | 'approvals'
  | 'payables'
  | 'projects'
  | 'audit'
  | 'alerts'
  | 'reports'
  | 'budgets'
  | 'tax'
  | 'cashflow'
  | 'multi_currency'
  | 'vendors'
  | 'integrations'
  | 'tags'
  | 'batch_ops'
  | 'search'
  | 'calendar'
  | 'timeline'
  | 'kanban'
  | 'insights'
  | 'readiness'
  | 'notifications'
  | 'sharing';

/** Feature metadata definition */
export interface FeatureDefinition {
  /** Unique machine-readable key */
  key: FeatureKey;
  /** Human-readable label */
  label: string;
  /** Short description */
  description: string;
  /** Feature category for grouping */
  category: 'core' | 'tracking' | 'finance' | 'oversight' | 'productivity' | 'integrations' | 'insights';
  /** Icon component reference */
  icon: LucideIcon;
  /** Whether this feature is always on and cannot be disabled */
  core: boolean;
  /** Whether feature is in development/preview */
  preview?: boolean;
  /** Features that must be enabled for this to work */
  dependencies?: FeatureKey[];
}

/** All application features with metadata */
export const FEATURES: FeatureDefinition[] = [
  // ─── Core ───
  {
    key: 'dashboard',
    label: 'Dashboard',
    description: 'Overview KPIs, charts, and alerts',
    category: 'core',
    icon: LayoutDashboard,
    core: true,
  },
  {
    key: 'scanning',
    label: 'Scan Receipts',
    description: 'Capture receipts via camera or upload',
    category: 'core',
    icon: Camera,
    core: true,
  },
  {
    key: 'receipts',
    label: 'Receipts',
    description: 'View and manage all receipts',
    category: 'core',
    icon: ReceiptText,
    core: true,
  },

  // ─── Tracking ───
  {
    key: 'mileage',
    label: 'Mileage',
    description: 'Track business mileage for CRA deductions',
    category: 'tracking',
    icon: Route,
    core: false,
    dependencies: ['dashboard'],
  },
  {
    key: 'time_tracking',
    label: 'Time Tracking',
    description: 'Clock in/out and track employee hours',
    category: 'tracking',
    icon: Clock,
    core: false,
  },

  // ─── Finance ───
  {
    key: 'export',
    label: 'Exports',
    description: 'Export data for CRA, accounting, or CSV',
    category: 'finance',
    icon: FileDown,
    core: false,
    dependencies: ['receipts'],
  },
  {
    key: 'banking',
    label: 'Banking',
    description: 'Reconcile bank transactions with receipts',
    category: 'finance',
    icon: Landmark,
    core: false,
    dependencies: ['receipts'],
  },
  {
    key: 'payables',
    label: 'Payables',
    description: 'Track bills, invoices, and payment schedules',
    category: 'finance',
    icon: Wallet,
    core: false,
  },
  {
    key: 'budgets',
    label: 'Budgets',
    description: 'Set and track department budgets',
    category: 'finance',
    icon: PiggyBank,
    core: false,
    dependencies: ['dashboard'],
  },
  {
    key: 'tax',
    label: 'Tax Dashboard',
    description: 'GST/HST recoverable estimates and CRA readiness',
    category: 'finance',
    icon: Receipt,
    core: false,
    dependencies: ['receipts'],
  },
  {
    key: 'cashflow',
    label: 'Cash Flow',
    description: 'Forecast and visualize cash flow trends',
    category: 'finance',
    icon: TrendingUp,
    core: false,
    dependencies: ['dashboard'],
  },
  {
    key: 'multi_currency',
    label: 'Multi-Currency',
    description: 'Handle receipts and expenses in foreign currencies',
    category: 'finance',
    icon: DollarSign,
    core: false,
    dependencies: ['receipts'],
  },
  {
    key: 'vendors',
    label: 'Vendors',
    description: 'Vendor analytics and spending patterns',
    category: 'finance',
    icon: Store,
    core: false,
    dependencies: ['receipts'],
  },

  // ─── Oversight ───
  {
    key: 'approvals',
    label: 'Approvals',
    description: 'Review and approve receipt submissions',
    category: 'oversight',
    icon: Users,
    core: false,
    dependencies: ['receipts'],
  },
  {
    key: 'audit',
    label: 'Audit Trail',
    description: 'Immutable log of all changes',
    category: 'oversight',
    icon: ScrollText,
    core: false,
  },
  {
    key: 'alerts',
    label: 'Alerts',
    description: 'Spend anomalies and fraud detection',
    category: 'oversight',
    icon: AlertTriangle,
    core: false,
    dependencies: ['dashboard'],
  },
  {
    key: 'reports',
    label: 'Reports',
    description: 'Custom reports, schedules, and exports',
    category: 'oversight',
    icon: BarChart3,
    core: false,
  },

  // ─── Productivity ───
  {
    key: 'tags',
    label: 'Tags & Labels',
    description: 'Organize receipts with custom tags',
    category: 'productivity',
    icon: Tags,
    core: false,
    dependencies: ['receipts'],
  },
  {
    key: 'batch_ops',
    label: 'Batch Operations',
    description: 'Edit, approve, or export multiple receipts at once',
    category: 'productivity',
    icon: ListChecks,
    core: false,
    dependencies: ['receipts'],
  },
  {
    key: 'search',
    label: 'Smart Search',
    description: 'Full-text receipt search with filters',
    category: 'productivity',
    icon: Search,
    core: false,
    dependencies: ['receipts'],
  },
  {
    key: 'calendar',
    label: 'Calendar View',
    description: 'Visual receipt calendar by date',
    category: 'productivity',
    icon: CalendarDays,
    core: false,
    dependencies: ['receipts'],
  },
  {
    key: 'timeline',
    label: 'Timeline View',
    description: 'Chronological receipt timeline',
    category: 'productivity',
    icon: History,
    core: false,
    dependencies: ['receipts'],
  },
  {
    key: 'kanban',
    label: 'Kanban Workflow',
    description: 'Visual receipt workflow board',
    category: 'productivity',
    icon: Kanban,
    core: false,
    dependencies: ['receipts'],
  },
  {
    key: 'sharing',
    label: 'Share Receipts',
    description: 'Share receipt images and details',
    category: 'productivity',
    icon: Share2,
    core: false,
    dependencies: ['receipts'],
  },

  // ─── Integrations ───
  {
    key: 'integrations',
    label: 'Integrations',
    description: 'QBO, Xero, email forwarding, and more',
    category: 'integrations',
    icon: Repeat,
    core: false,
    dependencies: ['receipts'],
  },

  // ─── Insights ───
  {
    key: 'insights',
    label: 'Spending Insights',
    description: 'AI-powered spending analysis and suggestions',
    category: 'insights',
    icon: Lightbulb,
    core: false,
    dependencies: ['dashboard'],
  },
  {
    key: 'readiness',
    label: 'CRA Readiness',
    description: 'Audit readiness score and gap analysis',
    category: 'insights',
    icon: ClipboardCheck,
    core: false,
    dependencies: ['receipts'],
  },
  {
    key: 'notifications',
    label: 'Notifications',
    description: 'Slack alerts, email digests, and in-app notifications',
    category: 'insights',
    icon: Bell,
    core: false,
  },
];

/** Map feature key to its definition */
export const FEATURE_BY_KEY: Record<FeatureKey, FeatureDefinition> = Object.fromEntries(
  FEATURES.map((f) => [f.key, f]),
) as Record<FeatureKey, FeatureDefinition>;

/** All feature keys */
export const ALL_FEATURE_KEYS: FeatureKey[] = FEATURES.map((f) => f.key);

/** Features that cannot be disabled */
export const CORE_FEATURE_KEYS: FeatureKey[] = FEATURES.filter((f) => f.core).map((f) => f.key);

/** Group features by category */
export function getFeaturesByCategory(): Record<string, FeatureDefinition[]> {
  const groups: Record<string, FeatureDefinition[]> = {};
  for (const feature of FEATURES) {
    if (!groups[feature.category]) groups[feature.category] = [];
    groups[feature.category].push(feature);
  }
  return groups;
}

/** Check if a set of enabled features satisfies all dependencies for a given feature */
export function featureDependenciesSatisfied(
  featureKey: FeatureKey,
  enabledFeatures: Set<FeatureKey>,
): boolean {
  const feature = FEATURE_BY_KEY[featureKey];
  if (!feature?.dependencies?.length) return true;
  return feature.dependencies.every((dep) => enabledFeatures.has(dep));
}

/** Get all additional features that must be enabled due to dependencies */
export function getRequiredDependencies(featureKey: FeatureKey): FeatureKey[] {
  const feature = FEATURE_BY_KEY[featureKey];
  return feature?.dependencies ?? [];
}
