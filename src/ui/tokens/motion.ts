/**
 * Motion Tokens — Fluid Spring Physics
 * All durations in ms, easings as cubic-bezier arrays
 */

export const motion = {
  // Duration scale
  duration: {
    instant: 0,
    fastest: 50,
    faster: 100,
    fast: 150,
    normal: 200,
    slow: 300,
    slower: 400,
    slowest: 500,
    page: 600,
    section: 800,
    hero: 1000,
    cinematic: 1200,
  },

  // Easing curves (cubic-bezier)
  easing: {
    // Standard
    linear: [0, 0, 1, 1] as const,
    ease: [0.25, 0.1, 0.25, 1] as const,
    easeIn: [0.42, 0, 1, 1] as const,
    easeOut: [0, 0, 0.58, 1] as const,
    easeInOut: [0.42, 0, 0.58, 1] as const,

    // Fluid Spring (Apple/Linear style)
    spring: [0.34, 1.56, 0.64, 1] as const,
    springGentle: [0.16, 1, 0.3, 1] as const,
    springSnap: [0.32, 0.72, 0, 1] as const,
    springBouncy: [0.68, -0.55, 0.265, 1.55] as const,

    // Custom premium curves
    fluid: [0.32, 0.72, 0, 1] as const,           // Main brand easing
    fluidEnter: [0.16, 1, 0.3, 1] as const,       // Entry animations
    fluidExit: [0.32, 0.72, 0, 1] as const,       // Exit animations
    fluidSharp: [0.4, 0, 0.2, 1] as const,        // Sharp/quick
    fluidSoft: [0.25, 0.46, 0.45, 0.94] as const, // Soft/gentle

    // Expo
    expoIn: [0.95, 0.05, 0.795, 0.035] as const,
    expoOut: [0.19, 1, 0.22, 1] as const,
    expoInOut: [1, 0, 0, 1] as const,

    // Circ
    circIn: [0.6, 0.04, 0.98, 0.335] as const,
    circOut: [0.075, 0.82, 0.165, 1] as const,
    circInOut: [0.785, 0.135, 0.15, 0.86] as const,

    // Back
    backIn: [0.6, -0.28, 0.735, 0.045] as const,
    backOut: [0.175, 0.885, 0.32, 1.275] as const,
    backInOut: [0.68, -0.55, 0.265, 1.55] as const,
  },

  // Stagger delays
  stagger: {
    none: 0,
    tight: 20,
    normal: 40,
    loose: 60,
    wide: 80,
    xwide: 100,
  },

  // Spring configs (for Framer Motion)
  spring: {
    gentle: { stiffness: 120, damping: 14 },
    normal: { stiffness: 180, damping: 12 },
    snappy: { stiffness: 260, damping: 10 },
    bouncy: { stiffness: 400, damping: 8 },
    wobbly: { stiffness: 180, damping: 6 },
    magnetic: { stiffness: 500, damping: 30 },
    heavy: { stiffness: 280, damping: 20 },
  },

  // Transition presets
  transition: {
    // Micro-interactions
    micro: { duration: 100, ease: [0.32, 0.72, 0, 1] },
    microHover: { duration: 150, ease: [0.16, 1, 0.3, 1] },
    microTap: { duration: 50, ease: [0.4, 0, 0.2, 1] },

    // Standard
    fast: { duration: 150, ease: [0.32, 0.72, 0, 1] },
    normal: { duration: 200, ease: [0.32, 0.72, 0, 1] },
    slow: { duration: 300, ease: [0.32, 0.72, 0, 1] },

    // Page/Section
    page: { duration: 600, ease: [0.16, 1, 0.3, 1] },
    section: { duration: 800, ease: [0.16, 1, 0.3, 1] },
    hero: { duration: 1000, ease: [0.16, 1, 0.3, 1] },

    // Spring variants
    springGentle: { type: 'spring', stiffness: 120, damping: 14 },
    springNormal: { type: 'spring', stiffness: 180, damping: 12 },
    springSnap: { type: 'spring', stiffness: 500, damping: 30 },

    // Layout
    layout: { type: 'spring', stiffness: 300, damping: 30 },
    layoutFast: { type: 'spring', stiffness: 400, damping: 25 },
  },

  // Animation keyframes (for CSS)
  keyframes: {
    fadeIn: { from: { opacity: 0 }, to: { opacity: 1 } },
    fadeOut: { from: { opacity: 1 }, to: { opacity: 0 } },
    slideUp: { from: { opacity: 0, transform: 'translateY(16px)' }, to: { opacity: 1, transform: 'translateY(0)' } },
    slideDown: { from: { opacity: 0, transform: 'translateY(-16px)' }, to: { opacity: 1, transform: 'translateY(0)' } },
    slideLeft: { from: { opacity: 0, transform: 'translateX(16px)' }, to: { opacity: 1, transform: 'translateX(0)' } },
    slideRight: { from: { opacity: 0, transform: 'translateX(-16px)' }, to: { opacity: 1, transform: 'translateX(0)' } },
    scaleIn: { from: { opacity: 0, transform: 'scale(0.95)' }, to: { opacity: 1, transform: 'scale(1)' } },
    scaleOut: { from: { opacity: 1, transform: 'scale(1)' }, to: { opacity: 0, transform: 'scale(0.95)' } },
    rotateIn: { from: { opacity: 0, transform: 'rotate(-4deg) scale(0.95)' }, to: { opacity: 1, transform: 'rotate(0) scale(1)' } },
    shimmer: { from: { backgroundPosition: '-200% 0' }, to: { backgroundPosition: '200% 0' } },
    pulse: { '0%, 100%': { opacity: 1 }, '50%': { opacity: 0.5 } },
    breathe: { '0%, 100%': { transform: 'scale(1)' }, '50%': { transform: 'scale(1.02)' } },
    float: { '0%, 100%': { transform: 'translateY(0)' }, '50%': { transform: 'translateY(-8px)' } },
    orbit: { from: { transform: 'rotate(0deg)' }, to: { transform: 'rotate(360deg)' } },
    glow: { '0%, 100%': { boxShadow: '0 0 8px var(--color-brand-glow)' }, '50%': { boxShadow: '0 0 24px var(--color-brand-glow-strong)' } },
  },
} as const;

export type MotionTokens = typeof motion;