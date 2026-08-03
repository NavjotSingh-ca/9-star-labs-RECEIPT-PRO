'use client';

import { ShieldCheck } from 'lucide-react';
import { ErrorBoundary } from '@/components/ErrorBoundary';

/**
 * Billing settings page — billing/subscriptions were removed.
 * Every account now has full access to every feature at no cost,
 * so this page simply confirms the account's access status.
 */
export default function BillingSettings() {
  return (
    <div className="space-y-8 animate-in fade-in slide-up-from-bottom-4 duration-700">
      <div className="mb-6">
        <h1 className="text-xl font-bold tracking-tight text-text-primary flex items-center gap-2">
          <ShieldCheck className="h-5 w-5 text-champagne" /> Access & Billing
        </h1>
        <p className="mt-1 text-sm text-text-secondary">
          Your account has full access to every feature — no subscription required.
        </p>
      </div>

      <ErrorBoundary componentName="BillingSettings">
        <div className="space-y-8">
          {/* Access Status */}
          <div className="rounded-2xl border border-glass-border bg-surface-raised p-5 animate-in fade-in slide-up-from-bottom-4">
            <div className="flex items-center gap-3 mb-3">
              <ShieldCheck className="h-5 w-5 text-champagne" />
              <h3 className="font-bold text-text-primary">Account Access</h3>
            </div>
            <p className="text-sm text-text-secondary mb-3">
              There are no plans, trials, or payment gates. Unlimited receipt scanning, exports,
              reports, and team members are included for every account and every role.
            </p>
          </div>
        </div>
      </ErrorBoundary>
    </div>
  );
}
