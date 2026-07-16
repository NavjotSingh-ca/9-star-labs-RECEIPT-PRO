'use client';

import type { ReactNode } from 'react';
import { motion } from 'framer-motion';
import { springGentle } from '@/lib/animations';

interface PageTransitionProps {
  children: ReactNode;
  className?: string;
  /** Entrance delay in seconds */
  delay?: number;
}

/**
 * Standard page/section entrance animation.
 * Wraps content in a fade+slide-up spring animation.
 */
export default function PageTransition({ children, className, delay = 0 }: PageTransitionProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ ...springGentle, delay }}
      className={className}
    >
      {children}
    </motion.div>
  );
}
