import { SupabaseClient } from '@supabase/supabase-js';
import { createServerClient } from '@supabase/ssr';
import { env } from './env';

/**
 * Creates a Supabase server client.
 * This function MUST be called in a Server Component, Server Action, or API route context.
 * It uses cookies() from next/headers which is only available in those contexts.
 */
export async function createServerSupabaseClient(): Promise<SupabaseClient> {
  const { cookies } = await import('next/headers');
  const cookieStore = await cookies();

  const isCI = process.env.CI === 'true';
  const isPlaceholder = env.NEXT_PUBLIC_SUPABASE_URL?.includes('placeholder') ||
                       env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.includes('placeholder');

  // In CI, use mock client
  if (isCI) {
    // Return a mock client for CI/testing environments
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

  return createServerClient(env.NEXT_PUBLIC_SUPABASE_URL!, env.NEXT_PUBLIC_SUPABASE_ANON_KEY!, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet) {
        try {
          cookiesToSet.forEach(({ name, value, options }) =>
            cookieStore.set(name, value, options)
          );
        } catch {
          // The `setAll` method was called from a Server Component.
          // This can be ignored if you have middleware refreshing user sessions.
        }
      },
    },
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true,
    },
    global: {
      fetch: (...args: Parameters<typeof fetch>) => {
        const [url, init] = args;
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 25000);
        return fetch(url, { ...init, signal: controller.signal }).finally(() =>
          clearTimeout(timeoutId)
        );
      },
    },
  });
}