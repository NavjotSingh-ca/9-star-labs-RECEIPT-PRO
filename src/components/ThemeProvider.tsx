'use client';

import { ThemeProvider as NextThemesProvider } from 'next-themes';
import { type ThemeProviderProps } from 'next-themes';

/**
 * ThemeProvider — Wraps next-themes ThemeProvider with `class` attribute strategy,
 * `system` default theme, and system preference detection enabled.
 * All children inherit theme context for CSS-variable-based theming.
 */
export function ThemeProvider({ children, ...props }: ThemeProviderProps) {
  return (
    <NextThemesProvider
      {...props}
      attribute="class"
      defaultTheme="system"
      enableSystem
    >
      {children}
    </NextThemesProvider>
  );
}
