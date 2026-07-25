/**
 * Keyboard Shortcuts Registry — Global shortcut manager
 * Centralized registry for all keyboard shortcuts with conflict detection.
 */

import { useEffect, useMemo } from 'react';

export interface KeyboardShortcut {
  id: string;
  key: string;
  ctrl?: boolean;
  meta?: boolean;
  shift?: boolean;
  alt?: boolean;
  description: string;
  section: string;
  action: () => void;
  global?: boolean; // true = works even in inputs
}

interface ShortcutRegistry {
  shortcuts: Map<string, KeyboardShortcut>;
  register: (shortcut: KeyboardShortcut) => () => void;
  unregister: (id: string) => void;
  getAll: () => KeyboardShortcut[];
  getBySection: (section: string) => KeyboardShortcut[];
}

// Global registry
const registry: ShortcutRegistry = {
  shortcuts: new Map(),
  register: (shortcut) => {
    const key = makeKey(shortcut);
    if (registry.shortcuts.has(key)) {
      console.warn(`Shortcut conflict: ${key} already registered`);
    }
    registry.shortcuts.set(key, shortcut);
    return () => registry.unregister(shortcut.id);
  },
  unregister: (id) => {
    for (const [key, shortcut] of registry.shortcuts) {
      if (shortcut.id === id) {
        registry.shortcuts.delete(key);
        break;
      }
    }
  },
  getAll: () => Array.from(registry.shortcuts.values()),
  getBySection: (section) => Array.from(registry.shortcuts.values()).filter(s => s.section === section),
};

let shortcutIdCounter = 0;

function nextShortcutId(): number {
  return ++shortcutIdCounter;
}

function makeKey(shortcut: KeyboardShortcut): string {
  return [
    shortcut.ctrl ? 'ctrl' : '',
    shortcut.meta ? 'meta' : '',
    shortcut.shift ? 'shift' : '',
    shortcut.alt ? 'alt' : '',
    shortcut.key.toLowerCase()
  ].filter(Boolean).join('+');
}

export function registerShortcut(shortcut: KeyboardShortcut): () => void {
  return registry.register(shortcut);
}

export function unregisterShortcut(id: string): void {
  registry.unregister(id);
}

export function getAllShortcuts(): KeyboardShortcut[] {
  return registry.getAll();
}

export function getShortcutsBySection(section: string): KeyboardShortcut[] {
  return registry.getBySection(section);
}

/**
 * Hook to register a shortcut with automatic cleanup
 */
export function useKeyboardShortcut(
  key: string,
  action: () => void,
  options: { ctrl?: boolean; meta?: boolean; shift?: boolean; alt?: boolean; description?: string; section?: string; global?: boolean } = {}
) {
  const shortcutId = useMemo(() => `shortcut-${key}-${nextShortcutId()}`, [key]);

  const shortcut = useMemo(() => ({
    id: shortcutId,
    key,
    action,
    ctrl: options.ctrl ?? false,
    meta: options.meta ?? false,
    shift: options.shift ?? false,
    alt: options.alt ?? false,
    description: options.description ?? '',
    section: options.section ?? 'General',
    global: options.global ?? false,
  }), [shortcutId, key, action, options.ctrl, options.meta, options.shift, options.alt, options.description, options.section, options.global]);

  useEffect(() => {
    const cleanup = registerShortcut(shortcut);
    return cleanup;
  }, [shortcut]);
}

/**
 * Hook to get all registered shortcuts for display
 */
export function useShortcutsRegistry() {
  return {
    getAll: registry.getAll,
    getBySection: registry.getBySection,
  };
}

/**
 * Format shortcut for display
 */
export function formatShortcut(shortcut: KeyboardShortcut): string {
  const parts = [];
  if (shortcut.ctrl || shortcut.meta) parts.push(typeof navigator !== 'undefined' && navigator.platform.toUpperCase().includes('MAC') ? '⌘' : 'Ctrl');
  if (shortcut.shift) parts.push('Shift');
  if (shortcut.alt) parts.push('Alt');
  parts.push(shortcut.key.toUpperCase());
  return parts.join(' + ');
}

/**
 * Get all shortcuts grouped by section for display
 */
export function getShortcutsForDisplay(): Record<string, KeyboardShortcut[]> {
  const shortcuts = getAllShortcuts();
  const grouped: Record<string, KeyboardShortcut[]> = {};
  shortcuts.forEach(s => {
    if (!grouped[s.section]) grouped[s.section] = [];
    grouped[s.section].push(s);
  });
  return grouped;
}

// Default app shortcuts
export const DEFAULT_SHORTCUTS: Omit<KeyboardShortcut, 'id' | 'action'>[] = [
  // Navigation
  { key: 'd', meta: true, ctrl: false, description: 'Go to Dashboard', section: 'Navigation' },
  { key: 'r', meta: true, ctrl: false, description: 'Go to Receipts', section: 'Navigation' },
  { key: 's', meta: true, ctrl: false, description: 'Open Scanner', section: 'Navigation' },
  { key: 'm', meta: true, ctrl: false, description: 'Go to Mileage', section: 'Navigation' },
  { key: 'e', meta: true, ctrl: false, description: 'Go to Export', section: 'Navigation' },
  { key: 'b', meta: true, ctrl: false, description: 'Bank Reconciliation', section: 'Navigation' },
  
  // Actions
  { key: 'n', ctrl: true, shift: false, description: 'New Receipt', section: 'Actions' },
  { key: 'a', ctrl: true, shift: true, description: 'Bulk Approve', section: 'Actions' },
  { key: 'g', ctrl: true, shift: true, description: 'Generate Report', section: 'Actions' },
  
  // Settings
  { key: 'o', ctrl: true, shift: true, description: 'Organization Settings', section: 'Settings' },
  { key: 't', ctrl: true, shift: true, description: 'Team Settings', section: 'Settings' },
  { key: 'b', ctrl: true, shift: true, description: 'Billing Settings', section: 'Settings' },
  { key: 's', ctrl: true, shift: true, description: 'Security Settings', section: 'Settings' },
  
  // UI
  { key: 'k', meta: true, ctrl: false, description: 'Open Command Palette', section: 'UI', global: true },
  { key: '/', ctrl: true, shift: true, description: 'Search', section: 'UI' },
  { key: '?', shift: true, description: 'Show Shortcuts Help', section: 'UI', global: true },
];

export function registerDefaultShortcuts(actions: Record<string, () => void>) {
  DEFAULT_SHORTCUTS.forEach((shortcut) => {
    const actionKey = shortcut.description.toLowerCase().replace(/\s+/g, '-');
    if (actions[actionKey]) {
      registerShortcut({
        ...shortcut,
        id: `default-${actionKey}`,
        action: actions[actionKey],
      });
    }
  });
}