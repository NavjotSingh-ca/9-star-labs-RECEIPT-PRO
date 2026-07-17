/**
 * Centralized animation presets — "Google antigravity" philosophy.
 *
 * Principles:
 * 1. Spring physics everywhere — no linear/cubic-bezier for motion.div
 * 2. Floaty ambient motion — elements drift like they're weightless
 * 3. Card hover = levitation (y offset + shadow, not just scale)
 * 4. Every interactive element responds with spring physics
 * 5. Consistent page transitions — fadeUp spring on all tab/settings panels
 * 6. Staggered list appearances — items fade up in sequence
 * 7. Respects system reduced-motion preference via Providers.tsx
 */

import type { Transition, Variants } from 'framer-motion';

// ─── Spring Physics Presets ───────────────────────────────────────
// Google antigravity = low stiffness + moderate damping = floaty but not bouncy

/** Ultra-gentle spring for ambient floating elements (orbs, backgrounds) */
export const springFloaty: Transition = {
  type: 'spring',
  stiffness: 80,
  damping: 20,
  mass: 1.2,
};

/** Gentle spring for page/section entrances (the core "antigravity" feel) */
export const springGentle: Transition = {
  type: 'spring',
  stiffness: 200,
  damping: 28,
  mass: 0.8,
};

/** Medium spring for cards, panels, drawers */
export const springDrawer: Transition = {
  type: 'spring',
  stiffness: 180,
  damping: 25,
  mass: 0.9,
};

/** Snappy spring for micro-interactions (buttons, taps, toggles) */
export const springSnap: Transition = {
  type: 'spring',
  stiffness: 400,
  damping: 20,
  mass: 0.5,
};

/** Expressive spring for hero elements, modals, celebration effects */
export const springBouncy: Transition = {
  type: 'spring',
  stiffness: 300,
  damping: 18,
  mass: 0.7,
};

/** Spring for sidebar collapse/expand — slow, deliberate */
export const springSidebar: Transition = {
  type: 'spring',
  stiffness: 250,
  damping: 30,
};

// ─── Duration-based presets (for CSS transitions, not framer) ────
// Only use these for non-motion elements (opacity fades on simple elements)

export const fadeFast: Transition = { duration: 0.12, ease: 'easeOut' };
export const fadeMedium: Transition = { duration: 0.2, ease: 'easeOut' };
export const fadeSlow: Transition = { duration: 0.35, ease: 'easeOut' };

// ─── Page/Section Entrance Variants ───────────────────────────────
// Every panel, settings page, and tab content uses these

/** Standard entrance: fade + slight upward slide with spring physics */
export const fadeUp: Variants = {
  hidden: { opacity: 0, y: 16 },
  show: { opacity: 1, y: 0, transition: springGentle },
};

/** Slower, floatier entrance for hero/section headings */
export const fadeUpFloaty: Variants = {
  hidden: { opacity: 0, y: 24 },
  show: { opacity: 1, y: 0, transition: { type: 'spring', stiffness: 150, damping: 25, mass: 1 } },
};

/** Fade in only (no slide) */
export const fadeIn: Variants = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { duration: 0.25, ease: 'easeOut' } },
};

/** Scale in from 97% + fade (for cards, modals) */
export const scaleIn: Variants = {
  hidden: { opacity: 0, scale: 0.97 },
  show: { opacity: 1, scale: 1, transition: springGentle },
};

/** Entrance with slight scale + fadeUp (cards, tiles) */
export const cardEntrance: Variants = {
  hidden: { opacity: 0, y: 20, scale: 0.98 },
  show: { opacity: 1, y: 0, scale: 1, transition: springGentle },
};

/** Slide in from right (drawers, panels) */
export const slideInRight: Variants = {
  hidden: { opacity: 0, x: 24 },
  show: { opacity: 1, x: 0, transition: springDrawer },
  exit: { opacity: 0, x: 24, transition: { duration: 0.15, ease: 'easeIn' } },
};

