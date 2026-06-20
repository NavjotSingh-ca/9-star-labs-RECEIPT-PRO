import type { Preview, Decorator } from '@storybook/react';
import React from 'react';
import '../src/app/globals.css';

/* ─── Geist font via CSS @font-face (same weight range as next/font/local) ─── */
const geistStyleId = 'storybook-geist-font';
if (typeof document !== 'undefined' && !document.getElementById(geistStyleId)) {
  const style = document.createElement('style');
  style.id = geistStyleId;
  style.textContent = `
    @font-face {
      font-family: 'Geist Variable';
      src: url('/fonts/Geist-Variable.woff2') format('woff2');
      font-weight: 100 900;
      font-display: swap;
    }
  `;
  document.head.appendChild(style);
}

/* ─── Theme Decorator ─── */

/* Inline <style> for data-theme attribute support */
const themeStyleId = 'storybook-theme-style';
if (typeof document !== 'undefined' && !document.getElementById(themeStyleId)) {
  const style = document.createElement('style');
  style.id = themeStyleId;
  style.textContent = `
    html[data-theme='dark'] .sb-theme-toggle-btn .sun-icon { display: none; }
    html[data-theme='dark'] .sb-theme-toggle-btn .moon-icon { display: inline; }
    html[data-theme='light'] .sb-theme-toggle-btn .moon-icon { display: none; }
    html[data-theme='light'] .sb-theme-toggle-btn .sun-icon { display: inline; }
  `;
  document.head.appendChild(style);
}

function applyTheme(theme: 'light' | 'dark') {
  if (typeof document === 'undefined') return;
  document.documentElement.setAttribute('data-theme', theme);
  document.documentElement.classList.toggle('dark', theme === 'dark');
  localStorage.setItem('storybook-theme', theme);
}

/* Initialise from localStorage or system */
if (typeof document !== 'undefined') {
  const stored = localStorage.getItem('storybook-theme') as 'light' | 'dark' | null;
  if (stored) {
    applyTheme(stored);
  } else {
    applyTheme(window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light');
  }
}

export const decorators: Decorator[] = [
  (Story, context) => {
    const [theme, setTheme] = React.useState<'light' | 'dark'>(() => {
      if (typeof document === 'undefined') return 'light';
      const stored = localStorage.getItem('storybook-theme') as 'light' | 'dark' | null;
      return stored ?? (document.documentElement.classList.contains('dark') ? 'dark' : 'light');
    });

    const toggle = () => {
      const next = theme === 'light' ? 'dark' : 'light';
      setTheme(next);
      applyTheme(next);
    };

    React.useEffect(() => {
      if (typeof document === 'undefined') return;
      applyTheme(theme);
    }, [theme]);

    return (
      <div
        style={{
          fontFamily: "'Geist Variable', ui-sans-serif, system-ui, sans-serif",
          minHeight: '100vh',
          padding: '1.5rem',
          background: 'var(--obsidian)',
          color: 'var(--text-primary)',
          position: 'relative',
        }}
      >
        <button
          type="button"
          onClick={toggle}
          className="sb-theme-toggle-btn"
          title={`Switch to ${theme === 'light' ? 'dark' : 'light'} mode`}
          style={{
            position: 'fixed',
            top: 12,
            right: 12,
            zIndex: 9999,
            width: 36,
            height: 36,
            borderRadius: '50%',
            border: '1px solid var(--glass-border)',
            background: 'var(--surface)',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: 18,
            lineHeight: 1,
            transition: 'all 0.2s',
            boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
          }}
        >
          <span className="sun-icon" style={{ display: theme === 'light' ? 'inline' : 'none' }}>☀️</span>
          <span className="moon-icon" style={{ display: theme === 'dark' ? 'inline' : 'none' }}>🌙</span>
        </button>
        <Story {...context} />
      </div>
    );
  },
];

const preview: Preview = {
  parameters: {
    controls: {
      matchers: {
        color: /(background|color)$/i,
        date: /Date$/i,
      },
    },
    backgrounds: { disable: true },
    docs: {
      toc: true,
    },
    viewport: {
      viewports: {
        mobile: { name: 'Mobile 375px', styles: { width: '375px', height: '812px' } },
        tablet: { name: 'Tablet 768px', styles: { width: '768px', height: '1024px' } },
        desktop: { name: 'Desktop 1280px', styles: { width: '1280px', height: '800px' } },
        wide: { name: 'Wide 1920px', styles: { width: '1920px', height: '1080px' } },
      },
    },
  },
  tags: ['autodocs'],
};

export default preview;
