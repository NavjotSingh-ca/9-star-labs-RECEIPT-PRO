'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { Drawer } from 'vaul';
import {
  AlertCircle,
  Camera,
  CheckCircle2,
  ChevronDown,
  Download,
  LayoutDashboard,
  Layers,
  Loader2,
  LogOut,
  Menu,
  MoreHorizontal,
  Settings,
  Scale,
  ReceiptText,
  ShieldCheck,
  TrendingUp,
  UserCircle2,
  Fingerprint,
  X,
  Crown,
} from 'lucide-react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { Suspense } from 'react';
import { motion, AnimatePresence, LayoutGroup } from 'framer-motion';

import Dashboard from '@/components/Dashboard';
import Export from '@/components/Export';
import History from '@/components/History';
import Scanner from '@/components/Scanner';
import AuditTrail from '@/components/AuditTrail';
import BankReconciliation from '@/components/BankReconciliation';
import CommandPalette from '@/components/CommandPalette';
import ApprovalsQueue from '@/components/ApprovalsQueue';
import ReimbursementsPanel from '@/components/ReimbursementsPanel';
import InviteModal from '@/components/InviteModal';
import ProjectManager from '@/components/ProjectManager';
import { AuroraBackground } from '@/components/aceternity/aurora-background';
import { Marquee } from '@/components/magicui/marquee';
import { ThemeToggle } from '@/components/ThemeToggle';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import OfflineIndicator from '@/components/OfflineIndicator';
import { UpgradePrompt } from '@/components/upgrade-prompt';
import { supabase } from '@/lib/supabase';
import { usePlan } from '@/hooks/use-plan';
import type { ReceiptRow, UserRole } from '@/lib/types';
import type { User } from '@supabase/supabase-js';
import { getReceipts, getBusinessUnits, getAuditLogs, redeemAccessCode } from '@/lib/services/receipts';
import { getUserRole } from '@/lib/services/roles';
type Tab = 'dashboard' | 'receipts' | 'scan' | 'export' | 'audit' | 'reconcile' | 'approvals' | 'payables' | 'projects' | 'more';

/* ─── Helpers ─── */

/* ─── Currency Formatter ─── */

const cad = new Intl.NumberFormat('en-CA', {
  style: 'currency',
  currency: 'CAD',
  maximumFractionDigits: 2,
});

/* ─── Liquid Glass Spring Transition ─── */

const tabTransition = {
  type: 'spring' as const,
  stiffness: 260,
  damping: 20,
};

const tabVariants = {
  initial: { opacity: 0, x: 20, filter: 'blur(8px)' },
  animate: { opacity: 1, x: 0, filter: 'blur(0px)' },
  exit: { opacity: 0, x: -20, filter: 'blur(8px)' },
};

/* ─── Loader ─── */

function FullPageLoader() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-obsidian">
      <div className="flex flex-col items-center gap-4">
        <div className="flex h-16 w-16 items-center justify-center rounded-[3rem] bg-champagne/15 champagne-glow">
          <ReceiptText className="h-8 w-8 text-champagne" />
        </div>
        <Loader2 className="h-6 w-6 animate-spin text-champagne" />
        <p className="text-sm font-medium text-text-secondary">Loading 9 Star Labs…</p>
        
        {/* Diagnostic Emergency Exit */}
        <div className="mt-8 animate-in fade-in duration-1000 delay-5000">
          <button 
            onClick={() => window.location.reload()}
            className="text-xs text-text-muted hover:text-champagne underline underline-offset-4"
          >
            Taking too long? Click to retry
          </button>
        </div>
      </div>
    </div>
  );
}

/* ─── Auth Screen ─── */

