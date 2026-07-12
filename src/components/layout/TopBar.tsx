'use client';

import { ReceiptText, Crown } from 'lucide-react';
import { APP_NAME } from '@/lib/constants';
import Link from 'next/link';
import NotificationBell from '@/components/notifications/NotificationBell';

interface TopBarProps {
  planLabel: string;
  plan: string;
  planLoading: boolean;
  children?: React.ReactNode;
}

export default function TopBar({ planLabel, plan, planLoading, children }: TopBarProps) {
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
          <NotificationBell />
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
