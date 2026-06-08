'use client';

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';
import { NuqsAdapter } from 'nuqs/adapters/next/app';
import { useState, useEffect } from 'react';
import { MotionConfig } from 'framer-motion';
import { ThemeProvider } from './ThemeProvider';
import { logWarn } from '@/lib/logger';

export default function Providers({ children }: { children: React.ReactNode }) {
  // Register Service Worker
  useEffect(() => {
    if ('serviceWorker' in navigator) {
      window.addEventListener('load', () => {
        navigator.serviceWorker.register('/sw.js').catch((err) => {
          logWarn('SW registration skipped — offline queuing unavailable: ' + (err?.message || err));
        });
      });
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
            {children}
          </MotionConfig>
        </ThemeProvider>
      </NuqsAdapter>
    </QueryClientProvider>
  );
}
