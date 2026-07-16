import { z } from 'zod';

const envSchema = z.object({
  NEXT_PUBLIC_SUPABASE_URL: z.string().min(1).url(),
  NEXT_PUBLIC_SUPABASE_ANON_KEY: z.string().min(1),
  // Service role key for server-side admin operations (bypasses RLS)
  SUPABASE_SERVICE_ROLE_KEY: z.string().min(1).optional(),
  GOOGLE_AI_KEY: z.string().min(1).optional(),
  // Stripe (optional — app works without until account created)
  STRIPE_SECRET_KEY: z.string().min(1).optional(),
  NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY: z.string().min(1).optional(),
  STRIPE_WEBHOOK_SECRET: z.string().min(1).optional(),
  // Resend (optional — app works without until account created)
  RESEND_API_KEY: z.string().min(1).optional(),
  RESEND_WEBHOOK_SECRET: z.string().min(1).optional(),
  RESEND_FROM_EMAIL: z.string().email().optional(),
  // Cron/Internal auth
  CRON_SECRET: z.string().min(1).optional(),
  // QBO OAuth
  QBO_CLIENT_ID: z.string().min(1).optional(),
  QBO_CLIENT_SECRET: z.string().min(1).optional(),
  // Token encryption key for OAuth tokens at rest (32-byte hex string)
  TOKEN_ENCRYPTION_KEY: z.string().min(1).optional(),
  // Site URL for redirects
  NEXT_PUBLIC_SITE_URL: z.string().url().optional().default('http://localhost:3000'),
  // Sentry
  NEXT_PUBLIC_SENTRY_DSN: z.string().url().optional(),
  SENTRY_ORG: z.string().min(1).optional(),
  SENTRY_PROJECT: z.string().min(1).optional(),
  // PostHog
  NEXT_PUBLIC_POSTHOG_KEY: z.string().min(1).optional(),
  NEXT_PUBLIC_POSTHOG_HOST: z.string().url().optional().default('https://app.posthog.com'),
  // Supabase Pooler
  USE_POOLER: z.string().optional().default('false'),
  // App identity
  APP_NAME: z.string().min(1).optional().default('Leduc Receipt Pro'),
  APP_TAGLINE: z.string().min(1).optional().default('Gold Standard Receipt Intelligence'),
  APP_DESCRIPTION: z.string().min(1).optional().default('Enterprise-grade receipt management with AI-powered extraction, CRA-compliant mileage, and audit-grade audit trails.'),
  // OpenTelemetry
  OTEL_EXPORTER_OTLP_ENDPOINT: z.string().url().optional(),
  OTEL_EXPORTER_OTLP_HEADERS: z.string().optional(),
}).superRefine((data, ctx) => {
  if (data.RESEND_API_KEY && !data.RESEND_FROM_EMAIL) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: 'RESEND_FROM_EMAIL is required when RESEND_API_KEY is set — email sender address must be configured',
      path: ['RESEND_FROM_EMAIL'],
    });
  }
  if (data.QBO_CLIENT_ID && !data.TOKEN_ENCRYPTION_KEY) {
    if (typeof window === 'undefined') {
      console.warn('[ENV] TOKEN_ENCRYPTION_KEY not set — OAuth tokens will be stored in plaintext');
    }
  }
  // In production, NEXT_PUBLIC_SITE_URL must not be the localhost default.
  // Stripe checkout redirects, QBO OAuth, and password reset links all use this URL.
  // This check uses process.env.NODE_ENV which is the only env var available at module eval time.
  if (data.NEXT_PUBLIC_SITE_URL === 'http://localhost:3000') {
    const nodeEnv = (typeof process !== 'undefined' && process.env?.NODE_ENV) || 'development';
    if (nodeEnv === 'production') {
      // Log as a clear warning rather than throwing — Next.js build runs with NODE_ENV=production
      // even in CI, and NEXT_PUBLIC_SITE_URL may be overridden at deploy time on Vercel.
      // The app will function but Stripe/OAuth redirects will fail until the var is set.
      if (typeof window === 'undefined') {
        console.warn(
          '[ENV] ⚠️  NEXT_PUBLIC_SITE_URL is set to http://localhost:3000 in a production build.\n' +
          '        Stripe redirects, QBO OAuth callbacks, and email links will all point to localhost.\n' +
          '        Set NEXT_PUBLIC_SITE_URL to your actual domain (e.g., https://yourapp.com) in Vercel env vars.'
        );
      }
    }
  }
});

