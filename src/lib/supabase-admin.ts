import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import { env } from '@/lib/env';

let client: SupabaseClient | null = null;

function getClient(): SupabaseClient {
  if (client) return client;
  // In CI/test mode, return a mock client
  if (process.env.CI === 'true' || !env.SUPABASE_SERVICE_ROLE_KEY) {
    return {
      from: () => ({
        select: () => ({ eq: () => ({ single: () => Promise.resolve({ data: null, error: null }) }) }),
        insert: () => Promise.resolve({ data: null, error: null }),
        update: () => ({ eq: () => Promise.resolve({ data: null, error: null }) }),
        delete: () => ({ eq: () => Promise.resolve({ data: null, error: null }) }),
      }),
      auth: {
        getUser: () => Promise.resolve({ data: { user: null }, error: null }),
      },
      rpc: () => Promise.resolve({ data: null, error: null }),
    } as unknown as SupabaseClient;
  }
  client = createClient(
    env.NEXT_PUBLIC_SUPABASE_URL!,
    env.SUPABASE_SERVICE_ROLE_KEY,
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    }
  );
  return client;
}

export const supabaseAdmin = new Proxy<SupabaseClient>({} as SupabaseClient, {
  get(_, prop: keyof SupabaseClient) {
    return getClient()[prop];
  },
});

/**
 * Create an admin client for webhook processing (uses service role key)
 * This is the same as supabaseAdmin but with explicit naming for clarity
 */
export function createWebhookAdminClient(): SupabaseClient {
  return getClient();
}
