'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Download, X } from 'lucide-react';

export default function InstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState<Event | null>(null);
  const [show, setShow] = useState(false);

  useEffect(() => {
    const handler = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e);
      setShow(true);
    };
    window.addEventListener('beforeinstallprompt', handler);
    return () => window.removeEventListener('beforeinstallprompt', handler);
  }, []);

  const handleInstall = async () => {
    if (!deferredPrompt) return;
    (deferredPrompt as any).prompt();
    const result = await (deferredPrompt as any).userChoice;
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
        >
          <div className="flex items-center gap-3 rounded-2xl border border-glass-border bg-card px-4 py-3 shadow-lg backdrop-blur-xl">
            <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-xl bg-champagne/15">
              <Download className="h-4 w-4 text-champagne" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-semibold text-text-primary">Install 9 Star Labs</p>
              <p className="text-xs text-text-muted">Add to your home screen for quick access</p>
            </div>
            <button
              type="button"
              onClick={handleInstall}
              className="rounded-xl bg-champagne px-4 py-2 text-xs font-bold text-obsidian transition hover:bg-champagne-dim"
            >
              Install
            </button>
            <button
              type="button"
              onClick={() => setShow(false)}
              className="flex h-7 w-7 items-center justify-center rounded-full text-text-muted transition hover:bg-surface-hover hover:text-text-primary"
              aria-label="Dismiss"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
