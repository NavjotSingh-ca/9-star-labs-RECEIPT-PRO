'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Keyboard, X, Command, ArrowUpDown, Scan, Search, CheckCheck, Download } from 'lucide-react';

const shortcuts = [
  { keys: ['⌘K', 'Ctrl+K'], label: 'Command palette', icon: Command },
  { keys: ['?'], label: 'Show this menu', icon: Keyboard },
  { keys: ['Escape'], label: 'Close overlays / modals', icon: X },
  { keys: ['⌘F', 'Ctrl+F'], label: 'Search receipts (AI semantic)', icon: Search },
  { keys: ['S'], label: 'Open scanner', icon: Scan },
  { keys: ['A'], label: 'Approve selected receipt', icon: CheckCheck },
  { keys: ['R'], label: 'Reject selected receipt', icon: X },
  { keys: ['←', '→'], label: 'Navigate tabs (swipe)', icon: ArrowUpDown },
  { keys: ['⌘E', 'Ctrl+E'], label: 'Export data', icon: Download },
];

export default function ShortcutsOverlay() {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === '?' && !e.metaKey && !e.ctrlKey && !e.altKey && !e.shiftKey) {
        e.preventDefault();
        setOpen((o) => !o);
      }
      if (e.key === 'Escape' && open) {
        setOpen(false);
      }
    };
    document.addEventListener('keydown', down);
    return () => document.removeEventListener('keydown', down);
  }, [open]);

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.15 }}
          className="fixed inset-0 z-[200] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
          onClick={() => setOpen(false)}
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 10 }}
            transition={{ type: 'spring', stiffness: 300, damping: 30 }}
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-md rounded-2xl border border-glass-border bg-card shadow-2xl"
          >
            <div className="flex items-center justify-between border-b border-glass-border px-5 py-4">
              <h2 className="flex items-center gap-2 text-sm font-bold text-text-primary">
                <Keyboard className="h-4 w-4 text-champagne" />
                Keyboard Shortcuts
              </h2>
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="flex h-7 w-7 items-center justify-center rounded-full text-text-muted transition hover:bg-surface-hover hover:text-text-primary"
                aria-label="Close"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            </div>
            <div className="space-y-0.5 px-3 py-3">
              {shortcuts.map((s) => (
                <div
                  key={s.keys[0]}
                  className="flex items-center justify-between rounded-lg px-3 py-2.5 transition hover:bg-surface-raised"
                >
                  <span className="flex items-center gap-2.5 text-sm text-text-secondary">
                    <s.icon className="h-3.5 w-3.5 text-text-muted" />
                    {s.label}
                  </span>
                  <span className="flex items-center gap-1">
                    {s.keys.map((k, i) => (
                      <span key={k}>
                        <kbd className="inline-flex min-w-[24px] items-center justify-center rounded-md border border-glass-border bg-surface-raised px-1.5 py-0.5 text-[11px] font-semibold text-text-muted shadow-sm">
                          {k}
                        </kbd>
                        {i < s.keys.length - 1 && <span className="mx-1 text-text-muted">or</span>}
                      </span>
                    ))}
                  </span>
                </div>
              ))}
            </div>
            <div className="border-t border-glass-border px-5 py-3">
              <p className="text-[11px] text-text-muted">Press <kbd className="inline-flex items-center justify-center rounded border border-glass-border bg-surface-raised px-1 py-0.5 text-[10px] font-semibold text-text-muted">?</kbd> to toggle this menu</p>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
