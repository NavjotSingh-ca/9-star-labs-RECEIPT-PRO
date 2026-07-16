import type { NextConfig } from "next";
import { withSentryConfig } from "@sentry/nextjs";
import { env } from "./src/lib/env";

// OpenTelemetry instrumentation (runs before app initialization)
if (process.env.NEXT_RUNTIME === 'nodejs' || process.env.NEXT_RUNTIME === 'edge') {
  import('./src/lib/telemetry').then(m => m.initializeTelemetry()).catch(() => {});
}

const config: NextConfig = {
  output: 'standalone',
  images: {
    formats: ['image/avif', 'image/webp'],
    remotePatterns: [
      { protocol: 'https', hostname: '**.supabase.co' },
      { protocol: 'https', hostname: '**.supabase.in' },
      { protocol: 'https', hostname: 'upload.wikimedia.org' },
    ],
    deviceSizes: [640, 750, 828, 1080, 1200, 1920, 2048],
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
  },
  poweredByHeader: false,
  compress: true,
  productionBrowserSourceMaps: false,
  experimental: {
    optimizePackageImports: ['lucide-react', 'recharts', 'framer-motion', 'date-fns', '@radix-ui/react-dialog', '@radix-ui/react-dropdown-menu', '@radix-ui/react-tabs'],
  },
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          { key: 'X-Frame-Options', value: 'DENY' },
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
          { key: 'Permissions-Policy', value: 'camera=(self), microphone=(), geolocation=()' },
          { key: 'Strict-Transport-Security', value: 'max-age=63072000; includeSubDomains; preload' },
          { key: 'X-DNS-Prefetch-Control', value: 'on' },
        ],
      },
    ];
  },
};

// Wrap with bundle analyzer when ANALYZE=true
const wrapped = /* @__PURE__ */ (() => {
  if (process.env.ANALYZE === 'true') {
    return async (cfg: NextConfig) => {
      const { default: withBundleAnalyzer } = await import('@next/bundle-analyzer');
      return withBundleAnalyzer({ enabled: true })(cfg);
    };
  }
  return (cfg: NextConfig) => cfg;
})();

export default withSentryConfig(wrapped(config) as NextConfig, {
  silent: true,
  org: env.SENTRY_ORG || '',
  project: env.SENTRY_PROJECT || '',
  widenClientFileUpload: true,
  tunnelRoute: '/monitoring',
  // Build-time tree-shaking/instrumentation options moved under `webpack.*`.
  // These only take effect under the webpack bundler; this project builds with
  // Turbopack, where they are no-ops, but we keep them configured so they apply
  // automatically if a webpack build is ever used.
  webpack: {
    treeshake: {
      removeDebugLogging: true,
    },
    automaticVercelMonitors: false,
  },
});
