import type { Metadata, Viewport } from 'next';
import localFont from 'next/font/local';
import { Toaster } from 'sonner';
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
  title: '9 Star Labs — CRA-Ready Receipt Intelligence',
  description:
    'Enterprise-grade Canadian receipt capture with SHA-256 integrity, CRA compliance scoring, and structured audit exports. Built for Canadian businesses and their accountants.',
  manifest: '/manifest.json',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'black-translucent',
    title: '9 Star Labs',
  },
  keywords: ['receipt scanner', 'CRA', 'Canadian tax', 'GST', 'HST', 'PST', 'expense tracking', 'audit trail'],
  authors: [{ name: '9 Star Labs' }],
  creator: '9 Star Labs',
  publisher: '9 Star Labs',
  robots: 'index, follow',
  openGraph: {
    title: '9 Star Labs — CRA-Ready Receipt Intelligence',
    description: 'The CRA-compliant receipt intelligence suite for Canadian contractors.',
    type: 'website',
    locale: 'en_CA',
    siteName: '9 Star Labs',
  },
  twitter: {
    card: 'summary_large_image',
    title: '9 Star Labs — CRA-Ready Receipt Intelligence',
    description: 'The CRA-compliant receipt intelligence suite for Canadian contractors.',
  },
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
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
        <meta name="apple-mobile-web-app-title" content="9 Star Labs" />
        <meta name="application-name" content="9 Star Labs" />
        <meta name="msapplication-TileColor" content="#0c0c0c" />
        <meta name="format-detection" content="telephone=no" />
        <link rel="preconnect" href="https://js.stripe.com" />
        <link rel="preconnect" href="https://generativelanguage.googleapis.com" />
        <link rel="dns-prefetch" href="https://*.supabase.co" />
      </head>
      <body className="font-sans antialiased selection:bg-champagne/30" suppressHydrationWarning>
        <a href="#main-content" className="sr-only focus:not-sr-only focus:fixed focus:top-4 focus:left-4 focus:z-[9999] focus:px-4 focus:py-2 focus:bg-champagne focus:text-black focus:rounded-lg focus:font-semibold focus:shadow-lg focus:outline-none">
          Skip to main content
        </a>
        <NextTopLoader color="#bea98e" height={2} showSpinner={false} />
        <PostHogProvider>
          <SmoothScroll>
            <Providers>
              {children}
              <Toaster position="bottom-right" richColors />
            </Providers>
          </SmoothScroll>
        </PostHogProvider>
      </body>
    </html>
  );
}
