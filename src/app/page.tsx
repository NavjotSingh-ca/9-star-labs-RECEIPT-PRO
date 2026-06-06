'use client';

import { useCallback, useEffect, useMemo, useRef, useState, Suspense } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useQueryState, parseAsStringEnum } from 'nuqs';
import { toast } from 'sonner';
import { Drawer } from 'vaul';
import {
  Loader2,
  ReceiptText,
  TrendingUp,
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';

import dynamic from 'next/dynamic';
import CommandPalette from '@/components/CommandPalette';
import InviteModal from '@/components/InviteModal';
import Export from '@/components/Export';
import ApprovalsQueue from '@/components/ApprovalsQueue';
import ReimbursementsPanel from '@/components/ReimbursementsPanel';

const Dashboard = dynamic(() => import('@/components/Dashboard'), { ssr: false });
const History = dynamic(() => import('@/components/History'), { ssr: false });
const Scanner = dynamic(() => import('@/components/Scanner'), { ssr: false });
const AuditTrail = dynamic(() => import('@/components/AuditTrail'), { ssr: false });
const BankReconciliation = dynamic(() => import('@/components/BankReconciliation'), { ssr: false });
const MileageTracker = dynamic(() => import('@/components/MileageTracker'), { ssr: false });
const ProjectManager = dynamic(() => import('@/components/ProjectManager'), { ssr: false });
const AnomalyDashboard = dynamic(() => import('@/components/AnomalyDashboard'), { ssr: false });
import { ThemeToggle } from '@/components/ThemeToggle';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import { ConsentBanner } from '@/components/ConsentBanner';
import OfflineIndicator from '@/components/OfflineIndicator';
import SwUpdateBanner from '@/components/SwUpdateBanner';
import InstallPrompt from '@/components/InstallPrompt';
import ShortcutsOverlay from '@/components/ShortcutsOverlay';
import { UpgradePrompt } from '@/components/upgrade-prompt';
import AuthScreen from '@/components/AuthScreen';
import { OnboardingTour } from '@/components/OnboardingTour';
import Sidebar from '@/components/layout/Sidebar';
import MobileNav from '@/components/layout/MobileNav';
import TopBar from '@/components/layout/TopBar';
import PageHeader from '@/components/layout/PageHeader';
import MoreSheet from '@/components/layout/MoreSheet';
import { supabase } from '@/lib/supabase';
import { usePlan } from '@/hooks/use-plan';
import type { ReceiptRow, UserRole } from '@/lib/types';
import type { User } from '@supabase/supabase-js';
import { getReceipts, getBusinessUnits, getAuditLogs } from '@/lib/services/receipts';
import { getUserRole } from '@/lib/services/roles';
import type { Tab } from '@/lib/store';
import { useAppStore } from '@/lib/store';

const cad = new Intl.NumberFormat('en-CA', {
  style: 'currency',
  currency: 'CAD',
  maximumFractionDigits: 2,
});

const tabTransition = {
  duration: 0.2,
  ease: 'easeOut' as const,
};

const tabVariants = {
  initial: { opacity: 0, y: 16 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -8 },
};

const showToast = (type: 'success' | 'error' | 'info', msg: string) => {
  if (type === 'success') toast.success(msg);
  else if (type === 'error') toast.error(msg);
  else toast.info(msg);
};

function FullPageLoader() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-obsidian" role="status" aria-live="polite" aria-label="Loading application">
      <div className="flex flex-col items-center gap-4">
        <div className="flex h-16 w-16 items-center justify-center rounded-[3rem] bg-champagne/15 champagne-glow">
          <ReceiptText className="h-8 w-8 text-champagne" />
        </div>
        <Loader2 className="h-6 w-6 animate-spin text-champagne" />
        <p className="text-sm font-medium text-text-secondary">Loading 9 Star Labs…</p>
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

function AppContent() {
  const router = useRouter();
  const [hasMounted, setHasMounted] = useState(false);
  const [authLoading, setAuthLoading] = useState(true);
  const [user, setUser] = useState<User | null>(null);
  const [activeTab, setActiveTab] = useQueryState('tab', parseAsStringEnum<Tab>(['dashboard', 'receipts', 'scan', 'export', 'audit', 'reconcile', 'mileage', 'approvals', 'payables', 'projects', 'alerts', 'more']).withDefault('dashboard'));
  const storeTab = useAppStore((s) => s.setActiveTab);
  const [activeFilter, setActiveFilter] = useState<string>('all');
  const touchStartX = useRef<number>(0);
  const touchStartY = useRef<number>(0);

  useEffect(() => {
    if (activeTab) storeTab(activeTab);
  }, [activeTab, storeTab]);

  useEffect(() => { setHasMounted(true); }, []);

  const setTabWithUrl = useCallback((tab: Tab) => {
    if (typeof window === 'undefined') return;
    setActiveTab(tab);
  }, [setActiveTab]);

  const [role, setRole] = useState<UserRole>('Owner');

  const closeMoreMenu = useCallback(() => {
    const fallback: Tab = role === 'Employee' ? 'scan' : 'dashboard';
    setTabWithUrl(fallback);
  }, [role, setTabWithUrl]);

  useEffect(() => {
    if (role === 'Employee') {
      const allowedEmployeeTabs: Tab[] = ['scan', 'receipts', 'more'];
      if (!allowedEmployeeTabs.includes(activeTab)) {
        setTabWithUrl('scan');
      }
    }
  }, [role, activeTab, setTabWithUrl]);

  useEffect(() => {
    if (!hasMounted) return;
    let active = true;

    async function resolveUser(currentUser: User) {
      setUser(currentUser);
      try {
        const rolePromise = getUserRole(currentUser.id);
        const orgPromise = supabase.rpc('get_user_org');
        const timeout = new Promise<never>((_, reject) =>
          setTimeout(() => reject(new Error('Auth timeout')), 3000)
        );

        const [role, { data: orgId }] = await Promise.all([
          Promise.race([rolePromise, timeout]),
          Promise.race([orgPromise, timeout]),
        ]) as [UserRole, { data: string | null }];

        if (!active) return;
        let finalRole = role;
        if (!orgId) {
          await supabase.rpc('bootstrap_first_user_org', {
            p_user_id: currentUser.id,
            p_org_name: 'My Business',
          });
          finalRole = await getUserRole(currentUser.id);
        }
        if (active) {
          setRole(finalRole);
          setAuthLoading(false);
        }
      } catch (err) {
        if (active) {
          console.error('Auth resolution failed:', err);
          toast.error('Unable to verify your role. Some features may be limited.');
          setRole('Employee');
          setAuthLoading(false);
        }
      }
    }

    supabase.auth.getUser().then(({ data: { user } }) => {
      if (!active) return;
      if (user) {
        resolveUser(user);
      } else {
        setAuthLoading(false);
      }
    }).catch(() => {
      if (active) setAuthLoading(false);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (!active) return;
      if (session?.user) {
        resolveUser(session.user);
      } else {
        setUser(null);
        setAuthLoading(false);
      }
    });

    const safetyTimeout = setTimeout(() => {
      setAuthLoading(false);
    }, 3000);

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

  const { plan, label: planLabel, receiptCount, teamSize, isTrialing, subscription, isLoading: planLoading } = usePlan();
  const trialDaysLeft = subscription?.trial_ends_at
    ? Math.max(0, Math.ceil((new Date(subscription.trial_ends_at).getTime() - Date.now()) / (1000 * 60 * 60 * 24)))
    : undefined;

  const queryClient = useQueryClient();
  useEffect(() => {
    if (!userId) return;
    const channel = supabase
      .channel('receipts-realtime')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'receipts' }, () => {
        queryClient.invalidateQueries({ queryKey: ['receipts'] });
        queryClient.invalidateQueries({ queryKey: ['receipts_paginated'] });
        queryClient.invalidateQueries({ queryKey: ['dashboard_summary'] });
      })
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [userId, queryClient]);

  const handleFilterClick = useCallback((filter: string) => {
    setActiveFilter(filter);
    setTabWithUrl('receipts');
  }, [setTabWithUrl]);

  const handleSignOut = useCallback(async () => {
    await supabase.auth.signOut();
    setTabWithUrl('dashboard');
    setActiveFilter('all');
  }, [setTabWithUrl]);

  const handleCommand = useCallback((action: string) => {
    if (action === 'scan') setTabWithUrl('scan');
    if (action === 'bulk-upload') setTabWithUrl('scan');
    if (action === 'missing-bn') { setActiveFilter('missing-bn'); setTabWithUrl('receipts'); }
    if (action === 'export-idea') setTabWithUrl('export');
  }, [setTabWithUrl]);

  // Global keyboard shortcuts
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === 's' && !e.metaKey && !e.ctrlKey && !e.altKey && !(e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement || e.target instanceof HTMLSelectElement)) {
        e.preventDefault();
        setTabWithUrl('scan');
      }
    }
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [setTabWithUrl]);

  const [showInviteModal, setShowInviteModal] = useState(false);
  const isPrivileged = role !== 'Employee';

  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX;
    touchStartY.current = e.touches[0].clientY;
  }, []);

  const handleTouchEnd = useCallback((e: React.TouchEvent) => {
    const deltaX = e.changedTouches[0].clientX - touchStartX.current;
    const deltaY = e.changedTouches[0].clientY - touchStartY.current;
    if (Math.abs(deltaX) < 40 || Math.abs(deltaX) < Math.abs(deltaY) * 1.2) return;
    const tabOrder: Tab[] = role === 'Employee'
      ? ['receipts', 'scan', 'more']
      : ['dashboard', 'receipts', 'scan', 'more'];
    const currentIndex = tabOrder.indexOf(activeTab);
    if (currentIndex === -1) return;
    if (deltaX < 0 && currentIndex < tabOrder.length - 1) setTabWithUrl(tabOrder[currentIndex + 1]);
    else if (deltaX > 0 && currentIndex > 0) setTabWithUrl(tabOrder[currentIndex - 1]);
  }, [activeTab, role, setTabWithUrl]);

  if (authLoading || !hasMounted) return <FullPageLoader />;
  if (!user) return <AuthScreen />;

  const tabContent = (() => {
    if (receiptsLoading) {
      return (
        <motion.div
          key="loader"
          variants={tabVariants}
          initial="initial"
          animate="animate"
          exit="exit"
          transition={tabTransition}
          className="flex min-h-[50vh] flex-col items-center justify-center gap-4"
          role="status"
          aria-live="polite"
        >
          <Loader2 className="h-9 w-9 animate-spin text-champagne" />
          <p className="text-sm font-medium text-text-secondary">Loading your workspace…</p>
        </motion.div>
      );
    }

    const inner = (() => {
      switch (activeTab) {
        case 'dashboard':
          return (
            <ErrorBoundary componentName="Dashboard">
              <div id="dashboard-kpis">
                <Dashboard onFilterClick={handleFilterClick} onScan={() => setTabWithUrl('scan')} role={role} userId={userId} />
              </div>
            </ErrorBoundary>
          );
        case 'receipts':
          return (
            <ErrorBoundary componentName="History">
              <History
                receipts={receipts}
                activeFilter={activeFilter}
                onUpdate={() => { fetchReceipts(); }}
                onScan={() => { setTabWithUrl('scan'); }}
                role={role}
                userId={userId}
              />
            </ErrorBoundary>
          );
        case 'scan':
          return (
            <ErrorBoundary componentName="Scanner">
              <Scanner
                user={user}
                onSaveSuccess={async () => {
                  await fetchReceipts();
                  setTabWithUrl('receipts');
                  showToast('success', 'Receipt saved successfully.');
                }}
              />
            </ErrorBoundary>
          );
        case 'reconcile':
          return (
            <ErrorBoundary componentName="BankReconciliation">
              <BankReconciliation receipts={receipts} />
            </ErrorBoundary>
          );
        case 'export':
          return (
            <ErrorBoundary componentName="Export">
              <Export receipts={receipts} />
            </ErrorBoundary>
          );
        case 'audit':
          return (
            <ErrorBoundary componentName="AuditTrail">
              <AuditTrail />
            </ErrorBoundary>
          );
        case 'mileage':
          return (
            <ErrorBoundary componentName="MileageTracker">
              <MileageTracker />
            </ErrorBoundary>
          );
        case 'approvals':
          return (
            <ErrorBoundary componentName="ApprovalsQueue">
              <ApprovalsQueue role={role} />
            </ErrorBoundary>
          );
        case 'payables':
          return (
            <ErrorBoundary componentName="ReimbursementsPanel">
              <ReimbursementsPanel role={role} />
            </ErrorBoundary>
          );
        case 'projects':
          return (
            <ErrorBoundary componentName="ProjectManager">
              <ProjectManager />
            </ErrorBoundary>
          );
        case 'alerts':
          return (
            <ErrorBoundary componentName="AnomalyDashboard">
              <AnomalyDashboard />
            </ErrorBoundary>
          );
        case 'more':
          return null;
        default:
          return (
            <ErrorBoundary componentName="AuditTrail">
              <AuditTrail />
            </ErrorBoundary>
          );
      }
    })();

    if (!inner) return null;

    return (
      <motion.div
        key={activeTab}
        variants={tabVariants}
        initial="initial"
        animate="animate"
        exit="exit"
        transition={tabTransition}
        aria-live="polite"
        aria-atomic="true"
      >
        {inner}
      </motion.div>
    );
  })();

  return (
    <div className="flex min-h-screen bg-obsidian">
      <OfflineIndicator />
      <SwUpdateBanner />

        <OnboardingTour />
        {/* Desktop sidebar */}
      <ErrorBoundary componentName="Sidebar">
        <Sidebar
          activeTab={activeTab}
          onTabChange={setTabWithUrl}
          role={role}
          planLabel={planLabel}
          plan={plan}
          openInviteModal={() => setShowInviteModal(true)}
          handleSignOut={handleSignOut}
        />
      </ErrorBoundary>

      {/* Main content area */}
      <div className="flex flex-1 flex-col min-w-0">
        {/* Mobile top bar */}
        <TopBar planLabel={planLabel} plan={plan} planLoading={planLoading}>
          <ThemeToggle />
        </TopBar>

        {/* Main content */}
        <main
          id="main-content"
          className="flex-1 overflow-y-auto px-4 pb-28 pt-16 sm:px-6 lg:pb-8 lg:pt-6 xl:px-8 relative"
          role="main"
          onTouchStart={handleTouchStart}
          onTouchEnd={handleTouchEnd}
        >
          {/* Subtle ambient gradient at top */}
          <div className="pointer-events-none absolute inset-x-0 top-0 h-80 bg-gradient-to-b from-champagne/10 to-transparent" aria-hidden="true" />
          <div className="mx-auto max-w-6xl relative">
            {/* Audit HUD */}
            {!receiptsLoading && receipts.length > 0 && role !== 'Employee' && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={tabTransition}
                className="mb-5"
              >
                <ErrorBoundary componentName="AuditHUD">
                  <AuditHUD receipts={receipts} />
                </ErrorBoundary>
              </motion.div>
            )}

            {/* Upgrade prompt */}
            {!planLoading && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="mb-5"
              >
                <ErrorBoundary componentName="UpgradePrompt">
                  <UpgradePrompt
                    plan={plan}
                    receiptCount={receiptCount}
                    teamSize={teamSize}
                    isTrialing={isTrialing}
                    daysLeftInTrial={trialDaysLeft}
                  />
                </ErrorBoundary>
              </motion.div>
            )}

            {/* Tab content */}
            <AnimatePresence mode="wait">
              {tabContent}
            </AnimatePresence>
          </div>
        </main>

        {/* Mobile bottom nav */}
        <MobileNav activeTab={activeTab} onTabChange={setTabWithUrl} role={role} noReceipts={receipts.length === 0} />

        {/* More slide-out panel */}
        <ErrorBoundary componentName="MoreSheet">
          <MoreSheet
            activeTab={activeTab}
            onTabChange={setTabWithUrl}
            onClose={closeMoreMenu}
            role={role}
            planLabel={planLabel}
            plan={plan}
            openInviteModal={() => setShowInviteModal(true)}
            onSignOut={handleSignOut}
          />
        </ErrorBoundary>
      </div>

      {/* Global overlays */}
      <ConsentBanner />
      <CommandPalette onAction={handleCommand} />
      <ShortcutsOverlay />
      <InstallPrompt />

      <Drawer.Root open={showInviteModal} onOpenChange={setShowInviteModal}>
        <Drawer.Portal>
          <Drawer.Overlay className="fixed inset-0 z-[150] bg-black/60 backdrop-blur-sm" />
          <Drawer.Content aria-label="Invite team member" className="fixed bottom-0 left-0 right-0 z-[160] flex flex-col rounded-t-[3rem] border-t border-glass-border bg-surface outline-none focus:ring-0 bottom-nav">
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
