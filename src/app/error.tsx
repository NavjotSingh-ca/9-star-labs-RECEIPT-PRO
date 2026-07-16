'use client';

import { useEffect } from 'react';
import { logError } from '@/lib/logger';
import { AlertTriangle, RefreshCcw, Home, ChevronDown } from 'lucide-react';
import { motion } from 'framer-motion';

/**
 * Global error boundary page — renders when a React error boundary
 * catches an unhandled error anywhere in the app. Shows error details,
 * stack trace (collapsible), retry button, and navigation home.
 * Error digest (if available) is displayed for support reference.
 */
export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Log the error to an error reporting service
    logError(error, { action: 'global_error_boundary' });
  }, [error]);

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-obsidian p-6 text-center" role="alertdialog" aria-live="assertive" aria-modal="true" aria-label="Application error">
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="max-w-md rounded-[2.5rem] border border-danger/20 bg-danger/[0.03] p-10 shadow-2xl backdrop-blur-xl"
      >
        <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-3xl bg-danger/10 text-danger mb-8">
          <AlertTriangle className="h-10 w-10" aria-hidden="true" />
        </div>
        
        <h1 className="text-2xl font-bold tracking-tight text-text-primary">Something went wrong</h1>
        <p className="mt-4 text-sm leading-relaxed text-text-secondary">
          We encountered a critical error while loading the workspace.
        </p>

        {/* Always show the error message */}
        <div className="mt-6 rounded-[3rem] bg-black/40 p-4 text-left font-mono text-[11px] text-danger border border-danger/10 overflow-x-auto break-words">
          {error.message || 'An unexpected error occurred'}
          {error.digest && (
            <div className="mt-2 text-[10px] text-text-muted/40">Error ID: {error.digest}</div>
          )}
        </div>

        {/* Stack trace behind collapsible */}
        {error.stack && process.env.NODE_ENV === 'development' && (
          <details className="mt-4 w-full rounded-[3rem] bg-black/20 p-4 border border-glass-border">
            <summary className="flex items-center justify-center gap-1 cursor-pointer text-[10px] font-semibold uppercase tracking-wider text-text-muted">
              <ChevronDown className="h-3 w-3" />
              Technical details
            </summary>
            <pre className="mt-3 max-h-40 overflow-auto whitespace-pre-wrap break-words text-[10px] text-danger/60 text-left">
              {error.stack}
            </pre>
          </details>
        )}

        <div className="mt-10 grid grid-cols-2 gap-4">
          <button
            onClick={() => reset()}
            className="flex items-center justify-center gap-2 rounded-[3rem] bg-surface-raised px-4 py-3 text-sm font-bold text-text-primary transition hover:bg-surface-hover focus-visible:outline-2 focus-visible:outline-champagne focus-visible:outline-offset-2"
          >
            <RefreshCcw className="h-4 w-4" />
            Try again
          </button>
          <button
            onClick={() => window.location.href = '/'}
            className="flex items-center justify-center gap-2 rounded-[3rem] bg-champagne px-4 py-3 text-sm font-bold text-black transition hover:opacity-90 focus-visible:outline-2 focus-visible:outline-champagne focus-visible:outline-offset-2"
          >
            <Home className="h-4 w-4" />
            Home
          </button>
        </div>
      </motion.div>
    </div>
  );
}
