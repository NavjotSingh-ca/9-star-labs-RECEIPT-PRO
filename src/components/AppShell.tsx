'use client';

import { useCallback, useEffect, useRef, useState, Suspense } from 'react';
import { useReceiptRealtimeSync } from '@/hooks/useReceiptRealtimeSync';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useQueryState, parseAsStringEnum } from 'nuqs';
import { toast } from 'sonner';
import { motion, AnimatePresence } from 'framer-motion';

import { OnboardingTour } from '@/components/OnboardingTour';
import FeatureWizard from '@/components/onboarding/FeatureWizard';
import { ThemeToggle } from '@/components/ThemeToggle';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import Sidebar from '@/components/layout/Sidebar';
import MobileNav from '@/components/layout/MobileNav';
import TopBar from '@/components/layout/TopBar';
import MoreSheet from '@/components/layout/MoreSheet';
import type { UserRole } from '@/lib/types';
import type { User } from '@supabase/supabase-js';
import { getReceipts, getDashboardSummary, getDailySpend } from '@/lib/services/receipts';
import { getPlan, formatPlanLabel } from '@/lib/services/subscription';
import { TabContent, AuditHUD, tabTransition, type Tab } from '@/components/tab-content';

const FULL_TAB_ORDER: Tab[] = [
  'dashboard', 'receipts', 'scan', 'mileage', 'time', 'export', 'reconcile',
  'approvals', 'payables', 'projects', 'audit', 'alerts', 'reports',
  'smart-search', 'receipt-calendar', 'receipt-timeline', 'vendor-analytics',
  'budgets', 'tax-dashboard', 'cashflow-forecast', 'multi-currency',
  'receipt-tags', 'batch-operations', 'receipt-comparison', 'recurring-detector', 'kanban-workflow',
  'qbo-export', 'xero-export', 'export-dashboard', 'email-forward',
  'readiness-score', 'spending-insights', 'share-receipt', 'payables-dashboard', 'slack-alerts', 'dark-sync', 'more',
];

const EMPLOYEE_TAB_ORDER: Tab[] = [
  'receipts', 'scan', 'mileage', 'time', 'smart-search', 'receipt-calendar',
  'receipt-timeline', 'vendor-analytics', 'receipt-tags', 'share-receipt', 'more',
];

export interface AppShellProps {
  user: User;
  role: UserRole;
  orgId: string | null;
  handleSignOut: () => Promise<void>;
}

export default function AppShell({ user, role, orgId, handleSignOut }: AppShellProps) {
  const userId = user.id;
  const [activeFilter] = useState<string>('all');
  const touchStartX = useRef<number>(0);
  const touchStartY = useRef<number>(0);
  const [showFeatureWizard, setShowFeatureWizard] = useState(false);
  const [featureWizardShown, setFeatureWizardShown] = useState(() => {
    if (typeof window === 'undefined') return false;
    return localStorage.getItem('featureWizardDone') === 'true';
  });

  const [activeTab, setActiveTab] = useQueryState('tab', parseAsStringEnum<Tab>([
    'dashboard', 'receipts', 'scan', 'export', 'audit', 'reconcile', 'mileage', 'time',
    'approvals', 'payables', 'projects', 'alerts', 'reports', 'more',
    'smart-search', 'receipt-calendar', 'receipt-timeline', 'vendor-analytics',
    'budgets', 'tax-dashboard', 'cashflow-forecast', 'multi-currency',
    'receipt-tags', 'batch-operations', 'receipt-comparison', 'recurring-detector', 'kanban-workflow',
    'qbo-export', 'xero-export', 'export-dashboard', 'email-forward',
    'readiness-score', 'spending-insights', 'share-receipt', 'payables-dashboard', 'slack-alerts', 'dark-sync',
  ]).withDefault('dashboard'));

  const setTabWithUrl = useCallback((tab: Tab) => {
    if (typeof window === 'undefined') return;
    setActiveTab(tab);
  }, [setActiveTab]);

  const closeMoreMenu = useCallback(() => {
    const fallback: Tab = role === 'Employee' ? 'scan' : 'dashboard';
    setTabWithUrl(fallback);
  }, [role, setTabWithUrl]);

  useEffect(() => {
    if (role === 'Employee') {
      if (!(EMPLOYEE_TAB_ORDER as readonly Tab[]).includes(activeTab)) {
        toast.error('This feature is not available for your role.');
      }
    }
  }, [role, activeTab]);

  const queryClient = useQueryClient();

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

  const tabContent = (
    <TabContent
      activeTab={activeTab}
      receipts={receipts}
      role={role}
      userId={userId}
      orgId={orgId ?? ''}
      activeFilter={activeFilter}
      fetchReceipts={fetchReceipts}
      setTabWithUrl={setTabWithUrl}
      user={user}
      receiptsLoading={receiptsLoading}
      receiptsError={receiptsError}
    />
  );

  return (
    <div className="flex min-h-screen bg-obsidian">
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

      <div className="flex flex-1 flex-col min-w-0">
        <TopBar planLabel={planLabel} plan={plan} planLoading={planLoading}>
          <ThemeToggle />
        </TopBar>

        <div
          className="flex-1 overflow-y-auto px-4 pb-[calc(4rem+env(safe-area-inset-bottom))] pt-16 sm:px-6 lg:pb-8 lg:pt-6 xl:px-8 relative max-w-full overflow-x-hidden"
          onTouchStart={handleTouchStart}
          onTouchEnd={handleTouchEnd}
          aria-label="Main workspace"
          role="region"
        >
          {/* Ambient gradients — hidden on small mobile to prevent overflow */}
          <div className="pointer-events-none absolute inset-x-0 top-0 h-[300px] sm:h-[600px] bg-gradient-to-b from-champagne/10 via-champagne/5 to-transparent" aria-hidden="true" />
          <div className="pointer-events-none absolute -left-16 -top-16 h-40 w-40 sm:-left-32 sm:-top-32 sm:h-64 sm:w-64 rounded-full bg-champagne/8 blur-3xl" aria-hidden="true" />
          <div className="hidden sm:block pointer-events-none absolute -right-32 top-64 h-48 w-48 rounded-full bg-champagne/5 blur-3xl" aria-hidden="true" />
          <div className="mx-auto w-full max-w-6xl relative">
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

            <AnimatePresence mode="wait">
              {tabContent}
            </AnimatePresence>
          </div>
        </div>

        <MobileNav activeTab={activeTab} onTabChange={setTabWithUrl} role={role} noReceipts={receipts.length === 0} />

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
