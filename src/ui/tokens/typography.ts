/**
 * Typography Tokens — Swiss Precision
 * Geist Variable for everything, fluid clamp-based scale
 */

export const typography = {
  // Font Families
  fontFamily: {
    sans: "'Geist Variable', ui-sans-serif, system-ui, sans-serif",
    mono: "'Geist Mono Variable', ui-monospace, SFMono-Regular, monospace",
    display: "'Geist Variable', ui-sans-serif, system-ui, sans-serif",
  },

  // Font Weights
  fontWeight: {
    normal: 400,
    medium: 500,
    semibold: 600,
    bold: 700,
  },

  // Line Heights
  lineHeight: {
    none: 1,
    tight: 1.1,
    snug: 1.25,
    normal: 1.5,
    relaxed: 1.625,
    loose: 1.75,
  },

  // Letter Spacing
  letterSpacing: {
    tighter: '-0.03em',
    tight: '-0.02em',
    normal: '0',
    wide: '0.01em',
    wider: '0.05em',
    widest: '0.1em',
    display: '-0.02em',
  },

  // Fluid Type Scale (clamp-based)
  // Mobile → Desktop scaling
  size: {
    // Display / Hero
    display: {
      xs: 'clamp(2.25rem, 6vw, 3.75rem)',    // 36-60px
      sm: 'clamp(2.5rem, 7vw, 4.5rem)',      // 40-72px
      md: 'clamp(3rem, 8vw, 6rem)',          // 48-96px
      lg: 'clamp(3.5rem, 10vw, 7.5rem)',     // 56-120px
      xl: 'clamp(4rem, 12vw, 9rem)',         // 64-144px
    },

    // Headlines
    h1: {
      xs: 'clamp(1.875rem, 4vw, 2.5rem)',    // 30-40px
      sm: 'clamp(2rem, 4.5vw, 3rem)',        // 32-48px
      md: 'clamp(2.25rem, 5vw, 3.5rem)',     // 36-56px
      lg: 'clamp(2.5rem, 6vw, 4rem)',        // 40-64px
    },

    h2: {
      xs: 'clamp(1.5rem, 3.5vw, 2rem)',      // 24-32px
      sm: 'clamp(1.75rem, 4vw, 2.25rem)',    // 28-36px
      md: 'clamp(2rem, 4.5vw, 2.5rem)',      // 32-40px
      lg: 'clamp(2.25rem, 5vw, 3rem)',       // 36-48px
    },

    h3: {
      xs: 'clamp(1.25rem, 3vw, 1.5rem)',     // 20-24px
      sm: 'clamp(1.375rem, 3.5vw, 1.75rem)', // 22-28px
      md: 'clamp(1.5rem, 4vw, 2rem)',        // 24-32px
      lg: 'clamp(1.75rem, 4.5vw, 2.25rem)',  // 28-36px
    },

    h4: {
      xs: 'clamp(1.125rem, 2.5vw, 1.25rem)', // 18-20px
      sm: 'clamp(1.25rem, 3vw, 1.375rem)',   // 20-22px
      md: 'clamp(1.375rem, 3.5vw, 1.5rem)',  // 22-24px
    },

    // Body
    body: {
      lg: 'clamp(1.125rem, 2vw, 1.25rem)',   // 18-20px
      md: 'clamp(1rem, 1.5vw, 1.125rem)',    // 16-18px
      sm: 'clamp(0.875rem, 1.25vw, 1rem)',   // 14-16px
      xs: 'clamp(0.8125rem, 1vw, 0.875rem)', // 13-14px
    },

    // UI Elements
    ui: {
      button: '0.875rem',     // 14px
      buttonSm: '0.8125rem',  // 13px
      buttonLg: '1rem',       // 16px
      label: '0.75rem',       // 12px
      caption: '0.6875rem',   // 11px
      overline: '0.625rem',   // 10px
    },

    // Numeric / Tabular
    numeric: {
      xs: '0.75rem',
      sm: '0.875rem',
      md: '1rem',
      lg: '1.125rem',
      xl: '1.5rem',
      '2xl': '2rem',
      '3xl': '3rem',
      '4xl': '4rem',
    },
  },

  // Semantic font size mapping
  semantic: {
    // Page titles
    pageTitle: 'var(--text-h1-md)',
    pageSubtitle: 'var(--text-body-lg)',

    // Section headers
    sectionTitle: 'var(--text-h2-md)',
    sectionSubtitle: 'var(--text-body-md)',

    // Cards
    cardTitle: 'var(--text-h3-md)',
    cardSubtitle: 'var(--text-body-sm)',
    cardBody: 'var(--text-body-md)',

    // Data display
    statValue: 'var(--text-numeric-3xl)',
    statLabel: 'var(--text-ui-caption)',
    price: 'var(--text-numeric-2xl)',

    // Navigation
    navLabel: 'var(--text-body-sm)',
    navLabelCollapsed: 'var(--text-ui-caption)',

    // Forms
    inputLabel: 'var(--text-ui-label)',
    inputValue: 'var(--text-body-md)',
    inputHelper: 'var(--text-ui-caption)',
    inputError: 'var(--text-ui-caption)',

    // Buttons
    btnPrimary: 'var(--text-ui-button)',
    btnSecondary: 'var(--text-ui-button)',
    btnLarge: 'var(--text-ui-buttonLg)',
    btnSmall: 'var(--text-ui-buttonSm)',
  },
} as const;

export type TypographyTokens = typeof typography;