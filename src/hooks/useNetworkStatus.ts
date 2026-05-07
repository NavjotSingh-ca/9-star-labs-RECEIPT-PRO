'use client';

import { useState, useEffect } from 'react';

export function useNetworkStatus(): { online: boolean; since: Date } {
  const [online, setOnline] = useState(true);
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

    setOnline(navigator.onLine);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  return { online, since };
}
