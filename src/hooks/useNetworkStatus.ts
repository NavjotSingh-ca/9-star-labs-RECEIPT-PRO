'use client';

import { useState, useEffect } from 'react';

/**
 * Tracks browser online/offline status and the timestamp of the last transition.
 * SSR-safe — defaults to `{ online: true, since: new Date() }` when `navigator` is unavailable.
 */
export function useNetworkStatus(): { online: boolean; since: Date } {
  const [online, setOnline] = useState(
    typeof navigator !== 'undefined' ? navigator.onLine : true,
  );
  const [since, setSince] = useState(new Date());

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const handleOnline = () => {
      setOnline(true);
      setSince(new Date());
    };
    const handleOffline = () => {
      setOnline(false);
      setSince(new Date());
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  return { online, since };
}