function AuthScreen() {
  const [mode, setMode] = useState<'signin' | 'signup'>('signin');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [inviteCode, setInviteCode] = useState('');
  const [accepted, setAccepted] = useState(false);
  const [loading, setLoading] = useState(false);

  const showToast = (type: 'success' | 'error' | 'info', msg: string) => {
    if (type === 'success') toast.success(msg);
    else if (type === 'error') toast.error(msg);
    else toast.info(msg);
  };

  const handleSubmit = async () => {
    if (!email || !password) {
      showToast('error', 'Please enter your email and password.');
      return;
    }
    if (!accepted && mode === 'signup') {
      showToast('error', 'Please accept the terms to create an account.');
      return;
    }
    setLoading(true);
    try {
      if (mode === 'signin') {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        showToast('success', 'Signed in successfully.');
      } else {
        const { data, error } = await supabase.auth.signUp({ email, password });
        if (error) throw error;
        
        if (inviteCode.trim() && data.user) {
          // Existing invite code redemption...
          const result = await redeemAccessCode(inviteCode.trim(), data.user.id);
          if (result.success) {
            showToast('success', `Account created. Role assigned: ${result.role}. Check email to confirm.`);
          } else {
            showToast('info', `Account created but invite code invalid: ${result.error ?? 'expired'}. Check email.`);
          }
        } else if (data.user) {
          // NEW: Bootstrap first user org for sign-ups without invite
          try {
            await supabase.rpc('bootstrap_first_user_org', {
              p_user_id: data.user.id,
              p_org_name: 'My Business',
            });
            showToast('success', 'Account created. Please check your email to confirm.');
          } catch (err: unknown) {
            console.error('Failed to create organization:', err);
            showToast('info', 'Account created but organization setup failed. Please contact support.');
          }
        } else {
          showToast('success', 'Account created. Please check your email to confirm.');
        }
      }
    } catch (error: unknown) {
      showToast('error', error instanceof Error ? error.message : 'Authentication failed.');
    } finally {
      setLoading(false);
    }
  };

  const FeatureCard = ({ title, desc, icon: Icon }: { title: string; desc: string; icon: React.ElementType }) => (
    <div className="flex w-64 flex-col items-start gap-2 rounded-[2rem] border border-glass-border bg-black/40 p-5 shadow-2xl backdrop-blur-2xl">
      <div className="flex h-10 w-10 items-center justify-center rounded-[2rem] bg-champagne/15 text-champagne">
        <Icon className="h-5 w-5" />
      </div>
      <h3 className="text-sm font-bold text-text-primary">{title}</h3>
      <p className="text-xs text-text-secondary">{desc}</p>
    </div>
  );

  return (
    <AuroraBackground>
      <div className="relative mx-auto flex min-h-screen w-full max-w-6xl items-center justify-center px-4 py-10 z-10">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ type: 'spring', stiffness: 260, damping: 20 }}
          className="grid w-full max-w-5xl overflow-hidden rounded-[2rem] border border-white/10 bg-black/60 shadow-2xl backdrop-blur-xl lg:grid-cols-[1.2fr_400px]"
        >
          {/* Left Hero (Godmode visuals) */}
          <div className="hidden flex-col justify-between p-10 lg:flex relative overflow-hidden">
            <div className="relative z-10">
              <div className="flex h-14 w-14 items-center justify-center rounded-[2rem] bg-champagne/15 champagne-glow">
                <ReceiptText className="h-7 w-7 text-champagne" />
              </div>
            <h1 className="mt-8 text-5xl font-bold tracking-tight text-white">9 Star Labs <br/> <span className="text-champagne">Elite Edition</span></h1>
              <p className="mt-4 max-w-md text-sm leading-7 text-text-secondary">
                The CRA-compliant receipt intelligence suite. SHA-256 integrity, semantic search, and enterprise-grade audit controls.
              </p>
            </div>

            <div className="relative z-10 mt-12 w-[150%] -ml-10">
              <Marquee pauseOnHover className="[--duration:30s]">
                <FeatureCard title="Tamper-Evident" desc="SHA-256 Merkle chain history" icon={ShieldCheck} />
                <FeatureCard title="Semantic AI" desc="Context-aware receipt taxonomy" icon={Layers} />
                <FeatureCard title="CRA Compliance" desc="One-click organized export zips" icon={Download} />
              </Marquee>
              <Marquee reverse pauseOnHover className="mt-4 [--duration:35s]">
                <FeatureCard title="Role-Based" desc="Owner / Employee / Accountant" icon={UserCircle2} />
                <FeatureCard title="Fraud Engine" desc="Duplicate and anomaly detection" icon={AlertCircle} />
                <FeatureCard title="Cost Control" desc="Live recoverable tax tracking" icon={TrendingUp} />
              </Marquee>
            </div>
            
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent pointer-events-none" />
          </div>

          {/* Right Form */}
          <div className="bg-white/5 p-6 sm:p-10 border-l border-white/5 relative z-10 shadow-[0_0_40px_rgba(0,0,0,0.5)] flex flex-col justify-center">
            <div className="mx-auto w-full max-w-md">
              <div className="mb-8 text-center lg:text-left">
                <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-3xl bg-champagne/15 champagne-glow lg:hidden mb-6">
                  <ReceiptText className="h-8 w-8 text-champagne" />
                </div>
                <h2 className="text-3xl font-bold tracking-tight text-white">
                  {mode === 'signin' ? 'Welcome back' : 'Create account'}
                </h2>
                <p className="mt-2 text-sm text-text-secondary">
                  {mode === 'signin'
                    ? 'Sign in to access your workspace.'
                    : 'Start capturing and organizing receipts securely.'}
                </p>
              </div>

              <form
                onSubmit={(e) => { e.preventDefault(); handleSubmit(); }}
                className="space-y-4"
                autoComplete="on"
              >
                <div>
                  <label className="mb-1.5 block text-xs font-semibold uppercase tracking-[0.14em] text-champagne-dim">
                    Email
                  </label>
                  <input
                    type="email"
                    name="email"
                    autoComplete="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full rounded-[2rem] border border-glass-border bg-black/40 px-4 py-3 text-sm text-white outline-none backdrop-blur-md transition placeholder:text-white/20 focus:border-champagne/40 focus:ring-1 focus:ring-champagne/15"
                    placeholder="you@company.ca"
                  />
                </div>

                <div>
                  <label className="mb-1.5 block text-xs font-semibold uppercase tracking-[0.14em] text-champagne-dim">
                    Password
                  </label>
                  <input
                    type="password"
                    name="password"
                    autoComplete={mode === 'signin' ? 'current-password' : 'new-password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full rounded-[2rem] border border-glass-border bg-black/40 px-4 py-3 text-sm text-white outline-none backdrop-blur-md transition placeholder:text-white/20 focus:border-champagne/40 focus:ring-1 focus:ring-champagne/15"
                    placeholder="••••••••"
                  />
                </div>

                {mode === 'signup' && (
                  <>
                    {/* Invite Code Field */}
                    <div>
                      <label className="mb-1.5 block text-xs font-semibold uppercase tracking-[0.14em] text-champagne-dim">
                        Invite Code <span className="text-white/30 normal-case font-normal">(optional — from your Owner)</span>
                      </label>
                      <input
                        type="text"
                        value={inviteCode}
                        onChange={(e) => setInviteCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                        className="w-full rounded-[3rem] border border-glass-border bg-black/40 px-4 py-3 text-sm text-white outline-none backdrop-blur-md transition placeholder:text-white/20 focus:border-champagne/40 focus:ring-1 focus:ring-champagne/15 font-mono tracking-[0.3em] text-center"
                        placeholder="000000"
                        maxLength={6}
                      />
                      <p className="mt-1 text-[11px] text-white/30">
                        Enter the 6-digit code if you were invited by a workspace owner.
                      </p>
                    </div>

                    {/* Accept Terms */}
                    <button
                      type="button"
                      onClick={() => setAccepted((v) => !v)}
                      className={`flex w-full items-start gap-3 rounded-[2rem] border p-4 text-left transition ${
                        accepted
                          ? 'border-champagne/40 bg-champagne/[0.08]'
                          : 'border-white/10 bg-black/40 hover:border-white/20'
                      }`}
                    >
                      <div
                        className={`mt-0.5 flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-[1rem] border transition-colors ${
                          accepted ? 'border-champagne bg-champagne text-black' : 'border-white/30 bg-black/50'
                        }`}
                      >
                        {accepted && <CheckCircle2 className="h-3.5 w-3.5" />}
                      </div>
                      <p className="text-xs leading-5 text-white/60">
                        I accept responsibility for reviewing exported tax and accounting data.
                      </p>
                    </button>
                  </>
                )}

                <div className="grid gap-3 pt-2">
                  <motion.button
                    type="submit"
                    whileTap={{ scale: 0.96 }}
                    disabled={loading || (!accepted && mode === 'signup')}
                    className="flex w-full items-center justify-center gap-2 rounded-[3rem] bg-gradient-to-b from-[#dfcaaa] to-champagne px-4 py-3.5 text-sm font-bold text-black shadow-[0_0_15px_rgba(190,169,142,0.3)] transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    {loading && <Loader2 className="h-4 w-4 animate-spin text-black/50" />}
                    {mode === 'signin' ? 'Sign In' : 'Create Account'}
                  </motion.button>
                </div>
              </form>

              {mode === 'signin' && (
                <button
                  type="button"
                  onClick={async () => {
                    if (!email) {
                      showToast('error', 'Enter your email first.');
                      return;
                    }
                    try {
                      const { error } = await supabase.auth.resetPasswordForEmail(email, {
                        redirectTo: `${process.env.NEXT_PUBLIC_SITE_URL || window.location.origin}/auth/callback?type=recovery`,
                      });
                      if (error) throw error;
                      showToast('success', 'Password reset email sent. Check your inbox.');
                    } catch (err: unknown) {
                      showToast('error', err instanceof Error ? err.message : 'Failed to send reset email.');
                    }
                  }}
                  className="mt-2 text-xs font-medium text-text-secondary transition hover:text-champagne"
                >
                  Forgot password?
                </button>
              )}

              <div className="mt-8 text-center border-t border-white/10 pt-6">
                <button
                  type="button"
                  onClick={() => setMode((m) => (m === 'signin' ? 'signup' : 'signin'))}
                  className="text-xs font-semibold text-text-secondary transition hover:text-champagne lg:text-sm"
                >
                  {mode === 'signin' ? "Don't have access? Request account" : 'Already authorized? Sign in'}
                </button>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </AuroraBackground>
  );
}

