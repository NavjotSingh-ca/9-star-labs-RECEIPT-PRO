/**
 * Shared animation configurations for framer-motion.
 * All spring constants and variants are centralized here for consistency.
 */

import type { Transition, Variants } from 'framer-motion';

// ─── Spring Presets ──────────────────────────────────────────────

/** Snappy spring for micro-interactions (buttons, taps) */
export const springSnap: Transition = {
  type: 'spring',
  stiffness: 400,
  damping: 20,
  mass: 0.5,
};

/** Gentle spring for panel/drawer animations */
export const springGentle: Transition = {
  type: 'spring',
  stiffness: 250,
  damping: 28,
  mass: 1,
};

/** Expressive spring for hero elements or modals entering */
export const springBouncy: Transition = {
  type: 'spring',
  stiffness: 300,
  damping: 20,
  mass: 0.8,
};

/** Slow spring for drawer slide-in/slide-out */
export const springDrawer: Transition = {
  type: 'spring',
  stiffness: 200,
  damping: 25,
  mass: 1,
};

/** Spring for sidebar collapse/expand */
export const springSidebar: Transition = {
  type: 'spring',
  stiffness: 300,
  damping: 28,
};

// ─── Duration-based presets ─────────────────────────────────────

/** Fast fade-out (0.12s easeOut) */
export const fadeFast: Transition = { duration: 0.12, ease: 'easeOut' };

/** Medium fade (0.2s easeOut) */
export const fadeMedium: Transition = { duration: 0.2, ease: 'easeOut' };

/** Slow fade (0.35s easeOut) */
export const fadeSlow: Transition = { duration: 0.35, ease: 'easeOut' };

// ─── Variants ───────────────────────────────────────────────────

/** Simple fade in + slight upward slide */
export const fadeUp: Variants = {
  hidden: { opacity: 0, y: 12 },
  show: { opacity: 1, y: 0, transition: { duration: 0.3, ease: 'easeOut' } },
};

/** Fade in only */
export const fadeIn: Variants = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { duration: 0.2, ease: 'easeOut' } },
};

/** Scale in from 95% + fade */
export const scaleIn: Variants = {
  hidden: { opacity: 0, scale: 0.95 },
  show: { opacity: 1, scale: 1, transition: { type: 'spring', stiffness: 300, damping: 25 } },
};

/** Slide in from right (for drawers, popovers) */
export const slideInRight: Variants = {
  hidden: { opacity: 0, x: 24 },
  show: { opacity: 1, x: 0, transition: springGentle },
  exit: { opacity: 0, x: 24, transition: fadeFast },
};

/** Slide down from top (for banners, alerts) */
export const slideDown: Variants = {
  hidden: { opacity: 0, y: -16 },
  show: { opacity: 1, y: 0, transition: springGentle },
  exit: { opacity: 0, y: -16, transition: fadeFast },
};

/** Slide up from bottom (for floating bars, bottom sheets) */
export const slideUp: Variants = {
  hidden: { opacity: 0, y: 40 },
  show: { opacity: 1, y: 0, transition: springSnap },
  exit: { opacity: 0, y: 40, transition: fadeFast },
};

// ─── Stagger container variants ─────────────────────────────────

/** Container that staggers child fadeUp animations */
export const staggerContainer: Variants = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { staggerChildren: 0.05, delayChildren: 0.05 },
  },
};

/** Slower stagger for hero/page sections */
export const staggerContainerSlow: Variants = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { staggerChildren: 0.1, delayChildren: 0.1 },
  },
};

// ─── Button / tap interaction presets ───────────────────────────

interface HoverPreset {
  whileHover: { scale: number };
  whileTap: { scale: number };
  transition: Transition;
}

/** Standard button hover (scale 1.03 / 0.97) */
export const buttonHover: HoverPreset = {
  whileHover: { scale: 1.03 },
  whileTap: { scale: 0.97 },
  transition: springSnap,
};

/** Subtle button hover (scale 1.02 / 0.98) */
export const buttonSubtleHover: HoverPreset = {
  whileHover: { scale: 1.02 },
  whileTap: { scale: 0.98 },
  transition: springSnap,
};

/** Icon-only button hover (scale 1.1 / 0.9) */
export const iconButtonHover: HoverPreset = {
  whileHover: { scale: 1.1 },
  whileTap: { scale: 0.9 },
  transition: springSnap,
};
