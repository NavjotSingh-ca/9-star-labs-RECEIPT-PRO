/**
 * Sidebar — Collapsible navigation sidebar (always dark theme).
 */

'use client';

import { type ReactNode, useState } from 'react';
import { cn } from '../utils/helpers';
import { Button } from '../primitives/Button';
import { motion, AnimatePresence } from 'framer-motion';
import {
  LayoutDashboard,
  Camera,
  ReceiptText,
  Route,
  FileDown,
  Landmark,
  Store,
  PiggyBank,
  TrendingUp,
  DollarSign,
  Tags,
  Kanban,
  GitCompare,
  Repeat,
  BarChart3,
  ClipboardCheck,
  ShieldCheck,
  AlertTriangle,
  Users,
  Building2,
  Wallet,
  Settings,
  CreditCard,
  Shield,
  ChevronLeft,
  ChevronRight,
  Crown,
  LogOut,
  Plus,
  Moon,
  Sun,
} from 'lucide-react';
import { Badge } from '../primitives/Badge';
import { usePathname } from 'next/navigation';

interface NavItem {
  label: string;
  href: string;
  icon: ReactNode;
  badge?: string;
  roles?: string[];
}

interface NavGroup {
  label: string;
  items: NavItem[];
  roles?: string[];
}

const navGroups: NavGroup[] = [
  {
    label: 'Overview',
    items: [
      { label: 'Dashboard', href: '/', icon: <LayoutDashboard className="h-5 w-5" /> },
    ],
  },
  {
    label: 'Records',
    items: [
      { label: 'Scan', href: '/scan', icon: <Camera className="h-5 w-5" /> },
      { label: 'Receipts', href: '/receipts', icon: <ReceiptText className="h-5 w-5" /> },
      { label: 'Mileage', href: '/mileage', icon: <Route className="h-5 w-5" /> },
      { label: 'Recurring', href: '/recurring', icon: <Repeat className="h-5 w-5" /> },
      { label: 'Import', href: '/import', icon: <FileDown className="h-5 w-5" /> },
    ],
  },
  {
    label: 'Business',
    items: [
      { label: 'Vendors', href: '/vendors', icon: <Store className="h-5 w-5" /> },
      { label: 'Categories', href: '/categories', icon: <Tags className="h-5 w-5" /> },
      { label: 'Projects', href: '/projects', icon: <Landmark className="h-5 w-5" /> },
      { label: 'Budget', href: '/budget', icon: <PiggyBank className="h-5 w-5" /> },
    ],
  },
  {
    label: 'Workflows',
    items: [
      { label: 'Kanban', href: '/kanban', icon: <Kanban className="h-5 w-5" /> },
      { label: 'Approvals', href: '/approvals', icon: <ClipboardCheck className="h-5 w-5" /> },
      { label: 'Reimbursements', href: '/reimbursements', icon: <Wallet className="h-5 w-5" /> },
    ],
    roles: ['owner', 'admin', 'manager'],
  },
  {
    label: 'Tax & Export',
    items: [
      { label: 'CRA Export', href: '/export/cra', icon: <FileDown className="h-5 w-5" /> },
      { label: 'Reports', href: '/reports', icon: <BarChart3 className="h-5 w-5" /> },
      { label: 'Integrations', href: '/integrations', icon: <GitCompare className="h-5 w-5" /> },
    ],
  },
  {
    label: 'Oversight',
    items: [
      { label: 'Analytics', href: '/analytics', icon: <TrendingUp className="h-5 w-5" /> },
      { label: 'Audit Trail', href: '/audit', icon: <ShieldCheck className="h-5 w-5" /> },
      { label: 'Alerts & Risk', href: '/alerts', icon: <AlertTriangle className="h-5 w-5" /> },
      { label: 'Payables Overview', href: '/payables', icon: <DollarSign className="h-5 w-5" /> },
    ],
    roles: ['owner', 'admin'],
  },
  {
    label: 'Employee Tools',
    items: [
      { label: 'My Receipts', href: '/my-receipts', icon: <ReceiptText className="h-5 w-5" /> },
      { label: 'My Mileage', href: '/my-mileage', icon: <Route className="h-5 w-5" /> },
      { label: 'Submit Expense', href: '/submit', icon: <Plus className="h-5 w-5" /> },
    ],
    roles: ['employee', 'member'],
  },
];

