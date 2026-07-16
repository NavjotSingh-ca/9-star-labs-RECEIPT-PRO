'use client';

import React, { useState } from 'react';
import { Plus, Scan, Upload, Calculator, DollarSign } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import Link from 'next/link';

/**
 * QuickActionsFAB - Floating action button with quick actions
 * Desktop keyboard shortcuts: Ctrl+K, Ctrl+Shift+K for actions
 */
export default function QuickActionsFAB() {
  const [isOpen, setIsOpen] = useState(false);

  const actions = [
    { label: 'Scan Receipt', href: '/?tab=scan', icon: Scan, shortcut: 'S' },
    { label: 'Upload Files', href: '/?tab=upload', icon: Upload, shortcut: 'U' },
    { label: 'Calculate Tax', href: '/?tab=tax', icon: DollarSign, shortcut: 'T' },
    { label: 'New Budget', href: '/?tab=budget', icon: Calculator, shortcut: 'B' },
  ];

  return (
    <div className="fixed bottom-6 right-6 z-50" role="region" aria-label="Quick actions">
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            className="absolute bottom-16 right-0 mb-2 flex flex-col gap-2"
          >
            {actions.map(action => (
              <Link
                key={action.label}
                href={action.href}
                className="flex items-center gap-3 rounded-xl border border-glass-border bg-card px-4 py-2.5 text-sm font-medium text-text-primary shadow-lg transition hover:bg-surface-hover focus:outline-none focus:ring-2 focus:ring-champagne/40"
                onClick={() => setIsOpen(false)}
              >
                <action.icon className="h-4 w-4" aria-hidden="true" />
                {action.label}
                <span className="ml-auto text-xs text-text-muted">{action.shortcut}</span>
              </Link>
            ))}
          </motion.div>
        )}
      </AnimatePresence>

      <button
        type="button"
        onClick={() => setIsOpen(o => !o)}
        className="flex h-14 w-14 items-center justify-center rounded-full bg-champagne text-obsidian shadow-xl transition hover:bg-champagne-dim focus:outline-none focus:ring-2 focus:ring-champagne/40"
        aria-label="Open quick actions menu"
        aria-expanded={isOpen}
      >
        <Plus className={`h-6 w-6 transition ${isOpen ? 'rotate-45' : ''}`} aria-hidden="true" />
      </button>
    </div>
  );
}