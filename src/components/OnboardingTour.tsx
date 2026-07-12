'use client';

import { useState, useEffect, useCallback } from 'react';
import { useJoyride } from 'react-joyride';

const steps = [
  {
    target: '#scan-fab',
    content: 'Tap the Scan button to capture any receipt with your camera or upload from gallery.',
    title: 'Scan a receipt',
    placement: 'top' as const,
    disableBeacon: true,
  },
  {
    target: '#dashboard-kpis',
    content: 'Your spending overview, CRA readiness scores, and key metrics live here.',
    title: 'Dashboard overview',
    placement: 'bottom' as const,
  },
  {
    target: '#main-content',
    content: 'AI extracts vendor, amount, and tax automatically. Review and save with one tap.',
    title: 'Review & approve',
    placement: 'center' as const,
  },
];

export function OnboardingTour() {
  const [run, setRun] = useState(false);

  useEffect(() => {
    const seen = localStorage.getItem('9sl-onboarding-seen');
    if (!seen) {
      const timer = setTimeout(() => setRun(true), 2000);
      return () => clearTimeout(timer);
    }
  }, []);

  const handleJoyrideCallback = useCallback((data: { action?: string; type?: string }) => {
    if (data.action === 'close' || data.action === 'skip' || data.type === 'tour_end') {
      localStorage.setItem('9sl-onboarding-seen', 'true');
      setRun(false);
    }
  }, []);

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

  return Tour;
}
