'use client';

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';
import { NuqsAdapter } from 'nuqs/adapters/next/app';
import { useState, useEffect } from 'react';
import { MotionConfig } from 'framer-motion';
import { ThemeProvider } from './ThemeProvider';
import { RealtimeProvider } from '@/providers/RealtimeProvider';
import { logWarn, logError } from '@/lib/logger';

/**
 * Providers — Root provider composition: React Query (2min stale, 10min gc),
 * nuqs URL state adapter, next-themes ThemeProvider, and Framer Motion reduced-motion config.
 * Registers global unhandled promise rejection handler and Service Worker on load.
 */
export default function Providers({ children }: { children: React.ReactNode }) {
  // Global unhandled promise rejection handler
  useEffect(() => {
    const handler = (event: PromiseRejectionEvent) => {
      logError(event.reason, { action: 'unhandled_promise_rejection' });
    };
    window.addEventListener('unhandledrejection', handler);
    return () => window.removeEventListener('unhandledrejection', handler);
  }, []);

  // Register Service Worker
  useEffect(() => {
    if (!('serviceWorker' in navigator)) return;
    const register = () => {
      navigator.serviceWorker.register('/sw.js').catch((err) => {
        logWarn('SW registration skipped — offline queuing unavailable: ' + (err?.message || err));
      });
    };
    if (document.readyState === 'complete') {
      register();
    } else {
      window.addEventListener('load', register);
      return () => window.removeEventListener('load', register);
    }
  }, []);

  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 1000 * 60 * 2,       // 2 minutes — Supabase Realtime supplements for live updates
            gcTime: 1000 * 60 * 10,          // 10 minutes garbage collection
            retry: 2,
            refetchOnWindowFocus: false,      // Use Supabase Realtime instead of refetch-on-focus
          },
        },
      })
  );

  return (
    <QueryClientProvider client={queryClient}>
      <NuqsAdapter>
        <ReactQueryDevtools initialIsOpen={false} buttonPosition="bottom-left" />
        <ThemeProvider>
          <MotionConfig reducedMotion="user">
            <RealtimeProvider>
              {children}
            </RealtimeProvider>
          </MotionConfig>
        </ThemeProvider>
      </NuqsAdapter>
    </QueryClientProvider>
  );
}
