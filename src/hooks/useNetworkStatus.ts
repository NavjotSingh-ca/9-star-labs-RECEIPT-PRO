'use client';

import { useState, useEffect } from 'react';

export function useNetworkStatus(): { online: boolean; since: Date } {
  const [online, setOnline] = useState(typeof navigator !== 'undefined' ? navigator.onLine : true);
  const [since, setSince] = useState(new Date());

  useEffect(() => {
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
