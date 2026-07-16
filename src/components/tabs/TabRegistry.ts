/**
 * Tab Components Registry
 * Central registry for all tab components to enable dynamic loading and tree-shaking.
 */

import dynamic from 'next/dynamic';
import type { ComponentType } from 'react';
import React from 'react';
import { 
  ReceiptTableSkeleton, 
  DashboardSkeleton, 
  ScannerSkeleton 
} from '@/components/ui/PremiumSkeletons';
import type { Tab } from '@/lib/types';

// Skeleton components for each feature
const skeletonComponents: Record<Tab, ComponentType<Record<string, unknown>>> = {
  dashboard: DashboardSkeleton,
  history: ReceiptTableSkeleton,
  scanner: ScannerSkeleton,
  mileage: ReceiptTableSkeleton,
  export: ReceiptTableSkeleton,
  reconciliation: ReceiptTableSkeleton,
  audit: ReceiptTableSkeleton,
  notifications: ReceiptTableSkeleton,
  approvals: ReceiptTableSkeleton,
  reimbursements: ReceiptTableSkeleton,
  projects: ReceiptTableSkeleton,
  anomaly: ReceiptTableSkeleton,
  reports: ReceiptTableSkeleton,
  time: ReceiptTableSkeleton,
  smartSearch: ReceiptTableSkeleton,
  receiptCalendar: ReceiptTableSkeleton,
  receiptTimeline: ReceiptTableSkeleton,
  vendorAnalytics: ReceiptTableSkeleton,
  budgetManager: ReceiptTableSkeleton,
  taxDashboard: ReceiptTableSkeleton,
  cashFlowForecast: ReceiptTableSkeleton,
  multiCurrency: ReceiptTableSkeleton,
  receiptTags: ReceiptTableSkeleton,
  batchOperations: ReceiptTableSkeleton,
  receiptComparison: ReceiptTableSkeleton,
  qboExport: ReceiptTableSkeleton,
  xeroExport: ReceiptTableSkeleton,
  recurringDetector: ReceiptTableSkeleton,
  kanbanWorkflow: ReceiptTableSkeleton,
  } as const;

// Dynamic import factory
function createDynamicImport<TabName extends Tab>(
  tab: TabName,
  importPath: string
): ComponentType<Record<string, unknown>> {
  return dynamic(() => import(importPath), {
    ssr: false,
    loading: () => React.createElement(
      skeletonComponents[tab as keyof typeof skeletonComponents] || ReceiptTableSkeleton
    ),
  });
}

// Lazy-loaded tab components
export const TabComponents: Record<Tab, ComponentType<Record<string, unknown>>> = {
  dashboard: createDynamicImport('dashboard', '@/components/Dashboard'),
  history: createDynamicImport('history', '@/components/History'),
  scanner: createDynamicImport('scanner', '@/components/Scanner'),
  mileage: createDynamicImport('mileage', '@/components/MileageTracker'),
  export: createDynamicImport('export', '@/components/Export'),
  reconciliation: createDynamicImport('reconciliation', '@/components/BankReconciliation'),
  audit: createDynamicImport('audit', '@/components/AuditTrail'),
  notifications: createDynamicImport('notifications', '@/components/NotificationsPage'),
  approvals: createDynamicImport('approvals', '@/components/ApprovalsQueue'),
  reimbursements: createDynamicImport('reimbursements', '@/components/ReimbursementsPanel'),
  projects: createDynamicImport('projects', '@/components/ProjectManager'),
  anomaly: createDynamicImport('anomaly', '@/components/AnomalyDashboard'),
  reports: createDynamicImport('reports', '@/components/reports/ReportsPage'),
  time: createDynamicImport('time', '@/components/time/TimeClock'),
  smartSearch: createDynamicImport('smartSearch', '@/components/features/SmartSearch'),
  receiptCalendar: createDynamicImport('receiptCalendar', '@/components/features/ReceiptCalendar'),
  receiptTimeline: createDynamicImport('receiptTimeline', '@/components/features/ReceiptTimeline'),
  vendorAnalytics: createDynamicImport('vendorAnalytics', '@/components/features/VendorAnalytics'),
  budgetManager: createDynamicImport('budgetManager', '@/components/features/BudgetManager'),
  taxDashboard: createDynamicImport('taxDashboard', '@/components/features/TaxDashboard'),
  cashFlowForecast: createDynamicImport('cashFlowForecast', '@/components/features/CashFlowForecast'),
  multiCurrency: createDynamicImport('multiCurrency', '@/components/features/MultiCurrency'),
  receiptTags: createDynamicImport('receiptTags', '@/components/features/ReceiptTags'),
  batchOperations: createDynamicImport('batchOperations', '@/components/features/BatchOperations'),
  receiptComparison: createDynamicImport('receiptComparison', '@/components/features/ReceiptComparison'),
  qboExport: createDynamicImport('qboExport', '@/components/features/QBOExport'),
  xeroExport: createDynamicImport('xeroExport', '@/components/features/XeroExport'),
  recurringDetector: createDynamicImport('recurringDetector', '@/components/features/RecurringDetector'),
  kanbanWorkflow: createDynamicImport('kanbanWorkflow', '@/components/features/KanbanWorkflow'),
} as Record<Tab, ComponentType<Record<string, unknown>>>;

