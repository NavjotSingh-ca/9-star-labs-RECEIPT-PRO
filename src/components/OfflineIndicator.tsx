'use client';

import { useState, useEffect, useRef } from 'react';
import { useNetworkStatus } from '@/hooks/useNetworkStatus';
import { useOfflineQueue } from '@/hooks/useOfflineQueue';
import { WifiOff, CloudUpload } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export default function OfflineIndicator() {
  const { online } = useNetworkStatus();
  const { queueCount } = useOfflineQueue();
  const [showOffline, setShowOffline] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (!online) {
      if (!timerRef.current) {
        timerRef.current = setTimeout(() => setShowOffline(true), 2000);
      }
    } else {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
        timerRef.current = null;
      }
      timerRef.current = setTimeout(() => setShowOffline(false), 0);
    }
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [online]);

  return (
    <AnimatePresence>
      {showOffline ? (
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
          className="fixed left-1/2 top-4 z-[90] flex -translate-x-1/2 items-center gap-2 rounded-full bg-warning/90 px-4 py-2 text-xs font-semibold text-white shadow-xl backdrop-blur-md"
          role="status"
          aria-live="polite"
        >
          <WifiOff className="h-3.5 w-3.5" />
          <span>You are offline. {queueCount > 0 ? `${queueCount} receipts queued.` : 'Changes will sync when connection returns.'}</span>
        </motion.div>
      ) : online && queueCount > 0 ? (
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.9 }}
          className="fixed left-1/2 top-4 z-[90] flex -translate-x-1/2 items-center gap-2 rounded-full bg-champagne/20 px-4 py-2 text-xs font-medium text-champagne shadow-xl backdrop-blur-md ring-1 ring-champagne/30"
          role="status"
          aria-live="polite"
        >
          <CloudUpload className="h-3.5 w-3.5" />
          <span>{queueCount} receipt{queueCount !== 1 ? 's' : ''} pending sync</span>
          <motion.span
            className="inline-block h-1.5 w-1.5 rounded-full bg-champagne"
            animate={{ opacity: [1, 0.3, 1] }}
            transition={{ repeat: Infinity, duration: 2 }}
          />
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
}
