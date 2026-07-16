'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { LucideIcon } from 'lucide-react';

interface AnimatedFeatureCardProps {
  icon: LucideIcon;
  title: string;
  description: string;
  highlight?: boolean;
  delay?: number;
}

/**
 * AnimatedFeatureCard - Staggered entrance animations
 * Perfect for feature showcase sections
 */
export default function AnimatedFeatureCard({
  icon: Icon,
  title,
  description,
  highlight = false,
  delay = 0,
}: AnimatedFeatureCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 30, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{
        duration: 0.6,
        delay,
        type: 'spring',
        stiffness: 100,
      }}
      whileHover={{ y: -5, transition: { duration: 0.2 } }}
      className={`flex flex-col rounded-2xl border p-6 transition-all ${
        highlight
          ? 'border-champagne/30 bg-champagne/5 hover:border-champagne/50'
          : 'border-glass-border bg-surface hover:border-glass-border-hover'
      }`}
    >
      <motion.div
        whileHover={{ rotate: [0, -10, 10, -10, 0], transition: { duration: 0.5 } }}
        className={`flex h-12 w-12 items-center justify-center rounded-xl ${
          highlight ? 'bg-champagne/15' : 'bg-surface-raised'
        } mb-4`}
      >
        <Icon
          className={`h-6 w-6 ${highlight ? 'text-champagne' : 'text-text-secondary'}`}
          aria-hidden="true"
        />
      </motion.div>

      <h3 className="text-lg font-bold text-text-primary">{title}</h3>
      <p className="mt-2 text-sm text-text-muted flex-1">{description}</p>

      {highlight && (
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: '100%' }}
          transition={{ delay: 0.3, duration: 0.8 }}
          className="mt-4 h-0.5 bg-gradient-to-r from-champagne to-transparent"
        />
      )}
    </motion.div>
  );
}