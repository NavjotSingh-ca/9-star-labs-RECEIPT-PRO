'use client';

import React, { useState, useEffect } from 'react';
import { Download, X, Share2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

/**
 * PWAInstaller - Handles Progressive Web App installation
 * Shows install prompt on supported browsers, provides fallback for iOS
 */
export function PWAInstaller() {
  const [installPrompt, setInstallPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [showIOSHint, setShowIOSHint] = useState(false);
  const [isInstalled, setIsInstalled] = useState(() =>
    typeof window !== 'undefined' && window.matchMedia('(display-mode: standalone)').matches
  );
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    // Use microtask to defer state update and avoid lint warning
    const timer = setTimeout(() => {
      if (typeof window !== 'undefined') {
        const isIOS = /iPad|iPhone|iPod/.test(window.navigator.userAgent);
        if (isIOS && !localStorage.getItem('pwa-dismissed')) {
          setShowIOSHint(true);
        }
      }
    }, 0);

    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setInstallPrompt(e as BeforeInstallPromptEvent);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    return () => {
      clearTimeout(timer);
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    };
  }, []);

  const handleInstall = async () => {
    if (installPrompt) {
      await installPrompt.prompt();
      const { outcome } = await installPrompt.userChoice;
      if (outcome === 'accepted') {
        setIsInstalled(true);
      }
    }
  };

  const handleDismiss = () => {
    setDismissed(true);
    localStorage.setItem('pwa-dismissed', 'true');
  };

  if (isInstalled || dismissed) return null;

  // iOS Safari fallback
  if (showIOSHint && !installPrompt) {
    return (
      <AnimatePresence>
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 40 }}
          className="fixed bottom-20 left-4 right-4 z-50 mx-auto max-w-sm lg:bottom-6"
          role="region"
          aria-label="Install app prompt"
        >
          <div className="flex items-start gap-3 rounded-2xl border border-glass-border bg-card p-4 shadow-lg backdrop-blur-xl">
            <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-xl bg-champagne/15" aria-hidden="true">
              <Share2 className="h-4 w-4 text-champagne" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-semibold text-text-primary">Install on iOS</p>
              <p className="text-xs text-text-muted">
                Tap the Share button and select &apos;Add to Home Screen&apos;
              </p>
            </div>
            <button
              type="button"
              onClick={handleDismiss}
              className="flex h-7 w-7 items-center justify-center rounded-full text-text-muted transition hover:bg-surface-hover hover:text-text-primary focus:outline-none focus:ring-2 focus:ring-champagne/40"
              aria-label="Dismiss install hint"
            >
              <X className="h-3.5 w-3.5" aria-hidden="true" />
            </button>
          </div>
        </motion.div>
      </AnimatePresence>
    );
  }

  if (!installPrompt) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: 40 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: 40 }}
        className="fixed bottom-20 left-4 right-4 z-50 mx-auto max-w-sm lg:bottom-6"
        role="region"
        aria-label="Install app prompt"
      >
        <div className="flex items-center gap-3 rounded-2xl border border-glass-border bg-card px-4 py-3 shadow-lg backdrop-blur-xl">
          <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-xl bg-champagne/15" aria-hidden="true">
            <Download className="h-4 w-4 text-champagne" />
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-sm font-semibold text-text-primary">Install Leduc Receipt Pro</p>
            <p className="text-xs text-text-muted">For offline scanning and faster access</p>
          </div>
          <button
            type="button"
            onClick={handleInstall}
            className="rounded-xl bg-champagne px-4 py-2 text-xs font-bold text-obsidian transition hover:bg-champagne-dim focus:outline-none focus:ring-2 focus:ring-champagne/40"
            aria-label="Install app to home screen"
          >
            Install
          </button>
          <button
            type="button"
            onClick={handleDismiss}
            className="flex h-7 w-7 items-center justify-center rounded-full text-text-muted transition hover:bg-surface-hover hover:text-text-primary focus:outline-none focus:ring-2 focus:ring-champagne/40"
            aria-label="Dismiss install prompt"
          >
            <X className="h-3.5 w-3.5" aria-hidden="true" />
          </button>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}