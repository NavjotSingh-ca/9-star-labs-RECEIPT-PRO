'use client';

import { motion } from 'framer-motion';
import type { ReactNode } from 'react';

/**
 * Props for the PageHeader component.
 */
interface PageHeaderProps {
  /** Page title (h1 element) */
  title: string;
  /** Optional subtitle displayed below the title */
  subtitle?: string;
  /** Optional action element rendered on the right side (desktop) or below (mobile) */
  action?: ReactNode;
}

/**
 * Consistent page header with animated entrance, title, optional subtitle,
 * and optional action button. Used as the first element in most page layouts.
 */
export default function PageHeader({ title, subtitle, action }: PageHeaderProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: -8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2 }}
      className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between mb-6"
    >
      <div>
        <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-text-primary">
          {title}
        </h1>
        {subtitle && (
          <p className="mt-0.5 text-sm text-text-secondary">{subtitle}</p>
        )}
      </div>
      {action && (
        <div className="mt-3 sm:mt-0">{action}</div>
      )}
    </motion.div>
  );
}
