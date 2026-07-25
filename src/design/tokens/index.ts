/**
 * Design Tokens — Single source of truth for all visual values.
 * Do not hardcode colors, spacing, or typography anywhere else.
 * Import from '@design/tokens' in all visual code.
 */

export const colors = {
  // Core surfaces
  obsidian: '#0C0C0C',
  'obsidian-hover': '#141414',
  surface: '#FAFAFA',
  'surface-raised': '#FFFFFF',
  'surface-hover': '#F5F5F5',

  // Brand — Champagne (amber/gold)
  champagne: '#BE9A7E',
  'champagne-dim': '#8B7355',
  'champagne-glow': '#E8D5C0',
  'champagne-soft': '#F5EEDD',

  // Semantic
  success: '#10B981',
  'success-soft': '#D1FAE5',
  warning: '#F59E0B',
  'warning-soft': '#FEF3C7',
  danger: '#EF4444',
  'danger-soft': '#FEE2E2',
  info: '#3B82F6',
  'info-soft': '#DBEAFE',

  // Text hierarchy
  'text-primary': '#0C0C0C',
  'text-secondary': '#3F3F46',
  'text-muted': '#71717A',
  'text-inverse': '#FAFAFA',

  // Borders
  'border-subtle': '#E4E4E7',
  'border-default': '#D4D4D8',
  'border-strong': '#A1A1AA',

  // Glass/borders for cards
  'glass-border': 'rgba(190,154,126,0.12)',
  'glass-border-hover': 'rgba(190,154,126,0.24)',

  // Sidebar (always dark)
  'sidebar-bg': '#09090B',
  'sidebar-surface': '#111113',
  'sidebar-active': '#18181B',
  'sidebar-border': '#27272A',
  'sidebar-text': '#FAFAFA',
  'sidebar-text-muted': '#A1A1AA',
  'sidebar-accent': '#BE9A7E',
} as const;

export const spacing = {
  0: '0',
  1: '0.25rem', // 4px
  2: '0.5rem',  // 8px
  3: '0.75rem', // 12px
  4: '1rem',    // 16px
  5: '1.25rem', // 20px
  6: '1.5rem',  // 24px
  8: '2rem',    // 32px
  10: '2.5rem', // 40px
  12: '3rem',   // 48px
  16: '4rem',   // 64px
  20: '5rem',   // 80px
  24: '6rem',   // 96px
} as const;

export const radius = {
  none: '0',
  sm: '0.375rem',   // 6px
  md: '0.5rem',     // 8px
  lg: '0.75rem',    // 12px
  xl: '1rem',       // 16px
  '2xl': '1.5rem',  // 24px
  '3xl': '2rem',    // 32px
  full: '9999px',
} as const;

export const typography = {
  fontFamily: {
    sans: ['Geist Variable', 'ui-sans-serif', 'system-ui', 'sans-serif'],
    mono: ['Geist Mono Variable', 'ui-monospace', 'SFMono-Regular', 'monospace'],
  },
  fontSize: {
    xs: ['0.75rem', { lineHeight: '1rem', letterSpacing: '0.01em' }],
    sm: ['0.875rem', { lineHeight: '1.25rem', letterSpacing: '0.01em' }],
    base: ['1rem', { lineHeight: '1.5rem', letterSpacing: '0' }],
    lg: ['1.125rem', { lineHeight: '1.75rem', letterSpacing: '-0.01em' }],
    xl: ['1.25rem', { lineHeight: '1.75rem', letterSpacing: '-0.01em' }],
    '2xl': ['1.5rem', { lineHeight: '2rem', letterSpacing: '-0.02em' }],
    '3xl': ['1.875rem', { lineHeight: '2.25rem', letterSpacing: '-0.02em' }],
    '4xl': ['2.25rem', { lineHeight: '2.5rem', letterSpacing: '-0.03em' }],
    '5xl': ['3rem', { lineHeight: '1', letterSpacing: '-0.03em' }],
  },
  fontWeight: {
    normal: '400',
    medium: '500',
    semibold: '600',
    bold: '700',
  },
  letterSpacing: {
    tight: '-0.02em',
    normal: '0',
    wide: '0.01em',
    wider: '0.05em',
  },
} as const;

export const shadows = {
  none: 'none',
  xs: '0 1px 2px 0 rgb(0 0 0 / 0.03)',
  sm: '0 1px 3px 0 rgb(0 0 0 / 0.06), 0 1px 2px -1px rgb(0 0 0 / 0.06)',
  md: '0 4px 6px -1px rgb(0 0 0 / 0.06), 0 2px 4px -2px rgb(0 0 0 / 0.06)',
  lg: '0 10px 15px -3px rgb(0 0 0 / 0.06), 0 4px 6px -4px rgb(0 0 0 / 0.06)',
  xl: '0 20px 25px -5px rgb(0 0 0 / 0.06), 0 8px 10px -6px rgb(0 0 0 / 0.06)',
  '2xl': '0 25px 50px -12px rgb(0 0 0 / 0.12)',
  inner: 'inset 0 2px 4px 0 rgb(0 0 0 / 0.05)',
  // Brand-aware
  'champagne-glow': '0 0 0 1px rgba(190,154,126,0.2), 0 8px 24px -8px rgba(190,154,126,0.3)',
} as const;

export const transitions = {
  fast: '120ms cubic-bezier(0.4, 0, 0.2, 1)',
  normal: '200ms cubic-bezier(0.4, 0, 0.2, 1)',
  slow: '300ms cubic-bezier(0.4, 0, 0.2, 1)',
  spring: '400ms cubic-bezier(0.34, 1.56, 0.64, 1)',
} as const;

export const zIndex = {
  hide: -1,
  base: 0,
  dropdown: 100,
  sticky: 200,
  fixed: 300,
  modalBackdrop: 400,
  modal: 500,
  popover: 600,
  tooltip: 700,
  toast: 800,
} as const;

export const breakpoints = {
  sm: '640px',
  md: '768px',
  lg: '1024px',
  xl: '1280px',
  '2xl': '1536px',
} as const;

export const layout = {
  sidebar: {
    width: '16rem',      // 256px
    widthCollapsed: '4rem', // 64px
  },
  header: {
    height: '4rem',      // 64px
    heightMobile: '3.5rem', // 56px
  },
  mobileNav: {
    height: '3.5rem',    // 56px
  },
  maxWidth: {
    sm: '24rem',
    md: '28rem',
    lg: '32rem',
    xl: '36rem',
    '2xl': '42rem',
    '3xl': '48rem',
    '4xl': '56rem',
    '5xl': '64rem',
    '6xl': '72rem',
    '7xl': '80rem',
    full: '100%',
  },
} as const;

export const tokens = {
  colors,
  spacing,
  radius,
  typography,
  shadows,
  transitions,
  zIndex,
  breakpoints,
  layout,
} as const;

export type Tokens = typeof tokens;
export type Colors = typeof colors;
export type Spacing = typeof spacing;
export type Radius = typeof radius;
export type Typography = typeof typography;
export type Shadows = typeof shadows;
export type Transitions = typeof transitions;
export type ZIndex = typeof zIndex;
export type Breakpoints = typeof breakpoints;
export type Layout = typeof layout;