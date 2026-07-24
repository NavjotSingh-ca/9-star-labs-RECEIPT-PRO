'use client';

import { useState } from 'react';
import { APP_NAME } from '@/lib/constants';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';
import { navItemHover } from '@/lib/animations';
import { useAppStore } from '@/lib/store';
import { useNotificationStore } from '@/lib/stores/notifications';
import {
  LayoutDashboard,
  Camera,
  ReceiptText,
  Route,
  Clock,
  FileDown,
  Landmark,
  ScrollText,
  Users,
  Wallet,
  Building2,
  BarChart3,
  AlertTriangle,
  Bell,
  Crown,
  Settings,
  LogOut,
  PanelLeftClose,
  PanelLeft,
  Menu,
  X,
  Search,
  CalendarDays,
  History,
  Store,
  PiggyBank,
  Receipt,
  TrendingUp,
  DollarSign,
  Tags,
  ListChecks,
  GitCompare,
  Repeat,
  Kanban,
  FileSpreadsheet,
  FileText,
  BarChart,
  Mail,
  ClipboardCheck,
  Lightbulb,
  Share2,
  MessageSquare,
  Moon,
} from 'lucide-react';
import Link from 'next/link';
import { ThemeToggle } from '@/components/ThemeToggle';
import RealtimeStatus from '@/components/layout/RealtimeStatus';
import { useRealtime } from '@/providers/RealtimeProvider';
import type { UserRole } from '@/lib/types';
import { useFeatures } from '@/lib/features/hooks';
import type { FeatureKey } from '@/lib/features/registry';

type Tab = 'dashboard' | 'receipts' | 'scan' | 'export' | 'audit' | 'reconcile' | 'mileage' | 'time' | 'approvals' | 'payables' | 'projects' | 'alerts' | 'reports' | 'more'
  | 'smart-search' | 'receipt-calendar' | 'receipt-timeline' | 'vendor-analytics'
  | 'budgets' | 'tax-dashboard' | 'cashflow-forecast' | 'multi-currency'
  | 'receipt-tags' | 'batch-operations' | 'receipt-comparison' | 'recurring-detector' | 'kanban-workflow'
  | 'qbo-export' | 'xero-export' | 'export-dashboard' | 'email-forward'
  | 'readiness-score' | 'spending-insights' | 'share-receipt' | 'payables-dashboard' | 'slack-alerts' | 'dark-sync';

/**
 * Props for the Sidebar component.
 */
interface SidebarProps {
  /** Currently active navigation tab */
  activeTab: Tab;
  /** Callback when user navigates to a different tab */
  onTabChange: (tab: Tab) => void;
  /** Current user's role for permission-based nav items */
  role: UserRole;
  /** Human-readable plan label (e.g., "Pro", "Free") */
  planLabel: string;
  /** Plan identifier for feature gating */
  plan: string;
  /** Sign-out handler */
  handleSignOut: () => void;
}

/**
 * Map navigation tabs to feature keys for gating.
 * Items without a mapping (null) are always shown.
 * Core features are always on and don't need gating.
 */
const TAB_TO_FEATURE: Partial<Record<Tab, FeatureKey | null>> = {
  dashboard: 'dashboard',
  scan: 'scanning',
  receipts: 'receipts',
  mileage: 'mileage',
  time: 'time_tracking',
  export: 'export',
  reconcile: 'banking',
  approvals: 'approvals',
  payables: 'payables',
  projects: 'projects',
  audit: 'audit',
  alerts: 'alerts',
  reports: 'reports',
  'smart-search': 'search',
  'receipt-calendar': 'calendar',
  'receipt-timeline': 'timeline',
  'vendor-analytics': 'vendors',
  budgets: 'budgets',
  'tax-dashboard': 'tax',
  'cashflow-forecast': 'cashflow',
  'multi-currency': 'multi_currency',
  'receipt-tags': 'tags',
  'batch-operations': 'batch_ops',
  'kanban-workflow': 'kanban',
  'readiness-score': 'readiness',
  'spending-insights': 'insights',
  'share-receipt': 'sharing',
  'slack-alerts': 'notifications',
  'qbo-export': 'integrations',
  'xero-export': 'integrations',
  'export-dashboard': 'integrations',
  'email-forward': 'integrations',
  'receipt-comparison': null, // always shown
  'recurring-detector': null, // always shown
  'dark-sync': null, // UI-only
  more: null, // overflow
};

/**
 * Individual navigation link with active state indicator, icon, and label.
 * Shows a champagne accent bar on the left when active.
 */