/* ─── Audit HUD ─── */

function AuditHUD({ receipts }: { receipts: ReceiptRow[] }) {
  const { gstRecoverable, monthLabel, receiptCount } = useMemo(() => {
    const now = new Date();
    const currentMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
    const monthReceipts = receipts.filter((r) => (r.transaction_date ?? '').startsWith(currentMonth));

    const gstRecoverable = monthReceipts.reduce((sum, r) => sum + Number(r.tax_amount ?? 0), 0);
    const monthLabel = now.toLocaleDateString('en-CA', { month: 'long', year: 'numeric' });

    return { gstRecoverable, monthLabel, receiptCount: monthReceipts.length };
  }, [receipts]);

  return (
    <div className="liquid-glass rounded-[3rem] px-4 py-3" role="status" aria-label="Tax recoverable this month">
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-[2rem] bg-emerald-success/30">
            <TrendingUp className="h-4 w-4 text-emerald-light" />
          </div>
          <div>
            <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-text-muted">
              {monthLabel} · Tax Recoverable
            </p>
            <p className="text-lg font-bold tracking-tight text-champagne tabular-nums">
              {cad.format(gstRecoverable)}
            </p>
          </div>
        </div>
        <div className="text-right">
          <p className="text-xs font-medium text-text-muted">{receiptCount} receipts</p>
        </div>
      </div>
    </div>
  );
}

/* ─── Main Page ─── */

