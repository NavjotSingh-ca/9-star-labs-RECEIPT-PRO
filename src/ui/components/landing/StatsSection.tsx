'use client';

import * as React from 'react';
import { motion } from 'framer-motion';
import { AnimatedCounter } from './AnimatedCounter';

const stats = [
  { value: 50000, suffix: '+', label: 'Receipts Processed' },
  { value: 500, suffix: '+', label: 'Canadian Businesses' },
  { value: 3, suffix: '', label: 'Tax Seasons Supported' },
  { value: 8, suffix: 'h/mo', label: 'Avg. Time Saved' },
];

export function StatsSection() {
  return (
    <section className="relative py-20 border-t border-glass-border">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-8 max-w-4xl mx-auto">
          {stats.map((stat) => (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.3 }}
              transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
              className="text-center"
            >
              <div className="text-4xl sm:text-5xl font-bold tracking-tight text-champagne mb-2 tabular-nums">
                <AnimatedCounter value={stat.value} suffix={stat.suffix} />
              </div>
              <p className="text-xs text-text-muted/70 uppercase tracking-wider font-medium">{stat.label}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}

export default StatsSection;