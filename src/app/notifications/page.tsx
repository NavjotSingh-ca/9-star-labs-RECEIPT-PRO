'use client';

import { useRouter } from 'next/navigation';
import { ArrowLeft } from 'lucide-react';
import NotificationsPage from '@/components/notifications/NotificationsPage';
import PageHeader from '@/components/layout/PageHeader';

export default function NotificationsRoute() {
  const router = useRouter();

  return (
    <div className="mx-auto max-w-6xl px-4 py-6 sm:px-6 lg:px-8">
      {/* Desktop back button */}
      <div className="mb-4 hidden lg:block">
        <button
          type="button"
          onClick={() => router.back()}
          className="inline-flex items-center gap-1.5 text-xs font-medium text-text-muted hover:text-text-secondary transition"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          Back
        </button>
      </div>

      <PageHeader
        title="Notifications"
        subtitle="Stay up to date with approvals, team activity, and alerts"
      />

      <div className="mt-6">
        <NotificationsPage />
      </div>
    </div>
  );
}