function AppContent() {
  const router = useRouter();
  const [hasMounted, setHasMounted] = useState(false);
  const [authLoading, setAuthLoading] = useState(true);
  const authLoadingRef = useRef(true);
  const [user, setUser] = useState<User | null>(null);
  const [activeTab, setActiveTab] = useState<Tab>('dashboard');
  const [activeFilter, setActiveFilter] = useState<string>('all');
  const touchStartX = useRef<number>(0);
  const touchStartY = useRef<number>(0);

  // Standardize mount state
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setHasMounted(true);
  }, []);

  const setTabWithUrl = useCallback((tab: Tab) => {
    if (typeof window === 'undefined') return;
    setActiveTab(tab);
    const url = new URL(window.location.href);
    url.searchParams.set('tab', tab);
    window.history.pushState({ tab }, '', url);
  }, []);

  // Sync tab with URL on mount (SSR Safe)
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const params = new URLSearchParams(window.location.search);
    const tab = params.get('tab') as Tab | null;
    // eslint-disable-next-line react-hooks/set-state-in-effect
    if (tab) setActiveTab(tab);
  }, [hasMounted]);

  // Listen for back button / popstate sync
  useEffect(() => {
    if (!hasMounted || typeof window === 'undefined') return;
    const handlePopState = (event: PopStateEvent) => {
      const tabFromState = event.state?.tab as Tab | null;
      const tabFromUrl = new URLSearchParams(window.location.search).get('tab') as Tab | null;
      const tabToSet = tabFromState || tabFromUrl || 'dashboard';
      setActiveTab(tabToSet);
    };
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, [hasMounted]);
  const [roleOpen, setRoleOpen] = useState(false);
  const [role, setRole] = useState<UserRole>('Owner');

  const showToast = (type: 'success' | 'error' | 'info', msg: string) => {
    if (type === 'success') toast.success(msg);
    else if (type === 'error') toast.error(msg);
    else toast.info(msg);
  };

  const closeMoreMenu = useCallback(() => {
    // Employees don't have a dashboard tab
    const fallback: Tab = role === 'Employee' ? 'scan' : 'dashboard';
    setTabWithUrl(fallback);
  }, [role, setTabWithUrl]);

  const handleRedeemCode = async () => {
    if (!redeemCodeValue || redeemCodeValue.trim().length !== 6) {
      showToast('error', 'Please enter a valid 6-digit access code.');
      return;
    }
    setRedeemLoading(true);
    try {
      const res = await redeemAccessCode(redeemCodeValue.trim(), user?.id || '');
      if (res.success) {
        showToast('success', `Success! Role assigned: ${res.role}. Reloading...`);
        setShowRedeemInput(false);
        setRedeemCodeValue('');
        setTimeout(() => window.location.reload(), 1500);
      } else {
        showToast('error', res.error || 'Invalid or expired code.');
      }
    } catch (err: unknown) {
      showToast('error', err instanceof Error ? err.message : 'Failed to redeem code.');
    } finally {
      setRedeemLoading(false);
    }
  };

/* ─── Role-aware tab enforcement (DOM removal for Employee) ─── */
  useEffect(() => {
    if (role === 'Employee') {
      // Physically force to allowed tabs only
      const allowedEmployeeTabs: Tab[] = ['scan', 'receipts', 'more'];
      if (!allowedEmployeeTabs.includes(activeTab)) {
        // eslint-disable-next-line react-hooks/set-state-in-effect
        setTabWithUrl('scan');
      }
    }
  }, [role, activeTab]);

  useEffect(() => {
    if (!hasMounted) return;

    let active = true;
    console.log('🔐 Setting up auth listener...');

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      console.log('🔐 Auth event:', event, 'Session:', session?.user?.id || 'NO USER');
      if (!active) return;

      const currentUser = session?.user ?? null;
      setUser(currentUser);

      if (currentUser) {
        getUserRole(currentUser.id)
          .then(r => {
            if (active) {
              console.log('🔐 Role loaded:', r);
              setRole(r);
              authLoadingRef.current = false;
              setAuthLoading(false);
            }
          })
          .catch((err) => {
            if (active) {
              console.error('🔐 Role load failed:', err);
              setRole('Employee');
              authLoadingRef.current = false;
              setAuthLoading(false);
            }
          });
      } else {
        // No user (INITIAL_SESSION with no session, or SIGNED_OUT)
        authLoadingRef.current = false;
        setAuthLoading(false);
      }
    });

    const safetyTimeout = setTimeout(() => {
      if (active && authLoadingRef.current) {
        console.warn('⚠️ Auth safety timeout reached. Forcing loader exit.');
        authLoadingRef.current = false;
        setAuthLoading(false);
      }
    }, 4500);

    return () => {
      active = false;
      subscription.unsubscribe();
      clearTimeout(safetyTimeout);
    };
  }, [hasMounted]);

  const userId = user?.id;

  const { data: receipts = [], isLoading: receiptsLoading, refetch: fetchReceipts } = useQuery({
    queryKey: ['receipts', role, userId],
    queryFn: async () => getReceipts(role, userId),
    enabled: !!userId,
  });

  // Parallel Prefetching to kill the 9-second waterfall
  const { data: businessUnits = [] } = useQuery({
    queryKey: ['business_units'],
    queryFn: getBusinessUnits,
    enabled: !!userId,
  });

  useQuery({
    queryKey: ['audit_logs'],
    queryFn: async () => getAuditLogs(50),
    enabled: !!userId && role !== 'Employee',
  });

  // ─── Plan Enforcement ───
  const { plan, label: planLabel, receiptCount, teamSize, isTrialing, subscription, isLoading: planLoading } = usePlan();
  const trialDaysLeft = subscription?.trial_ends_at
    ? Math.max(0, Math.ceil((new Date(subscription.trial_ends_at).getTime() - Date.now()) / (1000 * 60 * 60 * 24)))
    : undefined;

  // ─── Supabase Realtime: auto-invalidate TanStack cache on DB changes ───
  const queryClient = useQueryClient();
  useEffect(() => {
    if (!userId) return;

    const channel = supabase
      .channel('receipts-realtime')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'receipts' },
        () => {
          queryClient.invalidateQueries({ queryKey: ['receipts'] });
          queryClient.invalidateQueries({ queryKey: ['receipts_paginated'] });
          queryClient.invalidateQueries({ queryKey: ['dashboard_summary'] });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [userId, queryClient]);

  const handleFilterClick = useCallback((filter: string) => {
    setActiveFilter(filter);
    setTabWithUrl('receipts');
  }, [setTabWithUrl]);

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    setRoleOpen(false);
    setTabWithUrl('dashboard');
    setActiveFilter('all');
  };

  const handleCommand = (action: string) => {
    if (action === 'scan') setTabWithUrl('scan');
    if (action === 'bulk-upload') setTabWithUrl('scan'); // Maps to Scanner bulk capabilities
    if (action === 'missing-bn') { setActiveFilter('missing-bn'); setTabWithUrl('receipts'); }
    if (action === 'export-idea') setTabWithUrl('export'); // Export tab handles IDEA
    if (action === 'toggle-role') setRoleOpen(true);
  };

  const [showInviteModal, setShowInviteModal] = useState(false);
  const [showRedeemInput, setShowRedeemInput] = useState(false);
  const [redeemCodeValue, setRedeemCodeValue] = useState('');
  const [redeemLoading, setRedeemLoading] = useState(false);

  // Swipe gesture handlers for mobile tab navigation
  // Define these BEFORE early returns to avoid hook order issues
  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX;
    touchStartY.current = e.touches[0].clientY;
  }, []);

  const handleTouchEnd = useCallback((e: React.TouchEvent) => {
    const deltaX = e.changedTouches[0].clientX - touchStartX.current;
    const deltaY = e.changedTouches[0].clientY - touchStartY.current;

    // Only trigger on horizontal swipes (more horizontal than vertical)
    if (Math.abs(deltaX) < 50 || Math.abs(deltaX) < Math.abs(deltaY) * 1.5) return;

    const tabOrder: Tab[] = role !== 'Employee'
      ? ['dashboard', 'receipts', 'scan', 'reconcile']
      : ['receipts', 'scan'];

    const currentIndex = tabOrder.indexOf(activeTab);
    if (currentIndex === -1) return;

    if (deltaX < 0 && currentIndex < tabOrder.length - 1) {
      // Swipe left → next tab
      setTabWithUrl(tabOrder[currentIndex + 1]);
    } else if (deltaX > 0 && currentIndex > 0) {
      // Swipe right → previous tab
      setTabWithUrl(tabOrder[currentIndex - 1]);
    }
  }, [activeTab, role, setTabWithUrl]);

  if (authLoading || !hasMounted) return <FullPageLoader />;
  if (!user) return <AuthScreen />;

  // Only Owner/Accountant see these tabs
  const isPrivileged = role !== 'Employee';

  const navItems: Array<{
    id: Tab;
    label: string;
    icon: React.ReactNode;
    primary?: boolean;
  }> = [
  ...(isPrivileged ? [{ id: 'dashboard' as Tab, label: 'Dash', icon: <LayoutDashboard className="h-5 w-5" /> }] : []),
  { id: 'receipts', label: 'Records', icon: <ReceiptText className="h-5 w-5" /> },
  { id: 'scan', label: 'Scan', icon: <Camera className="h-6 w-6" />, primary: true },
  ...(isPrivileged ? [{ id: 'reconcile' as Tab, label: 'Bank', icon: <TrendingUp className="h-5 w-5" /> }] : []),
  { id: 'more', label: 'More', icon: <MoreHorizontal className="h-5 w-5" /> },
];

