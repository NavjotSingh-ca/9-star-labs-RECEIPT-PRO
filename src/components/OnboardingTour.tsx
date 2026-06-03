'use client';

import { useState, useEffect, type ReactNode } from 'react';

export function OnboardingTour() {
  const [show, setShow] = useState(false);

  useEffect(() => {
    const seen = localStorage.getItem('9sl-onboarding-seen');
    if (!seen) {
      const timer = setTimeout(() => setShow(true), 1500);
      return () => clearTimeout(timer);
    }
  }, []);

  const dismiss = () => {
    setShow(false);
    localStorage.setItem('9sl-onboarding-seen', 'true');
  };

  if (!show) return null;

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <div className="relative max-w-sm w-full bg-surface rounded-2xl border border-glass-border shadow-xl p-6 space-y-4">
        <h2 className="text-lg font-bold tracking-tight text-foreground">Welcome to Leduc Receipt Pro</h2>
        <div className="space-y-3 text-sm text-text-secondary">
          <p className="flex items-start gap-2">
            <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-champagne/20 text-[10px] font-bold text-champagne">1</span>
            <span><strong className="text-foreground">Scan a receipt</strong> — Tap the green Scan button to capture any receipt with your camera or upload from gallery.</span>
          </p>
          <p className="flex items-start gap-2">
            <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-champagne/20 text-[10px] font-bold text-champagne">2</span>
            <span><strong className="text-foreground">Review & approve</strong> — AI extracts vendor, amount, and tax for CRA compliance. Review and save.</span>
          </p>
          <p className="flex items-start gap-2">
            <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-champagne/20 text-[10px] font-bold text-champagne">3</span>
            <span><strong className="text-foreground">Export for CRA</strong> — One-click audit package with integrity hashes and GST/HST recovery report.</span>
          </p>
        </div>
        <div className="flex gap-3 pt-2">
          <button
            onClick={dismiss}
            className="flex-1 rounded-xl bg-champagne px-4 py-2.5 text-sm font-bold text-black transition hover:bg-champagne/90"
          >
            Got it, let&apos;s go
          </button>
        </div>
      </div>
    </div>
  );
}
