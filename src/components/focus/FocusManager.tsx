/**
 * Focus Management System -- Accessible focus handling
 * Provides focus trapping, restoration, skip links, and keyboard navigation.
 */

'use client';

import { createContext, useContext, useEffect, useCallback, useRef, useState, useMemo } from 'react';
import * as React from 'react';

interface FocusTrapOptions {
  enabled?: boolean;
  onEscape?: () => void;
  onTabOutside?: () => void;
  initialFocus?: React.RefObject<HTMLElement> | 'first' | 'last' | 'container';
  returnFocus?: React.RefObject<HTMLElement> | true;
  preventScroll?: boolean;
}

interface FocusManager {
  trapFocus: (element: HTMLElement, options?: FocusTrapOptions) => () => void;
  restoreFocus: () => void;
  getFocusedElement: () => HTMLElement | null;
  announceToScreenReader: (message: string, priority?: 'polite' | 'assertive') => void;
  registerSkipLink: (id: string, label: string, target: string) => void;
  unregisterSkipLink: (id: string) => void;
}

const FocusManagerContext = createContext<FocusManager | null>(null);

// Module-level mutable refs (not hooks — plain objects)
// These persist across renders and are shared between the provider and SkipLinks component.
const skipLinksRef: { current: Map<string, { label: string; target: string }> } = { current: new Map() };
const lastFocusedRef: { current: HTMLElement | null } = { current: null };
const focusStackRef: { current: Array<{ element: HTMLElement; options: FocusTrapOptions }> } = { current: [] };

export function FocusManagerProvider({ children }: { children: React.ReactNode }) {
  const announceRef = useRef<HTMLDivElement>(null);

  const announceToScreenReader = useCallback((message: string, priority: 'polite' | 'assertive' = 'polite') => {
    if (announceRef.current) {
      announceRef.current.setAttribute('aria-live', priority);
      announceRef.current.textContent = '';
      // Force re-render
      requestAnimationFrame(() => {
        if (announceRef.current) {
          announceRef.current.textContent = message;
        }
      });
    }
}, []);

  const trapFocus = useCallback((element: HTMLElement, options: FocusTrapOptions = {}) => {
    const { 
      enabled = true, 
      onEscape, 
      onTabOutside, 
      initialFocus = 'first', 
      returnFocus = true,
      preventScroll = false 
    } = options;

    if (!enabled) return () => {};

    // Save current focus for restoration
    const previouslyFocused = document.activeElement as HTMLElement;
    if (returnFocus && previouslyFocused && previouslyFocused !== document.body) {
      lastFocusedRef.current = previouslyFocused;
    }

    // Add to focus stack
    focusStackRef.current.push({ element, options });

    // Set initial focus
    const focusableSelector = 'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"]), [contenteditable="true"]';
    const focusableElements = element.querySelectorAll<HTMLElement>(focusableSelector);
    const firstElement = focusableElements[0];
    const lastElement = focusableElements[focusableElements.length - 1];

    const focusTarget = initialFocus === 'first' ? firstElement : 
                       initialFocus === 'last' ? lastElement : 
                       initialFocus === 'container' ? element : 
                       initialFocus.current || firstElement;

    if (focusTarget) {
      focusTarget.focus({ preventScroll });
    }

    // Handle keydown
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && onEscape) {
        e.preventDefault();
        onEscape();
        return;
      }

      if (e.key === 'Tab') {
        const focusedElement = document.activeElement as HTMLElement;
        const isTabForward = !e.shiftKey;
        const isTabBackward = e.shiftKey;

        if (isTabForward && focusedElement === lastElement) {
          e.preventDefault();
          firstElement?.focus({ preventScroll });
          onTabOutside?.();
        } else if (isTabBackward && focusedElement === firstElement) {
          e.preventDefault();
          lastElement?.focus({ preventScroll });
          onTabOutside?.();
        }
      }
    };

    element.addEventListener('keydown', handleKeyDown);

    // Cleanup function
    return () => {
      element.removeEventListener('keydown', handleKeyDown);
      focusStackRef.current.pop();
      
      // Restore focus to previous element
      if (returnFocus && previouslyFocused && previouslyFocused !== document.body) {
        previouslyFocused.focus({ preventScroll });
      }
    };
  }, []);

  const restoreFocus = useCallback(() => {
    if (lastFocusedRef.current) {
      lastFocusedRef.current.focus({ preventScroll: true });
      lastFocusedRef.current = null;
    }
  }, []);

  const getFocusedElement = useCallback(() => document.activeElement as HTMLElement | null, []);

  const registerSkipLink = useCallback((id: string, label: string, target: string) => {
    skipLinksRef.current.set(id, { label, target });
  }, []);

  const unregisterSkipLink = useCallback((id: string) => {
    skipLinksRef.current.delete(id);
  }, []);

  const manager = useMemo<FocusManager>(() => ({
    trapFocus,
    restoreFocus,
    getFocusedElement,
    announceToScreenReader,
    registerSkipLink,
    unregisterSkipLink,
  }), [trapFocus, restoreFocus, getFocusedElement, announceToScreenReader, registerSkipLink, unregisterSkipLink]);

  return (
    <FocusManagerContext.Provider value={manager}>
      <div 
        ref={announceRef} 
        role="status" 
        aria-live="polite" 
        aria-atomic="true" 
        className="sr-only" 
      />
      {children}
    </FocusManagerContext.Provider>
  );
}