const settingsItems: NavItem[] = [
  { label: 'Organization', href: '/settings/org', icon: <Building2 className="h-5 w-5" /> },
  { label: 'Team', href: '/settings/team', icon: <Users className="h-5 w-5" /> },
  { label: 'Billing', href: '/settings/billing', icon: <CreditCard className="h-5 w-5" /> },
  { label: 'Security', href: '/settings/security', icon: <Shield className="h-5 w-5" /> },
  { label: 'Features', href: '/settings/features', icon: <Settings className="h-5 w-5" /> },
];

export interface SidebarProps {
  open: boolean;
  onClose?: () => void;
  userRole?: string;
  className?: string;
}

export function Sidebar({
  open,
  onClose: _onClose,
  userRole = 'owner',
  className,
}: SidebarProps) {
  const [collapsed, setCollapsed] = useState(false);
  const pathname = usePathname();

  const filteredGroups = navGroups.filter(group => {
    if (!group.roles) return true;
    return group.roles.includes(userRole);
  });

  return (
    <aside
      className={cn(
        'fixed left-0 top-0 z-40 h-screen bg-sidebar-bg border-r border-sidebar-border',
        'transition-all duration-300 ease-in-out flex flex-col',
        open ? 'w-64' : 'w-16',
        className
      )}
      aria-label="Main navigation"
    >
      {/* Logo / Brand */}
      <div className="flex h-16 items-center justify-between px-4 border-b border-sidebar-border relative">
        <div className="absolute top-0 left-0 right-0 h-0.5 bg-champagne" aria-hidden="true" />
        <motion.div
          initial={{ opacity: 0, width: 0 }}
          animate={{ opacity: open && !collapsed ? 1 : 0, width: open && !collapsed ? 'auto' : 0 }}
          transition={{ duration: 0.2 }}
          className="overflow-hidden"
        >
          <span className="text-base font-bold text-white">{open && !collapsed ? 'Leduc Receipt Pro' : 'LRP'}</span>
        </motion.div>
        <Button
          variant="ghost"
          size="icon"
          className="ml-auto"
          onClick={() => setCollapsed(!collapsed)}
          aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          title={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        >
          {collapsed ? (
            <ChevronRight className="h-5 w-5" aria-hidden="true" />
          ) : (
            <ChevronLeft className="h-5 w-5" aria-hidden="true" />
          )}
        </Button>
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto p-3 space-y-4" role="navigation" aria-label="Main navigation">
        {filteredGroups.map((group, groupIndex) => (
          <motion.div
            key={group.label}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: groupIndex * 0.05 }}
          >
            <AnimatePresence mode="wait">
              {!collapsed && (
                <motion.p
                  key="group-label"
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="px-3 py-1 text-[10px] font-semibold uppercase tracking-wider text-sidebar-text-muted"
                >
                  {group.label}
                </motion.p>
              )}
            </AnimatePresence>
            <div className="space-y-1" role="group" aria-label={group.label}>
              {group.items.map((item, itemIndex) => {
                const isActive = pathname === item.href || pathname.startsWith(item.href + '/');
                return (
                  <motion.a
                    key={item.href}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: groupIndex * 0.05 + itemIndex * 0.02 }}
                    href={item.href}
                    className={cn(
                      'flex w-full items-center gap-3 rounded-xl px-3 py-2 text-sm font-medium transition-all duration-200',
                      'relative overflow-hidden',
                      isActive
                        ? 'bg-sidebar-active text-sidebar-text font-semibold border border-sidebar-accent/25 shadow-sm shadow-sidebar-accent/10'
                        : 'text-sidebar-text-muted hover:bg-sidebar-hover hover:text-sidebar-text',
                      collapsed && 'justify-center px-2'
                    )}
                    aria-current={isActive ? 'page' : undefined}
                    title={collapsed ? item.label : undefined}
                    whileHover={{ scale: 1.01 }}
                    whileTap={{ scale: 0.99 }}
                  >
                      <span className="flex-shrink-0" aria-hidden="true">
                        {item.icon}
                      </span>
                      <AnimatePresence mode="wait">
                        {!collapsed && (
                          <motion.span
                            key="label"
                            initial={{ opacity: 0, width: 0 }}
                            animate={{ opacity: 1, width: 'auto' }}
                            exit={{ opacity: 0, width: 0 }}
                            className="truncate flex-1"
                          >
                            {item.label}
                          </motion.span>
                        )}
                      </AnimatePresence>
                      {item.badge && !collapsed && (
                        <Badge variant="warning" size="sm" className="flex-shrink-0">
                          {item.badge}
                        </Badge>
                      )}
                      {isActive && !collapsed && (
                        <motion.div
                          layoutId="activeNavIndicator"
                          className="absolute left-0 top-1/2 -translate-y-1/2 h-5 w-0.5 rounded-full bg-sidebar-accent"
                          transition={{ type: 'spring', stiffness: 500, damping: 35 }}
                        />
                      )}
                    </motion.a>
                  );
              })}
            </div>
          </motion.div>
        ))}

        {/* Settings section */}
        <div className="pt-4 border-t border-sidebar-border">
          <p className={cn('px-3 py-1 text-[10px] font-semibold uppercase tracking-wider text-sidebar-text-muted', collapsed && 'hidden')}>
            Settings
          </p>
          <div className="space-y-1" role="group" aria-label="Settings">
            {settingsItems.map((item, index) => {
              const isActive = pathname === item.href || pathname.startsWith(item.href + '/');
return (
                  <motion.a
                    key={item.href}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.02 }}
                    href={item.href}
                    className={cn(
                      'flex w-full items-center gap-3 rounded-xl px-3 py-2 text-sm font-medium transition-all duration-200',
                      'relative overflow-hidden',
                      isActive
                        ? 'bg-sidebar-active text-sidebar-text font-semibold border border-sidebar-accent/25 shadow-sm shadow-sidebar-accent/10'
                        : 'text-sidebar-text-muted hover:bg-sidebar-hover hover:text-sidebar-text',
                      collapsed && 'justify-center px-2'
                    )}
                    aria-current={isActive ? 'page' : undefined}
                    title={collapsed ? item.label : undefined}
                    whileHover={{ scale: 1.01 }}
                    whileTap={{ scale: 0.99 }}
                  >
                    <span className="flex-shrink-0" aria-hidden="true">{item.icon}</span>
                    <AnimatePresence mode="wait">
                      {!collapsed && (
                        <motion.span
                          key="label"
                          initial={{ opacity: 0, width: 0 }}
                          animate={{ opacity: 1, width: 'auto' }}
                          exit={{ opacity: 0, width: 0 }}
                          className="truncate flex-1"
                        >
                          {item.label}
                        </motion.span>
                      )}
                    </AnimatePresence>
                    {isActive && !collapsed && (
                      <motion.div
                        layoutId="activeNavIndicator"
                        className="absolute left-0 top-1/2 -translate-y-1/2 h-5 w-0.5 rounded-full bg-sidebar-accent"
                        transition={{ type: 'spring', stiffness: 500, damping: 35 }}
                      />
                    )}
                  </motion.a>
                );
              })}
          </div>
        </div>
      </nav>

      {/* Footer - User info & theme toggle */}
      <div className="p-3 border-t border-sidebar-border space-y-3">
        {/* Plan badge */}
        <div className={cn('flex items-center gap-2', collapsed && 'justify-center')}>
          <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-champagne/15">
            <Crown className="h-4 w-4 text-champagne" aria-hidden="true" />
          </div>
          <AnimatePresence mode="wait">
            {!collapsed && (
              <motion.div
                key="plan"
                initial={{ opacity: 0, width: 0 }}
                animate={{ opacity: 1, width: 'auto' }}
                exit={{ opacity: 0, width: 0 }}
                className="flex-1 min-w-0"
              >
                <p className="text-xs font-semibold text-sidebar-text truncate">Pro Plan</p>
                <p className="text-[10px] text-sidebar-text-muted">14 days left in trial</p>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Theme toggle & sign out */}
        <div className={cn('flex items-center gap-2', collapsed && 'justify-center')}>
          <Button
            variant="ghost"
            size="icon"
            className="flex-1"
            onClick={() => document.documentElement.classList.toggle('dark')}
            aria-label="Toggle theme"
            title="Toggle theme"
          >
            <motion.div
              animate={{ rotate: document.documentElement.classList.contains('dark') ? 180 : 0 }}
              transition={{ duration: 0.3 }}
            >
              <Moon className="h-5 w-5 dark:hidden" aria-hidden="true" />
              <Sun className="h-5 w-5 hidden dark:block" aria-hidden="true" />
            </motion.div>
          </Button>
          <AnimatePresence mode="wait">
            {!collapsed && (
              <motion.div
                key="signout"
                initial={{ opacity: 0, width: 0 }}
                animate={{ opacity: 1, width: 'auto' }}
                exit={{ opacity: 0, width: 0 }}
              >
                <Button
                  variant="ghost"
                  className="flex-1 justify-start gap-2 text-sidebar-text-muted hover:text-danger hover:bg-danger/10"
                  onClick={() => { /* sign out */ }}
                >
                  <LogOut className="h-4 w-4" aria-hidden="true" />
                  <span className="text-sm font-medium">Sign out</span>
                </Button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </aside>
  );
}

export default Sidebar;