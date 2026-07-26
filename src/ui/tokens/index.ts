// Design tokens for the UI system

export const colors = {
  // Semantic colors
  primary: '#8b7355', // champagne
  primaryHover: '#bea98e',
  primaryLight: '#d4c8b8',
  
  // Surface colors (light mode)
  surface: '#f5f5f4', // zinc-50
  surfaceRaised: '#ffffff',
  surfaceHover: '#e7e5e4', // zinc-100
  
  // Surface colors (dark mode)
  surfaceDark: '#0c0c0c',
  surfaceRaisedDark: '#18181b', // zinc-900
  surfaceHoverDark: '#27272a', // zinc-800
  
  // Text colors
  textPrimary: '#18181b', // zinc-900
  textSecondary: '#52525b', // zinc-600
  textMuted: '#71717a', // zinc-500
  textPrimaryDark: '#fafafa', // zinc-50
  textSecondaryDark: '#a1a1aa', // zinc-400
  textMutedDark: '#71717a', // zinc-500
  
  // Border colors
  border: '#d4d4d8', // zinc-300
  borderHover: '#a1a1aa', // zinc-400
  borderDark: '#27272a', // zinc-800
  borderHoverDark: '#3f3f46', // zinc-700
  
  // Semantic colors
  success: '#059669', // emerald-600
  successLight: '#34d399', // emerald-400
  successDark: '#065f46', // emerald-800
  warning: '#d97706', // amber-600
  warningLight: '#fbbf24', // amber-400
  danger: '#dc2626', // red-600
  dangerLight: '#f87171', // red-400
  info: '#2563eb', // blue-600
  infoLight: '#60a5fa', // blue-400
  
  // Champagne (brand)
  champagne: '#8b7355',
  champagneLight: '#bea98e',
  champagneDark: '#6b5b42',
  
  // Sidebar (always dark)
  sidebarBg: '#09090b', // zinc-950
  sidebarText: '#fafafa', // zinc-50
  sidebarTextMuted: '#71717a', // zinc-500
  sidebarActive: '#8b7355', // champagne
  sidebarActiveText: '#09090b', // zinc-950
  sidebarBorder: '#27272a', // zinc-800
  sidebarHover: '#18181b', // zinc-900
};

export const spacing = {
  0: '0',
  1: '0.25rem',
  2: '0.5rem',
  3: '0.75rem',
  4: '1rem',
  5: '1.25rem',
  6: '1.5rem',
  8: '2rem',
  10: '2.5rem',
  12: '3rem',
  16: '4rem',
  20: '5rem',
  24: '6rem',
};

export const typography = {
  fontFamily: {
    sans: 'Geist Variable, ui-sans-serif, system-ui, sans-serif',
    mono: 'Geist Mono Variable, ui-monospace, SFMono-Regular, monospace',
  },
  fontSize: {
    xs: ['0.75rem', { lineHeight: '1rem' }],
    sm: ['0.875rem', { lineHeight: '1.25rem' }],
    base: ['1rem', { lineHeight: '1.5rem' }],
    lg: ['1.125rem', { lineHeight: '1.75rem' }],
    xl: ['1.25rem', { lineHeight: '1.75rem' }],
    '2xl': ['1.5rem', { lineHeight: '2rem' }],
    '3xl': ['1.875rem', { lineHeight: '2.25rem' }],
    '4xl': ['2.25rem', { lineHeight: '2.5rem' }],
    '5xl': ['3rem', { lineHeight: '1' }],
    '6xl': ['3.75rem', { lineHeight: '1' }],
  },
  fontWeight: {
    normal: '400',
    medium: '500',
    semibold: '600',
    bold: '700',
  },
};

export const radius = {
  none: '0',
  sm: '0.25rem',
  DEFAULT: '0.5rem',
  md: '0.75rem',
  lg: '1rem',
  xl: '1.5rem',
  '2xl': '2rem',
  full: '9999px',
};

export const shadows = {
  sm: '0 1px 2px 0 rgb(0 0 0 / 0.05)',
  DEFAULT: '0 1px 3px 0 rgb(0 0 0 / 0.1), 0 1px 2px -1px rgb(0 0 0 / 0.1)',
  md: '0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)',
  lg: '0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1)',
  xl: '0 20px 25px -5px rgb(0 0 0 / 0.1), 0 8px 10px -6px rgb(0 0 0 / 0.1)',
  '2xl': '0 25px 50px -12px rgb(0 0 0 / 0.25)',
};

export const motion = {
  fast: '150ms',
  normal: '200ms',
  slow: '300ms',
  slower: '500ms',
  easing: {
    default: 'cubic-bezier(0.32, 0.72, 0, 1)',
    spring: 'cubic-bezier(0.16, 1, 0.3, 1)',
    easeOut: 'cubic-bezier(0.16, 1, 0.3, 1)',
  },
};

export const breakpoints = {
  sm: '640px',
  md: '768px',
  lg: '1024px',
  xl: '1280px',
  '2xl': '1536px',
};

export const zIndex = {
  hide: -1,
  base: 0,
  dropdown: 1000,
  sticky: 1100,
  modal: 1300,
  popover: 1400,
  tooltip: 1500,
};