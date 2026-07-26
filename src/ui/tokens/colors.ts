/**
 * Color Tokens — Single Source of Truth
 * Ethereal Glass (SaaS/Tech) Palette: Vantablack base, Champagne accent
 * Dark-mode first (app default), light mode derived
 */

export const colors = {
  // Core Surfaces (Dark Mode - Default)
  bg: {
    canvas: '#050505',           // Vantablack base
    surface: '#0A0A0B',          // Card/sheet background
    surfaceRaised: '#111113',    // Elevated cards
    surfaceHover: '#18181B',     // Hover state
    surfaceOverlay: 'rgba(10,10,11,0.9)', // Modal overlay
  },

  // Brand — Champagne (Single Accent)
  brand: {
    50: '#FDF8F0',
    100: '#F5EEDD',
    200: '#E8DCC0',
    300: '#D4C4A0',
    400: '#BE9A7E',              // Light mode primary
    500: '#BE9A7E',              // Primary
    600: '#A88565',
    700: '#8B7355',              // Dark mode primary
    800: '#6B5942',
    900: '#4D3E2E',
    glow: 'rgba(190,154,126,0.15)',
    glowStrong: 'rgba(190,154,126,0.35)',
  },

  // Semantic
  semantic: {
    success: {
      DEFAULT: '#10B981',
      soft: '#064E3B',
      on: '#FFFFFF',
    },
    warning: {
      DEFAULT: '#F59E0B',
      soft: '#78350F',
      on: '#050505',
    },
    danger: {
      DEFAULT: '#EF4444',
      soft: '#7F1D1D',
      on: '#FFFFFF',
    },
    info: {
      DEFAULT: '#3B82F6',
      soft: '#1E3A5F',
      on: '#FFFFFF',
    },
  },

  // Text Hierarchy
  text: {
    primary: '#FAFAFA',
    secondary: '#E4E4E7',
    muted: '#A1A1AA',
    subtle: '#71717A',
    inverse: '#0C0C0C',
    brand: '#BE9A7E',
  },

  // Borders
  border: {
    subtle: '#27272A',
    DEFAULT: '#3F3F46',
    strong: '#52525B',
    brand: 'rgba(190,154,126,0.2)',
    brandHover: 'rgba(190,154,126,0.4)',
  },

  // Sidebar (Always Dark)
  sidebar: {
    bg: '#09090B',
    surface: '#111113',
    active: '#18181B',
    border: '#27272A',
    text: '#FAFAFA',
    textMuted: '#A1A1AA',
    accent: '#BE9A7E',
  },

  // Glass/Frost
  glass: {
    bg: 'rgba(10,10,11,0.7)',
    border: 'rgba(190,154,126,0.12)',
    borderHover: 'rgba(190,154,126,0.24)',
    highlight: 'rgba(255,255,255,0.05)',
  },

  // Gradients
  gradients: {
    brand: 'linear-gradient(135deg, #BE9A7E 0%, #8B7355 100%)',
    brandSoft: 'linear-gradient(135deg, rgba(190,154,126,0.1) 0%, rgba(139,115,85,0.05) 100%)',
    mesh: 'radial-gradient(ellipse at 50% 50%, rgba(190,154,126,0.08) 0%, transparent 70%)',
    aurora: 'linear-gradient(135deg, rgba(190,154,126,0.08) 0%, rgba(139,115,85,0.04) 50%, transparent 100%)',
  },
} as const;

export type ColorTokens = typeof colors;

// Light Mode Derived (computed from dark tokens)
export const lightColors = {
  bg: {
    canvas: '#FAFAFA',
    surface: '#FFFFFF',
    surfaceRaised: '#FAFAFA',
    surfaceHover: '#F5F5F5',
    surfaceOverlay: 'rgba(255,255,255,0.95)',
  },
  brand: { ...colors.brand },
  semantic: { ...colors.semantic },
  text: {
    primary: '#0C0C0C',
    secondary: '#3F3F46',
    muted: '#71717A',
    subtle: '#A1A1AA',
    inverse: '#FAFAFA',
    brand: '#8B7355',
  },
  border: {
    subtle: '#E4E4E7',
    DEFAULT: '#D4D4D8',
    strong: '#A1A1AA',
    brand: 'rgba(139,115,85,0.2)',
    brandHover: 'rgba(139,115,85,0.4)',
  },
  sidebar: { ...colors.sidebar },
  glass: {
    bg: 'rgba(255,255,255,0.8)',
    border: 'rgba(139,115,85,0.12)',
    borderHover: 'rgba(139,115,85,0.24)',
    highlight: 'rgba(0,0,0,0.02)',
  },
  gradients: {
    brand: 'linear-gradient(135deg, #8B7355 0%, #6B5942 100%)',
    brandSoft: 'linear-gradient(135deg, rgba(139,115,85,0.1) 0%, rgba(107,89,66,0.05) 100%)',
    mesh: 'radial-gradient(ellipse at 50% 50%, rgba(139,115,85,0.08) 0%, transparent 70%)',
    aurora: 'linear-gradient(135deg, rgba(139,115,85,0.08) 0%, rgba(107,89,66,0.04) 50%, transparent 100%)',
  },
} as const;