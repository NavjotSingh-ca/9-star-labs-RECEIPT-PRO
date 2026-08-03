'use client';

import { Shield, ExternalLink } from 'lucide-react';
import { ErrorBoundary } from '@/components/ErrorBoundary';

/**
 * Billing settings page — displays current subscription status,
 * available pricing plans, and license information.
 * Wraps content in ErrorBoundary for fault tolerance.
 */
export default function BillingSettings() {
  return (
    <div className="space-y-8 animate-in fade-in slide-up-from-bottom-4 duration-700">
      <div className="mb-6">
        <h1 className="text-xl font-bold tracking-tight text-text-primary flex items-center gap-2">
          <Shield className="h-5 w-5 text-champagne" /> Billing & Plans
        </h1>
        <p className="mt-1 text-sm text-text-secondary">
          Choose a plan that fits your needs, or manage your existing subscription.
        </p>
      </div>

      <ErrorBoundary componentName="BillingSettings">
        <div className="space-y-8">
          {/* Current Subscription Status */}
          <div className="rounded-2xl border border-glass-border bg-surface-raised p-5 animate-in fade-in slide-up-from-bottom-4">
            <div className="flex items-center gap-3 mb-3">
              <Shield className="h-5 w-5 text-champagne" />
              <h3 className="font-bold text-text-primary">Subscription Status</h3>
            </div>
            <p className="text-sm text-text-secondary mb-3">
              Billing is currently managed externally. Please contact support for plan changes or billing inquiries.
            </p>
          </div>

          {/* License Info */}
          <div className="rounded-2xl border border-glass-border bg-surface-raised p-5 animate-in fade-in slide-up-from-bottom-4 duration-700 delay-200">
            <div className="flex items-center gap-3 mb-3">
              <Shield className="h-5 w-5 text-champagne" />
              <h3 className="font-bold text-text-primary">License & Legal</h3>
            </div>
            <p className="text-sm text-text-secondary mb-3">
              Leduc Receipt Pro is proprietary software. Usage is subject to the terms of the license agreement.
              All rights reserved.
            </p>
            <a
              href="/LICENSE"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 rounded-xl border border-glass-border px-4 py-2 text-sm font-semibold text-text-primary transition hover:bg-surface-hover"
              aria-label="View license agreement (opens in new tab)"
            >
              <ExternalLink className="h-4 w-4" aria-hidden="true" />
              View License
            </a>
          </div>
        </div>
      </ErrorBoundary>
    </div>
  );
}