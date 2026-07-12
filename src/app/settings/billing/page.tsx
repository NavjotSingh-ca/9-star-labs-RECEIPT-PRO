'use client';

import { Crown, CheckCircle2, Shield, ExternalLink, Heart } from 'lucide-react';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import { APP_NAME } from '@/lib/constants';

export default function BillingSettings() {
  return (
    <>
      <div className="mb-6">
        <h1 className="text-xl font-bold tracking-tight text-text-primary">Billing & Licensing</h1>
        <p className="mt-1 text-sm text-text-secondary">{APP_NAME} is open source — all features are free</p>
      </div>

      <ErrorBoundary componentName="BillingSettings">
        <div className="space-y-6">
          {/* Open Source Hero Card */}
          <div className="rounded-[3rem] border border-champagne/20 bg-gradient-to-br from-surface-raised to-champagne/5 p-8 text-center">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-champagne/10">
              <Crown className="h-8 w-8 text-champagne" />
            </div>
            <h2 className="text-2xl font-bold text-text-primary mb-2">All Features Unlocked</h2>
            <p className="text-text-secondary max-w-lg mx-auto mb-6">
              {APP_NAME} is free and open source. There are no paid plans, no feature gates, 
              and no usage limits. Every feature is available to everyone.
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 max-w-2xl mx-auto mb-6">
              {[
                { icon: <CheckCircle2 className="h-4 w-4 text-emerald-light" />, label: 'Unlimited receipts' },
                { icon: <CheckCircle2 className="h-4 w-4 text-emerald-light" />, label: 'Unlimited users' },
                { icon: <CheckCircle2 className="h-4 w-4 text-emerald-light" />, label: 'AI receipt scanning' },
                { icon: <CheckCircle2 className="h-4 w-4 text-emerald-light" />, label: 'QBO & Xero sync' },
                { icon: <CheckCircle2 className="h-4 w-4 text-emerald-light" />, label: 'All exports' },
                { icon: <CheckCircle2 className="h-4 w-4 text-emerald-light" />, label: 'Bank reconciliation' },
                { icon: <CheckCircle2 className="h-4 w-4 text-emerald-light" />, label: 'Approval workflows' },
                { icon: <CheckCircle2 className="h-4 w-4 text-emerald-light" />, label: 'Advanced reports' },
                { icon: <CheckCircle2 className="h-4 w-4 text-emerald-light" />, label: 'Priority support' },
              ].map((item) => (
                <div key={item.label} className="flex items-center gap-2 text-sm text-text-secondary">
                  {item.icon}
                  <span>{item.label}</span>
                </div>
              ))}
            </div>
          </div>

          {/* License Info */}
          <div className="rounded-[3rem] border border-glass-border bg-surface-raised p-6">
            <div className="flex items-center gap-3 mb-4">
              <Shield className="h-5 w-5 text-champagne" />
              <h3 className="font-bold text-text-primary">Open Source License</h3>
            </div>
            <p className="text-sm text-text-secondary mb-4">
              This software is released under the <strong>MIT License with Attribution and Commercial Notification</strong>.
              You are free to use, modify, and share it for any purpose. If you use it in a revenue-generating product,
              you must provide attribution and notify the copyright holder.
            </p>
            <a
              href="https://github.com/NavjotSingh-ca/9-star-labs-RECEIPT-PRO/blob/main/LICENSE"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 rounded-[2rem] border border-glass-border px-4 py-2 text-sm font-semibold text-text-primary transition hover:bg-surface-hover"
            >
              <ExternalLink className="h-4 w-4" />
              View License
            </a>
          </div>

          {/* Self-Hosted Stripe (optional) */}
          <div className="rounded-[3rem] border border-glass-border bg-surface-raised p-6">
            <div className="flex items-center gap-3 mb-4">
              <Heart className="h-5 w-5 text-champagne" />
              <h3 className="font-bold text-text-primary">Support the Project</h3>
            </div>
            <p className="text-sm text-text-secondary mb-4">
              {APP_NAME} is maintained by volunteers. If you find it useful, consider contributing 
              code, reporting bugs, or sponsoring the project.
            </p>
            <div className="flex flex-wrap gap-3">
              <a
                href="https://github.com/NavjotSingh-ca/9-star-labs-RECEIPT-PRO/issues"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 rounded-[2rem] border border-glass-border px-4 py-2 text-sm font-semibold text-text-primary transition hover:bg-surface-hover"
              >
                Report an Issue
              </a>
              <a
                href="https://github.com/NavjotSingh-ca/9-star-labs-RECEIPT-PRO/blob/main/CONTRIBUTING.md"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 rounded-[2rem] bg-champagne px-4 py-2 text-sm font-bold text-black transition hover:bg-champagne/90"
              >
                <ExternalLink className="h-4 w-4" />
                Contribute
              </a>
            </div>
          </div>
        </div>
      </ErrorBoundary>
    </>
  );
}