export function useFocusManager() {
  const context = useContext(FocusManagerContext);
  if (!context) {
    throw new Error('useFocusManager must be used within FocusManagerProvider');
  }
  return context;
}

/**
 * Hook to trap focus within an element (for modals, drawers, etc.)
 */
export function useFocusTrap(elementRef: React.RefObject<HTMLElement>, options: FocusTrapOptions = {}) {
  const { trapFocus, restoreFocus } = useFocusManager();
  const cleanupRef = useRef<(() => void) | null>(null);

  useEffect(() => {
    if (elementRef.current && options.enabled !== false) {
      cleanupRef.current = trapFocus(elementRef.current, options);
    }
    return () => {
      if (cleanupRef.current) {
        cleanupRef.current();
        restoreFocus();
      }
    };
  }, [elementRef, options, trapFocus, restoreFocus]);
}

/**
 * Hook to create an accessible skip link
 */
export function useSkipLink(targetId: string, label: string) {
  const { registerSkipLink, unregisterSkipLink } = useFocusManager();
  const [skipLinkId] = useState(() => `skip-link-${crypto.randomUUID().slice(0, 7)}`);

  useEffect(() => {
    registerSkipLink(skipLinkId, label, targetId);
    return () => unregisterSkipLink(skipLinkId);
  }, [registerSkipLink, unregisterSkipLink, targetId, label, skipLinkId]);

  const handleClick = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    const target = document.getElementById(targetId);
    if (target) {
      target.focus({ preventScroll: true });
      target.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }, [targetId]);

  return { id: skipLinkId, onClick: handleClick, label };
}

/**
 * Component to render all skip links
 */
export function SkipLinks() {
  const skipLinks = skipLinksRef.current;
  if (skipLinks.size === 0) return null;

  return (
    <div className="skip-links">
      {Array.from(skipLinks.entries()).map(([id, { label, target }]) => (
        <a
          key={id}
          href={`#${target}`}
          className="sr-only focus:not-sr-only focus:fixed focus:top-4 focus:left-4 focus:z-[9999] focus:px-4 focus:py-2 focus:bg-champagne focus:text-black focus:rounded-lg focus:font-semibold focus:shadow-lg focus:outline-none focus:ring-2 focus:ring-champagne/50"
        >
          {label}
        </a>
      ))}
    </div>
  );
}

/**
 * Hook to manage focus on mount/unmount
 */
export function useFocusOnMount(ref: React.RefObject<HTMLElement>, options: { enabled?: boolean; preventScroll?: boolean } = {}) {
  const { enabled = true, preventScroll = false } = options;
  
  useEffect(() => {
    if (enabled && ref.current) {
      ref.current.focus({ preventScroll });
    }
  }, [ref, enabled, preventScroll]);
}

/**
 * Hook to restore focus when component unmounts
 */
export function useRestoreFocus(ref: React.RefObject<HTMLElement>, enabled = true) {
  const previousRef = useRef<HTMLElement | null>(null);
  
  useEffect(() => {
    if (enabled) {
      previousRef.current = document.activeElement as HTMLElement;
    }
    return () => {
      if (enabled && previousRef.current && document.body.contains(previousRef.current)) {
        previousRef.current.focus({ preventScroll: true });
      }
    };
  }, [enabled, ref]);
}

/**
 * Hook to manage focus within a list (arrow key navigation)
 */
export function useListFocus<T>(
  items: T[],
  options: {
    onSelect?: (item: T, index: number) => void;
    getId?: (item: T) => string;
    orientation?: 'horizontal' | 'vertical';
    loop?: boolean;
  } = {}
) {
  const { onSelect, orientation = 'vertical', loop = true } = options;
  const [focusedIndex, setFocusedIndex] = useState(-1);
  const refsRef = useRef<Map<number, React.MutableRefObject<HTMLElement | null>>>(new Map());

  const registerItem = useCallback((index: number) => {
    const ref = { current: null as HTMLElement | null };
    refsRef.current.set(index, ref);
    return ref;
  }, []);

  const handleKeyDown = useCallback((e: React.KeyboardEvent, index: number) => {
    let newIndex = index;
    const isHorizontal = orientation === 'horizontal';
    const nextKey = isHorizontal ? 'ArrowRight' : 'ArrowDown';
    const prevKey = isHorizontal ? 'ArrowLeft' : 'ArrowUp';

    switch (e.key) {
      case nextKey:
        e.preventDefault();
        newIndex = index + 1;
        if (newIndex >= items.length) newIndex = loop ? 0 : items.length - 1;
        break;
      case prevKey:
        e.preventDefault();
        newIndex = index - 1;
        if (newIndex < 0) newIndex = loop ? items.length - 1 : 0;
        break;
      case 'Home':
        e.preventDefault();
        newIndex = 0;
        break;
      case 'End':
        e.preventDefault();
        newIndex = items.length - 1;
        break;
      case 'Enter':
      case ' ':
        e.preventDefault();
        onSelect?.(items[index], index);
        return;
      default:
        return;
    }

    if (newIndex !== index && newIndex >= 0 && newIndex < items.length) {
      setFocusedIndex(newIndex);
      refsRef.current.get(newIndex)?.current?.focus();
    }
  }, [items, onSelect, orientation, loop]);

  return { focusedIndex, setFocusedIndex, registerItem, handleKeyDown };
}