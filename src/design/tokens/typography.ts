/**
 * Typography tokens — centralized type scale and font config.
 * Used by all UI primitives and layout components.
 */

export const typography = {
  fontFamily: {
    sans: ['Geist Variable', 'ui-sans-serif', 'system-ui', 'sans-serif'],
    mono: ['Geist Mono Variable', 'ui-monospace', 'SFMono-Regular', 'monospace'],
  },

  fontSize: {
    xs: '0.75rem',      // 12px
    sm: '0.875rem',     // 14px
    base: '1rem',       // 16px
    lg: '1.125rem',     // 18px
    xl: '1.25rem',      // 20px
    '2xl': '1.5rem',    // 24px
    '3xl': '1.875rem',  // 30px
    '4xl': '2.25rem',   // 36px
    '5xl': '3rem',      // 48px
  },

  fontWeight: {
    normal: 400,
    medium: 500,
    semibold: 600,
    bold: 700,
  },

  lineHeight: {
    tight: 1.25,
    normal: 1.5,
    relaxed: 1.75,
  },

  letterSpacing: {
    tight: '-0.02em',
    normal: '0',
    wide: '0.01em',
    wider: '0.05em',
  },

  // Semantic text styles
  styles: {
    // Headings
    h1: {
      fontSize: '2.25rem',    // 36px
      fontWeight: 700,
      lineHeight: 1.25,
      letterSpacing: '-0.02em',
    },
    h2: {
      fontSize: '1.875rem',   // 30px
      fontWeight: 700,
      lineHeight: 1.25,
      letterSpacing: '-0.02em',
    },
    h3: {
      fontSize: '1.5rem',     // 24px
      fontWeight: 600,
      lineHeight: 1.3,
      letterSpacing: '-0.01em',
    },
    h4: {
      fontSize: '1.25rem',    // 20px
      fontWeight: 600,
      lineHeight: 1.4,
      letterSpacing: '0',
    },
    h5: {
      fontSize: '1.125rem',   // 18px
      fontWeight: 600,
      lineHeight: 1.4,
      letterSpacing: '0',
    },
    h6: {
      fontSize: '1rem',       // 16px
      fontWeight: 600,
      lineHeight: 1.5,
      letterSpacing: '0',
    },

    // Body
    body: {
      fontSize: '1rem',       // 16px
      fontWeight: 400,
      lineHeight: 1.5,
      letterSpacing: '0',
    },
    bodySm: {
      fontSize: '0.875rem',   // 14px
      fontWeight: 400,
      lineHeight: 1.5,
      letterSpacing: '0',
    },
    bodyXs: {
      fontSize: '0.75rem',    // 12px
      fontWeight: 400,
      lineHeight: 1.5,
      letterSpacing: '0',
    },

    // Labels / UI text
    label: {
      fontSize: '0.875rem',   // 14px
      fontWeight: 500,
      lineHeight: 1.5,
      letterSpacing: '0',
    },
    labelSm: {
      fontSize: '0.75rem',    // 12px
      fontWeight: 500,
      lineHeight: 1.5,
      letterSpacing: '0.01em',
    },

    // Numbers / data
    number: {
      fontSize: '1rem',
      fontWeight: 600,
      lineHeight: 1.4,
      letterSpacing: '0',
      fontVariantNumeric: 'tabular-nums',
    },
    numberLg: {
      fontSize: '1.5rem',
      fontWeight: 700,
      lineHeight: 1.2,
      letterSpacing: '-0.02em',
      fontVariantNumeric: 'tabular-nums',
    },
    numberXl: {
      fontSize: '2.25rem',
      fontWeight: 700,
      lineHeight: 1.1,
      letterSpacing: '-0.02em',
      fontVariantNumeric: 'tabular-nums',
    },
    number2xl: {
      fontSize: '3rem',
      fontWeight: 700,
      lineHeight: 1.05,
      letterSpacing: '-0.02em',
      fontVariantNumeric: 'tabular-nums',
    },

    // Captions / metadata
    caption: {
      fontSize: '0.75rem',    // 12px
      fontWeight: 400,
      lineHeight: 1.5,
      letterSpacing: '0.01em',
    },
    captionStrong: {
      fontSize: '0.75rem',
      fontWeight: 600,
      lineHeight: 1.5,
      letterSpacing: '0.01em',
    },

    // Code / monospace
    code: {
      fontSize: '0.875rem',
      fontWeight: 400,
      lineHeight: 1.6,
      letterSpacing: '0',
      fontFamily: 'monospace',
    },
  },
} as const;

export type Typography = typeof typography;
export default typography;