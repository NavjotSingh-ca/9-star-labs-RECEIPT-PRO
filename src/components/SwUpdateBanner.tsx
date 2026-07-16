'use client';

import { useEffect, useState } from 'react';
import { RefreshCw, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

/**
 * SwUpdateBanner — Service Worker update notification banner.
 * Detects waiting SW registration and offers "Update" button via SKIP_WAITING postMessage.
 * Auto-reloads on controller change. Dismissible.
 */
export default function SwUpdateBanner() {
  const [waiting, setWaiting] = useState(false);
  const [registration, setRegistration] = useState<ServiceWorkerRegistration | null>(null);

  useEffect(() => {
    if (!('serviceWorker' in navigator)) return;

    const handleControllerChange = () => {
      window.location.reload();
    };

    navigator.serviceWorker.addEventListener('controllerchange', handleControllerChange);

    navigator.serviceWorker.ready.then((reg) => {
      setRegistration(reg);

      if (reg.waiting) {
        setWaiting(true);
        return;
      }

      reg.addEventListener('updatefound', () => {
        const newWorker = reg.installing;
        if (!newWorker) return;

        newWorker.addEventListener('statechange', () => {
          if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
            setWaiting(true);
          }
        });
      });
    });

    return () => {
      navigator.serviceWorker.removeEventListener('controllerchange', handleControllerChange);
    };
  }, []);

  const handleUpdate = () => {
    if (registration?.waiting) {
      registration.waiting.postMessage({ type: 'SKIP_WAITING' });
    }
  };

  const handleDismiss = () => {
    setWaiting(false);
  };

  return (
    <AnimatePresence>
      {waiting && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 20 }}
          className="fixed bottom-20 left-1/2 z-[120] -translate-x-1/2 lg:bottom-6"
        >
          <div className="flex items-center gap-3 rounded-full border border-glass-border bg-surface px-5 py-3 shadow-xl backdrop-blur-md" role="status" aria-live="polite">
            <RefreshCw className="h-4 w-4 shrink-0 text-champagne" />
            <p className="whitespace-nowrap text-sm font-medium text-text-primary">
              A new version is available
            </p>
            <button
              type="button"
              onClick={handleUpdate}
              className="rounded-full bg-champagne px-3 py-1 text-xs font-semibold text-black transition-colors hover:bg-champagne-dim"
            >
              Update
            </button>
            <button
              type="button"
              onClick={handleDismiss}
              className="flex h-6 w-6 items-center justify-center rounded-full text-text-muted hover:text-text-primary"
              title="Dismiss"
              aria-label="Dismiss update notification"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
