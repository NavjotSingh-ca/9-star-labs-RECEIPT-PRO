/**
 * Keyboard Shortcuts Manager - Centralized shortcut handling
 * Supports global shortcuts and context-aware actions
 */

import { useEffect, useCallback } from 'react';

export interface Shortcut {
  key: string;
  ctrl?: boolean;
  shift?: boolean;
  alt?: boolean;
  action: () => void;
  description: string;
}

const shortcuts: Shortcut[] = [
  { key: 's', ctrl: true, action: () => {}, description: 'Go to scanner' },
  { key: 'r', ctrl: true, action: () => {}, description: 'Go to receipts' },
  { key: 'b', ctrl: true, action: () => {}, description: 'Go to budgets' },
  { key: 'e', ctrl: true, action: () => {}, description: 'Go to export' },
  { key: 'f', ctrl: true, action: () => {}, description: 'Go to search' },
  { key: '?', action: () => {}, description: 'Show keyboard shortcuts' },
  { key: 'Escape', action: () => {}, description: 'Close modal/overlay' },
  { key: 'Enter', ctrl: true, action: () => {}, description: 'Save current form' },
];

/**
 * Hook to register global keyboard shortcuts
 */
export function useKeyboardShortcuts(customShortcuts: Shortcut[] = []) {
  // eslint-disable-next-line react-hooks/exhaustive-deps -- shortcuts are stable
  const allShortcuts = [...shortcuts, ...customShortcuts];

  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      const matching = allShortcuts.find(s => {
        const keyMatch = s.key.toLowerCase() === e.key.toLowerCase();
        const ctrlMatch = (s.ctrl ?? false) === (e.ctrlKey || e.metaKey);
        const shiftMatch = (s.shift ?? false) === e.shiftKey;
        const altMatch = (s.alt ?? false) === e.altKey;
        return keyMatch && ctrlMatch && shiftMatch && altMatch;
      });

      if (matching) {
        e.preventDefault();
        matching.action();
      }
    },
    [allShortcuts]
  );

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);

  return allShortcuts;
}

export function getShortcutDisplay(shortcut: Shortcut): string {
  const parts: string[] = [];
  if (shortcut.ctrl) parts.push('Ctrl');
  if (shortcut.shift) parts.push('Shift');
  if (shortcut.alt) parts.push('Alt');
  parts.push(shortcut.key === 'Escape' ? 'Esc' : shortcut.key.toUpperCase());
  return parts.join(' + ');
}