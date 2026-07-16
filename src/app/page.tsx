'use client';

import { useCallback, useEffect, useMemo, useRef, useState, Suspense } from 'react';
import { APP_NAME } from '@/lib/constants';
import { useReceiptRealtimeSync } from '@/hooks/useReceiptRealtimeSync';
import { bootstrapOrgAction } from '@/app/actions/bootstrap-org';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useQueryState, parseAsStringEnum } from 'nuqs';
import { toast } from 'sonner';
import {
  Loader2,
  ReceiptText,
  TrendingUp,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

import dynamic from 'next/dynamic';
import { 
  DashboardSkeleton, 
  ReceiptTableSkeleton, 
  ScannerSkeleton, 
} from '@/components/ui/PremiumSkeletons';
import { OnboardingTour } from '@/components/OnboardingTour';
import FeatureWizard from '@/components/onboarding/FeatureWizard';

const Dashboard = dynamic(() => import('@/components/Dashboard'), { 
  ssr: false, 
  loading: () => <DashboardSkeleton /> 
});
const History = dynamic(() => import('@/components/History'), { 
  ssr: false, 
  loading: () => <ReceiptTableSkeleton /> 
});
const Scanner = dynamic(() => import('@/components/Scanner'), { 
  ssr: false, 
  loading: () => <ScannerSkeleton /> 
});
const MileageTracker = dynamic(() => import('@/components/MileageTracker'), { 
  ssr: false, 
  loading: () => <ReceiptTableSkeleton /> 
});
const Export = dynamic(() => import('@/components/Export'), { 
  ssr: false, 
  loading: () => <ReceiptTableSkeleton /> 
});
const BankReconciliation = dynamic(() => import('@/components/BankReconciliation'), { 
  ssr: false, 
  loading: () => <ReceiptTableSkeleton /> 
});
const AuditTrail = dynamic(() => import('@/components/AuditTrail'), { 
  ssr: false, 
  loading: () => <ReceiptTableSkeleton /> 
});
const ApprovalsQueue = dynamic(() => import('@/components/ApprovalsQueue'), { 
  ssr: false, 
  loading: () => <ReceiptTableSkeleton /> 
});
const ReimbursementsPanel = dynamic(() => import('@/components/ReimbursementsPanel'), { 
  ssr: false, 
  loading: () => <ReceiptTableSkeleton /> 
});
const ProjectManager = dynamic(() => import('@/components/ProjectManager'), { 
  ssr: false, 
  loading: () => <ReceiptTableSkeleton /> 
});
const AnomalyDashboard = dynamic(() => import('@/components/AnomalyDashboard'), { 
  ssr: false, 
  loading: () => <ReceiptTableSkeleton /> 
});
const ReportsPage = dynamic(() => import('@/components/reports/ReportsPage').then(m => m.ReportsPage), { 
  ssr: false, 
  loading: () => <ReceiptTableSkeleton /> 
});

// Time Tracking
const TimeClock = dynamic(() => import('@/components/time/TimeClock'), {
  ssr: false,
  loading: () => <ReceiptTableSkeleton />
});
const TimeHistory = dynamic(() => import('@/components/time/TimeHistory'), {
  ssr: false,
  loading: () => <ReceiptTableSkeleton />
});

// === NEW FEATURES (23) ===
const SmartSearch = dynamic(() => import('@/components/features/SmartSearch'), { ssr: false, loading: () => <ReceiptTableSkeleton /> });
const ReceiptCalendar = dynamic(() => import('@/components/features/ReceiptCalendar'), { ssr: false, loading: () => <ReceiptTableSkeleton /> });
const ReceiptTimeline = dynamic(() => import('@/components/features/ReceiptTimeline'), { ssr: false, loading: () => <ReceiptTableSkeleton /> });
const VendorAnalytics = dynamic(() => import('@/components/features/VendorAnalytics'), { ssr: false, loading: () => <ReceiptTableSkeleton /> });
const BudgetManager = dynamic(() => import('@/components/features/BudgetManager'), { ssr: false, loading: () => <ReceiptTableSkeleton /> });
const TaxDashboard = dynamic(() => import('@/components/features/TaxDashboard'), { ssr: false, loading: () => <ReceiptTableSkeleton /> });
const CashFlowForecast = dynamic(() => import('@/components/features/CashFlowForecast'), { ssr: false, loading: () => <ReceiptTableSkeleton /> });
const MultiCurrency = dynamic(() => import('@/components/features/MultiCurrency'), { ssr: false, loading: () => <ReceiptTableSkeleton /> });
const ReceiptTags = dynamic(() => import('@/components/features/ReceiptTags'), { ssr: false, loading: () => <ReceiptTableSkeleton /> });
const BatchOperations = dynamic(() => import('@/components/features/BatchOperations'), { ssr: false, loading: () => <ReceiptTableSkeleton /> });
const ReceiptComparison = dynamic(() => import('@/components/features/ReceiptComparison'), { ssr: false, loading: () => <ReceiptTableSkeleton /> });
const RecurringDetector = dynamic(() => import('@/components/features/RecurringDetector'), { ssr: false, loading: () => <ReceiptTableSkeleton /> });
const KanbanWorkflow = dynamic(() => import('@/components/features/KanbanWorkflow'), { ssr: false, loading: () => <ReceiptTableSkeleton /> });
const QBOExport = dynamic(() => import('@/components/features/QBOExport'), { ssr: false, loading: () => <ReceiptTableSkeleton /> });
const XeroExport = dynamic(() => import('@/components/features/XeroExport'), { ssr: false, loading: () => <ReceiptTableSkeleton /> });
const ExportDashboard = dynamic(() => import('@/components/features/ExportDashboard'), { ssr: false, loading: () => <ReceiptTableSkeleton /> });
const EmailForwardSetup = dynamic(() => import('@/components/features/EmailForwardSetup'), { ssr: false, loading: () => <ReceiptTableSkeleton /> });
const ReadinessScore = dynamic(() => import('@/components/features/ReadinessScore'), { ssr: false, loading: () => <ReceiptTableSkeleton /> });
const SpendingInsights = dynamic(() => import('@/components/features/SpendingInsights'), { ssr: false, loading: () => <ReceiptTableSkeleton /> });
const ShareReceipt = dynamic(() => import('@/components/features/ShareReceipt'), { ssr: false, loading: () => <ReceiptTableSkeleton /> });
const PayablesDashboard = dynamic(() => import('@/components/features/PayablesDashboard'), { ssr: false, loading: () => <ReceiptTableSkeleton /> });
const SlackAlerts = dynamic(() => import('@/components/features/SlackAlerts'), { ssr: false, loading: () => <ReceiptTableSkeleton /> });
const DarkModeSync = dynamic(() => import('@/components/features/DarkModeSync'), { ssr: false, loading: () => <ReceiptTableSkeleton /> });


import { ThemeToggle } from '@/components/ThemeToggle';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import AuthScreen from '@/components/AuthScreen';
import LandingPage from '@/components/LandingPage';
import Sidebar from '@/components/layout/Sidebar';
import MobileNav from '@/components/layout/MobileNav';
import TopBar from '@/components/layout/TopBar';
import MoreSheet from '@/components/layout/MoreSheet';
import { supabase } from '@/lib/supabase';
import { logError } from '@/lib/logger';
import type { ReceiptRow, UserRole } from '@/lib/types';
import type { User } from '@supabase/supabase-js';
import { getReceipts, getDashboardSummary, getDailySpend } from '@/lib/services/receipts';
import { getUserRole } from '@/lib/services/roles';
import { getPlan, formatPlanLabel } from '@/lib/services/subscription';

type Tab = 'dashboard' | 'receipts' | 'scan' | 'export' | 'audit' | 'reconcile' | 'mileage' | 'time' | 'approvals' | 'payables' | 'projects' | 'alerts' | 'reports' | 'more'
  | 'smart-search' | 'receipt-calendar' | 'receipt-timeline' | 'vendor-analytics'
  | 'budgets' | 'tax-dashboard' | 'cashflow-forecast' | 'multi-currency'
  | 'receipt-tags' | 'batch-operations' | 'receipt-comparison' | 'recurring-detector' | 'kanban-workflow'
  | 'qbo-export' | 'xero-export' | 'export-dashboard' | 'email-forward'
  | 'readiness-score' | 'spending-insights' | 'share-receipt' | 'payables-dashboard' | 'slack-alerts' | 'dark-sync';

const FULL_TAB_ORDER: Tab[] = ['dashboard', 'receipts', 'scan', 'mileage', 'time', 'export', 'reconcile', 'approvals', 'payables', 'projects', 'audit', 'alerts', 'reports',
  'smart-search', 'receipt-calendar', 'receipt-timeline', 'vendor-analytics',
  'budgets', 'tax-dashboard', 'cashflow-forecast', 'multi-currency',
  'receipt-tags', 'batch-operations', 'receipt-comparison', 'recurring-detector', 'kanban-workflow',
  'qbo-export', 'xero-export', 'export-dashboard', 'email-forward',
  'readiness-score', 'spending-insights', 'share-receipt', 'payables-dashboard', 'slack-alerts', 'dark-sync', 'more'];

const EMPLOYEE_TAB_ORDER: Tab[] = ['receipts', 'scan', 'mileage', 'time', 'smart-search', 'receipt-calendar', 'receipt-timeline', 'vendor-analytics', 'receipt-tags', 'share-receipt', 'more'];

const cad = new Intl.NumberFormat('en-CA', {
  style: 'currency',
  currency: 'CAD',
  maximumFractionDigits: 2,
});

const tabTransition = {
  type: 'spring' as const,
  stiffness: 300,
  damping: 28,
  mass: 0.8,
};

const tabVariants = {
  initial: { opacity: 0, y: 16, scale: 0.98 },
  animate: { opacity: 1, y: 0, scale: 1 },
  exit: { opacity: 0, y: -8, scale: 0.98 },
};

function FullPageLoader() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-obsidian" role="status" aria-live="polite" aria-label="Loading application">
      <div className="flex flex-col items-center gap-4">
        <div className="flex h-16 w-16 items-center justify-center rounded-xl bg-champagne/15 accent-glow">
          <ReceiptText className="h-8 w-8 text-champagne" />
        </div>
        <Loader2 className="h-6 w-6 animate-spin text-champagne" />
        <p className="text-sm font-medium text-text-secondary">Loading {APP_NAME}…</p>
        <div className="mt-8 animate-in fade-in duration-1000" style={{ animationDelay: '5s' }}>
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
    <div className="rounded-lg border border-glass-border bg-surface px-4 py-3" role="status" aria-label="Tax recoverable this month">
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-emerald-success/30">
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

/**
 * Main authenticated application shell — manages auth state, tab routing,
 * keyboard shortcuts, touch gestures, realtime sync, and renders all tab panels.
 * Wrapped in Suspense in the default export for nuqs query state hydration.
 */
function AppContent() {
  const [hasMounted, setHasMounted] = useState(false);
  const [authLoading, setAuthLoading] = useState(true);
  const [user, setUser] = useState<User | null>(null);
  const [activeTab, setActiveTab] = useQueryState('tab', parseAsStringEnum<Tab>(['dashboard', 'receipts', 'scan', 'export', 'audit', 'reconcile', 'mileage', 'time', 'approvals', 'payables', 'projects', 'alerts', 'reports', 'more',
  'smart-search', 'receipt-calendar', 'receipt-timeline', 'vendor-analytics',
  'budgets', 'tax-dashboard', 'cashflow-forecast', 'multi-currency',
  'receipt-tags', 'batch-operations', 'receipt-comparison', 'recurring-detector', 'kanban-workflow',
  'qbo-export', 'xero-export', 'export-dashboard', 'email-forward',
  'readiness-score', 'spending-insights', 'share-receipt', 'payables-dashboard', 'slack-alerts', 'dark-sync',
]).withDefault('dashboard'));
  const [activeFilter, setActiveFilter] = useState<string>('all');
  const touchStartX = useRef<number>(0);
  const touchStartY = useRef<number>(0);

  useEffect(() => { setHasMounted(true); }, []);

  const setTabWithUrl = useCallback((tab: Tab) => {
    if (typeof window === 'undefined') return;
    setActiveTab(tab);
  }, [setActiveTab]);

  const [showAuth, setShowAuth] = useState(false);
  const [role, setRole] = useState<UserRole>('Owner');
  const [orgId, setOrgId] = useState<string | null>(null);
  const [showFeatureWizard, setShowFeatureWizard] = useState(false);
  const [featureWizardShown, setFeatureWizardShown] = useState(() => {
    if (typeof window === 'undefined') return false;
    return localStorage.getItem('featureWizardDone') === 'true';
  });

  const closeMoreMenu = useCallback(() => {
    const fallback: Tab = role === 'Employee' ? 'scan' : 'dashboard';
    setTabWithUrl(fallback);
  }, [role, setTabWithUrl]);

  useEffect(() => {
    if (role === 'Employee') {
      if (!(EMPLOYEE_TAB_ORDER as readonly Tab[]).includes(activeTab)) {
        setTabWithUrl('scan');
      }
    }
  }, [role, activeTab, setTabWithUrl]);

  useEffect(() => {
    if (!hasMounted) return;
    let active = true;
    let authResolved = false;
    let subscription: { unsubscribe: () => void } | null = null;

    function resolveAuth(isResolved: boolean) {
      if (authResolved) return;
      authResolved = true;
      setAuthLoading(!isResolved);
    }

    async function resolveUser(currentUser: User) {
      setUser(currentUser);
      try {
        const rolePromise = getUserRole(currentUser.id);
        const orgPromise = supabase.rpc('get_user_org');
        const timeout = new Promise<never>((_, reject) =>
          setTimeout(() => reject(new Error('Auth timeout')), 5000)
        );

        const [role, { data: orgId }] = await Promise.all([
          Promise.race([rolePromise, timeout]),
          Promise.race([orgPromise, timeout]),
        ]) as [UserRole, { data: string | null }];

        if (!active) return;
        let finalRole = role;
        let wasBootstrapped = false;
        if (!orgId) {
          const result = await bootstrapOrgAction(currentUser.id);
          if (!result.ok) {
            logError(result.error, { action: 'bootstrap_org_failed' });
            toast.error('Organization setup failed. Some features may be limited.');
          } else {
            finalRole = await getUserRole(currentUser.id);
            wasBootstrapped = true;
          }
        }
        if (active) {
          setRole(finalRole);
          if (orgId) {
            setOrgId(orgId);
          } else {
            // After bootstrap org was created, re-fetch org id
            const { data: newOrgId } = await supabase.rpc('get_user_org');
            if (newOrgId) {
              setOrgId(newOrgId);
              // Show FeatureWizard for newly bootstrapped orgs
              if (wasBootstrapped) {
                setShowFeatureWizard(true);
              }
            }
          }
          resolveAuth(true);
        }
      } catch (err) {
        if (active) {
          logError(err, { action: 'auth_resolution_failed' });
          toast.error('Unable to verify your role. Some features may be limited.');
          setRole('Employee');
          resolveAuth(true);
        }
      }
    }

    // Wrap in try-catch to handle synchronous Proxy throws from supabase
    // (e.g., if NEXT_PUBLIC_* env vars are missing at build time)
    try {
      supabase.auth.getUser().then(({ data: { user } }) => {
        if (!active) return;
        if (user) {
          resolveUser(user);
        } else {
          resolveAuth(false);
        }
      }).catch(() => {
        if (active) resolveAuth(true);
      });

      const { data: subResult } = supabase.auth.onAuthStateChange((event, session) => {
        if (!active) return;
        if (session?.user) {
          resolveUser(session.user);
        } else {
          setUser(null);
          resolveAuth(false);
        }
      });
      subscription = subResult.subscription;
    } catch (err) {
      if (active) {
        logError(err, { action: 'auth_effect_failed' });
        resolveAuth(true);
        return;
      }
    }

    // Safety timeout — ensures loading screen never persists indefinitely
    // even if all auth flows hang. Extended to 5 seconds for slow networks.
    const safetyTimeout = setTimeout(() => {
      resolveAuth(false);
    }, 5000);

    return () => {
      active = false;
      subscription?.unsubscribe();
      clearTimeout(safetyTimeout);
    };
  }, [hasMounted]);

  const queryClient = useQueryClient();
  const userId = user?.id;

  useEffect(() => {
    if (userId && role) {
      queryClient.prefetchQuery({
        queryKey: ['dashboard_summary', role, userId],
        queryFn: () => getDashboardSummary(role, userId),
        staleTime: 5 * 60 * 1000,
      });
      queryClient.prefetchQuery({
        queryKey: ['daily_spend', userId],
        queryFn: () => getDailySpend(30),
        staleTime: 5 * 60 * 1000,
      });
    }
  }, [userId, role, queryClient]);

  useEffect(() => {
    if (activeTab === 'dashboard') {
      import('@/components/Scanner');
    }
  }, [activeTab]);

  const { data: receipts = [], isLoading: receiptsLoading, refetch: fetchReceipts, isError: receiptsError } = useQuery({
    queryKey: ['receipts', role, userId],
    queryFn: async () => getReceipts(role, userId),
    enabled: !!userId,
    staleTime: 30_000,
    retry: 1,
  });

  const { data: currentPlan } = useQuery({
    queryKey: ['plan'],
    queryFn: getPlan,
    enabled: !!userId,
    staleTime: 60_000,
  });
  const plan = currentPlan || 'free';
  const planLabel = formatPlanLabel(plan);
  const planLoading = false;

  useReceiptRealtimeSync(role, userId);

  const handleSignOut = useCallback(async () => {
    await supabase.auth.signOut();
    setTabWithUrl('dashboard');
    setActiveFilter('all');
  }, [setTabWithUrl]);

  // Global keyboard shortcuts — `aria-keyshortcuts` values documented below
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      const target = e.target as HTMLElement;
      const isInput = target instanceof HTMLInputElement || target instanceof HTMLTextAreaElement || target instanceof HTMLSelectElement;
      const isDrawerContent = !!target.closest('[data-vaul-drawer-content]');
      if (isInput || isDrawerContent) return;

      if (e.key === 's' && !e.metaKey && !e.ctrlKey && !e.altKey) {
        e.preventDefault();
        setTabWithUrl('scan');
      }
      if (e.key === 'r' && !e.metaKey && !e.ctrlKey && !e.altKey) {
        e.preventDefault();
        setTabWithUrl('receipts');
      }
      if (e.key === 'm' && !e.metaKey && !e.ctrlKey && !e.altKey) {
        e.preventDefault();
        setTabWithUrl('mileage');
      }
      if (e.key === 'e' && !e.metaKey && !e.ctrlKey && !e.altKey) {
        e.preventDefault();
        setTabWithUrl('export');
      }
      if (e.key === 'a' && !e.metaKey && !e.ctrlKey && !e.altKey) {
        e.preventDefault();
        setTabWithUrl('audit');
      }
      if (e.key === 'g' && !e.metaKey && !e.ctrlKey && !e.altKey) {
        e.preventDefault();
        setTabWithUrl('reconcile');
      }
      // New feature keyboard shortcuts
      if (e.key === 'f' && !e.metaKey && !e.ctrlKey && !e.altKey) {
        e.preventDefault();
        setTabWithUrl('smart-search');
      }
      if (e.key === 'b' && !e.metaKey && !e.ctrlKey && !e.altKey) {
        e.preventDefault();
        setTabWithUrl('budgets');
      }
      if (e.key === 't' && !e.metaKey && !e.ctrlKey && !e.altKey) {
        e.preventDefault();
        setTabWithUrl('tax-dashboard');
      }
      if (e.key === 'k' && !e.metaKey && !e.ctrlKey && !e.altKey) {
        e.preventDefault();
        setTabWithUrl('kanban-workflow');
      }
      if (e.key === 'i' && !e.metaKey && !e.ctrlKey && !e.altKey) {
        e.preventDefault();
        setTabWithUrl('spending-insights');
      }
    }
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [setTabWithUrl]);

  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX;
    touchStartY.current = e.touches[0].clientY;
  }, []);

  const handleTouchEnd = useCallback((e: React.TouchEvent) => {
    const deltaX = e.changedTouches[0].clientX - touchStartX.current;
    const deltaY = e.changedTouches[0].clientY - touchStartY.current;
    if (Math.abs(deltaX) < 40 || Math.abs(deltaX) < Math.abs(deltaY) * 1.2) return;
    const tabOrder: Tab[] = role === 'Employee' ? EMPLOYEE_TAB_ORDER : FULL_TAB_ORDER;
    const currentIndex = tabOrder.indexOf(activeTab);
    if (currentIndex === -1) return;
    if (deltaX < 0 && currentIndex < tabOrder.length - 1) setTabWithUrl(tabOrder[currentIndex + 1]);
    else if (deltaX > 0 && currentIndex > 0) setTabWithUrl(tabOrder[currentIndex - 1]);
  }, [activeTab, role, setTabWithUrl]);

  if (authLoading || !hasMounted) return <FullPageLoader />;
  if (!user) {
    if (showAuth) return <AuthScreen onBackToLanding={() => setShowAuth(false)} />;
    return <LandingPage onGetStarted={() => setShowAuth(true)} />;
  }

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

    if (receiptsError) {
      return (
        <motion.div
          key="error"
          variants={tabVariants}
          initial="initial"
          animate="animate"
          className="flex flex-col items-center justify-center py-20 text-center"
        >
          <p className="text-sm font-semibold text-danger mb-2">Failed to load your receipts</p>
          <p className="text-xs text-text-muted mb-4">Check your connection and try again.</p>
          <button
            onClick={() => fetchReceipts()}
            className="rounded-lg bg-champagne px-5 py-2 text-xs font-bold text-black hover:bg-champagne-dim transition"
          >
            Retry
          </button>
        </motion.div>
      );
    }

    const inner = (() => {
      switch (activeTab) {
        case 'dashboard':
          return (
            <ErrorBoundary componentName="Dashboard">
              <div id="dashboard-kpis">
                <Dashboard onScan={() => setTabWithUrl('scan')} role={role} userId={userId} />
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
                }}
              />
            </ErrorBoundary>
          );
        case 'mileage':
          return (
            <ErrorBoundary componentName="MileageTracker">
              <MileageTracker />
            </ErrorBoundary>
          );
        case 'time':
          return (
            <ErrorBoundary componentName="TimeClock">
              <div className="space-y-6">
                <TimeClock orgId={orgId ?? ''} />
                <TimeHistory orgId={orgId ?? ''} />
              </div>
            </ErrorBoundary>
          );
        case 'export':
          return (
            <ErrorBoundary componentName="Export">
              <Export receipts={receipts} />
            </ErrorBoundary>
          );
        case 'reconcile':
          return (
            <ErrorBoundary componentName="BankReconciliation">
              <BankReconciliation receipts={receipts} />
            </ErrorBoundary>
          );
        case 'audit':
          return (
            <ErrorBoundary componentName="AuditTrail">
              <AuditTrail />
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
        case 'reports':
          return (
            <ErrorBoundary componentName="ReportsPage">
              <ReportsPage orgId={orgId ?? ''} />
            </ErrorBoundary>
          );
        // === NEW FEATURES (23) ===
        case 'smart-search':
          return <ErrorBoundary componentName="SmartSearch"><SmartSearch /></ErrorBoundary>;
        case 'receipt-calendar':
          return <ErrorBoundary componentName="ReceiptCalendar"><ReceiptCalendar /></ErrorBoundary>;
        case 'receipt-timeline':
          return <ErrorBoundary componentName="ReceiptTimeline"><ReceiptTimeline /></ErrorBoundary>;
        case 'vendor-analytics':
          return <ErrorBoundary componentName="VendorAnalytics"><VendorAnalytics /></ErrorBoundary>;
        case 'budgets':
          return <ErrorBoundary componentName="BudgetManager"><BudgetManager /></ErrorBoundary>;
        case 'tax-dashboard':
          return <ErrorBoundary componentName="TaxDashboard"><TaxDashboard /></ErrorBoundary>;
        case 'cashflow-forecast':
          return <ErrorBoundary componentName="CashFlowForecast"><CashFlowForecast /></ErrorBoundary>;
        case 'multi-currency':
          return <ErrorBoundary componentName="MultiCurrency"><MultiCurrency /></ErrorBoundary>;
        case 'receipt-tags':
          return <ErrorBoundary componentName="ReceiptTags"><ReceiptTags /></ErrorBoundary>;
        case 'batch-operations':
          return <ErrorBoundary componentName="BatchOperations"><BatchOperations /></ErrorBoundary>;
        case 'receipt-comparison':
          return <ErrorBoundary componentName="ReceiptComparison"><ReceiptComparison /></ErrorBoundary>;
        case 'recurring-detector':
          return <ErrorBoundary componentName="RecurringDetector"><RecurringDetector /></ErrorBoundary>;
        case 'kanban-workflow':
          return <ErrorBoundary componentName="KanbanWorkflow"><KanbanWorkflow /></ErrorBoundary>;
        case 'qbo-export':
          return <ErrorBoundary componentName="QBOExport"><QBOExport /></ErrorBoundary>;
        case 'xero-export':
          return <ErrorBoundary componentName="XeroExport"><XeroExport /></ErrorBoundary>;
        case 'export-dashboard':
          return <ErrorBoundary componentName="ExportDashboard"><ExportDashboard /></ErrorBoundary>;
        case 'email-forward':
          return <ErrorBoundary componentName="EmailForwardSetup"><EmailForwardSetup /></ErrorBoundary>;
        case 'readiness-score':
          return <ErrorBoundary componentName="ReadinessScore"><ReadinessScore /></ErrorBoundary>;
        case 'spending-insights':
          return <ErrorBoundary componentName="SpendingInsights"><SpendingInsights /></ErrorBoundary>;
        case 'share-receipt':
          return <ErrorBoundary componentName="ShareReceipt"><ShareReceipt /></ErrorBoundary>;
        case 'payables-dashboard':
          return <ErrorBoundary componentName="PayablesDashboard"><PayablesDashboard /></ErrorBoundary>;
        case 'slack-alerts':
          return <ErrorBoundary componentName="SlackAlerts"><SlackAlerts /></ErrorBoundary>;
        case 'dark-sync':
          return <ErrorBoundary componentName="DarkModeSync"><DarkModeSync /></ErrorBoundary>;
        case 'more':
          return null;
        default:
          return (
            <ErrorBoundary componentName="Dashboard">
              <Dashboard onScan={() => setTabWithUrl('scan')} role={role} userId={userId} />
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
        role="tabpanel"
        aria-label={`${activeTab.replace(/-/g, ' ')} panel`}
        tabIndex={-1}
      >
        {inner}
      </motion.div>
    );
  })();

  return (
    <div className="flex min-h-screen bg-obsidian">
      {/* Desktop sidebar */}
      <ErrorBoundary componentName="Sidebar">
        <Sidebar
          activeTab={activeTab}
          onTabChange={setTabWithUrl}
          role={role}
          planLabel={planLabel}
          plan={plan}
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
        <div
          className="flex-1 overflow-y-auto px-4 pb-28 pt-16 sm:px-6 lg:pb-8 lg:pt-6 xl:px-8 relative"
          onTouchStart={handleTouchStart}
          onTouchEnd={handleTouchEnd}
          aria-label="Main workspace"
          role="region"
        >
          {/* Premium ambient gradient at top */}
          <div className="pointer-events-none absolute inset-x-0 top-0 h-[600px] bg-gradient-to-b from-champagne/10 via-champagne/5 to-transparent" aria-hidden="true" />
          <div className="pointer-events-none absolute -left-32 -top-32 h-64 w-64 rounded-full bg-champagne/8 blur-3xl" aria-hidden="true" />
          <div className="pointer-events-none absolute -right-32 top-64 h-48 w-48 rounded-full bg-champagne/5 blur-3xl" aria-hidden="true" />
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

            {/* Tab content */}
            <AnimatePresence mode="wait">
              {tabContent}
            </AnimatePresence>
          </div>
        </div>

        {/* Mobile bottom nav */}
        <MobileNav activeTab={activeTab} onTabChange={setTabWithUrl} role={role} noReceipts={receipts.length === 0} />

        {/* More slide-out panel */}
        <ErrorBoundary componentName="MoreSheet">
          <Suspense fallback={null}>
            <MoreSheet
              activeTab={activeTab}
              onTabChange={setTabWithUrl}
              onClose={closeMoreMenu}
              planLabel={planLabel}
              plan={plan}
              onSignOut={handleSignOut}
            />
          </Suspense>
        </ErrorBoundary>
      </div>

      {/* Feature configuration wizard for new orgs */}
      {showFeatureWizard && orgId && !featureWizardShown && (
        <FeatureWizard
          orgId={orgId}
          onComplete={() => {
            setShowFeatureWizard(false);
            setFeatureWizardShown(true);
            if (typeof window !== 'undefined') {
              localStorage.setItem('featureWizardDone', 'true');
            }
          }}
          onSkip={() => {
            setShowFeatureWizard(false);
            setFeatureWizardShown(true);
            if (typeof window !== 'undefined') {
              localStorage.setItem('featureWizardDone', 'true');
            }
          }}
        />
      )}

      <OnboardingTour />
    </div>
  );
}

/**
 * Root page — wraps AppContent in Suspense with a full-page loader
 * for nuqs query state hydration and initial data fetching.
 */
export default function Page() {
  return (
    <Suspense fallback={<FullPageLoader />}>
      <AppContent />
    </Suspense>
  );
}
