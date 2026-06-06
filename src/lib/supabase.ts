import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { createBrowserClient } from '@supabase/ssr';
import { env } from './env';

let client: SupabaseClient | null = null;

function createSupabaseClient(): SupabaseClient {
  if (!env.NEXT_PUBLIC_SUPABASE_URL || !env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
    throw new Error(
      'Supabase environment variables are missing. Set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY.'
    );
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

export const supabase = getSupabase();

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
