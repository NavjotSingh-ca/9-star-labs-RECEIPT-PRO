import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import { env } from '@/lib/env';

let client: SupabaseClient | null = null;

function getClient(): SupabaseClient {
  if (client) return client;
  if (!env.SUPABASE_SERVICE_ROLE_KEY) {
    throw new Error(
      'SUPABASE_SERVICE_ROLE_KEY is required in production. ' +
      'Set it in your environment variables. The admin client cannot use the anon key.'
    );
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