// Tab to feature flag mapping
export const TAB_TO_FEATURE: Record<Tab, string> = {
  dashboard: 'dashboard',
  history: 'history',
  scanner: 'scanner',
  mileage: 'mileage_tracking',
  export: 'export',
  reconciliation: 'bank_reconciliation',
  audit: 'audit_trail',
  notifications: 'notifications',
  approvals: 'approvals',
  reimbursements: 'reimbursements',
  projects: 'projects',
  anomaly: 'anomaly_detection',
  reports: 'reports',
  time: 'time_tracking',
  smartSearch: 'smart_search',
  receiptCalendar: 'receipt_calendar',
  receiptTimeline: 'receipt_timeline',
  vendorAnalytics: 'vendor_analytics',
  budgetManager: 'budgets',
  taxDashboard: 'tax_dashboard',
  cashFlowForecast: 'cash_flow_forecast',
  multiCurrency: 'multi_currency',
  receiptTags: 'receipt_tags',
  batchOperations: 'batch_operations',
  receiptComparison: 'receipt_comparison',
  qboExport: 'qbo_export',
  xeroExport: 'xero_export',
  recurringDetector: 'recurring_detector',
  kanbanWorkflow: 'kanban_workflow',
} as const;

// Tab metadata for navigation
export interface TabMetadata {
  key: Tab;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  feature: string;
  group: 'primary' | 'features' | 'reports' | 'time' | 'admin';
}

// Navigation groups for the sidebar
export const TAB_GROUPS = {
  primary: ['dashboard', 'history', 'scanner', 'mileage', 'export'] as Tab[],
  features: [
    'smartSearch', 'receiptCalendar', 'receiptTimeline', 'vendorAnalytics',
    'budgetManager', 'taxDashboard', 'cashFlowForecast', 'multiCurrency',
    'receiptTags', 'batchOperations', 'receiptComparison', 'recurringDetector',
    'kanbanWorkflow', 'qboExport', 'xeroExport',
  ] as Tab[],
  reports: ['reconciliation', 'audit', 'reports', 'notifications', 'approvals', 'reimbursements', 'projects', 'anomaly'] as Tab[],
  time: ['time'] as Tab[],
  admin: ['reimbursements', 'approvals'] as Tab[],
} as const;

// Feature gating: which roles can access which tabs
export const TAB_ROLE_PERMISSIONS: Record<Tab, string[]> = {
  dashboard: ['Owner', 'Admin', 'Employee', 'Accountant', 'Auditor'],
  history: ['Owner', 'Admin', 'Employee', 'Accountant', 'Auditor'],
  scanner: ['Owner', 'Admin', 'Employee', 'Accountant'],
  mileage: ['Owner', 'Admin', 'Employee'],
  export: ['Owner', 'Admin', 'Accountant', 'Auditor'],
  reconciliation: ['Owner', 'Admin', 'Accountant'],
  audit: ['Owner', 'Admin', 'Auditor'],
  notifications: ['Owner', 'Admin', 'Employee', 'Accountant', 'Auditor'],
  approvals: ['Owner', 'Admin'],
  reimbursements: ['Owner', 'Admin', 'Employee', 'Accountant'],
  projects: ['Owner', 'Admin', 'Employee'],
  anomaly: ['Owner', 'Admin', 'Auditor'],
  reports: ['Owner', 'Admin', 'Accountant', 'Auditor'],
  time: ['Owner', 'Admin', 'Employee'],
  smartSearch: ['Owner', 'Admin', 'Employee', 'Accountant', 'Auditor'],
  receiptCalendar: ['Owner', 'Admin', 'Employee', 'Accountant'],
  receiptTimeline: ['Owner', 'Admin', 'Employee', 'Accountant'],
  vendorAnalytics: ['Owner', 'Admin', 'Accountant', 'Auditor'],
  budgetManager: ['Owner', 'Admin', 'Accountant'],
  taxDashboard: ['Owner', 'Admin', 'Accountant', 'Auditor'],
  cashFlowForecast: ['Owner', 'Admin', 'Accountant', 'Auditor'],
  multiCurrency: ['Owner', 'Admin', 'Accountant', 'Auditor'],
  receiptTags: ['Owner', 'Admin', 'Employee', 'Accountant'],
  batchOperations: ['Owner', 'Admin'],
  receiptComparison: ['Owner', 'Admin', 'Accountant', 'Auditor'],
  qboExport: ['Owner', 'Admin', 'Accountant'],
  xeroExport: ['Owner', 'Admin', 'Accountant'],
  recurringDetector: ['Owner', 'Admin', 'Accountant', 'Auditor'],
  kanbanWorkflow: ['Owner', 'Admin', 'Employee'],
} as const;

// Helper to get tab label
export const TAB_LABELS: Record<Tab, string> = {
  dashboard: 'Dashboard',
  history: 'History',
  scanner: 'Scan',
  mileage: 'Mileage',
  export: 'Export',
  reconciliation: 'Reconciliation',
  audit: 'Audit',
  notifications: 'Notifications',
  approvals: 'Approvals',
  reimbursements: 'Reimbursements',
  projects: 'Projects',
  anomaly: 'Anomaly',
  reports: 'Reports',
  time: 'Time',
  smartSearch: 'Smart Search',
  receiptCalendar: 'Calendar',
  receiptTimeline: 'Timeline',
  vendorAnalytics: 'Vendor Analytics',
  budgetManager: 'Budgets',
  taxDashboard: 'Tax Dashboard',
  cashFlowForecast: 'Cash Flow',
  multiCurrency: 'Multi-Currency',
  receiptTags: 'Tags',
  batchOperations: 'Batch Ops',
  receiptComparison: 'Compare',
  qboExport: 'QBO Export',
  xeroExport: 'Xero Export',
  recurringDetector: 'Recurring',
  kanbanWorkflow: 'Kanban',
} as const;

// Helper to check if user's role has access to tab
export function hasTabAccess(tab: Tab, userRole: string): boolean {
  const permissions = TAB_ROLE_PERMISSIONS[tab];
  return permissions?.includes('Owner') || permissions?.includes('Admin') || permissions?.includes('Employee') || 
         permissions?.includes('Accountant') || permissions?.includes('Auditor') || permissions?.includes(userRole);
}