'use client';

import { useMemo } from 'react';
import { Loader2, TrendingUp } from 'lucide-react';
import { motion } from 'framer-motion';
import { springGentle } from '@/lib/animations';

import dynamic from 'next/dynamic';
import {
  DashboardSkeleton,
  ReceiptTableSkeleton,
  ScannerSkeleton,
} from '@/components/ui/PremiumSkeletons';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import type { ReceiptRow, UserRole } from '@/lib/types';
import type { User } from '@supabase/supabase-js';

const Dashboard = dynamic(() => import('@/components/Dashboard'), {
  ssr: false,
  loading: () => <DashboardSkeleton />,
});
const History = dynamic(() => import('@/components/History'), {
  ssr: false,
  loading: () => <ReceiptTableSkeleton />,
});
const Scanner = dynamic(() => import('@/components/Scanner'), {
  ssr: false,
  loading: () => <ScannerSkeleton />,
});
const MileageTracker = dynamic(() => import('@/components/MileageTracker'), {
  ssr: false,
  loading: () => <ReceiptTableSkeleton />,
});
const Export = dynamic(() => import('@/components/Export'), {
  ssr: false,
  loading: () => <ReceiptTableSkeleton />,
});
const BankReconciliation = dynamic(() => import('@/components/BankReconciliation'), {
  ssr: false,
  loading: () => <ReceiptTableSkeleton />,
});
const AuditTrail = dynamic(() => import('@/components/AuditTrail'), {
  ssr: false,
  loading: () => <ReceiptTableSkeleton />,
});
const ApprovalsQueue = dynamic(() => import('@/components/ApprovalsQueue'), {
  ssr: false,
  loading: () => <ReceiptTableSkeleton />,
});
const ReimbursementsPanel = dynamic(() => import('@/components/ReimbursementsPanel'), {
  ssr: false,
  loading: () => <ReceiptTableSkeleton />,
});
const ProjectManager = dynamic(() => import('@/components/ProjectManager'), {
  ssr: false,
  loading: () => <ReceiptTableSkeleton />,
});
const AnomalyDashboard = dynamic(() => import('@/components/AnomalyDashboard'), {
  ssr: false,
  loading: () => <ReceiptTableSkeleton />,
});
const ReportsPage = dynamic(() => import('@/components/reports/ReportsPage').then((m) => m.ReportsPage), {
  ssr: false,
  loading: () => <ReceiptTableSkeleton />,
});

// Time Tracking
const TimeClock = dynamic(() => import('@/components/time/TimeClock'), {
  ssr: false,
  loading: () => <ReceiptTableSkeleton />,
});
const TimeHistory = dynamic(() => import('@/components/time/TimeHistory'), {
  ssr: false,
  loading: () => <ReceiptTableSkeleton />,
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

export type Tab =
  | 'dashboard' | 'receipts' | 'scan' | 'export' | 'audit' | 'reconcile' | 'mileage' | 'time' | 'approvals' | 'payables' | 'projects' | 'alerts' | 'reports' | 'more'
  | 'smart-search' | 'receipt-calendar' | 'receipt-timeline' | 'vendor-analytics'
  | 'budgets' | 'tax-dashboard' | 'cashflow-forecast' | 'multi-currency'
  | 'receipt-tags' | 'batch-operations' | 'receipt-comparison' | 'recurring-detector' | 'kanban-workflow'
  | 'qbo-export' | 'xero-export' | 'export-dashboard' | 'email-forward'
  | 'readiness-score' | 'spending-insights' | 'share-receipt' | 'payables-dashboard' | 'slack-alerts' | 'dark-sync';

const cad = new Intl.NumberFormat('en-CA', {
  style: 'currency',
  currency: 'CAD',
  maximumFractionDigits: 2,
});

export const tabTransition = springGentle;

const tabVariants = {
  initial: { opacity: 0, y: 16, scale: 0.98 },
  animate: { opacity: 1, y: 0, scale: 1, transition: springGentle },
  exit: { opacity: 0, y: -8, scale: 0.98, transition: { duration: 0.15, ease: 'easeIn' as const } },
};

export function AuditHUD({ receipts }: { receipts: ReceiptRow[] }) {
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

export interface TabContentProps {
  activeTab: Tab;
  receipts: ReceiptRow[];
  role: UserRole;
  userId?: string;
  orgId: string;
  activeFilter: string;
  fetchReceipts: () => void;
  setTabWithUrl: (tab: Tab) => void;
  user: User | null;
  receiptsLoading: boolean;
  receiptsError: boolean;
}

export function TabContent({
  activeTab,
  receipts,
  role,
  userId,
  orgId,
  activeFilter,
  fetchReceipts,
  setTabWithUrl,
  user,
  receiptsLoading,
  receiptsError,
}: TabContentProps) {
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
              <TimeClock orgId={orgId} />
              <TimeHistory orgId={orgId} />
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
            <ReportsPage orgId={orgId} />
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
      className="max-w-full overflow-x-hidden"
    >
      {inner}
    </motion.div>
  );
}
