'use client';

import React, { Suspense, ReactNode } from 'react';

interface SuspenseBoundaryProps {
  children: ReactNode;
  fallback?: ReactNode;
}

/**
 * SuspenseBoundary - Clean loading states with skeleton screens
 * Improves perceived performance
 */
export default function SuspenseBoundary({ children, fallback }: SuspenseBoundaryProps) {
  return (
    <Suspense
      fallback={
        fallback ?? (
          <div className="space-y-4" aria-live="polite" aria-label="Loading content">
            <div className="skeleton skeleton-xl" />
            <div className="skeleton skeleton-md" />
            <div className="skeleton skeleton-card" />
          </div>
        )
      }
    >
      {children}
    </Suspense>
  );
}