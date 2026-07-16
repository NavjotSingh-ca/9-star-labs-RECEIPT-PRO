'use client';

import { useState, useEffect } from 'react';
import { APP_NAME } from '@/lib/constants';
import { motion, AnimatePresence } from 'framer-motion';
import { Download, X } from 'lucide-react';

interface BeforeInstallPromptEvent extends Event {
  prompt(): Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

/**
 * InstallPrompt — PWA install prompt banner (beforeinstallprompt event).
 * Shows when the browser fires the install event. Triggers the native install dialog.
 * Dismissible with X button.
 */
export default function InstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [show, setShow] = useState(false);

  useEffect(() => {
    const handler = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
      setShow(true);
    };
    window.addEventListener('beforeinstallprompt', handler as EventListener);
    return () => window.removeEventListener('beforeinstallprompt', handler as EventListener);
  }, []);

  const handleInstall = async () => {
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    const result = await deferredPrompt.userChoice;
    if (result?.outcome === 'accepted') setShow(false);
    setDeferredPrompt(null);
  };

  return (
    <AnimatePresence>
      {show && (
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 40 }}
          transition={{ type: 'spring', stiffness: 300, damping: 30 }}
          className="fixed bottom-28 left-4 right-4 z-50 mx-auto max-w-sm lg:bottom-6"
          role="region"
          aria-label="Install app prompt"
        >
          <div className="flex items-center gap-3 rounded-2xl border border-glass-border bg-card px-4 py-3 shadow-lg backdrop-blur-xl">
            <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-xl bg-champagne/15" aria-hidden="true">
              <Download className="h-4 w-4 text-champagne" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-semibold text-text-primary">{APP_NAME} App</p>
              <p className="text-xs text-text-muted">Install for offline scanning and faster access</p>
            </div>
            <button
              type="button"
              onClick={handleInstall}
              className="rounded-xl bg-champagne px-4 py-2 text-xs font-bold text-obsidian transition hover:bg-champagne-dim focus:outline-none focus:ring-2 focus:ring-champagne/40"
            aria-label="Install app to home screen"
            >
              Install
            </button>
            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={() => setShow(false)}
                className="flex h-7 w-7 items-center justify-center rounded-full text-text-muted transition hover:bg-surface-hover hover:text-text-primary focus:outline-none focus:ring-2 focus:ring-champagne/40"
                aria-label="Dismiss install prompt"
              >
                <X className="h-3.5 w-3.5" aria-hidden="true" />
              </button>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
