'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ShieldCheck,
  AlertCircle,
  Download,
  CheckCircle2,
  TrendingUp,
  Layers,
  Scale,
  UserCircle2,
  Crown,
  Settings,
  LogOut,
  X,
} from 'lucide-react';
import Link from 'next/link';
import type { UserRole } from '@/lib/types';

type Tab = 'dashboard' | 'receipts' | 'scan' | 'export' | 'audit' | 'reconcile' | 'mileage' | 'approvals' | 'payables' | 'projects' | 'alerts' | 'more';

interface MoreSheetProps {
  activeTab: Tab;
  onTabChange: (tab: Tab) => void;
  onClose: () => void;
  role: UserRole;
  planLabel: string;
  plan: string;
  openInviteModal: () => void;
  onSignOut: () => void;
}

export default function MoreSheet({
  activeTab,
  onTabChange,
  onClose,
  role,
  planLabel,
  plan,
  openInviteModal,
  onSignOut,
}: MoreSheetProps) {
  const [showRedeemInput, setShowRedeemInput] = useState(false);
  const [redeemCodeValue, setRedeemCodeValue] = useState('');
  const [redeemLoading, setRedeemLoading] = useState(false);

  const handleRedeemCode = async () => {
    if (!redeemCodeValue || redeemCodeValue.trim().length !== 6) return;
    setRedeemLoading(true);
    try {
      const { redeemAccessCode } = await import('@/lib/services/receipts');
      const res = await redeemAccessCode(redeemCodeValue.trim(), '');
      if (res.success) {
        setShowRedeemInput(false);
        setRedeemCodeValue('');
        setTimeout(() => window.location.reload(), 1500);
      }
    } finally {
      setRedeemLoading(false);
    }
  };

  return (
    <AnimatePresence>
      {activeTab === 'more' && (
        <div
          className="fixed inset-0 z-[100] bg-black/60 backdrop-blur-sm flex flex-col"
          onClick={onClose}
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
                {role !== 'Employee' && (
                  <>
                    <MoreTabButton
                      icon={<ShieldCheck className="h-5 w-5" />}
                      iconBg="bg-champagne/15 text-champagne"
                      label="Audit Trail"
                      description="Immutable Merkle history"
                      onClick={() => onTabChange('audit')}
                    />
                    <MoreTabButton
                      icon={<AlertCircle className="h-5 w-5" />}
                      iconBg="bg-red-500/10 text-red-400"
                      label="Anomaly Dashboard"
                      description="AI fraud & math errors"
                      onClick={() => onTabChange('alerts')}
                    />
                    <MoreTabButton
                      icon={<Download className="h-5 w-5" />}
                      iconBg="bg-champagne/15 text-champagne"
                      label="CRA Export"
                      description="Generate compliance ZIPs"
                      onClick={() => onTabChange('export')}
                    />
                    <MoreTabButton
                      icon={<CheckCircle2 className="h-5 w-5" />}
                      iconBg="bg-emerald-success/30 text-emerald-light"
                      label="Approvals Queue"
                      description="Review employee submissions"
                      onClick={() => onTabChange('approvals')}
                    />
                    <MoreTabButton
                      icon={<TrendingUp className="h-5 w-5" />}
                      iconBg="bg-amber-500/10 text-amber-400"
                      label="Reimbursements"
                      description="Employee payables tracker"
                      onClick={() => onTabChange('payables')}
                    />
                    <MoreTabButton
                      icon={<Layers className="h-5 w-5" />}
                      iconBg="bg-champagne/15 text-champagne"
                      label="Projects & Job Codes"
                      description="Track project budgets and spend"
                      onClick={() => onTabChange('projects')}
                    />
                    <MoreTabButton
                      icon={<Scale className="h-5 w-5" />}
                      iconBg="bg-emerald-success/30 text-emerald-light"
                      label="Mileage Tracker"
                      description="CRA-prescribed km rates"
                      onClick={() => onTabChange('mileage')}
                    />
                    {role === 'Owner' && (
                      <MoreTabButton
                        icon={<UserCircle2 className="h-5 w-5" />}
                        iconBg="bg-champagne/15 text-champagne"
                        label="Invite Team Member"
                        description="Generate 6-digit access code"
                        onClick={() => { openInviteModal(); onClose(); }}
                      />
                    )}
                  </>
                )}
                {role === 'Employee' && !showRedeemInput && (
                  <MoreTabButton
                    icon={<ShieldCheck className="h-5 w-5" />}
                    iconBg="bg-champagne/15 text-champagne"
                    label="Redeem Access Code"
                    description="Join a workspace"
                    onClick={() => setShowRedeemInput(true)}
                  />
                )}
                {role === 'Employee' && showRedeemInput && (
                  <div className="rounded-xl border border-glass-border bg-surface-raised p-4 space-y-3">
                    <p className="text-sm font-bold text-text-primary">Enter 6-digit Access Code</p>
                    <input
                      type="text"
                      value={redeemCodeValue}
                      onChange={(e) => setRedeemCodeValue(e.target.value.replace(/\D/g, '').slice(0, 6))}
                      placeholder="000000"
                      maxLength={6}
                      className="w-full rounded-xl border border-glass-border bg-surface px-4 py-2 text-center font-mono tracking-[0.3em] text-lg text-text-primary outline-none focus:border-champagne/40 focus:ring-2 focus:ring-champagne/15"
                      autoFocus
                    />
                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={() => { setShowRedeemInput(false); setRedeemCodeValue(''); }}
                        className="flex-1 rounded-xl border border-glass-border bg-surface px-4 py-2 text-sm font-semibold text-text-secondary hover:bg-surface-hover"
                      >
                        Cancel
                      </button>
                      <button
                        type="button"
                        onClick={handleRedeemCode}
                        disabled={redeemCodeValue.length !== 6 || redeemLoading}
                        className="flex-1 rounded-xl bg-champagne px-4 py-2 text-sm font-bold text-obsidian hover:bg-champagne-dim disabled:opacity-50"
                      >
                        {redeemLoading ? 'Redeeming...' : 'Redeem'}
                      </button>
                    </div>
                  </div>
                )}

                <div className="mt-6 px-2">
                  <p className="mb-2 text-xs font-bold uppercase tracking-widest text-text-muted">Settings</p>
                  <MoreSettingLink
                    icon={<Crown className="h-4 w-4 text-amber-400" />}
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
                  <MoreSettingLink
                    icon={<ShieldCheck className="h-4 w-4 text-text-muted" />}
                    label="Security"
                    href="/settings/security"
                  />
                  <button
                    type="button"
                    onClick={onSignOut}
                    className="mt-2 flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-text-secondary hover:bg-red-500/10 hover:text-red-400 transition"
                  >
                    <LogOut className="h-4 w-4" />
                    <span>Sign out</span>
                  </button>

                  <p className="mt-6 mb-2 text-xs font-bold uppercase tracking-widest text-text-muted">Legal</p>
                  <MoreSettingLink
                    icon={<Scale className="h-4 w-4 text-text-muted" />}
                    label="Terms of Service"
                    href="/terms"
                  />
                  <MoreSettingLink
                    icon={<ShieldCheck className="h-4 w-4 text-text-muted" />}
                    label="Privacy Policy (PIPEDA)"
                    href="/privacy"
                  />
                  <button
                    type="button"
                    onClick={async () => {
                      try {
                        const { supabase } = await import('@/lib/supabase');
                        const { data: { session } } = await supabase.auth.getSession();
                        if (!session?.access_token) { return; }
                        const response = await fetch('/api/export/data', {
                          headers: { Authorization: `Bearer ${session.access_token}` },
                        });
                        if (!response.ok) { return; }
                        const blob = await response.blob();
                        const url = URL.createObjectURL(blob);
                        const a = document.createElement('a');
                        a.href = url;
                        a.download = `9sl-data-export.json`;
                        a.click();
                        URL.revokeObjectURL(url);
                      } catch {}
                    }}
                    className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-text-secondary hover:bg-surface-hover transition"
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

function MoreTabButton({
  icon,
  iconBg,
  label,
  description,
  onClick,
}: {
  icon: React.ReactNode;
  iconBg: string;
  label: string;
  description: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex items-center gap-3 rounded-xl bg-surface-raised p-4 transition hover:bg-surface-hover"
    >
      <div className={`flex h-10 w-10 items-center justify-center rounded-xl ${iconBg}`}>
        {icon}
      </div>
      <div className="text-left">
        <p className="text-sm font-bold text-text-primary">{label}</p>
        <p className="text-xs text-text-secondary">{description}</p>
      </div>
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
          badgeActive ? 'bg-amber-500/10 text-amber-300' : 'bg-surface-raised text-text-muted'
        }`}>
          {badge}
        </span>
      )}
    </Link>
  );
}