function NavLink({
  icon,
  label,
  active,
  collapsed,
  onClick,
}: {
  /** Icon component to display */
  icon: React.ReactNode;
  /** Display label text */
  label: string;
  /** Whether this nav item is currently active */
  active: boolean;
  /** Whether the sidebar is in collapsed state */
  collapsed: boolean;
  /** Click handler */
  onClick: () => void;
}) {
  return (
    <motion.button
      type="button"
      onClick={onClick}
      aria-label={label}
      aria-current={active ? 'page' : undefined}
      title={label}
      {...navItemHover}
      className={cn(
        'relative flex w-full items-center gap-3 rounded-xl px-3 py-2 text-sm font-medium transition-all duration-200',
        active
          ? 'bg-sidebar-active text-sidebar-text font-semibold border border-sidebar-accent/25 shadow-sm shadow-sidebar-accent/10'
          : 'text-sidebar-text-muted hover:bg-sidebar-hover hover:text-sidebar-text-secondary',
        collapsed && 'justify-center px-2'
      )}
    >
      {/* Active indicator bar — animated */}
      <motion.div
        layoutId="activeNavIndicator"
        className="absolute left-0 top-1/2 -translate-y-1/2 h-5 w-0.5 rounded-full bg-sidebar-accent"
        style={{ display: active ? 'block' : 'none' }}
        transition={{ type: 'spring', stiffness: 500, damping: 35 }}
      />
      {active && (
        <motion.span
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          className="absolute right-2 top-1/2 -translate-y-1/2 h-1.5 w-1.5 rounded-full bg-sidebar-accent/40"
        />
      )}
      <span className="relative z-10 flex-shrink-0 transition-transform duration-200 group-hover:scale-110">{icon}</span>
      <span
        className={`relative z-10 overflow-hidden whitespace-nowrap transition-all duration-200 ${
          collapsed ? 'max-w-0 opacity-0' : 'max-w-40 opacity-100'
        }`}
      >
        {label}
      </span>
    </motion.button>
  );
}

