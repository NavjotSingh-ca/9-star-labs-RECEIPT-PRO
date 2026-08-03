import type { Metadata, Viewport } from 'next';
import localFont from 'next/font/local';
import { Toaster } from 'sonner';
import { APP_NAME, APP_TAGLINE, APP_DESCRIPTION } from '@/lib/constants';
import NextTopLoader from 'nextjs-toploader';
import './globals.css';

import Providers from '@/components/Providers';
import { MainWithTransition } from '@/components/ui/MainWithTransition';

const geist = localFont({
  src: '../../node_modules/geist/dist/fonts/geist-sans/Geist-Variable.woff2',
  display: 'swap',
  variable: '--font-geist',
  weight: '100 900',
  preload: true,
  fallback: ['system-ui', 'sans-serif'],
});

export const metadata: Metadata = {
  title: `${APP_NAME} — ${APP_TAGLINE}`,
  description: APP_DESCRIPTION,
  manifest: '/manifest.json',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'black-translucent',
    title: APP_NAME,
  },
  keywords: ['receipt scanner', 'CRA', 'Canadian tax', 'GST', 'HST', 'PST', 'expense tracking', 'audit trail'],
  authors: [{ name: APP_NAME }],
  creator: APP_NAME,
  publisher: APP_NAME,
  robots: 'index, follow',
  openGraph: {
    title: `${APP_NAME} — ${APP_TAGLINE}`,
    description: 'The CRA-compliant receipt intelligence suite for Canadian contractors.',
    type: 'website',
    locale: 'en_CA',
    siteName: APP_NAME,
  },
  twitter: {
    card: 'summary_large_image',
    title: `${APP_NAME} — ${APP_TAGLINE}`,
    description: 'The CRA-compliant receipt intelligence suite for Canadian contractors.',
  },
};
export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  viewportFit: 'cover',
  themeColor: '#0c0c0c',
};

/**
 * Root layout — provides HTML shell, font loading, global providers,
 * skip-to-content link, toast system, and NextTopLoader.
 * All pages render inside this layout via the `<main>` children slot.
 */
export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en-CA" dir="ltr" className={geist.variable} suppressHydrationWarning>
      <head>
        <meta charSet="utf-8" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
        <meta name="apple-mobile-web-app-title" content={APP_NAME} />
        <meta name="application-name" content={APP_NAME} />
        <meta name="msapplication-TileColor" content="#0c0c0c" />
        <meta name="format-detection" content="telephone=no" />
        <meta name="color-scheme" content="light dark" />
        <link rel="preconnect" href="https://supabase.co" />
        <link rel="dns-prefetch" href="https://generativelanguage.googleapis.com" />
        {/* Geist font preload is handled by next/font/local with preload: true */}
        {/* Features page prefetch moved to LandingPage component only */}
        <noscript>
          <div style={{
            padding: '1rem',
            textAlign: 'center',
            background: '#0c0c0c',
            color: '#f5f5f4',
            fontFamily: 'system-ui, sans-serif',
          }}>
            JavaScript is required to use {APP_NAME}. Please enable JavaScript in your browser.
          </div>
        </noscript>
      </head>
      <body className="font-sans antialiased selection:bg-champagne/30" suppressHydrationWarning>
        <header>
          <a href="#main-content" className="sr-only focus:not-sr-only focus:fixed focus:top-4 focus:left-4 focus:z-[9999] focus:px-4 focus:py-2 focus:bg-champagne focus:text-black focus:rounded-lg focus:font-semibold focus:shadow-lg focus:outline-none">
            Skip to main content
          </a>
        </header>
        <NextTopLoader color="#bea98e" height={2} showSpinner={false} />
        <Providers>
              <MainWithTransition>{children}</MainWithTransition>
              <Toaster
                position="bottom-right"
                richColors
                toastOptions={{
                  style: {
                    fontFamily: 'var(--font-sans)',
                    borderRadius: '1rem',
                    border: '1px solid var(--glass-border)',
                    padding: '12px 16px',
                  },
                  classNames: {
                    success: '!border-emerald-success/20 !shadow-[0_0_24px_-4px_var(--emerald-success)]',
                    error: '!border-danger/20 !shadow-[0_0_24px_-4px_rgba(239,68,68,0.15)]',
                    info: '!border-champagne/20 !shadow-[0_0_24px_-4px_rgba(190,169,142,0.2)]',
                  },
                }}
              />
            </Providers>
      </body>
    </html>
  );
}
