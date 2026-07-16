import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { createBrowserClient } from '@supabase/ssr';
import { env } from './env';

let client: SupabaseClient | null = null;

function createSupabaseClient(): SupabaseClient {
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
        onAuthStateChange: () => ({ data: { subscription: mockSubscription } }),
      },
      rpc: () => Promise.resolve({ data: null, error: null }),
      storage: {
        from: () => ({
          createSignedUrl: () => Promise.resolve({ data: { signedUrl: '' }, error: null }),
        }),
      },
    } as unknown as SupabaseClient;
  }

  if (typeof window !== 'undefined') {
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

  return createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.NEXT_PUBLIC_SUPABASE_ANON_KEY, {
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

export function getSupabase(): SupabaseClient {
  if (!client) {
    client = createSupabaseClient();
  }
  return client;
}

export const supabase = new Proxy<SupabaseClient>({} as SupabaseClient, {
  get(_, prop: keyof SupabaseClient) {
    return getSupabase()[prop];
  },
});

export async function getReceiptImageUrl(pathOrUrl: string | null | undefined): Promise<string | null> {
  if (!pathOrUrl) return null;
  if (pathOrUrl.startsWith('http')) {
    return pathOrUrl;
  }
  const c = getSupabase();
  const { data, error } = await c.storage
    .from('receipt-images')
    .createSignedUrl(pathOrUrl, 3600);
  if (error || !data) return null;
  return data.signedUrl;
}

export async function getOrgIdString(): Promise<string | null> {
  const { data } = await getSupabase().rpc('get_user_org');
  return typeof data === 'string' ? data : null;
}
