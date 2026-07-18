'use client';

import { Suspense } from 'react';
import { Loader2 } from 'lucide-react';
import { AdminDashboard } from '@/components/admin/AdminDashboard';
import { ErrorBoundary } from '@/components/ErrorBoundary';

function AdminFallback() {
  return (
    <div className="flex min-h-[200px] items-center justify-center animate-in fade-in duration-500" role="status" aria-live="polite" aria-label="Loading admin dashboard">
      <Loader2 className="h-6 w-6 animate-spin text-champagne" />
    </div>
  );
}

/**
 * Admin settings page — system overview and management tools.
 * Wraps AdminDashboard in ErrorBoundary and Suspense for resilience.
 */
export default function AdminSettingsPage() {
  return (
    <div className="space-y-6 animate-in fade-in slide-up-from-bottom-4 duration-700">
      <div className="mb-6">
        <h1 className="text-xl font-bold tracking-tight text-text-primary flex items-center gap-2">
          <Loader2 className="h-5 w-5 text-champagne" /> Admin Dashboard
        </h1>
        <p className="mt-1 text-sm text-text-secondary">System overview and management tools</p>
      </div>
      <ErrorBoundary componentName="AdminDashboard">
        <Suspense fallback={<AdminFallback />}>
          <AdminDashboard />
        </Suspense>
      </ErrorBoundary>
    </div>
  );
}