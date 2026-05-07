import type { Metadata, Viewport } from 'next';
import { Inter } from 'next/font/google';
import { Toaster } from 'sonner';
import './globals.css';
import SmoothScroll from '@/components/SmoothScroll';
import Providers from '@/components/Providers';

const inter = Inter({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-inter',
});

export const metadata: Metadata = {
  title: '9 Star Labs — CRA-Ready Receipt Intelligence',
  description:
    'Enterprise-grade Canadian receipt capture with SHA-256 integrity, CRA compliance scoring, and structured audit exports. Built for Alberta construction businesses and their accountants.',
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
    <html lang="en-CA" dir="ltr" className={inter.variable}>
      <head>
        <meta charSet="utf-8" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
        <meta name="apple-mobile-web-app-title" content="9 Star Labs" />
        <meta name="application-name" content="9 Star Labs" />
        <meta name="msapplication-TileColor" content="#0c0c0c" />
        <meta name="format-detection" content="telephone=no" />
      </head>
      <body className="font-sans antialiased selection:bg-champagne/30">
        <SmoothScroll>
          <Providers>
            {children}
            <Toaster position="top-center" richColors />
          </Providers>
        </SmoothScroll>
      </body>
    </html>
  );
}