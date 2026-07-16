'use client';

import { useEffect, useCallback, useRef } from 'react';

interface KeyboardShortcutsOptions {
  onScan?: () => void;
  onSearch?: () => void;
  onNewReceipt?: () => void;
  onNavigateTab?: (tab: string) => void;
  onEscape?: () => void;
  onGlobalSearch?: () => void;
}

export function useKeyboardShortcuts({
  onScan,
  onSearch,
  onNewReceipt,
  onNavigateTab,
  onEscape,
  onGlobalSearch,
}: KeyboardShortcutsOptions) {
  const keyMapRef = useRef<Record<string, boolean>>({});

  const handleKeyDown = useCallback(
    (event: KeyboardEvent) => {
      const { key, ctrlKey, metaKey, shiftKey, altKey, target } = event;
      const isInput = target instanceof HTMLInputElement || target instanceof HTMLTextAreaElement || target instanceof HTMLSelectElement;
      const isContentEditable = (target as HTMLElement).isContentEditable;
      const isTyping = isInput || isContentEditable;

      const modifier = ctrlKey || metaKey;
      const keyCombo = `${ctrlKey ? 'ctrl+' : ''}${metaKey ? 'meta+' : ''}${shiftKey ? 'shift+' : ''}${altKey ? 'alt+' : ''}${key.toLowerCase()}`;

      if (keyMapRef.current[keyCombo]) return;
      keyMapRef.current[keyCombo] = true;

      // Global shortcuts (work even when typing)
      if (keyCombo === 'ctrl+k' || keyCombo === 'meta+k') {
        event.preventDefault();
        onGlobalSearch?.();
        return;
      }

      if (keyCombo === 'ctrl+shift+k' || keyCombo === 'meta+shift+k') {
        event.preventDefault();
        onSearch?.();
        return;
      }

      if (keyCombo === 'ctrl+shift+s' || keyCombo === 'meta+shift+s') {
        event.preventDefault();
        onScan?.();
        return;
      }

      if (key === 'Escape') {
        onEscape?.();
        return;
      }

      // Shortcuts that don't work when typing
      if (isTyping) return;

      // Tab navigation shortcuts
      if (keyCombo === 'ctrl+1' || keyCombo === 'meta+1') {
        event.preventDefault();
        onNavigateTab?.('dashboard');
        return;
      }
      if (keyCombo === 'ctrl+2' || keyCombo === 'meta+2') {
        event.preventDefault();
        onNavigateTab?.('history');
        return;
      }
      if (keyCombo === 'ctrl+3' || keyCombo === 'meta+3') {
        event.preventDefault();
        onNavigateTab?.('scanner');
        return;
      }
      if (keyCombo === 'ctrl+4' || keyCombo === 'meta+4') {
        event.preventDefault();
        onNavigateTab?.('mileage');
        return;
      }
      if (keyCombo === 'ctrl+5' || keyCombo === 'meta+5') {
        event.preventDefault();
        onNavigateTab?.('export');
        return;
      }
      if (keyCombo === 'ctrl+6' || keyCombo === 'meta+6') {
        event.preventDefault();
        onNavigateTab?.('reconciliation');
        return;
      }
      if (keyCombo === 'ctrl+7' || keyCombo === 'meta+7') {
        event.preventDefault();
        onNavigateTab?.('audit');
        return;
      }
      if (keyCombo === 'ctrl+8' || keyCombo === 'meta+8') {
        event.preventDefault();
        onNavigateTab?.('notifications');
        return;
      }

      // N = New receipt
      if (key === 'n' && !modifier) {
        event.preventDefault();
        onNewReceipt?.();
        return;
      }

      // S = Search (when not typing)
      if (key === 's' && !modifier) {
        event.preventDefault();
        onSearch?.();
        return;
      }
    },
    [onScan, onSearch, onNewReceipt, onNavigateTab, onEscape, onGlobalSearch]
  );

  const handleKeyUp = useCallback(
    (event: KeyboardEvent) => {
      const { key, ctrlKey, metaKey, shiftKey, altKey } = event;
      const keyCombo = `${ctrlKey ? 'ctrl+' : ''}${metaKey ? 'meta+' : ''}${shiftKey ? 'shift+' : ''}${altKey ? 'alt+' : ''}${key.toLowerCase()}`;
      delete keyMapRef.current[keyCombo];
    },
    []
  );

  useEffect(() => {
    document.addEventListener('keydown', handleKeyDown, { passive: false });
    document.addEventListener('keyup', handleKeyUp);
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.removeEventListener('keyup', handleKeyUp);
    };
  }, [handleKeyDown, handleKeyUp]);
}