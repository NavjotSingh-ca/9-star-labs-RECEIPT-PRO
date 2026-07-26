'use client';

import { createContext, useContext, useEffect, useMemo, useState, ReactNode } from 'react';

export type ThemeMode = 'light' | 'dark' | 'system';

export interface DesignTokens {
  colors: Record<string, Record<string, string>>;
  spacing: {
    [key: string]: string | Record<string, string>;
    fluid: Record<string, string>;
    layout: Record<string, string>;
  };
  typography: { fontFamily: Record<string, string> };
  radius: { 
    [key: string]: string | Record<string, string>;
    component: Record<string, string>;
    fluid: Record<string, string>;
  };
  shadows: { 
    [key: string]: string | Record<string, string>;
    brand: Record<string, string>;
  };
  motion: { duration: Record<string, number> };
  zIndex: Record<string, number>;
  breakpoints: { fluid: Record<string, string> };
}

const defaultTokens: DesignTokens = {
  colors: {},
  spacing: { fluid: {} as Record<string, string>, layout: {} as Record<string, string> },
  typography: { fontFamily: {} },
  radius: { component: {} as Record<string, string>, fluid: {} as Record<string, string> },
  shadows: { brand: {} as Record<string, string> },
  motion: { duration: {} },
  zIndex: {},
  breakpoints: { fluid: {} },
};

const ThemeContext = createContext<{
  mode: ThemeMode;
  resolvedMode: 'dark' | 'light';
  setMode: (mode: ThemeMode) => void;
  tokens: DesignTokens;
} | null>(null);

export function ThemeProvider({ children, defaultMode = 'system' }: { children: ReactNode; defaultMode?: ThemeMode }) {
  const [mode, setModeState] = useState<ThemeMode>(() => {
    if (typeof window !== 'undefined') {
      return (localStorage.getItem('theme-mode') as ThemeMode) || defaultMode;
    }
    return defaultMode;
  });

  // Initialize resolvedMode based on mode and system preference
  const [resolvedMode, setResolvedMode] = useState<'dark' | 'light'>(() => {
    if (typeof window !== 'undefined') {
      const storedMode = localStorage.getItem('theme-mode') as ThemeMode | null;
      const effectiveMode = storedMode || defaultMode;
      if (effectiveMode === 'system') {
        return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
      }
      return effectiveMode;
    }
    return 'dark';
  });

  const tokens = useMemo(() => defaultTokens, []);

  // Apply CSS variables to document root
  useEffect(() => {
    const root = document.documentElement;
    const colors = defaultTokens.colors;

    // Apply color variables
    Object.entries(colors).forEach(([category, values]) => {
      if (typeof values === 'object' && values !== null) {
        Object.entries(values).forEach(([key, value]) => {
          root.style.setProperty(`--color-${category}-${key}`, value as string);
        });
      }
    });

    // Apply spacing
    Object.entries(defaultTokens.spacing).forEach(([key, value]) => {
      if (typeof value === 'string' && !key.startsWith('fluid') && !key.startsWith('layout')) {
        root.style.setProperty(`--space-${key}`, value);
      }
    });

    // Apply fluid spacing
    Object.entries(defaultTokens.spacing.fluid).forEach(([key, value]) => {
      root.style.setProperty(`--space-fluid-${key}`, value);
    });

    // Apply layout
    Object.entries(defaultTokens.spacing.layout).forEach(([key, value]) => {
      root.style.setProperty(`--layout-${key}`, value);
    });

    // Apply typography
    Object.entries(defaultTokens.typography.fontFamily).forEach(([key, value]) => {
      root.style.setProperty(`--font-${key}`, value);
    });

    // Apply radius
    Object.entries(defaultTokens.radius).forEach(([key, value]) => {
      if (typeof value === 'string' && !key.startsWith('squircle') && !key.startsWith('component') && !key.startsWith('fluid')) {
        root.style.setProperty(`--radius-${key}`, value);
      }
    });

    // Apply component radius
    Object.entries(defaultTokens.radius.component).forEach(([key, value]) => {
      root.style.setProperty(`--radius-component-${key}`, value);
    });

    // Apply fluid radius
    Object.entries(defaultTokens.radius.fluid).forEach(([key, value]) => {
      root.style.setProperty(`--radius-fluid-${key}`, value);
    });

    // Apply shadows
    Object.entries(defaultTokens.shadows).forEach(([key, value]) => {
      if (typeof value === 'string' && !key.startsWith('brand')) {
        root.style.setProperty(`--shadow-${key}`, value);
      }
    });

    // Apply brand shadows
    Object.entries(defaultTokens.shadows.brand).forEach(([key, value]) => {
      root.style.setProperty(`--shadow-brand-${key}`, value);
    });

    // Apply motion
    Object.entries(defaultTokens.motion.duration).forEach(([key, value]) => {
      root.style.setProperty(`--duration-${key}`, `${value}ms`);
    });

    // Apply z-index
    Object.entries(defaultTokens.zIndex).forEach(([key, value]) => {
      if (typeof value === 'number') {
        root.style.setProperty(`--z-${key}`, String(value));
      }
    });

    // Apply breakpoints as CSS custom properties for container queries
    root.style.setProperty('--breakpoint-sm', defaultTokens.breakpoints.fluid.sm);
    root.style.setProperty('--breakpoint-md', defaultTokens.breakpoints.fluid.md);
    root.style.setProperty('--breakpoint-lg', defaultTokens.breakpoints.fluid.lg);
    root.style.setProperty('--breakpoint-xl', defaultTokens.breakpoints.fluid.xl);
    root.style.setProperty('--breakpoint-2xl', defaultTokens.breakpoints.fluid['2xl']);
  }, []);

  // Resolve system preference - only subscribe, don't set state synchronously
  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    const handleChange = (e: MediaQueryListEvent) => {
      if (mode === 'system') {
        setResolvedMode(e.matches ? 'dark' : 'light');
      }
    };

    if (mode === 'system') {
      mediaQuery.addEventListener('change', handleChange);
    }

    localStorage.setItem('theme-mode', mode);
    document.documentElement.setAttribute('data-theme', resolvedMode);

    return () => mediaQuery.removeEventListener('change', handleChange);
  }, [mode, resolvedMode]);

  const setMode = (newMode: ThemeMode) => {
    setModeState(newMode);
    localStorage.setItem('theme-mode', newMode);
  };

  return (
    <ThemeContext.Provider value={{ mode, resolvedMode, setMode, tokens }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
}

// Utility to get token values with fallback
export function getToken<T extends keyof DesignTokens>(theme: DesignTokens, category: T, ...path: string[]): string {
  let value: unknown = theme[category];
  for (const key of path) {
    if (value && typeof value === 'object' && key in value) {
      value = (value as Record<string, unknown>)[key];
    } else {
      return '';
    }
  }
  return typeof value === 'string' ? value : '';
}