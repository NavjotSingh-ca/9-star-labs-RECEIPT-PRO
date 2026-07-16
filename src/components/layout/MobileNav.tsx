'use client';

import { motion, LayoutGroup } from 'framer-motion';
import {
  LayoutDashboard,
  Camera,
  ReceiptText,
  MoreHorizontal,
} from 'lucide-react';
import type { UserRole } from '@/lib/types';

type Tab = 'dashboard' | 'receipts' | 'scan' | 'export' | 'audit' | 'reconcile' | 'mileage' | 'time' | 'approvals' | 'payables' | 'projects' | 'alerts' | 'reports' | 'more'
  | 'smart-search' | 'receipt-calendar' | 'receipt-timeline' | 'vendor-analytics'
  | 'budgets' | 'tax-dashboard' | 'cashflow-forecast' | 'multi-currency'
  | 'receipt-tags' | 'batch-operations' | 'receipt-comparison' | 'recurring-detector' | 'kanban-workflow'
  | 'qbo-export' | 'xero-export' | 'export-dashboard' | 'email-forward'
  | 'readiness-score' | 'spending-insights' | 'share-receipt' | 'payables-dashboard' | 'slack-alerts' | 'dark-sync';

/**
 * Props for the MobileNav component.
 */
interface MobileNavProps {
  /** Currently active navigation tab */
  activeTab: Tab;
  /** Callback when user navigates to a different tab */
  onTabChange: (tab: Tab) => void;
  /** Current user's role */
  role: UserRole;
  /** When true, the scan FAB pulses to encourage the first receipt scan */
  noReceipts?: boolean;
}

/**
 * Bottom tab navigation bar for mobile/tablet viewports (<1024px).
 * Features 4 tabs: Home, Records, Scan (center FAB), More.
 * The Scan button pulses when no receipts exist to encourage first-time scanning.
 * Supports keyboard navigation with proper focus states.
 */
export default function MobileNav({ activeTab, onTabChange, noReceipts }: MobileNavProps) {
  const navItems: Array<{
    id: Tab;
    label: string;
    icon: React.ReactNode;
    primary?: boolean;
  }> = [
    { id: 'dashboard' as Tab, label: 'Home', icon: <LayoutDashboard className="h-5 w-5" aria-hidden="true" /> },
    { id: 'receipts' as Tab, label: 'Records', icon: <ReceiptText className="h-5 w-5" aria-hidden="true" /> },
    { id: 'scan' as Tab, label: 'Scan receipt', icon: <Camera className="h-6 w-6" aria-hidden="true" />, primary: true },
    { id: 'more' as Tab, label: 'More options', icon: <MoreHorizontal className="h-5 w-5" aria-hidden="true" /> },
  ];

  return (
    <nav
      className="fixed inset-x-0 bottom-0 z-50 border-t border-glass-border bg-surface/80 backdrop-blur-xl bottom-nav lg:hidden"
      role="navigation"
      aria-label="Main navigation"
    >
      <div className="mx-auto flex max-w-6xl items-end justify-around px-2 py-2 sm:px-4">
        <LayoutGroup id="nav">
          {navItems.map((item) => {
            const isActive = activeTab === item.id;

            if (item.primary) {
              return (
                <div key={item.id} className="relative -mt-6 flex flex-col items-center gap-1">
                  <motion.button
                    type="button"
                    id="scan-fab"
                    onClick={() => onTabChange(item.id)}
                    aria-label={item.label}
                    aria-current={isActive ? 'page' : undefined}
                    whileHover={{ scale: 1.06 }}
                    whileTap={{ scale: 0.85 }}
                    animate={noReceipts ? {
                      boxShadow: [
                        '0 4px 14px 0 rgba(16,185,129,0.2)',
                        '0 4px 28px 0 rgba(16,185,129,0.6)',
                        '0 4px 14px 0 rgba(16,185,129,0.2)',
                      ],
                      scale: [1, 1.06, 1],
                    } : {}}
                    transition={noReceipts
                      ? { repeat: Infinity, duration: 2, ease: 'easeInOut' }
                      : { type: 'spring', stiffness: 400, damping: 15 }
                    }
                    className="flex h-14 w-14 items-center justify-center rounded-full shadow-xl shimmer-scan text-white/90 shadow-emerald-success/20 focus:outline-none focus:ring-2 focus:ring-champagne/40"
                  >
                    {item.icon}
                  </motion.button>
                  <span className="text-[10px] font-bold uppercase tracking-[0.16em] text-emerald-light" aria-hidden="true">
                    {item.label}
                  </span>
                </div>
              );
            }

            return (
              <motion.button
                key={item.id}
                type="button"
                onClick={() => onTabChange(item.id)}
                aria-label={item.label}
                aria-current={isActive ? 'page' : undefined}
                whileTap={{ scale: 0.9 }}
                className="flex flex-col items-center gap-0.5 py-1 focus:outline-none focus:ring-2 focus:ring-champagne/40 rounded-xl"
              >
                <div className={`flex h-10 w-10 items-center justify-center rounded-xl transition-colors ${
                  isActive
                    ? 'text-sidebar-accent bg-sidebar-accent/10'
                    : 'text-sidebar-text-muted hover:text-sidebar-text'
                }`} aria-hidden="true">
                  {item.icon}
                </div>
                <span className={`text-[10px] font-semibold transition-colors ${
                  isActive ? 'text-sidebar-accent' : 'text-sidebar-text-muted'
                }`} aria-hidden="true">
                  {item.label}
                </span>
              </motion.button>
            );
          })}
        </LayoutGroup>
      </div>
    </nav>
  );
}
