'use client';

import { useNetworkStatus } from '@/hooks/useNetworkStatus';
import { Wifi, WifiOff } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export default function OfflineIndicator() {
  const { online } = useNetworkStatus();

  return (
    <AnimatePresence>
      {!online && (
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
          className="fixed left-1/2 top-4 z-[90] flex -translate-x-1/2 items-center gap-2 rounded-full bg-amber-500/90 px-4 py-2 text-xs font-semibold text-white shadow-xl backdrop-blur-md"
          role="status"
          aria-live="polite"
        >
          <WifiOff className="h-3.5 w-3.5" />
          <span>You are offline. Changes will sync when connection returns.</span>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
