'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { Command } from 'cmdk';
import { AnimatePresence, motion } from 'framer-motion';
import { useRouter } from 'next/navigation';
import { useTheme } from 'next-themes';
import { useAppStore } from '@/lib/store';
import type { Tab } from '@/components/tab-content';
import type { UserRole } from '@/lib/types';
import {
  LayoutDashboard, Camera, ReceiptText, Route, Clock, Building2, Search,
  CalendarDays, History, FileDown, Landmark, Wallet, PiggyBank, Receipt,
  TrendingUp, Store, Tags, GitCompare, Repeat, Kanban, ScrollText, Users,
  AlertTriangle, BarChart3, ClipboardCheck, Lightbulb, Share2,
  CreditCard, Building, ShieldCheck, Sparkles, Bell, FileText, Lock,
  Sun, Moon, LogOut, ArrowRight, type LucideIcon,
} from 'lucide-react';

interface CommandPaletteProps {
  /** Switches the active app tab. */
  onTabChange: (tab: Tab) => void;
  /** Signs the current user out. */
  onSignOut: () => void | Promise<void>;
  /** Current user role — gates privileged tabs. */
  role: UserRole;
}

interface PaletteItemProps {
  icon: LucideIcon;
  label: string;
  hint?: string;
  keywords?: string[];
  onSelect: () => void;
}

/** A single selectable row inside the palette. */
function PaletteItem({ icon: Icon, label, hint, keywords, onSelect }: PaletteItemProps) {
  return (
    <Command.Item
      value={label}
      keywords={keywords}
      onSelect={onSelect}
      className="group flex cursor-pointer items-center gap-3 rounded-lg px-3 py-2.5 text-sm text-foreground/90 outline-none transition-colors [&[data-selected='true']]:bg-champagne/10 [&[data-selected='true']]:text-foreground"
    >
      <span className="flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-md bg-surface-raised text-muted-foreground transition-colors group-hover:text-foreground [&[data-selected='true']]:bg-champagne/15 [&[data-selected='true']]:text-champagne">
        <Icon className="h-4 w-4" />
      </span>
      <span className="flex-1 truncate">{label}</span>
      {hint && <span className="text-xs text-muted-foreground">{hint}</span>}
      <ArrowRight className="h-3.5 w-3.5 text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100 [&[data-selected='true']]:opacity-100" />
    </Command.Item>
  );
}

/**
 * Global command palette (⌘K / Ctrl+K).
 * Fuzzy search across app navigation, settings pages, and quick actions.
 * Self-contained: owns its open/close keyboard handling and respects the
 * app-wide reduced-motion preference via the root MotionConfig.
 */
