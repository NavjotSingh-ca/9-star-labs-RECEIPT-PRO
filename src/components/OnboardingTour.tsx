'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { useJoyride } from 'react-joyride';

const STORAGE_KEY = '9sl-onboarding-seen';
const LAUNCH_DELAY = 2000;
const SAFETY_TIMEOUT = 5000;

const steps = [
  {
    target: '#scan-fab',
    content: 'Tap the Scan button to capture any receipt with your camera or upload from gallery.',
    title: 'Scan a receipt',
    placement: 'top' as const,
    disableBeacon: true,
    spotlightClicks: true,
  },
  {
    target: '#dashboard-kpis',
    content: 'Your spending overview, CRA readiness scores, and key metrics live here.',
    title: 'Dashboard overview',
    placement: 'bottom' as const,
    disableBeacon: true,
    spotlightClicks: true,
  },
  {
    target: '[data-tour-step="receipt-list"]',
    content:
      'AI extracts vendor, amount, and tax automatically. Review and save with one tap.',
    title: 'Review & approve',
    placement: 'bottom' as const,
    disableBeacon: true,
    spotlightClicks: true,
    // Don't block the entire screen — user can still navigate sidebar/tabs
    disableOverlay: true,
  },
];

/**
 * OnboardingTour — First-time user tour using react-joyride.
 * Shows 3 steps: scan button, dashboard KPIs, and review flow.
 * Auto-triggers after 2s if localStorage `9sl-onboarding-seen` is not set.
 * Verifies target elements exist before showing. Safety timeout dismisses if elements never appear.
 */
export function OnboardingTour() {
  const [run, setRun] = useState(false);
  const [ready, setReady] = useState(false);
  const safetyRef = useRef<ReturnType<typeof setTimeout>>(undefined);

  useEffect(() => {
    const seen = localStorage.getItem(STORAGE_KEY);
    if (seen === 'true') {
      setReady(true);
      return;
    }

    // Wait for DOM to settle before checking targets
    const launchTimer = setTimeout(() => {
      // Verify at least the first target exists
      const firstTarget = document.querySelector('#scan-fab');
      if (firstTarget) {
        setRun(true);
        setReady(true);
      } else {
        // Retry once after a short delay
        const retry = setTimeout(() => {
          const retryTarget = document.querySelector('#scan-fab');
          if (retryTarget) {
            setRun(true);
          } else {
            // Target never appeared — mark seen so user isn't stuck forever
            localStorage.setItem(STORAGE_KEY, 'true');
          }
          setReady(true);
        }, 1500);
        safetyRef.current = retry;
      }
    }, LAUNCH_DELAY);

    // Safety timeout — if nothing worked, mark seen and move on
    const safetyTimer = setTimeout(() => {
      if (!run) {
        localStorage.setItem(STORAGE_KEY, 'true');
        setReady(true);
      }
    }, SAFETY_TIMEOUT);

    return () => {
      clearTimeout(launchTimer);
      clearTimeout(safetyTimer);
      if (safetyRef.current) clearTimeout(safetyRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleJoyrideCallback = useCallback(
    (data: { action?: string; type?: string }) => {
      if (
        data.action === 'close' ||
        data.action === 'skip' ||
        data.type === 'tour_end'
      ) {
        localStorage.setItem(STORAGE_KEY, 'true');
        setRun(false);
      }
    },
    [setRun],
  );

  const { Tour } = useJoyride({
    steps,
    run,
    onEvent: handleJoyrideCallback,
    continuous: true,
    options: {
      arrowColor: 'var(--surface)',
      backgroundColor: 'var(--surface)',
      overlayColor: 'rgba(0,0,0,0.5)',
      primaryColor: 'var(--champagne)',
      textColor: 'var(--text-secondary)',
      showProgress: true,
      buttons: ['skip', 'back', 'primary'],
    },
    locale: {
      last: 'Done',
      skip: 'Skip tour',
      next: 'Next',
      back: 'Back',
    },
  });

  // Return null if tour already seen
  if (ready && !run) return null;

  return Tour;
}
