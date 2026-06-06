'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAppStore } from '@/lib/store';
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

type Tab = 'dashboard' | 'receipts' | 'scan' | 'export' | 'audit' | 'reconcile' | 'mileage' | 'approvals' | 'payables' | 'projects' | 'alerts' | 'more';

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
      className={`relative flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-all duration-200 ${
        active
          ? 'bg-sidebar-active text-sidebar-text'
          : 'text-sidebar-text-muted hover:bg-sidebar-hover hover:text-sidebar-text-secondary'
      } ${collapsed ? 'justify-center px-2' : ''}`}
    >
      {active && (
        <>
          <motion.div
            layoutId="sidebar-active-pill"
            className="absolute inset-0 rounded-lg bg-sidebar-active"
            transition={{ type: 'spring', stiffness: 350, damping: 30 }}
          />
          <div className="absolute left-0 top-1/2 -translate-y-1/2 h-5 w-0.5 rounded-full bg-sidebar-accent" />
        </>
      )}
      <span className="relative z-10 flex-shrink-0">{icon}</span>
      <AnimatePresence mode="wait">
        {!collapsed && (
          <motion.span
            initial={{ opacity: 0, width: 0 }}
            animate={{ opacity: 1, width: 'auto' }}
            exit={{ opacity: 0, width: 0 }}
            transition={{ duration: 0.15 }}
            className="relative z-10 overflow-hidden whitespace-nowrap"
          >
            {label}
          </motion.span>
        )}
      </AnimatePresence>
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
      <div className="h-0.5 w-full bg-sidebar-accent flex-shrink-0" />

      {/* Logo */}
      <div className={`flex items-center border-b border-sidebar-border px-4 py-4 ${collapsed ? 'justify-center' : 'gap-3'}`}>
        <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl bg-sidebar-accent/15">
          <ReceiptText className="h-5 w-5 text-sidebar-accent" />
        </div>
        <AnimatePresence mode="wait">
          {!collapsed && (
            <motion.div
              initial={{ opacity: 0, width: 0 }}
              animate={{ opacity: 1, width: 'auto' }}
              exit={{ opacity: 0, width: 0 }}
              transition={{ duration: 0.15 }}
              className="overflow-hidden"
            >
              <h1 className="text-base font-bold tracking-tight text-sidebar-text whitespace-nowrap">9 Star Labs</h1>
              <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-sidebar-accent whitespace-nowrap">
                CRA-ready records
              </p>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto px-3 py-4 scroll-smooth no-scrollbar">
        {navGroups.map((group) => {
          const hasItems = group.items.length > 0;
          if (!hasItems) return null;

          return (
            <div key={group.id} className="mb-5">
              {!collapsed && (
                <p className="mb-2 px-3 text-[10px] font-semibold uppercase tracking-[0.14em] text-sidebar-text-muted">
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
      <div className="border-t border-sidebar-border p-3">
        {/* Billing & Plan */}
        <Link
          href="/settings/billing"
          className={`flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-sidebar-text-muted hover:bg-sidebar-hover hover:text-sidebar-text-secondary transition mb-1 ${collapsed ? 'justify-center' : ''}`}
          title={collapsed ? `Billing · ${planLabel}` : undefined}
        >
          <Crown className={`h-4 w-4 flex-shrink-0 ${plan === 'pro' || plan === 'enterprise' ? 'text-warning' : 'text-sidebar-text-muted'}`} />
          {!collapsed && (
            <>
              <span className="flex-1">Billing</span>
              <span className={`text-[10px] px-1.5 py-0.5 rounded-md font-semibold ${
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
          className={`flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-sidebar-text-muted hover:bg-sidebar-hover hover:text-sidebar-text-secondary transition mb-2 ${collapsed ? 'justify-center' : ''}`}
          title={collapsed ? 'Organization' : undefined}
        >
          <Settings className="h-4 w-4 flex-shrink-0" />
          {!collapsed && <span>Organization</span>}
        </Link>

        {/* Collapse toggle */}
        <button
          type="button"
          onClick={() => setCollapsed(!collapsed)}
          className="mb-2 hidden w-full items-center justify-center rounded-lg px-3 py-2 text-sidebar-text-muted hover:bg-sidebar-hover hover:text-sidebar-text-secondary transition lg:flex"
          aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          title={collapsed ? 'Expand sidebar (Ctrl+\)' : 'Collapse sidebar (Ctrl+\)'}
        >
          {collapsed ? <PanelLeft className="h-4 w-4" /> : <PanelLeftClose className="h-4 w-4" />}
        </button>

        {/* Theme + Sign out */}
        <div className={`flex items-center gap-1 rounded-lg bg-sidebar-surface p-1.5 ${collapsed ? 'flex-col' : ''}`}>
          <ThemeToggle />
          <button
            type="button"
            onClick={handleSignOut}
            className={`flex items-center gap-2 rounded-md px-2.5 py-1.5 text-xs font-medium text-sidebar-text-muted hover:bg-sidebar-hover hover:text-danger transition ${collapsed ? 'justify-center w-full' : 'flex-1'}`}
            title="Sign out"
          >
            <LogOut className="h-4 w-4 flex-shrink-0" />
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

                <div className="flex items-center justify-between border-b border-sidebar-border px-4 py-4">
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-sidebar-accent/15">
                      <ReceiptText className="h-5 w-5 text-sidebar-accent" />
                    </div>
                    <div>
                      <h1 className="text-base font-bold tracking-tight text-sidebar-text">9 Star Labs</h1>
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
                      <div key={group.id} className="mb-5">
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

                <div className="border-t border-sidebar-border p-3 space-y-1">
                  <Link
                    href="/settings/billing"
                    onClick={() => setMobileOpen(false)}
                    className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-sidebar-text-muted hover:bg-sidebar-hover hover:text-sidebar-text-secondary transition"
                  >
                    <Crown className="h-4 w-4 text-warning flex-shrink-0" />
                    <span>Billing & Plan</span>
                  </Link>
                  <Link
                    href="/settings/org"
                    onClick={() => setMobileOpen(false)}
                    className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-sidebar-text-muted hover:bg-sidebar-hover hover:text-sidebar-text-secondary transition"
                  >
                    <Settings className="h-4 w-4 flex-shrink-0" />
                    <span>Organization</span>
                  </Link>
                  <button
                    type="button"
                    onClick={() => { handleSignOut(); setMobileOpen(false); }}
                    className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-sidebar-text-muted hover:bg-sidebar-hover hover:text-danger transition"
                  >
                    <LogOut className="h-4 w-4" />
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
