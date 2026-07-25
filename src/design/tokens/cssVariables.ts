/**
 * CSS Variable Mapping — Maps design tokens to CSS custom properties.
 * Import this in globals.css or use the CSS variables directly.
 * All variables are defined on :root (light mode) and .dark (dark mode).
 */

export const cssVariables = `
:root {
  /* Core surfaces */
  --color-obsidian: #0C0C0C;
  --color-obsidian-hover: #141414;
  --color-surface: #FAFAFA;
  --color-surface-raised: #FFFFFF;
  --color-surface-hover: #F5F5F5;

  /* Brand — Champagne */
  --color-champagne: #BE9A7E;
  --color-champagne-dim: #8B7355;
  --color-champagne-glow: #E8D5C0;
  --color-champagne-soft: #F5EEDD;

  /* Semantic */
  --color-success: #10B981;
  --color-success-soft: #D1FAE5;
  --color-warning: #F59E0B;
  --color-warning-soft: #FEF3C7;
  --color-danger: #EF4444;
  --color-danger-soft: #FEE2E2;
  --color-info: #3B82F6;
  --color-info-soft: #DBEAFE;

  /* Text hierarchy */
  --color-text-primary: #0C0C0C;
  --color-text-secondary: #3F3F46;
  --color-text-muted: #71717A;
  --color-text-inverse: #FAFAFA;

  /* Borders */
  --color-border-subtle: #E4E4E7;
  --color-border-default: #D4D4D8;
  --color-color-border-strong: #A1A1AA;

  /* Glass/borders for cards */
  --color-glass-border: rgba(190,154,126,0.12);
  --color-glass-border-hover: rgba(190,154,126,0.24);

  /* Sidebar (always dark) */
  --color-sidebar-bg: #09090B;
  --color-sidebar-surface: #111113;
  --color-sidebar-active: #18181B;
  --color-sidebar-border: #27272A;
  --color-sidebar-text: #FAFAFA;
  --color-sidebar-text-muted: #A1A1AA;
  --color-sidebar-accent: #BE9A7E;

  /* Spacing */
  --space-0: 0;
  --space-1: 0.25rem;
  --space-2: 0.5rem;
  --space-3: 0.75rem;
  --space-4: 1rem;
  --space-5: 1.25rem;
  --space-6: 1.5rem;
  --space-8: 2rem;
  --space-10: 2.5rem;
  --space-12: 3rem;
  --space-16: 4rem;
  --space-20: 5rem;
  --space-24: 6rem;

  /* Radius */
  --radius-none: 0;
  --radius-sm: 0.375rem;
  --radius-md: 0.5rem;
  --radius-lg: 0.75rem;
  --radius-xl: 1rem;
  --radius-2xl: 1.5rem;
  --radius-3xl: 2rem;
  --radius-full: 9999px;

  /* Typography */
  --font-sans: 'Geist Variable', ui-sans-serif, system-ui, sans-serif;
  --font-mono: 'Geist Mono Variable', ui-monospace, SFMono-Regular, monospace;

  --text-xs: 0.75rem;
  --text-sm: 0.875rem;
  --text-base: 1rem;
  --text-lg: 1.125rem;
  --text-xl: 1.25rem;
  --text-2xl: 1.5rem;
  --text-3xl: 1.875rem;
  --text-4xl: 2.25rem;
  --text-5xl: 3rem;

  --leading-tight: 1.25;
  --leading-normal: 1.5;
  --leading-relaxed: 1.75;

  --font-normal: 400;
  --font-medium: 500;
  --font-semibold: 600;
  --font-bold: 700;

  --tracking-tight: -0.02em;
  --tracking-normal: 0;
  --tracking-wide: 0.01em;
  --tracking-wider: 0.05em;

  /* Shadows */
  --shadow-none: none;
  --shadow-xs: 0 1px 2px 0 rgb(0 0 0 / 0.03);
  --shadow-sm: 0 1px 3px 0 rgb(0 0 0 / 0.06), 0 1px 2px -1px rgb(0 0 0 / 0.06);
  --shadow-md: 0 4px 6px -1px rgb(0 0 0 / 0.06), 0 2px 4px -2px rgb(0 0 0 / 0.06);
  --shadow-lg: 0 10px 15px -3px rgb(0 0 0 / 0.06), 0 4px 6px -4px rgb(0 0 0 / 0.06);
  --shadow-xl: 0 20px 25px -5px rgb(0 0 0 / 0.06), 0 8px 10px -6px rgb(0 0 0 / 0.06);
  --shadow-2xl: 0 25px 50px -12px rgb(0 0 0 / 0.12);
  --shadow-inner: inset 0 2px 4px 0 rgb(0 0 0 / 0.05);
  --shadow-champagne-glow: 0 0 0 1px rgba(190,154,126,0.2), 0 8px 24px -8px rgba(190,154,126,0.3);

  /* Transitions */
  --transition-fast: 120ms cubic-bezier(0.4, 0, 0.2, 1);
  --transition-normal: 200ms cubic-bezier(0.4, 0, 0.2, 1);
  --transition-slow: 300ms cubic-bezier(0.4, 0, 0.2, 1);
  --transition-spring: 400ms cubic-bezier(0.34, 1.56, 0.64, 1);

  /* Z-index */
  --z-hide: -1;
  --z-base: 0;
  --z-dropdown: 100;
  --z-sticky: 200;
  --z-fixed: 300;
  --z-modal-backdrop: 400;
  --z-modal: 500;
  --z-popover: 600;
  --z-tooltip: 700;
  --z-toast: 800;

  /* Layout */
  --sidebar-width: 16rem;
  --sidebar-width-collapsed: 4rem;
  --header-height: 4rem;
  --header-height-mobile: 3.5rem;
  --mobile-nav-height: 3.5rem;
}

/* Dark mode overrides */
.dark {
  --color-obsidian: #FAFAFA;
  --color-obsidian-hover: #F5F5F5;
  --color-surface: #0C0C0C;
  --color-surface-raised: #18181B;
  --color-surface-hover: #27272A;

  --color-champagne: #D4B896;
  --color-champagne-dim: #A89070;
  --color-champagne-glow: #E8D5C0;
  --color-champagne-soft: #2A241E;

  --color-success: #34D399;
  --color-success-soft: #064E3B;
  --color-warning: #FBBF24;
  --color-warning-soft: #78350F;
  --color-danger: #F87171;
  --color-danger-soft: #7F1D1D;
  --color-info: #60A5FA;
  --color-info-soft: #1E3A5F;

  --color-text-primary: #FAFAFA;
  --color-text-secondary: #E4E4E7;
  --color-text-muted: #A1A1AA;
  --color-text-inverse: #0C0C0C;

  --color-border-subtle: #27272A;
  --color-border-default: #3F3F46;
  --color-border-strong: #52525B;

  --color-glass-border: rgba(212,184,150,0.12);
  --color-glass-border-hover: rgba(212,184,150,0.24);

  --shadow-champagne-glow: 0 0 0 1px rgba(212,184,150,0.2), 0 8px 24px -8px rgba(212,184,150,0.3);
}

/* Reduced motion */
@media (prefers-reduced-motion: reduce) {
  *,
  *::before,
  *::after {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
    scroll-behavior: auto !important;
  }
}

/* Focus visible */
*:focus-visible {
  outline: 2px solid var(--color-champagne);
  outline-offset: 2px;
}

/* Scrollbar */
* {
  scrollbar-width: thin;
  scrollbar-color: var(--color-border-default) transparent;
}
*::-webkit-scrollbar {
  width: 8px;
  height: 8px;
}
*::-webkit-scrollbar-track {
  background: transparent;
}
*::-webkit-scrollbar-thumb {
  background: var(--color-border-default);
  border-radius: 4px;
}
*::-webkit-scrollbar-thumb:hover {
  background: var(--color-border-strong);
}

/* Selection */
::selection {
  background: var(--color-champagne);
  color: var(--color-text-inverse);
}
` as const;

export default cssVariables;