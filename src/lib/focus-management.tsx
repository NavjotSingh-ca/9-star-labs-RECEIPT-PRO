/**
 * Focus Management — Accessible focus control utilities
 * Provides focus trapping, restoration, and keyboard navigation.
 */

'use client';

import { useEffect, useRef, useCallback, useState } from 'react';

/**
 * Focus trap for modals, drawers, and dialogs
 * Keeps focus within a container element
 */
export function useFocusTrap(
  containerRef: React.RefObject<HTMLElement | null>,
  isActive: boolean,
  options: {
    onEscape?: () => void;
    initialFocus?: 'first' | 'last' | 'none' | HTMLElement;
    returnFocus?: boolean | HTMLElement;
  } = {}
) {
  const onEscape = options.onEscape;
  const initialFocus = options.initialFocus ?? 'first';
  const returnFocusRef = 'returnFocus' in options ? options.returnFocus : undefined;
  const previousActiveElement = useRef<HTMLElement | null>(null);

  useEffect(() => {
    if (!isActive || !containerRef.current) return;

    const container = containerRef.current;
    previousActiveElement.current = document.activeElement as HTMLElement;

    // Get focusable elements
    const getFocusableElements = () => {
      const selector = [
        'button:not([disabled]):not([aria-hidden="true"])',
        'a[href]:not([aria-hidden="true"])',
        'input:not([disabled]):not([aria-hidden="true"])',
        'select:not([disabled]):not([aria-hidden="true"])',
        'textarea:not([disabled]):not([aria-hidden="true"])',
        '[tabindex]:not([tabindex="-1"]):not([aria-hidden="true"])',
        '[contenteditable="true"]:not([aria-hidden="true"])',
      ].join(', ');
      
      return Array.from(container.querySelectorAll<HTMLElement>(selector))
        .filter(el => el.offsetWidth > 0 || el.offsetHeight > 0)
        .sort((a, b) => {
          const tabA = a.tabIndex;
          const tabB = b.tabIndex;
          if (tabA !== tabB) return tabA - tabB;
          return 0;
        });
    };

    const focusableElements = getFocusableElements();
    
    // Set initial focus
    if (focusableElements.length > 0) {
      const target = initialFocus === 'last' 
        ? focusableElements[focusableElements.length - 1]
        : initialFocus instanceof HTMLElement
        ? initialFocus
        : focusableElements[0];
      target?.focus({ preventScroll: true });
    }

    // Handle Tab key
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && onEscape) {
        onEscape();
        return;
      }
      
      if (e.key !== 'Tab') return;
      
      const currentFocusable = getFocusableElements();
      if (currentFocusable.length === 0) return;
      
      const firstElement = currentFocusable[0];
      const lastElement = currentFocusable[currentFocusable.length - 1];
      const activeElement = document.activeElement;
      
      if (e.shiftKey) {
        if (activeElement === firstElement) {
          e.preventDefault();
          lastElement.focus({ preventScroll: true });
        }
      } else {
        if (activeElement === lastElement) {
          e.preventDefault();
          firstElement.focus({ preventScroll: true });
        }
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    
    // Handle escape
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && options.onEscape) {
        options.onEscape();
      }
    };
    document.addEventListener('keydown', handleEscape);

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.removeEventListener('keydown', handleEscape);
      
      // Return focus
      if (returnFocusRef) {
        const target = returnFocusRef === true ? previousActiveElement.current : returnFocusRef;
        target?.focus({ preventScroll: true });
      }
    };
  }, [isActive, containerRef, onEscape, initialFocus, returnFocusRef, options]);
  
  return { containerRef };
}

/**
 * Focus restoration utility
 * Saves and restores focus state
 */
export function useFocusRestoration() {
  const savedFocus = useRef<HTMLElement | null>(null);

  const saveFocus = useCallback(() => {
    savedFocus.current = document.activeElement as HTMLElement;
  }, []);

  const restoreFocus = useCallback((target?: HTMLElement) => {
    (target || savedFocus.current)?.focus({ preventScroll: true });
  }, []);

  return { saveFocus, restoreFocus };
}

/**
 * Skip link component for accessibility
 */
export function SkipLink({ 
  href = '#main-content', 
  children = 'Skip to main content',
  className 
}: { href?: string; children?: string; className?: string }) {
  return (
    <a
      href={href}
      className={`
        sr-only focus:not-sr-only 
        fixed top-4 left-4 z-[9999]
        px-4 py-2 bg-champagne text-black rounded-lg
        font-semibold shadow-lg
        focus:outline-none focus:ring-2 focus:ring-champagne/50
        transition-all duration-200
        ${className || ''}
      `}
    >
      {children}
    </a>
  );
}

/**
 * Focus visible styles utility
 */
export const focusVisibleStyles = `
  &:focus-visible {
    outline: 2px solid var(--champagne);
    outline-offset: 2px;
  }
  &:focus:not(:focus-visible) {
    outline: none;
  }
`;

/**
 * Hook to manage focus within a list/grid
 */
export function useListFocus<T extends HTMLElement>(
  items: T[],
  options: {
    orientation?: 'horizontal' | 'vertical' | 'both';
    loop?: boolean;
    onSelect?: (index: number) => void;
  } = {}
) {
  const { orientation = 'vertical', loop = true, onSelect } = options;
  const [focusedIndex, setFocusedIndex] = useState(-1);
  const refsRef = useRef<Map<number, React.MutableRefObject<T | null>>>(new Map());

  const registerItem = useCallback((index: number) => {
    const ref: React.MutableRefObject<T | null> = { current: null };
    refsRef.current.set(index, ref);
    return ref;
  }, []);

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (!items.length) return;

    let newIndex = focusedIndex;
    const isHorizontal = orientation === 'horizontal' || orientation === 'both';
    const isVertical = orientation === 'vertical' || orientation === 'both';
    const nextKey = isHorizontal ? 'ArrowRight' : 'ArrowDown';
    const prevKey = isHorizontal ? 'ArrowLeft' : 'ArrowUp';

    switch (e.key) {
      case nextKey:
        if (!isHorizontal) return;
        e.preventDefault();
        newIndex = focusedIndex + 1;
        if (newIndex >= items.length) newIndex = loop ? 0 : items.length - 1;
        break;
      case 'ArrowLeft':
        if (!orientation.includes('horizontal')) return;
        e.preventDefault();
        newIndex = focusedIndex - 1;
        if (newIndex < 0) newIndex = loop ? items.length - 1 : 0;
        break;
      case prevKey:
        if (!isVertical) return;
        e.preventDefault();
        newIndex = focusedIndex - 1;
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
        onSelect?.(focusedIndex);
        return;
      default:
        return;
    }

    if (newIndex !== focusedIndex && newIndex >= 0 && newIndex < items.length) {
      setFocusedIndex(newIndex);
      // Focus the element
      const ref = Array.from(refsRef.current.values())[newIndex];
      if (ref?.current) {
        ref.current.focus();
      }
    }
  }, [focusedIndex, items.length, orientation, loop, onSelect]);

  return { focusedIndex, setFocusedIndex, registerItem, handleKeyDown };
}