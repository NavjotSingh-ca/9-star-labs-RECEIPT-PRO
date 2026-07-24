'use client';

import { ReceiptText, Crown, Search } from 'lucide-react';
import { APP_NAME } from '@/lib/constants';
import Link from 'next/link';
import NotificationBell from '@/components/notifications/NotificationBell';
import RealtimeStatus from '@/components/layout/RealtimeStatus';
import { useAppStore } from '@/lib/store';
import { useRealtime } from '@/providers/RealtimeProvider';

/**
 * Props for the TopBar component.
 */
interface TopBarProps {
  /** Human-readable plan label (e.g., "Pro", "Free") */
  planLabel: string;
  /** Plan identifier for styling */
  plan: string;
  /** Whether the plan data is still loading */
  planLoading: boolean;
  /** Optional action elements to render on the right side */
  children?: React.ReactNode;
}

/**
 * Top navigation bar for mobile/tablet viewports (<1024px).
 * Shows app logo, plan badge, notification bell, and optional action elements.
 * Has a 2px champagne accent line at the top.
 */
export default function TopBar({ planLabel, plan, planLoading, children }: TopBarProps) {
  const setCommandOpen = useAppStore((s) => s.setCommandOpen);
  const { isConnected } = useRealtime();
  return (
    <header className="fixed inset-x-0 top-0 z-50 border-b border-sidebar-border bg-sidebar-bg lg:hidden relative" role="banner">
      <div className="absolute inset-x-0 top-0 h-0.5 bg-sidebar-accent" />
      <div className="mx-auto flex max-w-6xl items-center justify-between px-3 py-2.5 sm:px-6">
        <div className="flex items-center gap-2 sm:gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-[2rem] bg-sidebar-accent/15">
            <ReceiptText className="h-4 w-4 sm:h-5 sm:w-5 text-sidebar-accent" />
          </div>
          <div>
            <h1 className="text-sm sm:text-base font-bold tracking-tight text-sidebar-text">{APP_NAME}</h1>
            <p className="text-[9px] sm:text-[11px] font-semibold uppercase tracking-[0.18em] text-sidebar-accent">
              CRA-ready records
            </p>
          </div>
        </div>

        <div className="flex items-center gap-1.5 sm:gap-3">
          <button
            type="button"
            onClick={() => setCommandOpen(true)}
            aria-label="Open command palette"
            title="Open command palette (⌘K)"
            className="flex h-9 w-9 items-center justify-center rounded-[2rem] bg-sidebar-surface text-sidebar-text-muted transition hover:bg-sidebar-active hover:text-sidebar-text sm:w-auto sm:gap-2 sm:px-3"
          >
            <Search className="h-4 w-4" />
<kbd className="hidden items-center gap-0.5 text-[10px] font-medium text-sidebar-text-muted sm:flex">
          <span>
            {typeof navigator !== 'undefined' && navigator.platform.toUpperCase().indexOf('MAC') >= 0 ? '⌘' : 'Ctrl'}
          </span>
          <span>+</span>
          <span>K</span>
        </kbd>
          </button>
          <NotificationBell />
          <RealtimeStatus connected={isConnected} />
          {children}

          <Link
            href="/settings/billing"
            className="flex items-center gap-1 sm:gap-1.5 rounded-full border border-sidebar-border bg-sidebar-surface px-2.5 py-1.5 sm:px-3 sm:py-2 text-xs font-semibold transition hover:bg-sidebar-hover"
          >
            <Crown className="h-4 w-4 text-warning" />
            <span className={`${plan === 'pro' || plan === 'enterprise' ? 'text-warning' : 'text-sidebar-text-muted'} hidden sm:inline`}>
              {planLoading ? '...' : planLabel}
            </span>
          </Link>
        </div>
      </div>
    </header>
  );
}
