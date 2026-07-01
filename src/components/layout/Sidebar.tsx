'use client';

import { useState } from 'react';
import { APP_NAME } from '@/lib/constants';
import { motion, AnimatePresence } from 'framer-motion';
import { useAppStore, type Tab } from '@/lib/store';
import {
  LayoutDashboard,
  Camera,
  ReceiptText,
  CheckCircle2,
  TrendingUp,
  Layers,
  Scale,
  ShieldCheck,
  AlertCircle,
  BarChart3,
  Download,
  Crown,
  Settings,
  LogOut,
  PanelLeftClose,
  PanelLeft,
  Users,
  Banknote,
  Menu,
  X,
} from 'lucide-react';
import Link from 'next/link';
import { ThemeToggle } from '@/components/ThemeToggle';
import type { UserRole } from '@/lib/types';

interface SidebarProps {
  activeTab: Tab;
  onTabChange: (tab: Tab) => void;
  role: UserRole;
  planLabel: string;
  plan: string;
  openInviteModal: () => void;
  handleSignOut: () => void;
}

function NavLink({
  icon,
  label,
  active,
  collapsed,
  onClick,
}: {
  icon: React.ReactNode;
  label: string;
  active: boolean;
  collapsed: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={label}
      title={label}
       className={`relative flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-all duration-150 ${
         active
           ? 'bg-sidebar-active text-sidebar-text'
           : 'text-sidebar-text-muted hover:bg-sidebar-hover hover:text-sidebar-text-secondary'
       } ${collapsed ? 'justify-center px-2' : ''}`}
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
    </button>
  );
}

export default function Sidebar({
  activeTab,
  onTabChange,
  role,
  planLabel,
  plan,
  openInviteModal,
  handleSignOut,
}: SidebarProps) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const collapsed = useAppStore((s) => s.sidebarCollapsed);
  const setCollapsed = useAppStore((s) => s.setSidebarCollapsed);

  const isPrivileged = role !== 'Employee';

  const navGroups: Array<{
    id: string;
    label: string;
    items: Array<{ id: Tab; label: string; icon: React.ReactNode; roles?: UserRole[] }>;
  }> = [
    {
      id: 'overview',
      label: 'Overview',
      items: [
        ...(isPrivileged ? [{ id: 'dashboard' as Tab, label: 'Dashboard', icon: <LayoutDashboard className="h-4 w-4" /> }] : []),
        ...(role !== 'Accountant' ? [{ id: 'scan' as Tab, label: 'Scan', icon: <Camera className="h-4 w-4" /> }] : []),
      ],
    },
    {
      id: 'records',
      label: 'Records',
      items: [
        { id: 'receipts' as Tab, label: 'Receipts', icon: <ReceiptText className="h-4 w-4" /> },
        ...(isPrivileged ? [{ id: 'approvals' as Tab, label: 'Approvals', icon: <CheckCircle2 className="h-4 w-4" /> }] : []),
        ...(isPrivileged ? [{ id: 'payables' as Tab, label: 'Payables', icon: <Banknote className="h-4 w-4" /> }] : []),
      ],
    },
    {
      id: 'finance',
      label: 'Finance',
      items: [
        ...(isPrivileged ? [{ id: 'reconcile' as Tab, label: 'Banking', icon: <TrendingUp className="h-4 w-4" /> }] : []),
        ...(isPrivileged ? [{ id: 'export' as Tab, label: 'Tax Export', icon: <Download className="h-4 w-4" /> }] : []),
      ],
    },
    {
      id: 'business',
      label: 'Business',
      items: [
        ...(isPrivileged ? [{ id: 'projects' as Tab, label: 'Projects', icon: <Layers className="h-4 w-4" /> }] : []),
        { id: 'mileage' as Tab, label: 'Mileage', icon: <Scale className="h-4 w-4" /> },
      ],
    },
    {
      id: 'audit',
      label: 'Audit',
      items: [
        ...(isPrivileged ? [{ id: 'audit' as Tab, label: 'Audit History', icon: <ShieldCheck className="h-4 w-4" /> }] : []),
        ...(isPrivileged ? [{ id: 'alerts' as Tab, label: 'Alerts & Risk', icon: <AlertCircle className="h-4 w-4" /> }] : []),
        ...(isPrivileged ? [{ id: 'reports' as Tab, label: 'Reports', icon: <BarChart3 className="h-4 w-4" /> }] : []),
      ],
    },
    {
      id: 'people',
      label: 'People',
      items: [
        ...(role === 'Owner' ? [{ id: 'more' as Tab, label: 'Invite Team', icon: <Users className="h-4 w-4" />, roles: ['Owner' as UserRole] }] : []),
      ],
    },
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
      <nav className="flex-1 overflow-y-auto px-3 py-4 scroll-smooth no-scrollbar">
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
                {group.items.map((item) => (
                  <NavLink
                    key={item.id}
                    icon={item.icon}
                    label={item.label}
                    active={activeTab === item.id}
                    collapsed={collapsed}
                    onClick={() => {
                      if (item.id === 'more') {
                        openInviteModal();
                      } else {
                        onTabChange(item.id);
                      }
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
                          {group.items.map((item) => (
                            <NavLink
                              key={item.id}
                              icon={item.icon}
                              label={item.label}
                              active={activeTab === item.id}
                              collapsed={false}
                              onClick={() => {
                                if (item.id === 'more') {
                                  openInviteModal();
                                } else {
                                  onTabChange(item.id);
                                }
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
