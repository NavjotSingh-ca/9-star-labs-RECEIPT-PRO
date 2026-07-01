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
  // PostHog
  NEXT_PUBLIC_POSTHOG_KEY: z.string().min(1).optional(),
  NEXT_PUBLIC_POSTHOG_HOST: z.string().url().optional().default('https://app.posthog.com'),
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
});

function parseEnv() {
  const parsed = envSchema.safeParse({
    NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
    NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
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
    NEXT_PUBLIC_POSTHOG_KEY: process.env.NEXT_PUBLIC_POSTHOG_KEY,
    NEXT_PUBLIC_POSTHOG_HOST: process.env.NEXT_PUBLIC_POSTHOG_HOST || (typeof window !== 'undefined' ? 'https://app.posthog.com' : 'https://app.posthog.com'),
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

  return parsed.data ?? ({} as z.infer<typeof envSchema>);
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
