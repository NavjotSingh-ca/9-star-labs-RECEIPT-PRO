/**
 * Keyboard Shortcuts Provider — Global shortcut registry with conflict detection
 * Provides declarative shortcut registration with categories and conflict prevention.
 */

'use client';

import { createContext, useContext, useEffect, useCallback, useMemo, useRef, useState } from 'react';
import { useKeyboardShortcut as useDesignKeyboardShortcut } from '@design/hooks';

export interface ShortcutDefinition {
  id: string;
  key: string;
  description: string;
  category: string;
  action: () => void;
  modifiers?: {
    ctrl?: boolean;
    meta?: boolean;
    shift?: boolean;
    alt?: boolean;
  };
  disabled?: boolean;
  global?: boolean; // Works even when inputs are focused
  priority?: number; // Higher = takes precedence
}

interface ShortcutRegistry {
  register: (shortcut: ShortcutDefinition) => () => void;
  unregister: (id: string) => void;
  getAll: () => ShortcutDefinition[];
  getByCategory: (category: string) => ShortcutDefinition[];
}

const ShortcutRegistryContext = createContext<ShortcutRegistry | null>(null);

export function ShortcutProvider({ children }: { children: React.ReactNode }) {
  const [shortcuts, setShortcuts] = useState<ShortcutDefinition[]>([]);
  
  const register = useCallback((shortcut: ShortcutDefinition) => {
    setShortcuts(prev => {
      // Check for conflicts
      const conflict = prev.find(s => 
        s.key === shortcut.key &&
        JSON.stringify(s.modifiers) === JSON.stringify(shortcut.modifiers) &&
        s.global === shortcut.global
      );
      
      if (conflict && conflict.priority && shortcut.priority && conflict.priority >= shortcut.priority) {
        console.warn(`Shortcut conflict: ${shortcut.id} conflicts with ${conflict.id}. Higher priority wins.`);
        return prev;
      }
      
      return [...prev.filter(s => s.id !== shortcut.id), shortcut].sort((a, b) => (b.priority || 0) - (a.priority || 0));
    });
    
    return () => setShortcuts(prev => prev.filter(s => s.id !== shortcut.id));
  }, []);

  const unregister = useCallback((id: string) => {
    setShortcuts(prev => prev.filter(s => s.id !== id));
  }, []);

  const getAll = useCallback(() => shortcuts, [shortcuts]);
  
  const getByCategory = useCallback((category: string) => 
    shortcuts.filter(s => s.category === category), [shortcuts]);

  const registry = useMemo(() => ({
    register,
    unregister,
    getAll,
    getByCategory,
  }), [register, unregister, getAll, getByCategory]);

  return (
    <ShortcutRegistryContext.Provider value={registry}>
      {children}
    </ShortcutRegistryContext.Provider>
  );
}

export function useShortcutRegistry() {
  const context = useContext(ShortcutRegistryContext);
  if (!context) {
    throw new Error('useShortcutRegistry must be used within ShortcutProvider');
  }
  return context;
}

/**
 * Hook to register a shortcut declaratively
 */
export function useShortcut(definition: ShortcutDefinition) {
  const { register, unregister } = useShortcutRegistry();
  const idRef = useRef(definition.id);
  
  // Update ID if it changes
  useEffect(() => {
    idRef.current = definition.id;
  }, [definition.id]);

  useEffect(() => {
    const cleanup = register(definition);
    return cleanup;
  }, [definition, register]);

  useEffect(() => {
    return () => unregister(idRef.current);
  }, [unregister]);
}

/**
 * Hook to use keyboard shortcuts with automatic registration
 */
export function useKeyboardShortcut(
  key: string,
  action: () => void,
  options: {
    ctrl?: boolean;
    meta?: boolean;
    shift?: boolean;
    alt?: boolean;
    disabled?: boolean;
    global?: boolean;
  } = {}
) {
  const { ctrl, meta, shift, alt, disabled, global } = options;
  
  useDesignKeyboardShortcut(key, action, { ctrl, meta, shift, alt });
  
  // Handle global shortcuts (even when inputs are focused)
  useEffect(() => {
    if (!global || disabled) return;
    
    const handler = (e: KeyboardEvent) => {
      const matches = e.key === key &&
        (!ctrl || e.ctrlKey || e.metaKey) &&
        (!meta || e.metaKey) &&
        (!shift || e.shiftKey) &&
        (!alt || e.altKey);
      
      if (matches) {
        e.preventDefault();
        action();
      }
    };
    
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [key, action, ctrl, meta, shift, alt, global, disabled]);
}

/**
 * Hook to get all registered shortcuts for display (e.g., in help modal)
 */
export function useShortcuts(category?: string) {
  const { getAll, getByCategory } = useShortcutRegistry();
  return category ? getByCategory(category) : getAll();
}

/**
 * Built-in shortcut categories
 */
export const SHORTCUT_CATEGORIES = {
  navigation: 'Navigation',
  actions: 'Actions',
  settings: 'Settings',
  help: 'Help',
  editing: 'Editing',
  bulk: 'Bulk Operations',
} as const;

export type ShortcutCategory = keyof typeof SHORTCUT_CATEGORIES;