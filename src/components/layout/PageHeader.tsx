'use client';

import { motion } from 'framer-motion';
import { fadeUp } from '@/lib/animations';
import type { ReactNode } from 'react';
interface PageHeaderProps {
  title: string;
  subtitle?: string;
  action?: ReactNode;
}

export default function PageHeader({ title, subtitle, action }: PageHeaderProps) {
  return (
    <motion.div
      variants={fadeUp}
      initial="hidden"
      animate="show"
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