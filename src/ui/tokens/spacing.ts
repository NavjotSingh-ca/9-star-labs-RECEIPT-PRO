/**
 * Spacing System — 4px base unit with fluid scaling
 * All values in rem (1rem = 16px default)
 */

export const spacing = {
  // Base unit
  base: 4, // 4px = 0.25rem

  // Scale (0-24)
  0: '0',
  0.5: '0.125rem',  // 2px
  1: '0.25rem',     // 4px
  1.5: '0.375rem',  // 6px
  2: '0.5rem',      // 8px
  2.5: '0.625rem',  // 10px
  3: '0.75rem',     // 12px
  3.5: '0.875rem',  // 14px
  4: '1rem',        // 16px
  5: '1.25rem',     // 20px
  6: '1.5rem',      // 24px
  7: '1.75rem',     // 28px
  8: '2rem',        // 32px
  9: '2.25rem',     // 36px
  10: '2.5rem',     // 40px
  11: '2.75rem',    // 44px
  12: '3rem',       // 48px
  14: '3.5rem',     // 56px
  16: '4rem',       // 64px
  20: '5rem',       // 80px
  24: '6rem',       // 96px
  28: '7rem',       // 112px
  32: '8rem',       // 128px
  36: '9rem',       // 144px
  40: '10rem',      // 160px
  44: '11rem',      // 176px
  48: '12rem',      // 192px
  52: '13rem',      // 208px
  56: '14rem',      // 224px
  60: '15rem',      // 240px
  64: '16rem',      // 256px
  72: '18rem',      // 288px
  80: '20rem',      // 320px
  96: '24rem',      // 384px

  // Fluid spacing (clamp-based for responsive)
  fluid: {
    // Section padding
    sectionXS: 'clamp(1.5rem, 3vw, 2.5rem)',   // 24-40px
    sectionSM: 'clamp(2rem, 4vw, 3.5rem)',     // 32-56px
    sectionMD: 'clamp(3rem, 6vw, 5rem)',       // 48-80px
    sectionLG: 'clamp(4rem, 8vw, 6rem)',       // 64-96px
    sectionXL: 'clamp(5rem, 10vw, 8rem)',      // 80-128px

    // Container padding
    containerXS: 'clamp(1rem, 3vw, 1.5rem)',   // 16-24px
    containerSM: 'clamp(1.25rem, 4vw, 2rem)',  // 20-32px
    containerMD: 'clamp(1.5rem, 5vw, 2.5rem)', // 24-40px
    containerLG: 'clamp(2rem, 6vw, 3rem)',     // 32-48px

    // Gap
    gapXS: 'clamp(0.5rem, 1.5vw, 0.75rem)',    // 8-12px
    gapSM: 'clamp(0.75rem, 2vw, 1rem)',        // 12-16px
    gapMD: 'clamp(1rem, 2.5vw, 1.5rem)',       // 16-24px
    gapLG: 'clamp(1.5rem, 3vw, 2rem)',         // 24-32px
    gapXL: 'clamp(2rem, 4vw, 3rem)',           // 32-48px

    // Component internal
    cardPadding: 'clamp(1rem, 2.5vw, 1.5rem)',     // 16-24px
    cardGap: 'clamp(0.75rem, 2vw, 1.25rem)',       // 12-20px
    buttonGap: 'clamp(0.5rem, 1.5vw, 0.75rem)',    // 8-12px
    inputGap: 'clamp(0.5rem, 1vw, 0.75rem)',       // 8-12px
  },

  // Layout constants
  layout: {
    sidebarWidth: '16rem',           // 256px
    sidebarCollapsed: '4rem',        // 64px
    headerHeight: '4rem',            // 64px
    headerHeightMobile: '3.5rem',    // 56px
    mobileNavHeight: '3.5rem',       // 56px
    maxContentWidth: '87.5rem',      // 1400px
    maxContentWidthNarrow: '72rem',  // 1152px
  },
} as const;

export type SpacingTokens = typeof spacing;