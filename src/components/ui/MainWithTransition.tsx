'use client';

import { type ReactNode } from 'react';
import { PageTransition } from '@/components/ui/PageTransition';

/**
 * Client wrapper that provides animated route transitions for the main content area.
 * Replaces the plain `<main>` tag in layout.tsx.
 */
export function MainWithTransition({ children }: { children: ReactNode }) {
  return (
    <main id="main-content" tabIndex={-1} className="outline-none">
      <PageTransition>{children}</PageTransition>
    </main>
  );
}
