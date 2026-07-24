'use client';

import { motion } from 'framer-motion';

export function PremiumSpinner() {
  return (
    <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-[var(--obsidian)]">
      {/* Ambient glow */}
      <div
        className="pointer-events-none absolute inset-0 opacity-20"
        style={{
          background:
            'radial-gradient(ellipse 200px 200px at 50% 40%, var(--champagne-glow, #bea98e), transparent 70%)',
        }}
      />

      <div className="relative flex flex-col items-center gap-6">
        {/* Pulsing glow ring behind spinner */}
        <motion.div
          className="absolute -inset-8 rounded-full"
          animate={{ opacity: [0.3, 0.6, 0.3], scale: [0.95, 1.05, 0.95] }}
          transition={{ duration: 3, ease: 'easeInOut', repeat: Infinity }}
          style={{
            background:
              'radial-gradient(circle, var(--champagne-glow, #bea98e / 0.15), transparent 70%)',
            filter: 'blur(20px)',
          }}
        />

        {/* Spinning ring */}
        <motion.div
          className="relative h-12 w-12 rounded-full"
          style={{
            background:
              'conic-gradient(from 0deg, var(--glass-border), var(--champagne), var(--champagne), var(--glass-border))',
            mask: 'radial-gradient(circle, transparent 38%, black 39%)',
            WebkitMask: 'radial-gradient(circle, transparent 38%, black 39%)',
          }}
          animate={{ rotate: 360 }}
          transition={{
            duration: 1.5,
            repeat: Infinity,
            ease: [0.25, 0.46, 0.45, 0.94],
          }}
        />

        {/* Brand wordmark */}
        <motion.span
          className="text-xs font-bold uppercase tracking-[0.25em]"
          style={{ color: 'var(--champagne)', fontFamily: 'Geist Variable, ui-sans-serif, system-ui, sans-serif' }}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{
            delay: 0.3,
            duration: 0.7,
            ease: [0.25, 0.1, 0.25, 1],
          }}
        >
          Leduc
        </motion.span>
      </div>
    </div>
  );
}
