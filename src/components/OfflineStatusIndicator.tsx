'use client';

import React from 'react';
import { Wifi, WifiOff, RefreshCw } from 'lucide-react';
import { motion } from 'framer-motion';
import { useOfflineMode } from '@/hooks/useOfflineMode';

/**
 * OfflineStatusIndicator - Shows connectivity status and sync progress
 * Integrates with useOfflineMode for real-time offline state
 */
export function OfflineStatusIndicator() {
  const { isOnline, pendingCount, isSyncing, sync } = useOfflineMode();

  return (
    <div className="flex items-center gap-2">
      {isOnline ? (
        <div className="flex items-center gap-1.5 text-xs text-emerald-light" aria-label="Online">
          <Wifi className="h-3.5 w-3.5" />
          <span className="sr-only">Online</span>
        </div>
      ) : (
        <div className="flex items-center gap-1.5 text-xs text-warning" aria-label="Offline">
          <WifiOff className="h-3.5 w-3.5" />
          <span>Offline</span>
        </div>
      )}

      {pendingCount > 0 && (
        <motion.button
          whileTap={{ scale: 0.95 }}
          onClick={() => sync()}
          disabled={isSyncing}
          className="flex items-center gap-1.5 text-xs text-text-secondary hover:text-text-primary transition disabled:opacity-50"
          aria-label={`${pendingCount} pending sync. Click to sync now.`}
        >
          <RefreshCw className={`h-3 w-3 ${isSyncing ? 'animate-spin' : ''}`} aria-hidden="true" />
          <span>{pendingCount}</span>
        </motion.button>
      )}
    </div>
  );
}