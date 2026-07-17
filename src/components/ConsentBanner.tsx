'use client';

import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ShieldCheck } from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { supabase } from '@/lib/supabase';

const STORAGE_KEY = '9sl-privacy-consent';

/**
 * ConsentBanner — Privacy notice banner shown on first login (localStorage).
 * Records consent/decline in audit_logs (best-effort). Supports Escape to accept.
 * Discloses AI processing (Gemini) and US-based server storage.
 */
/**
 * Privacy consent banner shown on first login (stored in localStorage).
 * Discloses AI/REST processing for receipt data, cross-border transfer,
 * and links to full Privacy Policy. User must accept or decline before proceeding.
 */
export function ConsentBanner() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const existing = localStorage.getItem(STORAGE_KEY);
    if (!existing) {
      const frame = requestAnimationFrame(() => setVisible(true));
      return () => cancelAnimationFrame(frame);
    }
  }, []);

  const handleAccept = useCallback(async () => {
    localStorage.setItem(STORAGE_KEY, new Date().toISOString());
    setVisible(false);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        await supabase.from('audit_logs').insert({
          user_id: user.id,
          action: 'privacy_consent',
          details: 'Accepted privacy and data processing notice',
        });
      }
    } catch {
      /* Best-effort: consent already recorded in localStorage */
    }
  }, []);

  const handleDecline = async () => {
    localStorage.setItem(STORAGE_KEY, 'declined');
    setVisible(false);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        await supabase.from('audit_logs').insert({
          user_id: user.id,
          action: 'privacy_consent',
          details: 'Declined privacy and data processing notice',
        });
      }
    } catch {
      /* Best-effort: decline already recorded in localStorage */
    }
  };

  useEffect(() => {
    if (!visible) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') handleAccept();
    };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [visible, handleAccept]);

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
          <div           className="rounded-2xl border border-glass-border bg-card p-5 shadow-2xl backdrop-blur-xl"
          aria-live="assertive">
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
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={handleDecline}
                    className="rounded-xl px-4 text-xs font-medium text-text-muted hover:text-text-primary transition-colors"
                  >
                    Decline
                  </Button>
                  <Link
                    href="/privacy"
                    className="text-xs font-medium text-text-muted underline underline-offset-2 hover:text-champagne transition-colors"
                  >
                    Privacy Policy
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