/** Slide down from top (banners, alerts) */
export const slideDown: Variants = {
  hidden: { opacity: 0, y: -16 },
  show: { opacity: 1, y: 0, transition: springGentle },
  exit: { opacity: 0, y: -16, transition: { duration: 0.15, ease: 'easeIn' } },
};

/** Slide up from bottom (bottom sheets, floating bars) */
export const slideUp: Variants = {
  hidden: { opacity: 0, y: 40 },
  show: { opacity: 1, y: 0, transition: springSnap },
  exit: { opacity: 0, y: 40, transition: { duration: 0.15, ease: 'easeIn' } },
};

// ─── Ambient / Floating Variants ─────────────────────────────────
// For background orbs, gradient blobs, decorative elements

/** Gentle infinite float (y-axis bob) for ambient elements */
export const floatAnimation = {
  y: [0, -12, 0],
  transition: {
    duration: 6,
    repeat: Infinity,
    ease: 'easeInOut',
  },
};

/** Slower, wider float for background orbs */
export const floatDrift = {
  y: [0, -20, 0],
  x: [0, 8, 0],
  transition: {
    duration: 10,
    repeat: Infinity,
    ease: 'easeInOut',
  },
};

/** Breathing opacity pulse for gradients */
export const breatheAnimation = {
  opacity: [0.7, 1, 0.7],
  transition: {
    duration: 6,
    repeat: Infinity,
    ease: 'easeInOut' as const,
  },
};

// ─── Stagger Containers ───────────────────────────────────────────
// Wrap lists of items to animate them in sequence

/** Fast stagger (0.04s between children) — for dense lists */
export const staggerFast: Variants = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { staggerChildren: 0.04, delayChildren: 0.05 },
  },
};

/** Medium stagger (0.08s between children) — for cards, feature grids */
export const staggerMedium: Variants = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { staggerChildren: 0.08, delayChildren: 0.08 },
  },
};

/** Slow stagger (0.12s between children) — for hero sections, onboarding */
export const staggerSlow: Variants = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { staggerChildren: 0.12, delayChildren: 0.15 },
  },
};

// ─── Hover / Tap Interaction Presets ─────────────────────────────
// Apply as `whileHover={cardHover.whileHover}` etc.

export interface HoverPreset {
  whileHover: Record<string, number | string>;
  whileTap: Record<string, number | string>;
  transition: Transition;
}

/** Card hover — levitate up 8px + subtle scale (the signature antigravity move) */
export const cardHover: HoverPreset = {
  whileHover: { y: -8, scale: 1.01 },
  whileTap: { y: -2, scale: 0.99 },
  transition: { type: 'spring', stiffness: 300, damping: 22, mass: 0.7 },
};

/** Card hover — lighter version for dense grids (less y-offset) */
export const cardHoverSubtle: HoverPreset = {
  whileHover: { y: -4, scale: 1.005 },
  whileTap: { y: -1, scale: 0.99 },
  transition: { type: 'spring', stiffness: 350, damping: 24, mass: 0.6 },
};

/** Standard button hover (scale up 1.03 / press down 0.97) */
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

/** Icon-only button hover (scale up 1.1 / press 0.9) */
export const iconHover: HoverPreset = {
  whileHover: { scale: 1.1 },
  whileTap: { scale: 0.9 },
  transition: springSnap,
};

/** Nav item hover — slight lift + scale for sidebar/mobile nav items */
export const navItemHover: HoverPreset = {
  whileHover: { x: 4, scale: 1.02 },
  whileTap: { scale: 0.98 },
  transition: { type: 'spring', stiffness: 350, damping: 22 },
};

/** FAB / primary action hover — float up + pulse glow (simulated scale) */
export const fabHover: HoverPreset = {
  whileHover: { scale: 1.08, y: -2 },
  whileTap: { scale: 0.92 },
  transition: { type: 'spring', stiffness: 250, damping: 15, mass: 0.6 },
};

/** Row hover — subtle background shift for table/list rows */
export const rowHover: HoverPreset = {
  whileHover: { backgroundColor: 'rgba(190,169,142,0.05)' },
  whileTap: {},
  transition: { duration: 0.2, ease: 'easeOut' },
};
