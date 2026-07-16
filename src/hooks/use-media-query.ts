'use client';

import { useState, useEffect } from 'react';

/**
 * Tracks whether the document matches a CSS media query string.
 * SSR-safe — returns `false` during server rendering.
 *
 * @param query - A CSS media query string (e.g. `"(min-width: 768px)"`).
 * @returns Whether the document currently matches the query.
 */
export function useMediaQuery(query: string): boolean {
  const [matches, setMatches] = useState(() => {
    if (typeof window !== 'undefined') {
      return window.matchMedia(query).matches;
    }
    return false;
  });

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const mql = window.matchMedia(query);
    const handler = (e: MediaQueryListEvent) => setMatches(e.matches);

    mql.addEventListener('change', handler);
    return () => mql.removeEventListener('change', handler);
  }, [query]);

  return matches;
}
