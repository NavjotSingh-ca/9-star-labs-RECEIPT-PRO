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
            <div className="h-6 w-3/4 bg-surface-raised rounded animate-pulse" />
            <div className="h-4 w-1/2 bg-surface-raised rounded animate-pulse" />
            <div className="h-32 bg-surface-raised rounded animate-pulse" />
          </div>
        )
      }
    >
      {children}
    </Suspense>
  );
}