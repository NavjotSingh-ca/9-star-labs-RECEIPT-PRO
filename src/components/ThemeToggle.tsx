'use client';

import { useTheme } from 'next-themes';
import { useState } from 'react';
import { Moon, Sun } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

/**
 * ThemeToggle — Dark/light mode toggle with animated Sun/Moon icon swap.
 * Uses next-themes `useTheme` hook. Shows placeholder skeleton until mounted (hydration safety).
 */
export function ThemeToggle() {
  const { theme, setTheme, resolvedTheme } = useTheme();
  const [mounted] = useState(false);

  if (!mounted && typeof window === 'undefined') {
    return <div className="h-10 w-10 rounded-[2rem] bg-sidebar-surface" />;
  }

  const isDark = (resolvedTheme ?? theme) === 'dark';

  return (
    <button
      type="button"
      onClick={() => setTheme(isDark ? 'light' : 'dark')}
      className="relative h-10 w-10 flex items-center justify-center rounded-[2rem] bg-sidebar-surface text-sidebar-text-muted hover:text-sidebar-text hover:bg-sidebar-active transition"
      aria-label={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
      title={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
    >
      <AnimatePresence mode="wait">
        {isDark ? (
          <motion.div
            key="moon"
            initial={{ scale: 0, opacity: 0, rotate: -90 }}
            animate={{ scale: 1, opacity: 1, rotate: 0 }}
            exit={{ scale: 0, opacity: 0, rotate: 90 }}
            transition={{ type: 'spring', stiffness: 400, damping: 20, mass: 0.5 }}
          >
            <Moon className="h-5 w-5" />
          </motion.div>
        ) : (
          <motion.div
            key="sun"
            initial={{ scale: 0, opacity: 0, rotate: 90 }}
            animate={{ scale: 1, opacity: 1, rotate: 0 }}
            exit={{ scale: 0, opacity: 0, rotate: -90 }}
            transition={{ type: 'spring', stiffness: 400, damping: 20, mass: 0.5 }}
          >
            <Sun className="h-5 w-5" />
          </motion.div>
        )}
      </AnimatePresence>
    </button>
  );
}
