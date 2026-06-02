'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ShieldCheck, X } from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';

const STORAGE_KEY = '9sl-privacy-consent';

export function ConsentBanner() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const existing = localStorage.getItem(STORAGE_KEY);
    if (!existing) setVisible(true);
  }, []);

  const handleAccept = () => {
    localStorage.setItem(STORAGE_KEY, new Date().toISOString());
    setVisible(false);
  };

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          initial={{ opacity: 0, y: 50, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 50, scale: 0.95 }}
          transition={{ duration: 0.3, ease: 'easeOut' }}
          className="fixed bottom-6 left-4 right-4 z-[200] mx-auto max-w-lg"
        >
          <div className="rounded-2xl border border-white/10 bg-card p-5 shadow-2xl backdrop-blur-xl">
            <div className="flex items-start gap-3">
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-champagne/15">
                <ShieldCheck className="h-4 w-4 text-champagne" />
              </div>
              <div className="flex-1 space-y-2.5">
                <p className="text-sm font-semibold text-text-primary">Privacy & Data Processing Notice</p>
                <p className="text-xs leading-relaxed text-text-secondary">
                  Receipt images you upload may be processed by AI services (including{' '}
                  <span className="font-medium text-text-primary">Google Gemini</span>)
                  and stored on <span className="font-medium text-text-primary">US-based servers</span>.
                  Your data is encrypted, never used for training, and retained in accordance with
                  CRA record-keeping requirements.
                </p>
                <div className="flex items-center gap-3 pt-1">
                  <Button
                    size="sm"
                    onClick={handleAccept}
                    className="rounded-xl bg-champagne px-5 text-xs font-bold text-black hover:opacity-90 transition-opacity"
                  >
                    I Understand
                  </Button>
                  <Link
                    href="/privacy"
                    className="text-xs font-medium text-text-muted underline underline-offset-2 hover:text-champagne transition-colors"
                  >
                    Privacy Policy
                  </Link>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setVisible(false)}
                className="shrink-0 text-text-muted hover:text-text-secondary transition-colors"
                aria-label="Dismiss"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