return (
  <div className="min-h-screen w-full bg-obsidian flex flex-col overflow-hidden text-text-primary">
    <OfflineIndicator />

    {/* Header */}
    <header className="fixed inset-x-0 top-0 z-50 liquid-glass" role="banner">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3 sm:px-6">
      <div className="flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-[2rem] bg-champagne/15 champagne-glow">
            <ReceiptText className="h-5 w-5 text-champagne" />
          </div>
          <div>
            <h1 className="text-base font-bold tracking-tight text-text-primary">9 Star Labs</h1>
            <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-champagne">
              CRA-ready records
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <ThemeToggle />
          
          <div className="relative">
            <button
              type="button"
              onClick={() => setRoleOpen((v) => !v)}
              className="flex items-center gap-2 rounded-full border border-glass-border bg-surface px-3 py-2 text-xs font-semibold text-text-secondary transition hover:border-glass-border-hover hover:bg-surface-raised"
            >
              <UserCircle2 className="h-4 w-4 text-champagne" />
              <span>Role: {role}</span>
              <ChevronDown
                className={`h-3.5 w-3.5 text-text-muted transition ${roleOpen ? 'rotate-180' : ''}`}
              />
            </button>

            <Link
              href="/settings/billing"
              className="flex items-center gap-1.5 rounded-full border border-glass-border bg-surface px-3 py-2 text-xs font-semibold transition hover:border-glass-border-hover hover:bg-surface-raised"
            >
              <Crown className="h-4 w-4 text-amber-400" />
              <span className={plan === 'pro' || plan === 'enterprise' ? 'text-amber-300' : 'text-text-secondary'}>
                {planLoading ? '...' : planLabel}
              </span>
            </Link>

            <AnimatePresence>
                {roleOpen && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.95, y: -4 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95, y: -4 }}
                    transition={{ type: 'spring', stiffness: 400, damping: 25 }}
                    className="absolute right-0 top-12 z-50 w-48 rounded-[3rem] border border-glass-border bg-surface p-2 shadow-2xl"
                  >
                    <div className="pt-1">
                      <button
                        type="button"
                        onClick={handleSignOut}
                        className="flex w-full items-center gap-2 rounded-[2rem] px-3 py-2 text-left text-sm font-medium text-text-secondary transition hover:bg-red-500/10 hover:text-red-400"
                      >
                        <LogOut className="h-4 w-4" />
                        <span>Sign out</span>
                      </button>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main
        className="mx-auto max-w-6xl px-4 pb-28 pt-24 sm:px-6 relative overflow-hidden"
        role="main"
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
      >
        {/* Audit HUD */}
        {!receiptsLoading && receipts.length > 0 && role !== 'Employee' && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={tabTransition}
            className="mb-5"
          >
            <AuditHUD receipts={receipts} />
          </motion.div>
        )}

        {/* Upgrade Prompt Banner */}
        {!planLoading && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-5"
          >
            <UpgradePrompt
              plan={plan}
              receiptCount={receiptCount}
              teamSize={teamSize}
              isTrialing={isTrialing}
              daysLeftInTrial={trialDaysLeft}
            />
          </motion.div>
        )}

        <AnimatePresence mode="wait">
          {receiptsLoading ? (
            <motion.div 
              key="loader"
              variants={tabVariants}
              initial="initial"
              animate="animate"
              exit="exit"
              transition={tabTransition}
              className="flex min-h-[50vh] flex-col items-center justify-center gap-4"
            >
              <Loader2 className="h-9 w-9 animate-spin text-champagne" />
              <p className="text-sm font-medium text-text-secondary">Loading your workspace…</p>
            </motion.div>
          ) : activeTab === 'dashboard' ? (
            <motion.div
              key="dashboard"
              variants={tabVariants}
              initial="initial"
              animate="animate"
              exit="exit"
              transition={tabTransition}
            >
              <ErrorBoundary componentName="Dashboard">
                <Dashboard onFilterClick={handleFilterClick} role={role} userId={userId} />
              </ErrorBoundary>
            </motion.div>
          ) : activeTab === 'receipts' ? (
            <motion.div
              key="receipts"
              variants={tabVariants}
              initial="initial"
              animate="animate"
              exit="exit"
              transition={tabTransition}
            >
              <ErrorBoundary componentName="History">
                <History receipts={receipts} activeFilter={activeFilter} onUpdate={() => { fetchReceipts(); }} role={role} userId={userId} />
              </ErrorBoundary>
            </motion.div>
          ) : activeTab === 'scan' ? (
            <motion.div
              key="scan"
              variants={tabVariants}
              initial="initial"
              animate="animate"
              exit="exit"
              transition={tabTransition}
            >
              <ErrorBoundary componentName="Scanner">
                <Scanner
                  user={user}
                  onSaveSuccess={async () => {
                    await fetchReceipts();
                    setActiveTab('receipts');
                    showToast('success', 'Receipt saved successfully.');
                  }}
                />
              </ErrorBoundary>
            </motion.div>
          ) : activeTab === 'export' ? (
            <motion.div
              key="export"
              variants={tabVariants}
              initial="initial"
              animate="animate"
              exit="exit"
              transition={tabTransition}
            >
              <ErrorBoundary componentName="Export">
                <Export receipts={receipts} />
              </ErrorBoundary>
            </motion.div>
          ) : activeTab === 'reconcile' ? (
            <motion.div
              key="reconcile"
              variants={tabVariants}
              initial="initial"
              animate="animate"
              exit="exit"
              transition={tabTransition}
            >
              <ErrorBoundary componentName="BankReconciliation">
                <BankReconciliation receipts={receipts} />
              </ErrorBoundary>
            </motion.div>
          ) : activeTab === 'approvals' ? (
            <motion.div key="approvals" variants={tabVariants} initial="initial" animate="animate" exit="exit" transition={tabTransition}>
              <ErrorBoundary componentName="ApprovalsQueue">
                <ApprovalsQueue role={role} />
              </ErrorBoundary>
            </motion.div>
          ) : activeTab === 'payables' ? (
            <motion.div key="payables" variants={tabVariants} initial="initial" animate="animate" exit="exit" transition={tabTransition}>
              <ErrorBoundary componentName="ReimbursementsPanel">
                <ReimbursementsPanel role={role} />
              </ErrorBoundary>
            </motion.div>
          ) : activeTab === 'projects' ? (
            <motion.div key="projects" variants={tabVariants} initial="initial" animate="animate" exit="exit" transition={tabTransition}>
              <ErrorBoundary componentName="ProjectManager">
                <ProjectManager />
              </ErrorBoundary>
            </motion.div>
          ) : (
            <motion.div
              key="audit"
              variants={tabVariants}
              initial="initial"
              animate="animate"
              exit="exit"
              transition={tabTransition}
            >
              <ErrorBoundary componentName="AuditTrail">
                <AuditTrail />
              </ErrorBoundary>
            </motion.div>
          )}
        </AnimatePresence>

        {/* 'More' Bottom Sheet */}
        <AnimatePresence>
          {activeTab === 'more' && (
            <div
              className="fixed inset-0 z-50 bg-black/50 flex flex-col"
              onClick={() => closeMoreMenu()}
            >
              <motion.div
                initial={{ opacity: 0, x: '100%' }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: '100%' }}
                transition={{ type: 'spring', damping: 25, stiffness: 200 }}
                className="ml-auto flex flex-col bg-white rounded-t-lg max-h-[90vh] overflow-y-auto w-full sm:w-96 shadow-2xl"
                onClick={(e) => e.stopPropagation()}
              >
                {/* Header with close button INSIDE the sheet */}
                <div className="sticky top-0 bg-white border-b flex justify-between items-center p-6 z-10">
                  <h2 className="text-xl font-bold text-gray-900">More Options</h2>
                  <button
                    onClick={() => closeMoreMenu()}
                    className="text-3xl font-bold leading-none text-gray-400 hover:text-gray-600 transition"
                    aria-label="Close menu"
                  >
                    ✕
                  </button>
                </div>

                {/* Scrollable content */}
                <div className="overflow-y-auto flex-1 p-2">
                  <div className="grid gap-2">
                    {role !== 'Employee' && (
                      <>
                        <button onClick={() => setActiveTab('audit')} className="flex items-center gap-3 rounded-[3rem] bg-gray-50 p-4 transition hover:bg-gray-100">
                          <div className="flex h-10 w-10 items-center justify-center rounded-[2rem] bg-blue-100 text-blue-600"><ShieldCheck className="h-5 w-5" /></div>
                          <div className="text-left"><p className="text-sm font-bold text-gray-900">Audit Trail</p><p className="text-xs text-gray-500">Immutable Merkle history</p></div>
                        </button>
                        <button onClick={() => setActiveTab('export')} className="flex items-center gap-3 rounded-[3rem] bg-gray-50 p-4 transition hover:bg-gray-100">
                          <div className="flex h-10 w-10 items-center justify-center rounded-[2rem] bg-blue-100 text-blue-600"><Download className="h-5 w-5" /></div>
                          <div className="text-left"><p className="text-sm font-bold text-gray-900">CRA Export</p><p className="text-xs text-gray-500">Generate compliance ZIPs</p></div>
                        </button>
                        <button onClick={() => setActiveTab('approvals')} className="flex items-center gap-3 rounded-[3rem] bg-gray-50 p-4 transition hover:bg-gray-100">
                          <div className="flex h-10 w-10 items-center justify-center rounded-[2rem] bg-emerald-100 text-emerald-600"><CheckCircle2 className="h-5 w-5" /></div>
                          <div className="text-left"><p className="text-sm font-bold text-gray-900">Approvals Queue</p><p className="text-xs text-gray-500">Review employee submissions</p></div>
                        </button>
                        <button onClick={() => setActiveTab('payables')} className="flex items-center gap-3 rounded-[3rem] bg-gray-50 p-4 transition hover:bg-gray-100">
                          <div className="flex h-10 w-10 items-center justify-center rounded-[2rem] bg-amber-100 text-amber-600"><TrendingUp className="h-5 w-5" /></div>
                          <div className="text-left"><p className="text-sm font-bold text-gray-900">Reimbursements</p><p className="text-xs text-gray-500">Employee payables tracker</p></div>
                        </button>
                        <button onClick={() => setActiveTab('projects')} className="flex items-center gap-3 rounded-2xl bg-gray-50 p-4 transition hover:bg-gray-100">
                          <div className="flex h-10 w-10 items-center justify-center rounded-[2rem] bg-blue-100 text-blue-600"><Layers className="h-5 w-5" /></div>
                          <div className="text-left"><p className="text-sm font-bold text-gray-900">Projects & Job Codes</p><p className="text-xs text-gray-500">Manage construction sites</p></div>
                        </button>
                        {role === 'Owner' && (
                          <button onClick={() => { setActiveTab('dashboard'); setShowInviteModal(true); }} className="flex items-center gap-3 rounded-[3rem] bg-gray-50 p-4 transition hover:bg-gray-100">
                            <div className="flex h-10 w-10 items-center justify-center rounded-[2rem] bg-blue-100 text-blue-600"><UserCircle2 className="h-5 w-5" /></div>
                            <div className="text-left"><p className="text-sm font-bold text-gray-900">Invite Team Member</p><p className="text-xs text-gray-500">Generate 6-digit access code</p></div>
                          </button>
                        )}
                        {!showRedeemInput ? (
                          <button
                            onClick={() => setShowRedeemInput(true)}
                            className="flex items-center gap-3 rounded-[3rem] bg-gray-50 p-4 transition hover:bg-gray-100 w-full"
                          >
                            <div className="flex h-10 w-10 items-center justify-center rounded-[2rem] bg-blue-100 text-blue-600">
                              <ShieldCheck className="h-5 w-5" />
                            </div>
                            <div className="text-left">
                              <p className="text-sm font-bold text-gray-900">Redeem Access Code</p>
                              <p className="text-xs text-gray-500">Join a workspace</p>
                            </div>
                          </button>
                        ) : (
                          <div className="rounded-[2rem] border border-blue-200 bg-blue-50 p-4 space-y-3">
                            <p className="text-sm font-bold text-gray-900">Enter 6-digit Access Code</p>
                            <input
                              type="text"
                              value={redeemCodeValue}
                              onChange={(e) => setRedeemCodeValue(e.target.value.replace(/\D/g, '').slice(0, 6))}
                              placeholder="000000"
                              maxLength={6}
                              className="w-full rounded-[2rem] border border-gray-200 bg-white px-4 py-2 text-center font-mono tracking-[0.3em] text-lg outline-none focus:border-blue-400"
                              autoFocus
                            />
                            <div className="flex gap-2">
                              <button
                                onClick={() => { setShowRedeemInput(false); setRedeemCodeValue(''); }}
                                className="flex-1 rounded-[2rem] border border-gray-200 bg-white px-4 py-2 text-sm font-semibold text-gray-600 hover:bg-gray-100"
                              >
                                Cancel
                              </button>
                              <button
                                onClick={handleRedeemCode}
                                disabled={redeemCodeValue.length !== 6 || redeemLoading}
                                className="flex-1 rounded-[2rem] bg-blue-600 px-4 py-2 text-sm font-bold text-white hover:bg-blue-700 disabled:opacity-50"
                              >
                                {redeemLoading ? 'Redeeming...' : 'Redeem'}
                              </button>
                            </div>
                          </div>
                        )}
                      </>
                    )}
                    
                    <div className="mt-4 px-2">
                      <p className="mb-2 text-xs font-bold uppercase tracking-widest text-gray-400">Settings</p>
                      <Link href="/settings/billing" className="flex items-center gap-3 rounded-[3rem] p-3 transition hover:bg-gray-100">
                        <Crown className="h-4 w-4 text-amber-500" />
                        <span className="text-sm font-semibold text-gray-700">Billing & Plan</span>
                        <span className={`ml-auto text-[10px] px-2 py-0.5 rounded-full ${plan === 'pro' || plan === 'enterprise' ? 'bg-amber-100 text-amber-700' : 'bg-gray-100 text-gray-600'}`}>
                          {planLabel}
                        </span>
                      </Link>
                      <Link href="/settings/org" className="flex items-center gap-3 rounded-[3rem] p-3 transition hover:bg-gray-100">
                        <Settings className="h-4 w-4 text-gray-400" />
                        <span className="text-sm font-semibold text-gray-700">Organization</span>
                      </Link>
                      <Link href="/settings/security" className="flex items-center gap-3 rounded-[3rem] p-3 transition hover:bg-gray-100">
                        <ShieldCheck className="h-4 w-4 text-gray-400" />
                        <span className="text-sm font-semibold text-gray-700">Security</span>
                      </Link>

                      <p className="mt-6 mb-2 text-xs font-bold uppercase tracking-widest text-gray-400">Legal</p>
                      <Link href="/terms" className="flex items-center gap-3 rounded-[3rem] p-3 transition hover:bg-gray-100">
                        <Scale className="h-4 w-4 text-gray-400" />
                        <span className="text-sm font-semibold text-gray-700">Terms of Service</span>
                      </Link>
                      <Link href="/privacy" className="flex items-center gap-3 rounded-[3rem] p-3 transition hover:bg-gray-100">
                        <ShieldCheck className="h-4 w-4 text-gray-400" />
                        <span className="text-sm font-semibold text-gray-700">Privacy Policy (PIPEDA)</span>
                      </Link>
                    </div>
                  </div>
                </div>
              </motion.div>
            </div>
          )}
        </AnimatePresence>
      </main>

      {/* Bottom Navigation */}
      <nav className="fixed inset-x-0 bottom-0 z-50 liquid-glass bottom-nav" role="navigation" aria-label="Main navigation">
        <div className="mx-auto flex max-w-6xl items-end justify-around px-2 py-2 sm:px-4">
          <LayoutGroup id="nav">
            {navItems.map((item) => {
              /* Role-based Visibility */
              if (role === 'Employee' && ['dashboard', 'export', 'audit', 'reconcile'].includes(item.id)) {
                return null;
              }
              if (role === 'Accountant' && ['payables'].includes(item.id)) {
                return null;
              }

              const isActive = activeTab === item.id;
              
              return item.primary ? (
                <div key={item.id} className="relative -mt-6 flex flex-col items-center gap-1">
                  <motion.button
                    type="button"
                    onClick={() => setActiveTab(item.id)}
                    aria-label={item.label}
                    aria-current={isActive ? 'page' : undefined}
                    whileTap={{ scale: 0.88 }}
                    whileHover={{ scale: 1.06 }}
                    transition={{ type: 'spring', stiffness: 400, damping: 15 }}
                    className={`flex h-14 w-14 items-center justify-center rounded-full shadow-xl transition ${
                      isActive
                        ? 'bg-emerald-success text-white shadow-emerald-success/30'
                        : 'bg-emerald-success/80 text-white shadow-emerald-success/20 hover:bg-emerald-success'
                    }`}
                  >
                    {item.icon}
                  </motion.button>
                  <span className="text-[10px] font-bold uppercase tracking-[0.16em] text-emerald-light">
                    {item.label}
                  </span>
                </div>
              ) : (
                <motion.button
                  key={item.id}
                  type="button"
                  onClick={() => setActiveTab(item.id)}
                  aria-label={item.label}
                  aria-current={isActive ? 'page' : undefined}
                  whileTap={{ scale: 0.9 }}
                  transition={{ type: 'spring', stiffness: 400, damping: 20 }}
                  className={`relative flex min-w-[64px] flex-col items-center gap-1 rounded-[3rem] px-3 py-2 transition ${
                    isActive ? 'text-champagne' : 'text-text-muted hover:text-text-secondary'
                  }`}
                >
                  {isActive && (
                    <motion.div
                      layoutId="active-pill"
                      className="absolute inset-0 bg-champagne/10 rounded-[3rem]"
                      transition={{ type: 'spring', stiffness: 350, damping: 30 }}
                    />
                  )}
                  <div className="relative z-10 flex flex-col items-center gap-1">
                    {item.icon}
                    <span className="text-[10px] font-semibold uppercase tracking-[0.14em]">
                      {item.label}
                    </span>
                  </div>
                </motion.button>
              );
            })}
          </LayoutGroup>
        </div>
      </nav>

      {/* Role menu backdrop */}
      {roleOpen && (
        <button
          type="button"
          aria-label="Close role menu"
          className="fixed inset-0 z-40 cursor-default"
          onClick={() => setRoleOpen(false)}
        />
      )}

      <CommandPalette onAction={handleCommand} />

      {/* Invite Modal */}
      <Drawer.Root open={showInviteModal} onOpenChange={setShowInviteModal}>
        <Drawer.Portal>
          <Drawer.Overlay className="fixed inset-0 z-[150] bg-black/60 backdrop-blur-sm" />
          <Drawer.Content className="fixed bottom-0 left-0 right-0 z-[160] flex flex-col rounded-t-[3rem] border-t border-glass-border bg-surface outline-none focus:ring-0 bottom-nav">
            <div className="mx-auto mt-4 h-1.5 w-12 flex-shrink-0 rounded-full bg-glass-border" />
            <div className="p-6">
              <InviteModal
                onClose={() => setShowInviteModal(false)}
                businessUnits={businessUnits}
              />
            </div>
          </Drawer.Content>
        </Drawer.Portal>
      </Drawer.Root>
    </div>
  );
}

export default function Page() {
  return (
    <Suspense fallback={<FullPageLoader />}>
      <AppContent />
    </Suspense>
  );
}