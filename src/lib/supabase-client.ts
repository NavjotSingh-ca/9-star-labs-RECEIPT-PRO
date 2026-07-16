import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { createBrowserClient } from '@supabase/ssr';
import { env } from './env';

// Client-side singleton
let browserClient: SupabaseClient | null = null;

function createBrowserSupabaseClient(): SupabaseClient {
  const isPlaceholder = env.NEXT_PUBLIC_SUPABASE_URL?.includes('placeholder') ||
                       env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.includes('placeholder') ||
                       process.env.CI === 'true' ||
                       !env.NEXT_PUBLIC_SUPABASE_URL ||
                       !env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (isPlaceholder || process.env.CI === 'true') {
    // Return a mock client for CI/testing environments where real Supabase isn't available
    const mockSubscription = { unsubscribe: () => {} };

    return {
      from: () => ({
        select: () => ({ eq: () => ({ single: () => Promise.resolve({ data: null, error: null }) }) }),
        insert: () => Promise.resolve({ data: null, error: null }),
        update: () => ({ eq: () => Promise.resolve({ data: null, error: null }) }),
        delete: () => ({ eq: () => Promise.resolve({ data: null, error: null }) }),
        createSignedUrl: () => Promise.resolve({ data: { signedUrl: '' }, error: null }),
      }),
      auth: {
        signInWithPassword: () => Promise.resolve({ data: { user: null, session: null }, error: { message: 'CI mode - no real auth' } }),
        signUp: () => Promise.resolve({ data: { user: null, session: null }, error: { message: 'CI mode - no real auth' } }),
        getUser: () => Promise.resolve({ data: { user: null }, error: null }),
        signOut: () => Promise.resolve({ error: null }),
        onAuthStateChange: (callback: (event: string, session: null) => void) => {
          // Immediately invoke with SIGNED_OUT since there's no user in CI mode
          setTimeout(() => callback('SIGNED_OUT', null), 0);
          return { data: { subscription: mockSubscription } };
        },
        getSession: () => Promise.resolve({ data: { session: null } }),
      },
      rpc: () => Promise.resolve({ data: null, error: null }),
      storage: {
        from: () => ({
          createSignedUrl: () => Promise.resolve({ data: { signedUrl: '' }, error: null }),
        }),
      },
      channel: () => ({
        on: () => ({ subscribe: () => ({ unsubscribe: () => {} }) }),
        subscribe: () => ({ unsubscribe: () => {} }),
        unsubscribe: () => {},
      }),
    } as unknown as SupabaseClient;
  }

  return createBrowserClient(env.NEXT_PUBLIC_SUPABASE_URL, env.NEXT_PUBLIC_SUPABASE_ANON_KEY, {
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