type EnvVar = z.infer<typeof envSchema>;

// In CI mode, accept placeholder/empty values for required Supabase env vars
const isCI = process.env.CI === 'true';

function parseEnv(): EnvVar {
  // Use placeholder values if env vars are empty in CI mode
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || (isCI ? 'https://placeholder.supabase.co' : '');
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || (isCI ? 'placeholder-key' : '');

  const parsed = envSchema.safeParse({
    NEXT_PUBLIC_SUPABASE_URL: supabaseUrl,
    NEXT_PUBLIC_SUPABASE_ANON_KEY: supabaseAnonKey,
    SUPABASE_SERVICE_ROLE_KEY: process.env.SUPABASE_SERVICE_ROLE_KEY,
    GOOGLE_AI_KEY: process.env.GOOGLE_AI_KEY,
    STRIPE_SECRET_KEY: process.env.STRIPE_SECRET_KEY,
    NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY: process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY,
    STRIPE_WEBHOOK_SECRET: process.env.STRIPE_WEBHOOK_SECRET,
    RESEND_API_KEY: process.env.RESEND_API_KEY,
    RESEND_WEBHOOK_SECRET: process.env.RESEND_WEBHOOK_SECRET,
    RESEND_FROM_EMAIL: process.env.RESEND_FROM_EMAIL,
    CRON_SECRET: process.env.CRON_SECRET,
    QBO_CLIENT_ID: process.env.QBO_CLIENT_ID,
    QBO_CLIENT_SECRET: process.env.QBO_CLIENT_SECRET,
    TOKEN_ENCRYPTION_KEY: process.env.TOKEN_ENCRYPTION_KEY,
    NEXT_PUBLIC_SITE_URL: process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000',
    NEXT_PUBLIC_SENTRY_DSN: process.env.NEXT_PUBLIC_SENTRY_DSN,
    SENTRY_ORG: process.env.SENTRY_ORG,
    SENTRY_PROJECT: process.env.SENTRY_PROJECT,
    NEXT_PUBLIC_POSTHOG_KEY: process.env.NEXT_PUBLIC_POSTHOG_KEY,
    NEXT_PUBLIC_POSTHOG_HOST: process.env.NEXT_PUBLIC_POSTHOG_HOST || 'https://app.posthog.com',
    USE_POOLER: process.env.USE_POOLER || 'false',
    APP_NAME: process.env.APP_NAME || 'Leduc Receipt Pro',
    APP_TAGLINE: process.env.APP_TAGLINE || 'Gold Standard Receipt Intelligence',
    APP_DESCRIPTION: process.env.APP_DESCRIPTION || 'Enterprise-grade receipt management with AI-powered extraction, CRA-compliant mileage, and audit-grade audit trails.',
    // OpenTelemetry
    OTEL_EXPORTER_OTLP_ENDPOINT: process.env.OTEL_EXPORTER_OTLP_ENDPOINT,
    OTEL_EXPORTER_OTLP_HEADERS: process.env.OTEL_EXPORTER_OTLP_HEADERS,
  });

  if (!parsed.success) {
    const issues = parsed.error.issues.map((i) => `${i.path.join('.')}: ${i.message}`).join('\n');
    const msg = `Missing/invalid environment variables:\n${issues}`;
    if (typeof window === 'undefined') {
      throw new Error(msg);
    } else {
      console.error('[ENV]', msg);
    }
  }

  return parsed.data as EnvVar;
}

export const env = parseEnv();

/** Returns the canonical site URL for auth redirects.
 *  Uses the env var when set (production), falls back to window.location.origin on the client.
 *  This is a getter (not a cached value) so it works correctly in both SSR and client contexts. */
export function getSiteUrl(): string {
  if (env.NEXT_PUBLIC_SITE_URL && env.NEXT_PUBLIC_SITE_URL !== 'http://localhost:3000') {
    return env.NEXT_PUBLIC_SITE_URL;
  }
  if (typeof window !== 'undefined') {
    return window.location.origin;
  }
  return 'http://localhost:3000';
}

/** Check if connection pooling is enabled */
export function isPoolerEnabled(): boolean {
  return env.USE_POOLER === 'true';
}

/** Get the pooler host based on project ref */
export function getPoolerHost(): string {
  const match = env.NEXT_PUBLIC_SUPABASE_URL?.match(/https:\/\/([^.]+)\.supabase\.co/);
  return match?.[1] ? `${match[1]}.pooler.supabase.com` : '';
}