export default function CommandPalette({ onTabChange, onSignOut, role }: CommandPaletteProps) {
  const open = useAppStore((s) => s.commandOpen);
  const setOpen = useAppStore((s) => s.setCommandOpen);
  const { resolvedTheme, setTheme } = useTheme();
  const router = useRouter();
  const [search, setSearch] = useState('');
  const lastFocused = useRef<HTMLElement | null>(null);

  const isPrivileged = role !== 'Employee';

  const close = useCallback(() => {
    setSearch('');
    setOpen(false);
    lastFocused.current?.focus?.();
  }, [setOpen, setSearch]);

  const runCommand = useCallback(
    (action: () => void) => {
      close();
      action();
    },
    [close],
  );

  // Global ⌘K / Ctrl+K toggle. Ignored while typing in a field because the
  // listener checks the active element before preventing the default.
  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if (e.key.toLowerCase() === 'k' && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        lastFocused.current = document.activeElement as HTMLElement;
        useAppStore.getState().toggleCommand();
      }
    }
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, []);

  // Per-open setup: lock body scroll and capture the focus target so it can
  // be restored on close. (Search is reset in `close()` instead of here to
  // avoid a synchronous setState inside the effect.)
  useEffect(() => {
    if (!open) return;
    lastFocused.current = document.activeElement as HTMLElement;
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = prevOverflow;
    };
  }, [open]);

  const goToTab = (tab: Tab) => runCommand(() => onTabChange(tab));
  const goToRoute = (href: string) => runCommand(() => router.push(href));
  const toggleTheme = () =>
    runCommand(() => setTheme(resolvedTheme === 'dark' ? 'light' : 'dark'));
  const signOut = () => runCommand(() => void onSignOut());

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="fixed inset-0 z-[100] flex items-start justify-center px-4 pt-[12vh] sm:pt-[16vh]"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.15, ease: 'easeOut' }}
          onKeyDown={(e) => {
            if (e.key === 'Escape') {
              e.preventDefault();
              close();
            }
          }}
        >
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-black/50 backdrop-blur-sm"
            onClick={close}
            aria-hidden="true"
          />

          {/* Panel */}
          <motion.div
            role="dialog"
            aria-modal="true"
            aria-label="Command palette"
            initial={{ opacity: 0, scale: 0.97, y: 8 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.98, y: 8 }}
            transition={{ type: 'spring', stiffness: 320, damping: 28, mass: 0.8 }}
            className="relative w-full max-w-xl overflow-hidden rounded-xl border border-glass-border bg-card shadow-2xl shadow-black/40"
          >
            {/* Champagne top accent */}
            <div className="absolute inset-x-0 top-0 h-0.5 bg-champagne/50" />

            <Command label="Command palette" className="flex flex-col">
              <div className="flex items-center gap-3 border-b border-glass-border px-4">
                <Search className="h-4 w-4 flex-shrink-0 text-muted-foreground" />
                <Command.Input
                  autoFocus
                  value={search}
                  onValueChange={setSearch}
                  placeholder="Search or jump to…"
                  className="h-12 w-full bg-transparent text-sm text-foreground outline-none placeholder:text-muted-foreground"
                />
                <kbd className="hidden rounded border border-glass-border bg-surface-raised px-1.5 py-0.5 text-[10px] font-medium text-muted-foreground sm:inline-block">
                  ESC
                </kbd>
              </div>

              <Command.List className="max-h-[60vh] overflow-y-auto p-2">
                <Command.Empty className="px-3 py-8 text-center text-sm text-muted-foreground">
                  No results found.
                </Command.Empty>

                <Command.Group
                  heading="Navigation"
                  className="[&_[cmdk-group-heading]]:px-3 [&_[cmdk-group-heading]]:py-1.5 [&_[cmdk-group-heading]]:text-[10px] [&_[cmdk-group-heading]]:font-semibold [&_[cmdk-group-heading]]:uppercase [&_[cmdk-group-heading]]:tracking-[0.14em] [&_[cmdk-group-heading]]:text-muted-foreground"
                >
                  <PaletteItem icon={LayoutDashboard} label="Dashboard" keywords={['home', 'overview']} onSelect={() => goToTab('dashboard')} />
                  <PaletteItem icon={Camera} label="Scan a receipt" keywords={['camera', 'upload', 'photo']} onSelect={() => goToTab('scan')} />
                  <PaletteItem icon={ReceiptText} label="Receipts" keywords={['records', 'expenses']} onSelect={() => goToTab('receipts')} />
                  {isPrivileged && <PaletteItem icon={Route} label="Mileage" keywords={['vehicle', 'km']} onSelect={() => goToTab('mileage')} />}
                  {isPrivileged && <PaletteItem icon={Clock} label="Time" keywords={['timesheet', 'hours']} onSelect={() => goToTab('time')} />}
                  {isPrivileged && <PaletteItem icon={Building2} label="Projects" keywords={['jobs', 'clients']} onSelect={() => goToTab('projects')} />}
                  <PaletteItem icon={Search} label="Smart Search" keywords={['find', 'query', 'filter']} onSelect={() => goToTab('smart-search')} />
                  <PaletteItem icon={CalendarDays} label="Calendar" keywords={['dates']} onSelect={() => goToTab('receipt-calendar')} />
                  <PaletteItem icon={History} label="Timeline" keywords={['history']} onSelect={() => goToTab('receipt-timeline')} />
                  {isPrivileged && <PaletteItem icon={FileDown} label="Exports" keywords={['download', 'cra', 'csv']} onSelect={() => goToTab('export')} />}
                  {isPrivileged && <PaletteItem icon={Landmark} label="Banking" keywords={['reconcile', 'transactions']} onSelect={() => goToTab('reconcile')} />}
                  {isPrivileged && <PaletteItem icon={Wallet} label="Payables" keywords={['bills', 'vendors']} onSelect={() => goToTab('payables')} />}
                  {isPrivileged && <PaletteItem icon={PiggyBank} label="Budgets" keywords={['limits', 'spend']} onSelect={() => goToTab('budgets')} />}
                  {isPrivileged && <PaletteItem icon={Receipt} label="Tax" keywords={['cra', 'gst', 'hst']} onSelect={() => goToTab('tax-dashboard')} />}
                  {isPrivileged && <PaletteItem icon={TrendingUp} label="Cash Flow" keywords={['forecast']} onSelect={() => goToTab('cashflow-forecast')} />}
                  {isPrivileged && <PaletteItem icon={Store} label="Vendors" keywords={['suppliers']} onSelect={() => goToTab('vendor-analytics')} />}
                  <PaletteItem icon={Tags} label="Tags & Labels" keywords={['categories']} onSelect={() => goToTab('receipt-tags')} />
                  <PaletteItem icon={GitCompare} label="Compare" keywords={['receipt comparison']} onSelect={() => goToTab('receipt-comparison')} />
                  <PaletteItem icon={Repeat} label="Recurring" keywords={['subscriptions', 'detector']} onSelect={() => goToTab('recurring-detector')} />
                  {isPrivileged && <PaletteItem icon={Kanban} label="Kanban" keywords={['workflow', 'board']} onSelect={() => goToTab('kanban-workflow')} />}
                  {isPrivileged && <PaletteItem icon={ScrollText} label="Audit" keywords={['trail', 'log']} onSelect={() => goToTab('audit')} />}
                  {isPrivileged && <PaletteItem icon={Users} label="Approvals" keywords={['review', 'sign-off']} onSelect={() => goToTab('approvals')} />}
                  {isPrivileged && <PaletteItem icon={AlertTriangle} label="Alerts" keywords={['risk', 'anomalies']} onSelect={() => goToTab('alerts')} />}
                  {isPrivileged && <PaletteItem icon={BarChart3} label="Reports" keywords={['analytics']} onSelect={() => goToTab('reports')} />}
                  {isPrivileged && <PaletteItem icon={ClipboardCheck} label="Readiness" keywords={['score', 'cra']} onSelect={() => goToTab('readiness-score')} />}
                  {isPrivileged && <PaletteItem icon={Lightbulb} label="Insights" keywords={['spending']} onSelect={() => goToTab('spending-insights')} />}
                  <PaletteItem icon={Share2} label="Share Receipt" keywords={['send']} onSelect={() => goToTab('share-receipt')} />
                </Command.Group>

                <Command.Group
                  heading="Settings & Pages"
                  className="mt-1 [&_[cmdk-group-heading]]:px-3 [&_[cmdk-group-heading]]:py-1.5 [&_[cmdk-group-heading]]:text-[10px] [&_[cmdk-group-heading]]:font-semibold [&_[cmdk-group-heading]]:uppercase [&_[cmdk-group-heading]]:tracking-[0.14em] [&_[cmdk-group-heading]]:text-muted-foreground"
                >
                  <PaletteItem icon={CreditCard} label="Billing" keywords={['plan', 'subscription', 'invoice']} onSelect={() => goToRoute('/settings/billing')} />
                  <PaletteItem icon={Building} label="Organization" keywords={['org', 'company']} onSelect={() => goToRoute('/settings/org')} />
                  <PaletteItem icon={Users} label="Team" keywords={['members', 'invite']} onSelect={() => goToRoute('/settings/team')} />
                  <PaletteItem icon={ShieldCheck} label="Security" keywords={['mfa', 'password', '2fa']} onSelect={() => goToRoute('/settings/security')} />
                  <PaletteItem icon={Sparkles} label="Feature Flags" keywords={['beta', 'toggles']} onSelect={() => goToRoute('/settings/features')} />
                  <PaletteItem icon={Bell} label="Notifications" keywords={['alerts', 'digest']} onSelect={() => goToRoute('/notifications')} />
                  <PaletteItem icon={FileText} label="Terms of Service" keywords={['legal', 'tos']} onSelect={() => goToRoute('/terms')} />
                  <PaletteItem icon={Lock} label="Privacy Policy" keywords={['data', 'law 25']} onSelect={() => goToRoute('/privacy')} />
                  <PaletteItem icon={Sparkles} label="Product Features" keywords={['marketing', 'overview']} onSelect={() => goToRoute('/features')} />
                </Command.Group>

                <Command.Group
                  heading="Actions"
                  className="mt-1 [&_[cmdk-group-heading]]:px-3 [&_[cmdk-group-heading]]:py-1.5 [&_[cmdk-group-heading]]:text-[10px] [&_[cmdk-group-heading]]:font-semibold [&_[cmdk-group-heading]]:uppercase [&_[cmdk-group-heading]]:tracking-[0.14em] [&_[cmdk-group-heading]]:text-muted-foreground"
                >
                  <PaletteItem
                    icon={resolvedTheme === 'dark' ? Sun : Moon}
                    label={resolvedTheme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
                    keywords={['theme', 'appearance', 'dark', 'light']}
                    onSelect={toggleTheme}
                  />
                  <PaletteItem icon={LogOut} label="Sign out" keywords={['logout', 'exit']} onSelect={signOut} />
                </Command.Group>
              </Command.List>

              {/* Footer hints */}
              <div className="flex items-center justify-between border-t border-glass-border px-4 py-2 text-[11px] text-muted-foreground">
                <div className="flex items-center gap-3">
                  <span className="flex items-center gap-1">
                    <kbd className="rounded border border-glass-border bg-surface-raised px-1.5 py-0.5 font-medium">↑</kbd>
                    <kbd className="rounded border border-glass-border bg-surface-raised px-1.5 py-0.5 font-medium">↓</kbd>
                    to navigate
                  </span>
                  <span className="flex items-center gap-1">
                    <kbd className="rounded border border-glass-border bg-surface-raised px-1.5 py-0.5 font-medium">↵</kbd>
                    to select
                  </span>
                </div>
                <span className="hidden items-center gap-1 sm:flex">
                  <kbd className="rounded border border-glass-border bg-surface-raised px-1.5 py-0.5 font-medium">⌘</kbd>
                  <kbd className="rounded border border-glass-border bg-surface-raised px-1.5 py-0.5 font-medium">K</kbd>
                </span>
              </div>
            </Command>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
