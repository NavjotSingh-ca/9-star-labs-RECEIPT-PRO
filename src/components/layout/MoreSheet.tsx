'use client';

import { motion, AnimatePresence } from 'framer-motion';
import {
  Download,
  Crown,
  Settings,
  LogOut,
  X,
  ReceiptText,
  Route,
  Building2,
  FileDown,
  Landmark,
  Wallet,
  ScrollText,
  Users,
  AlertTriangle,
  BarChart3,
} from 'lucide-react';
import Link from 'next/link';

type Tab = 'dashboard' | 'receipts' | 'scan' | 'export' | 'audit' | 'reconcile' | 'mileage' | 'approvals' | 'payables' | 'projects' | 'alerts' | 'reports' | 'more';

interface MoreSheetProps {
  activeTab: Tab;
  onTabChange: (tab: Tab) => void;
  onClose: () => void;
  planLabel: string;
  plan: string;
  onSignOut: () => void;
}

export default function MoreSheet({
  activeTab,
  onTabChange,
  onClose,
  planLabel,
  plan,
  onSignOut,
}: MoreSheetProps) {
  return (
    <AnimatePresence>
      {activeTab === 'more' && (
        <div
          className="fixed inset-0 z-[100] bg-black/60 backdrop-blur-sm flex flex-col focus-visible:outline-2 focus-visible:outline-champagne/40"
          onClick={onClose}
          onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onClose(); } }}
          tabIndex={0}
          role="button"
          aria-label="Close menu"
        >
          <motion.div
            initial={{ opacity: 0, x: '100%' }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className="ml-auto flex flex-col bg-surface border-l border-glass-border h-full max-h-screen overflow-y-auto w-full sm:w-96 shadow-2xl text-text-primary sm:rounded-l-[2rem]"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="sticky top-0 bg-surface border-b border-glass-border flex justify-between items-center p-6 z-10">
              <h2 className="text-xl font-bold text-text-primary">More Options</h2>
              <button
                type="button"
                onClick={onClose}
                className="flex h-8 w-8 items-center justify-center rounded-lg text-text-muted hover:bg-surface-hover hover:text-text-primary transition"
                aria-label="Close menu"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Content */}
            <div className="overflow-y-auto flex-1 p-4">
              <div className="grid gap-2">
                <div className="px-2">
                  <p className="mb-2 text-xs font-bold uppercase tracking-widest text-text-muted">Settings</p>
                  <MoreSettingLink
                    icon={<Crown className="h-4 w-4 text-warning" />}
                    label="Billing & Plan"
                    href="/settings/billing"
                    badge={planLabel}
                    badgeActive={plan === 'pro' || plan === 'enterprise'}
                  />
                  <MoreSettingLink
                    icon={<Settings className="h-4 w-4 text-text-muted" />}
                    label="Organization"
                    href="/settings/org"
                  />
                  <button
                    type="button"
                    onClick={onSignOut}
                    className="mt-2 flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-text-secondary hover:bg-danger/10 hover:text-danger transition"
                  >
                    <LogOut className="h-4 w-4" />
                    <span>Sign out</span>
                  </button>

                  <p className="mt-6 mb-2 text-xs font-bold uppercase tracking-widest text-text-muted">Navigation</p>
                  <div className="space-y-0.5">
                    <p className="px-3 text-[10px] font-semibold uppercase tracking-[0.12em] text-text-muted/60">Records</p>
                    <MoreNavLink icon={<ReceiptText className="h-4 w-4" />} label="Receipts" tab="receipts" onTabChange={onTabChange} onClose={onClose} />
                    <MoreNavLink icon={<Route className="h-4 w-4" />} label="Mileage" tab="mileage" onTabChange={onTabChange} onClose={onClose} />
                    <MoreNavLink icon={<Building2 className="h-4 w-4" />} label="Projects" tab="projects" onTabChange={onTabChange} onClose={onClose} />
                    <p className="mt-3 px-3 text-[10px] font-semibold uppercase tracking-[0.12em] text-text-muted/60">Finance</p>
                    <MoreNavLink icon={<FileDown className="h-4 w-4" />} label="Exports" tab="export" onTabChange={onTabChange} onClose={onClose} />
                    <MoreNavLink icon={<Landmark className="h-4 w-4" />} label="Banking" tab="reconcile" onTabChange={onTabChange} onClose={onClose} />
                    <MoreNavLink icon={<Wallet className="h-4 w-4" />} label="Payables" tab="payables" onTabChange={onTabChange} onClose={onClose} />
                    <p className="mt-3 px-3 text-[10px] font-semibold uppercase tracking-[0.12em] text-text-muted/60">Oversight</p>
                    <MoreNavLink icon={<ScrollText className="h-4 w-4" />} label="Audit" tab="audit" onTabChange={onTabChange} onClose={onClose} />
                    <MoreNavLink icon={<Users className="h-4 w-4" />} label="Approvals" tab="approvals" onTabChange={onTabChange} onClose={onClose} />
                    <MoreNavLink icon={<AlertTriangle className="h-4 w-4" />} label="Alerts" tab="alerts" onTabChange={onTabChange} onClose={onClose} />
                    <MoreNavLink icon={<BarChart3 className="h-4 w-4" />} label="Reports" tab="reports" onTabChange={onTabChange} onClose={onClose} />
                  </div>

                  <p className="mt-6 mb-2 text-xs font-bold uppercase tracking-widest text-text-muted">Legal</p>
                  <MoreSettingLink
                    icon={<Download className="h-4 w-4 text-text-muted" />}
                    label="Terms of Service"
                    href="/terms"
                  />
                  <MoreSettingLink
                    icon={<Download className="h-4 w-4 text-text-muted" />}
                    label="Privacy Policy (PIPEDA)"
                    href="/privacy"
                  />
                  <button
                    type="button"
                    onClick={() => {
                      onTabChange('export');
                      onClose();
                    }}
                    className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-text-secondary hover:bg-surface-hover transition"
                    title="Export your data"
                  >
                    <Download className="h-4 w-4" />
                    <span>Download My Data (PIPEDA)</span>
                  </button>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}

function MoreNavLink({ icon, label, tab, onTabChange, onClose }: {
  icon: React.ReactNode;
  label: string;
  tab: Tab;
  onTabChange: (tab: Tab) => void;
  onClose: () => void;
}) {
  return (
    <button
      type="button"
      onClick={() => { onTabChange(tab); onClose(); }}
      className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-text-secondary hover:bg-surface-hover transition"
    >
      {icon}
      <span>{label}</span>
    </button>
  );
}

function MoreSettingLink({
  icon,
  label,
  href,
  badge,
  badgeActive,
}: {
  icon: React.ReactNode;
  label: string;
  href: string;
  badge?: string;
  badgeActive?: boolean;
}) {
  return (
    <Link
      href={href}
      className="flex items-center gap-3 rounded-xl px-3 py-2.5 transition hover:bg-surface-hover"
    >
      {icon}
      <span className="text-sm font-semibold text-text-secondary flex-1">{label}</span>
      {badge && (
        <span className={`text-[10px] px-2 py-0.5 rounded-full font-semibold ${
          badgeActive ? 'bg-warning/10 text-warning' : 'bg-surface-raised text-text-muted'
        }`} aria-live="polite" aria-atomic="true">
          {badge}
        </span>
      )}
    </Link>
  );
}
