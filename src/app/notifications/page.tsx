'use client';

import { Suspense } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Loader2 } from 'lucide-react';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import NotificationsPage from '@/components/notifications/NotificationsPage';
import PageHeader from '@/components/layout/PageHeader';

function NotificationsFallback() {
  return (
    <div className="flex min-h-[200px] items-center justify-center" role="status" aria-live="polite" aria-label="Loading notifications">
      <Loader2 className="h-6 w-6 animate-spin text-champagne" />
    </div>
  );
}

/**
 * Notifications page — renders the real-time notification center
 * wrapped in Suspense and ErrorBoundary for resilience.
 */
export default function NotificationsRoute() {
  const router = useRouter();

  return (
    <div className="mx-auto max-w-6xl px-4 py-6 sm:px-6 lg:px-8">
      <div className="mb-4 hidden lg:block">
        <button
          type="button"
          onClick={() => router.back()}
          className="inline-flex items-center gap-1.5 text-xs font-medium text-text-muted hover:text-text-secondary transition"
          aria-label="Go back to previous page"
        >
          <ArrowLeft className="h-3.5 w-3.5" aria-hidden="true" />
          Back
        </button>
      </div>

      <PageHeader
        title="Notifications"
        subtitle="Stay up to date with approvals, team activity, and alerts"
      />

      <div className="mt-6">
        <ErrorBoundary componentName="NotificationsPage">
          <Suspense fallback={<NotificationsFallback />}>
            <NotificationsPage />
          </Suspense>
        </ErrorBoundary>
      </div>
    </div>
  );
}
