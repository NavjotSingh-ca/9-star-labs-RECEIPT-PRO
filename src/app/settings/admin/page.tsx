'use client';

import { motion } from 'framer-motion';
import { fadeUp, springGentle } from '@/lib/animations';
import { Suspense } from 'react';
import { Loader2 } from 'lucide-react';
import { AdminDashboard } from '@/components/admin/AdminDashboard';
import { ErrorBoundary } from '@/components/ErrorBoundary';

function AdminFallback() {
  return (
    <div className="flex min-h-[200px] items-center justify-center" role="status" aria-live="polite" aria-label="Loading admin dashboard">
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
    <motion.div
      variants={fadeUp}
      initial="hidden"
      animate="show"
      className="space-y-6"
    >
      <div className="mb-6">
        <h1 className="text-xl font-bold tracking-tight text-text-primary">Admin Dashboard</h1>
        <p className="mt-1 text-sm text-text-secondary">System overview and management tools</p>
      </div>
      <ErrorBoundary componentName="AdminDashboard">
        <Suspense fallback={<AdminFallback />}>
          <AdminDashboard />
        </Suspense>
      </ErrorBoundary>
    </motion.div>
  );
}
