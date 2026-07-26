/**
 * Border Radius System — Squircle-inspired continuous curves
 */

export const radius = {
  none: '0',
  xs: '0.125rem',    // 2px
  sm: '0.25rem',     // 4px
  md: '0.375rem',    // 6px
  lg: '0.5rem',      // 8px
  xl: '0.75rem',     // 12px
  '2xl': '1rem',     // 16px
  '3xl': '1.5rem',   // 24px
  '4xl': '2rem',     // 32px
  full: '9999px',

  // Continuous corner radius (squircle feel via SVG mask or border-radius approximation)
  // These use slightly larger values for that "Apple squircle" feel
  squircle: {
    xs: '0.375rem',    // ~6px
    sm: '0.5rem',      // ~8px
    md: '0.75rem',     // ~12px
    lg: '1rem',        // ~16px
    xl: '1.5rem',      // ~24px
    '2xl': '2rem',     // ~32px
    '3xl': '3rem',     // ~48px
  },

  // Component-specific
  component: {
    button: '0.75rem',        // 12px - pill-like but not full
    buttonSm: '0.5rem',       // 8px
    buttonLg: '1rem',         // 16px
    card: '1.5rem',           // 24px
    cardSm: '1rem',           // 16px
    cardLg: '2rem',           // 32px
    input: '0.75rem',         // 12px
    badge: '9999px',          // full pill
    avatar: '9999px',         // full circle
    dropdown: '0.75rem',      // 12px
    modal: '1.5rem',          // 24px
    tooltip: '0.5rem',        // 8px
    popover: '0.75rem',       // 12px
    sheet: '1.5rem',          // 24px
    table: '0.5rem',          // 8px
    tab: '0.5rem',            // 8px
    progress: '9999px',       // full
    slider: '9999px',         // full
    switch: '9999px',         // full
    checkbox: '0.25rem',      // 4px
    radio: '9999px',          // full
  },

  // Fluid radius for responsive components
  fluid: {
    card: 'clamp(1rem, 2.5vw, 1.5rem)',      // 16-24px
    cardSm: 'clamp(0.75rem, 2vw, 1rem)',     // 12-16px
    button: 'clamp(0.5rem, 1.5vw, 0.75rem)', // 8-12px
    modal: 'clamp(1rem, 2vw, 1.5rem)',       // 16-24px
  },
} as const;

export type RadiusTokens = typeof radius;