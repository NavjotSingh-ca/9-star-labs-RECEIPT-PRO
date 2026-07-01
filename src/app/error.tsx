'use client';

import { useEffect } from 'react';
import { logError } from '@/lib/logger';
import { AlertTriangle, RefreshCcw, Home } from 'lucide-react';
import { motion } from 'framer-motion';

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
    <div className="flex min-h-screen flex-col items-center justify-center bg-obsidian p-6 text-center" role="alert" aria-live="assertive">
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="max-w-md rounded-[2.5rem] border border-danger/20 bg-danger/[0.03] p-10 shadow-2xl backdrop-blur-xl"
      >
        <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-3xl bg-danger/10 text-danger mb-8">
          <AlertTriangle className="h-10 w-10" />
        </div>
        
        <h1 className="text-2xl font-bold tracking-tight text-text-primary">Something went wrong</h1>
        <p className="mt-4 text-sm leading-relaxed text-text-secondary">
          We encountered a critical error while loading the workspace. This is often due to a database synchronization issue or a temporary connection failure.
        </p>

        <div className="mt-6 rounded-[3rem] bg-black/40 p-4 text-left font-mono text-[10px] text-danger/80 border border-danger/10 overflow-auto max-h-32">
          {process.env.NODE_ENV === 'development' ? error.message : 'An unexpected error occurred'}
          {error.digest && <div className="mt-2 text-text-muted/20">Digest: {error.digest}</div>}
        </div>

        <div className="mt-10 grid grid-cols-2 gap-4">
          <button
            onClick={() => reset()}
            className="flex items-center justify-center gap-2 rounded-[3rem] bg-surface-raised px-4 py-3 text-sm font-bold text-text-primary transition hover:bg-surface-hover"
          >
            <RefreshCcw className="h-4 w-4" />
            Try again
          </button>
          <button
            onClick={() => window.location.href = '/'}
            className="flex items-center justify-center gap-2 rounded-[3rem] bg-champagne px-4 py-3 text-sm font-bold text-black transition hover:opacity-90"
          >
            <Home className="h-4 w-4" />
            Home
          </button>
        </div>
      </motion.div>
    </div>
  );
}
