import type { Metadata, Viewport } from 'next';
import localFont from 'next/font/local';
import { Toaster } from 'sonner';
import { APP_NAME, APP_TAGLINE, APP_DESCRIPTION } from '@/lib/constants';
import NextTopLoader from 'nextjs-toploader';
import './globals.css';
import SmoothScroll from '@/components/SmoothScroll';
import Providers from '@/components/Providers';
import { PostHogProvider } from '@/lib/posthog';

const geist = localFont({
  src: '../../node_modules/geist/dist/fonts/geist-sans/Geist-Variable.woff2',
  display: 'swap',
  variable: '--font-geist',
  weight: '100 900',
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
        <link rel="preconnect" href="https://js.stripe.com" />
        <link rel="preconnect" href="https://generativelanguage.googleapis.com" />
        <link rel="dns-prefetch" href="https://*.supabase.co" />
      </head>
      <body className="font-sans antialiased selection:bg-champagne/30" suppressHydrationWarning>
        <header>
          <a href="#main-content" className="sr-only focus:not-sr-only focus:fixed focus:top-4 focus:left-4 focus:z-[9999] focus:px-4 focus:py-2 focus:bg-champagne focus:text-black focus:rounded-lg focus:font-semibold focus:shadow-lg focus:outline-none">
            Skip to main content
          </a>
        </header>
        <NextTopLoader color="#bea98e" height={2} showSpinner={false} />
        <PostHogProvider>
          <SmoothScroll>
            <Providers>
              <main id="main-content" tabIndex={-1} className="outline-none">
                {children}
              </main>
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
          </SmoothScroll>
        </PostHogProvider>
      </body>
    </html>
  );
}
