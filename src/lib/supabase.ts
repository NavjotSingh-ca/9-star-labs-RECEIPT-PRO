import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { env } from './env';

let client: SupabaseClient | null = null;

function createSupabaseClient(): SupabaseClient {
  if (!env.NEXT_PUBLIC_SUPABASE_URL || !env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
    throw new Error(
      'Supabase environment variables are missing. Set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY.'
    );
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

/**
 * Generate a fresh signed URL for a receipt image.
 * Accepts either a storage path OR a legacy full URL.
 * Returns null if generation fails.
 */
export async function getReceiptImageUrl(pathOrUrl: string | null | undefined): Promise<string | null> {
  if (!pathOrUrl) return null;

  // If it already starts with http it could be a legacy signed URL or public URL
  // Try to use it as-is; if it fails rendering, display a placeholder
  if (pathOrUrl.startsWith('http')) {
    return pathOrUrl;
  }

  // It's a storage path — generate a fresh 1-hour signed URL
  const { data, error } = await supabase.storage
    .from('receipt-images')
    .createSignedUrl(pathOrUrl, 3600);

  if (error || !data) return null;
  return data.signedUrl;
}