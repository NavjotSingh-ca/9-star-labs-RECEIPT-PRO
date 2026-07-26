/**
 * Breakpoint & Media Query Tokens
 * Mobile-first, fluid approach
 */

export const breakpoints = {
  // Breakpoint values (mobile-first)
  values: {
    xs: '320px',
    sm: '640px',
    md: '768px',
    lg: '1024px',
    xl: '1280px',
    '2xl': '1536px',
    '3xl': '1920px',
  },

  // Media query strings
  media: {
    xs: '@media (min-width: 320px)',
    sm: '@media (min-width: 640px)',
    md: '@media (min-width: 768px)',
    lg: '@media (min-width: 1024px)',
    xl: '@media (min-width: 1280px)',
    '2xl': '@media (min-width: 1536px)',
    '3xl': '@media (min-width: 1920px)',

    // Max-width queries (for mobile-first overrides)
    maxXs: '@media (max-width: 319px)',
    maxSm: '@media (max-width: 639px)',
    maxMd: '@media (max-width: 767px)',
    maxLg: '@media (max-width: 1023px)',
    maxXl: '@media (max-width: 1279px)',
    max2xl: '@media (max-width: 1535px)',

    // Range queries
    smOnly: '@media (min-width: 640px) and (max-width: 767px)',
    mdOnly: '@media (min-width: 768px) and (max-width: 1023px)',
    lgOnly: '@media (min-width: 1024px) and (max-width: 1279px)',
    xlOnly: '@media (min-width: 1280px) and (max-width: 1535px)',

    // Touch/hover
    hover: '@media (hover: hover) and (pointer: fine)',
    touch: '@media (hover: none) and (pointer: coarse)',

    // Reduced motion
    reduceMotion: '@media (prefers-reduced-motion: reduce)',
    noReduceMotion: '@media (prefers-reduced-motion: no-preference)',

    // Dark/light
    dark: '@media (prefers-color-scheme: dark)',
    light: '@media (prefers-color-scheme: light)',

    // High contrast
    highContrast: '@media (prefers-contrast: more)',

    // Orientation
    portrait: '@media (orientation: portrait)',
    landscape: '@media (orientation: landscape)',

    // Retina
    retina: '@media (-webkit-min-device-pixel-ratio: 2), (min-resolution: 192dpi)',
  },

  // Container queries (for component-level responsiveness)
  container: {
    sm: '@container (min-width: 320px)',
    md: '@container (min-width: 480px)',
    lg: '@container (min-width: 768px)',
    xl: '@container (min-width: 1024px)',
  },

  // Fluid breakpoints (for clamp-based fluid sizing)
  fluid: {
    xs: '320px',
    sm: '640px',
    md: '768px',
    lg: '1024px',
    xl: '1280px',
    '2xl': '1536px',
  },
} as const;

export type BreakpointTokens = typeof breakpoints;