export default function Sidebar({
  activeTab,
  onTabChange,
  role,
  planLabel,
  plan,
  handleSignOut,
}: SidebarProps) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const collapsed = useAppStore((s) => s.sidebarCollapsed);
  const setCollapsed = useAppStore((s) => s.setSidebarCollapsed);

  const isPrivileged = role !== 'Employee';
  const unreadCount = useNotificationStore((s) => s.unreadCount());
  const { features } = useFeatures();
  const { isConnected } = useRealtime();

  /**
   * Check if a tab should be visible based on feature flags.
   * Items without a feature mapping, core features, or features that are enabled pass through.
   */
  const isTabVisible = (tab: Tab): boolean => {
    const featureKey = TAB_TO_FEATURE[tab];
    // No mapping = always visible (UI-only items like more, dark-sync)
    if (featureKey === undefined || featureKey === null) return true;
    // If the feature key maps but user doesn't have it, hide
    return features[featureKey] ?? true;
  };

  const navGroups: Array<{
    id: string;
    label: string;
    items: Array<{ id: Tab; label: string; icon: React.ReactNode }>;
  }> = [
    {
      id: 'overview',
      label: 'Overview',
      items: [
        ...(isPrivileged ? [{ id: 'dashboard' as Tab, label: 'Dashboard', icon: <LayoutDashboard className="h-4 w-4" /> }] : []),
        { id: 'scan' as Tab, label: 'Scan', icon: <Camera className="h-4 w-4" /> },
      ],
    },
    {
      id: 'records',
      label: 'Records',
      items: [
        { id: 'receipts' as Tab, label: 'Receipts', icon: <ReceiptText className="h-4 w-4" /> },
        ...(isPrivileged ? [{ id: 'mileage' as Tab, label: 'Mileage', icon: <Route className="h-4 w-4" /> }] : []),
        ...(isPrivileged ? [{ id: 'time' as Tab, label: 'Time', icon: <Clock className="h-4 w-4" /> }] : []),
        ...(isPrivileged ? [{ id: 'projects' as Tab, label: 'Projects', icon: <Building2 className="h-4 w-4" /> }] : []),
        { id: 'smart-search' as Tab, label: 'Smart Search', icon: <Search className="h-4 w-4" /> },
        { id: 'receipt-calendar' as Tab, label: 'Calendar', icon: <CalendarDays className="h-4 w-4" /> },
        { id: 'receipt-timeline' as Tab, label: 'Timeline', icon: <History className="h-4 w-4" /> },
      ],
    },
    {
      id: 'finance',
      label: 'Finance',
      items: [
        ...(isPrivileged ? [{ id: 'export' as Tab, label: 'Exports', icon: <FileDown className="h-4 w-4" /> }] : []),
        ...(isPrivileged ? [{ id: 'reconcile' as Tab, label: 'Banking', icon: <Landmark className="h-4 w-4" /> }] : []),
        ...(isPrivileged ? [{ id: 'payables' as Tab, label: 'Payables', icon: <Wallet className="h-4 w-4" /> }] : []),
        ...(isPrivileged ? [{ id: 'budgets' as Tab, label: 'Budgets', icon: <PiggyBank className="h-4 w-4" /> }] : []),
        ...(isPrivileged ? [{ id: 'tax-dashboard' as Tab, label: 'Tax', icon: <Receipt className="h-4 w-4" /> }] : []),
        ...(isPrivileged ? [{ id: 'cashflow-forecast' as Tab, label: 'Cash Flow', icon: <TrendingUp className="h-4 w-4" /> }] : []),
        ...(isPrivileged ? [{ id: 'vendor-analytics' as Tab, label: 'Vendors', icon: <Store className="h-4 w-4" /> }] : []),
        ...(isPrivileged ? [{ id: 'multi-currency' as Tab, label: 'Multi-Currency', icon: <DollarSign className="h-4 w-4" /> }] : []),
      ],
    },
    {
      id: 'tools',
      label: 'Productivity',
      items: [
        { id: 'receipt-tags' as Tab, label: 'Tags & Labels', icon: <Tags className="h-4 w-4" /> },
        ...(isPrivileged ? [{ id: 'batch-operations' as Tab, label: 'Batch Ops', icon: <ListChecks className="h-4 w-4" /> }] : []),
        { id: 'receipt-comparison' as Tab, label: 'Compare', icon: <GitCompare className="h-4 w-4" /> },
        { id: 'recurring-detector' as Tab, label: 'Recurring', icon: <Repeat className="h-4 w-4" /> },
        ...(isPrivileged ? [{ id: 'kanban-workflow' as Tab, label: 'Kanban', icon: <Kanban className="h-4 w-4" /> }] : []),
      ],
    },
    {
      id: 'oversight',
      label: 'Oversight',
      items: [
        ...(isPrivileged ? [{ id: 'audit' as Tab, label: 'Audit', icon: <ScrollText className="h-4 w-4" /> }] : []),
        ...(isPrivileged ? [{ id: 'approvals' as Tab, label: 'Approvals', icon: <Users className="h-4 w-4" /> }] : []),
        ...(isPrivileged ? [{ id: 'alerts' as Tab, label: 'Alerts', icon: <AlertTriangle className="h-4 w-4" /> }] : []),
        ...(isPrivileged ? [{ id: 'reports' as Tab, label: 'Reports', icon: <BarChart3 className="h-4 w-4" /> }] : []),
        ...(isPrivileged ? [{ id: 'readiness-score' as Tab, label: 'Readiness', icon: <ClipboardCheck className="h-4 w-4" /> }] : []),
        ...(isPrivileged ? [{ id: 'spending-insights' as Tab, label: 'Insights', icon: <Lightbulb className="h-4 w-4" /> }] : []),
        ...(isPrivileged ? [{ id: 'payables-dashboard' as Tab, label: 'Payables', icon: <Wallet className="h-4 w-4" /> }] : []),
        ...(isPrivileged ? [{ id: 'slack-alerts' as Tab, label: 'Notifications', icon: <MessageSquare className="h-4 w-4" /> }] : []),
      ],
    },
    {
      id: 'integrations',
      label: 'Integrations',
      items: [
        ...(isPrivileged ? [{ id: 'qbo-export' as Tab, label: 'QBO', icon: <FileSpreadsheet className="h-4 w-4" /> }] : []),
        ...(isPrivileged ? [{ id: 'xero-export' as Tab, label: 'Xero', icon: <FileText className="h-4 w-4" /> }] : []),
        ...(isPrivileged ? [{ id: 'export-dashboard' as Tab, label: 'Export Logs', icon: <BarChart className="h-4 w-4" /> }] : []),
        ...(isPrivileged ? [{ id: 'email-forward' as Tab, label: 'Email Forward', icon: <Mail className="h-4 w-4" /> }] : []),
      ],
    },
    ...(!isPrivileged ? [{
      id: 'tools',
      label: 'Tools',
      items: [
        { id: 'smart-search' as Tab, label: 'Search', icon: <Search className="h-4 w-4" /> },
        { id: 'receipt-calendar' as Tab, label: 'Calendar', icon: <CalendarDays className="h-4 w-4" /> },
        { id: 'receipt-timeline' as Tab, label: 'Timeline', icon: <History className="h-4 w-4" /> },
        { id: 'vendor-analytics' as Tab, label: 'Vendors', icon: <Store className="h-4 w-4" /> },
        { id: 'receipt-tags' as Tab, label: 'Tags', icon: <Tags className="h-4 w-4" /> },
        { id: 'receipt-comparison' as Tab, label: 'Compare', icon: <GitCompare className="h-4 w-4" /> },
        { id: 'recurring-detector' as Tab, label: 'Recurring', icon: <Repeat className="h-4 w-4" /> },
        { id: 'share-receipt' as Tab, label: 'Share', icon: <Share2 className="h-4 w-4" /> },
      ],
    }] : []),
    // Non-privileged get a simplified Tools group; extra items only for privileged above
    ...(isPrivileged ? [{
      id: 'extra',
      label: 'Extra',
      items: [
        { id: 'share-receipt' as Tab, label: 'Share Receipt', icon: <Share2 className="h-4 w-4" /> },
        { id: 'dark-sync' as Tab, label: 'Dark Sync', icon: <Moon className="h-4 w-4" /> },
      ],
    }] : []),
  ];

  const sidebarContent = (
    <div className="flex h-full flex-col">
      {/* Top accent line */}
      <div className="h-0.5 w-full bg-sidebar-accent/60 flex-shrink-0" />

      {/* Logo */}
      <div className={`flex items-center border-b border-sidebar-border px-4 py-3 ${collapsed ? 'justify-center' : 'gap-3'}`}>
        <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg bg-sidebar-accent/15">
          <ReceiptText className="h-4.5 w-4.5 text-sidebar-accent" />
        </div>
        <div
          className={`overflow-hidden transition-all duration-200 ${
            collapsed ? 'max-w-0 opacity-0' : 'max-w-40 opacity-100'
          }`}
        >
          <h1 className="text-sm font-bold tracking-tight text-sidebar-text whitespace-nowrap">{APP_NAME}</h1>
          <p className="text-[9px] font-semibold uppercase tracking-[0.18em] text-sidebar-accent whitespace-nowrap">
            CRA-ready records
          </p>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto px-3 py-4 scroll-smooth no-scrollbar" aria-label="Main navigation">
        {navGroups.map((group) => {
          const hasItems = group.items.length > 0;
          if (!hasItems) return null;

          return (
            <div key={group.id} className="mb-5">
              {!collapsed && (
                <p className="mb-1.5 px-3 text-[9px] font-semibold uppercase tracking-[0.14em] text-sidebar-text-muted/60">
                  {group.label}
                </p>
              )}
                  <div className="space-y-0.5">
                {group.items.filter((item) => isTabVisible(item.id)).map((item) => (
                  <NavLink
                    key={item.id}
                    icon={item.icon}
                    label={item.label}
                    active={activeTab === item.id}
                    collapsed={collapsed}
                    onClick={() => {
                      onTabChange(item.id);
                      setMobileOpen(false);
                    }}
                  />
                ))}
                      </div>
                    </div>
                  );
                })}
      </nav>

        {/* Bottom section */}
      <div className="border-t border-sidebar-border px-2 py-2">
        {/* Live sync status */}
        <div
          className={`mb-1 flex items-center rounded-lg px-2.5 py-1.5 text-sidebar-text-muted ${collapsed ? 'justify-center' : ''}`}
          title={collapsed ? (isConnected ? 'Live sync connected' : 'Live sync disconnected') : undefined}
        >
          <RealtimeStatus connected={isConnected} showLabel={!collapsed} />
        </div>

        {/* Billing & Plan */}
        <Link
          href="/settings/billing"
          aria-label="Billing"
          className={`flex items-center gap-2.5 rounded-lg px-2.5 py-1.5 text-xs font-medium text-sidebar-text-muted hover:bg-sidebar-hover hover:text-sidebar-text-secondary transition mb-0.5 ${collapsed ? 'justify-center px-2' : ''}`}
          title={collapsed ? `Billing · ${planLabel}` : undefined}
        >
          <Crown className={`h-3.5 w-3.5 flex-shrink-0 ${plan === 'pro' || plan === 'enterprise' ? 'text-warning' : 'text-sidebar-text-muted'}`} />
          {!collapsed && (
            <>
              <span className="flex-1">Billing</span>
              <span className={`text-[9px] px-1.5 py-0.5 rounded font-semibold ${
                plan === 'pro' || plan === 'enterprise' ? 'bg-warning/10 text-warning' : 'bg-sidebar-hover text-sidebar-text-muted'
              }`}>
                {planLabel}
              </span>
            </>
          )}
        </Link>

        {/* Admin */}
        <Link
          href="/settings/admin"
          aria-label="Admin"
          className={`flex items-center gap-2.5 rounded-lg px-2.5 py-1.5 text-xs font-medium text-sidebar-text-muted hover:bg-sidebar-hover hover:text-sidebar-text-secondary transition mb-0.5 ${collapsed ? 'justify-center px-2' : ''}`}
          title={collapsed ? 'Admin' : undefined}
        >
          <LayoutDashboard className="h-3.5 w-3.5 flex-shrink-0" />
          {!collapsed && <span>Admin</span>}
        </Link>

        {/* Organization */}
        <Link
          href="/settings/org"
          aria-label="Organization"
          className={`flex items-center gap-2.5 rounded-lg px-2.5 py-1.5 text-xs font-medium text-sidebar-text-muted hover:bg-sidebar-hover hover:text-sidebar-text-secondary transition mb-0.5 ${collapsed ? 'justify-center px-2' : ''}`}
          title={collapsed ? 'Organization' : undefined}
        >
          <Settings className="h-3.5 w-3.5 flex-shrink-0" />
          {!collapsed && <span>Organization</span>}
        </Link>

        {/* Notifications */}
        <Link
          href="/notifications"
          aria-label={`Notifications${unreadCount > 0 ? ` (${unreadCount} unread)` : ''}`}
          className={`relative flex items-center gap-2.5 rounded-lg px-2.5 py-1.5 text-xs font-medium text-sidebar-text-muted hover:bg-sidebar-hover hover:text-sidebar-text-secondary transition mb-0.5 ${collapsed ? 'justify-center px-2' : ''}`}
          title={collapsed ? `Notifications${unreadCount > 0 ? ` — ${unreadCount} unread` : ''}` : undefined}
        >
          <Bell className="h-3.5 w-3.5 flex-shrink-0" />
          {!collapsed && <span className="flex-1">Notifications</span>}
          {unreadCount > 0 && (
            <span className={`flex items-center justify-center rounded-full bg-danger px-1.5 text-[9px] font-bold leading-none text-white ${collapsed ? 'absolute -right-0.5 -top-0.5' : ''}`}>
              {unreadCount > 99 ? '99+' : unreadCount}
            </span>
          )}
        </Link>

        {/* Collapse toggle */}
        <button
          type="button"
          onClick={() => setCollapsed(!collapsed)}
          className="mb-1 hidden w-full items-center justify-center rounded-lg px-3 py-1.5 text-sidebar-text-muted hover:bg-sidebar-hover hover:text-sidebar-text-secondary transition lg:flex"
          aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          title={collapsed ? 'Expand sidebar (Ctrl+\)' : 'Collapse sidebar (Ctrl+\)'}
        >
          {collapsed ? <PanelLeft className="h-4 w-4" /> : <PanelLeftClose className="h-4 w-4" />}
        </button>

        {/* Theme + Sign out */}
        <div className={`flex items-center gap-1 rounded-lg bg-sidebar-surface p-1 ${collapsed ? 'flex-col' : ''}`}>
          <ThemeToggle />
          <button
            type="button"
            onClick={handleSignOut}
            className={`flex items-center gap-2 rounded-md px-2 py-1 text-[11px] font-medium text-sidebar-text-muted hover:bg-sidebar-hover hover:text-danger transition ${collapsed ? 'justify-center w-full' : 'flex-1'}`}
            title="Sign out"
          >
            <LogOut className={`h-3.5 w-3.5 flex-shrink-0 ${collapsed ? '' : ''}`} />
            {!collapsed && <span>Sign out</span>}
          </button>
        </div>
      </div>
    </div>
  );

  return (
    <>
      {/* Mobile hamburger */}
      <button
        type="button"
        onClick={() => setMobileOpen(true)}
        className="fixed left-3 top-3 z-[60] flex h-9 w-9 items-center justify-center rounded-xl bg-sidebar-bg border border-sidebar-border lg:hidden"
        aria-label="Open menu"
      >
        <Menu className="h-5 w-5 text-sidebar-text-muted" />
      </button>

      {/* Mobile overlay sidebar */}
      <AnimatePresence>
        {mobileOpen && (
          <div className="fixed inset-0 z-[100] lg:hidden">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="absolute inset-0 bg-black/70 backdrop-blur-sm focus-visible:outline-2 focus-visible:outline-champagne/40"
              onClick={() => setMobileOpen(false)}
              onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); setMobileOpen(false); } }}
              tabIndex={0}
              role="button"
              aria-label="Close menu"
            />
            <motion.aside
              initial={{ x: '-100%' }}
              animate={{ x: 0 }}
              exit={{ x: '-100%' }}
              transition={{ type: 'spring', damping: 28, stiffness: 250 }}
              className="relative h-full w-72 max-w-[85vw] bg-sidebar-bg border-r border-sidebar-border shadow-2xl"
            >
              <div className="flex h-full flex-col">
                {/* Top accent */}
                <div className="h-0.5 w-full bg-sidebar-accent flex-shrink-0" />

                <div className="flex items-center justify-between border-b border-sidebar-border px-4 py-3">
                  <div className="flex items-center gap-3">
                    <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-sidebar-accent/15">
                      <ReceiptText className="h-4.5 w-4.5 text-sidebar-accent" />
                    </div>
                    <div>
                      <h1 className="text-base font-bold tracking-tight text-sidebar-text">{APP_NAME}</h1>
                      <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-sidebar-accent">CRA-ready records</p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => setMobileOpen(false)}
                    className="flex h-8 w-8 items-center justify-center rounded-lg text-sidebar-text-muted hover:bg-sidebar-hover hover:text-sidebar-text-secondary transition"
                    aria-label="Close menu"
                    title="Close menu"
                  >
                    <X className="h-5 w-5" />
                  </button>
                </div>

                <div className="flex-1 overflow-y-auto px-3 py-4">
                  {navGroups.map((group) => {
                    const hasItems = group.items.length > 0;
                    if (!hasItems) return null;
                    return (
            <div key={group.id} className="mb-4">
                        <p className="mb-2 px-3 text-[10px] font-semibold uppercase tracking-[0.14em] text-sidebar-text-muted">{group.label}</p>
                        <div className="space-y-0.5">
                          {group.items.filter((item) => isTabVisible(item.id)).map((item) => (
                            <NavLink
                              key={item.id}
                              icon={item.icon}
                              label={item.label}
                              active={activeTab === item.id}
                              collapsed={false}
                              onClick={() => {
                                onTabChange(item.id);
                                setMobileOpen(false);
                              }}
                            />
                          ))}
                        </div>
                      </div>
                    );
                  })}
                </div>

                <div className="border-t border-sidebar-border p-2 space-y-0.5">
                  <Link
                    href="/settings/billing"
                    onClick={() => setMobileOpen(false)}
                    className="flex items-center gap-2.5 rounded-lg px-2.5 py-2 text-xs font-medium text-sidebar-text-muted hover:bg-sidebar-hover hover:text-sidebar-text-secondary transition"
                  >
                    <Crown className="h-3.5 w-3.5 text-warning flex-shrink-0" />
                    <span>Billing</span>
                  </Link>
                  <Link
                    href="/settings/org"
                    onClick={() => setMobileOpen(false)}
                    className="flex items-center gap-2.5 rounded-lg px-2.5 py-2 text-xs font-medium text-sidebar-text-muted hover:bg-sidebar-hover hover:text-sidebar-text-secondary transition"
                  >
                    <Settings className="h-3.5 w-3.5 flex-shrink-0" />
                    <span>Organization</span>
                  </Link>
                  <button
                    type="button"
                    onClick={() => { handleSignOut(); setMobileOpen(false); }}
                    className="flex w-full items-center gap-2.5 rounded-lg px-2.5 py-2 text-xs font-medium text-sidebar-text-muted hover:bg-sidebar-hover hover:text-danger transition"
                  >
                    <LogOut className="h-3.5 w-3.5" />
                    <span>Sign out</span>
                  </button>
                </div>
              </div>
            </motion.aside>
          </div>
        )}
      </AnimatePresence>

      {/* Desktop sidebar */}
      <motion.aside
        animate={{ width: collapsed ? 64 : 256 }}
        transition={{ type: 'spring', stiffness: 300, damping: 28 }}
        className="hidden lg:flex h-screen flex-col bg-sidebar-bg border-r border-sidebar-border flex-shrink-0 overflow-hidden"
      >
        {sidebarContent}
      </motion.aside>
    </>
  );
}
