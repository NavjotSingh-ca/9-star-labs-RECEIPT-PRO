'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { usePathname } from 'next/navigation';
import { type ReactNode } from 'react';

const DURATION = 0.35;

const easeOut = [0.25, 0.1, 0.25, 1] as const;

const pageVariants = {
  initial: { opacity: 0, y: 12 },
  animate: {
    opacity: 1,
    y: 0,
    transition: { duration: DURATION, ease: easeOut },
  },
  exit: {
    opacity: 0,
    y: -8,
    transition: { duration: DURATION * 0.6, ease: easeOut },
  },
};

/**
 * Wraps page content with a fade + micro slide transition on route change.
 * Place inside a single `<main>` — one per layout.
 */
export function PageTransition({ children }: { children: ReactNode }) {
  const pathname = usePathname();

  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={pathname}
        variants={pageVariants}
        initial="initial"
        animate="animate"
        exit="exit"
        className="contents"
      >
        {children}
      </motion.div>
    </AnimatePresence>
  );
}
