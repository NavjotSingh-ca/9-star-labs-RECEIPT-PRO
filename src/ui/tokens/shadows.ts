/**
 * Shadow System — Layered Depth
 * Tinted shadows (never pure black), elevation-based
 */

export const shadows = {
  // Base shadows (tinted with brand for warmth)
  none: 'none',
  xs: '0 1px 2px 0 rgb(0 0 0 / 0.03)',
  sm: '0 1px 3px 0 rgb(0 0 0 / 0.06), 0 1px 2px -1px rgb(0 0 0 / 0.06)',
  md: '0 4px 6px -1px rgb(0 0 0 / 0.06), 0 2px 4px -2px rgb(0 0 0 / 0.06)',
  lg: '0 10px 15px -3px rgb(0 0 0 / 0.06), 0 4px 6px -4px rgb(0 0 0 / 0.06)',
  xl: '0 20px 25px -5px rgb(0 0 0 / 0.06), 0 8px 10px -6px rgb(0 0 0 / 0.06)',
  '2xl': '0 25px 50px -12px rgb(0 0 0 / 0.12)',
  inner: 'inset 0 2px 4px 0 rgb(0 0 0 / 0.05)',

  // Brand-tinted glows
  brand: {
    glow: '0 0 0 1px rgba(190,154,126,0.2), 0 8px 24px -8px rgba(190,154,126,0.3)',
    glowHover: '0 0 0 1px rgba(190,154,126,0.35), 0 16px 48px -12px rgba(190,154,126,0.45)',
    glowStrong: '0 0 0 2px rgba(190,154,126,0.3), 0 24px 64px -16px rgba(190,154,126,0.5)',
    subtle: '0 0 12px rgba(190,154,126,0.15)',
  },

  // Elevation system (material-inspired)
  elevation: {
    0: 'none',
    1: '0 1px 3px 0 rgb(0 0 0 / 0.06), 0 1px 2px -1px rgb(0 0 0 / 0.06)',
    2: '0 4px 6px -1px rgb(0 0 0 / 0.06), 0 2px 4px -2px rgb(0 0 0 / 0.06)',
    3: '0 10px 15px -3px rgb(0 0 0 / 0.06), 0 4px 6px -4px rgb(0 0 0 / 0.06)',
    4: '0 20px 25px -5px rgb(0 0 0 / 0.06), 0 8px 10px -6px rgb(0 0 0 / 0.06)',
    5: '0 25px 50px -12px rgb(0 0 0 / 0.12)',

    // With inner highlight for "raised" feel
    raised1: '0 1px 3px 0 rgb(0 0 0 / 0.06), 0 1px 2px -1px rgb(0 0 0 / 0.06), inset 0 1px 0 rgb(255 255 255 / 0.05)',
    raised2: '0 4px 6px -1px rgb(0 0 0 / 0.06), 0 2px 4px -2px rgb(0 0 0 / 0.06), inset 0 1px 0 rgb(255 255 255 / 0.05)',
    raised3: '0 10px 15px -3px rgb(0 0 0 / 0.06), 0 4px 6px -4px rgb(0 0 0 / 0.06), inset 0 1px 0 rgb(255 255 255 / 0.05)',
    raised4: '0 20px 25px -5px rgb(0 0 0 / 0.06), 0 8px 10px -6px rgb(0 0 0 / 0.06), inset 0 1px 0 rgb(255 255 255 / 0.05)',
  },

  // Component-specific
  component: {
    card: '0 1px 3px 0 rgb(0 0 0 / 0.06), 0 1px 2px -1px rgb(0 0 0 / 0.06)',
    cardHover: '0 10px 25px -5px rgb(0 0 0 / 0.1), 0 4px 10px -4px rgb(0 0 0 / 0.06)',
    cardInteractive: '0 4px 6px -1px rgb(0 0 0 / 0.06), 0 2px 4px -2px rgb(0 0 0 / 0.06)',

    button: '0 4px 14px 0 rgba(190,154,126,0.2)',
    buttonHover: '0 4px 28px 0 rgba(190,154,126,0.4)',
    buttonActive: '0 2px 4px 0 rgba(190,154,126,0.15)',

    dropdown: '0 20px 25px -5px rgb(0 0 0 / 0.1), 0 8px 10px -6px rgb(0 0 0 / 0.04)',
    modal: '0 25px 50px -12px rgb(0 0 0 / 0.25), 0 0 0 1px rgba(190,154,126,0.1)',
    popover: '0 10px 15px -3px rgb(0 0 0 / 0.08), 0 4px 6px -4px rgb(0 0 0 / 0.04)',
    tooltip: '0 4px 6px -1px rgb(0 0 0 / 0.08)',

    sidebar: 'inset -1px 0 0 rgba(190,154,126,0.1)',
    header: '0 1px 0 rgba(190,154,126,0.08)',
    sheet: '0 25px 50px -12px rgb(0 0 0 / 0.25)',

    focus: '0 0 0 2px rgba(190,154,126,0.4)',
    focusInset: 'inset 0 0 0 2px rgba(190,154,126,0.4)',
  },

  // Glass/frost effects
  glass: {
    light: 'inset 0 1px 0 rgba(255,255,255,0.1)',
    dark: 'inset 0 1px 0 rgba(255,255,255,0.05)',
    border: '1px solid rgba(190,154,126,0.12)',
    borderHover: '1px solid rgba(190,154,126,0.24)',
  },

  // Scroll shadows (for indicating scrollable content)
  scroll: {
    top: 'linear-gradient(to bottom, var(--color-bg-surface), transparent)',
    bottom: 'linear-gradient(to top, var(--color-bg-surface), transparent)',
    left: 'linear-gradient(to right, var(--color-bg-surface), transparent)',
    right: 'linear-gradient(to left, var(--color-bg-surface), transparent)',
  },
} as const;

export type ShadowTokens = typeof shadows;