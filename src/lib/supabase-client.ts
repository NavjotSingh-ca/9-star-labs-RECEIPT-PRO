import { SupabaseClient } from '@supabase/supabase-js';
import { createBrowserClient } from '@supabase/ssr';
import { env } from './env';

// Client-side singleton
let browserClient: SupabaseClient | null = null;

function createBrowserSupabaseClient(): SupabaseClient {
  const isCI = process.env.CI === 'true';
  const isPlaceholder = env.NEXT_PUBLIC_SUPABASE_URL?.includes('placeholder') ||
                       env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.includes('placeholder');

  // In CI, the workflow now runs real Supabase (supabase-local or Postgres 17 service).
  // If CI=true without valid Supabase credentials, something is misconfigured — fail hard.
  if (isCI) {
    throw new Error(
      'CI mode detected but missing valid Supabase credentials. ' +
      'The CI pipeline must provide NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY ' +
      'pointing to a real (local or ephemeral) Supabase instance.'
    );
  }

  // In production, throw if config is missing/misconfigured
  if (process.env.NODE_ENV === 'production' && (isPlaceholder || !env.NEXT_PUBLIC_SUPABASE_URL || !env.NEXT_PUBLIC_SUPABASE_ANON_KEY)) {
    throw new Error(
      'Supabase configuration missing or invalid in production. ' +
      'NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY must be set.'
    );
  }

  // Development: warn but allow if placeholder
  if (isPlaceholder) {
    console.warn('[Supabase] Using placeholder credentials - some features may not work');
  }

  return createBrowserClient(env.NEXT_PUBLIC_SUPABASE_URL!, env.NEXT_PUBLIC_SUPABASE_ANON_KEY!, {
    global: {
      fetch: (...args: Parameters<typeof fetch>) => {
        const [url, init] = args;
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 15000);
        return fetch(url, { ...init, signal: controller.signal }).finally(() =>
          clearTimeout(timeoutId)
        );
      },
    },
  });
}

/**
 * Get the Supabase browser client (client-side only).
 * Returns a singleton instance for consistent session handling.
 */
export function getBrowserSupabase(): SupabaseClient {
  if (typeof window === 'undefined') {
    throw new Error('getBrowserSupabase() can only be used in client components');
  }
  if (!browserClient) {
    browserClient = createBrowserSupabaseClient();
  }
  return browserClient;
}

/**
 * Client-side only Supabase instance.
 * Use this in client components for consistent singleton access.
 * Throws if used on server.
 */
export const supabase = new Proxy<SupabaseClient>({} as SupabaseClient, {
  get(_, prop: keyof SupabaseClient) {
    if (typeof window === 'undefined') {
      throw new Error('supabase proxy can only be used in client components. Use getSupabase() instead.');
    }
    return getBrowserSupabase()[prop];
  },
});