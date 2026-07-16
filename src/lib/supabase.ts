/**
 * Unified Supabase client exports.
 *
 * For client components: import { supabase, getBrowserSupabase } from '@/lib/supabase'
 * For server components/actions/API routes: import { createServerSupabaseClient, getSupabase } from '@/lib/supabase'
 */

import type { SupabaseClient } from '@supabase/supabase-js';

// Client-side exports
export {
  supabase,
  getBrowserSupabase,
} from './supabase-client';

import { getBrowserSupabase } from './supabase-client';

// Server-side exports (lazy to avoid next/headers import on client)
export { createServerSupabaseClient } from './supabase-server';
export { createServerSupabaseClient as createServerClient } from './supabase-server';

/**
 * Get the Supabase client for the current environment.
 * - On the client: returns a promise resolving to the singleton browser client
 * - On the server: returns a promise resolving to a fresh server client per request
 *
 * Always `await` the result — the server client requires async cookie access
 * and on the client we wrap the sync return for a consistent API.
 */
export async function getSupabase(): Promise<SupabaseClient> {
  if (typeof window !== 'undefined') {
    // Client-side: use singleton browser client
    return getBrowserSupabase();
  }
  // Server-side: create fresh server client per request
  // Import dynamically to avoid bundling next/headers in client
  const m = await import('./supabase-server');
  return m.createServerSupabaseClient();
}

export async function getReceiptImageUrl(pathOrUrl: string | null | undefined): Promise<string | null> {
  if (!pathOrUrl) return null;
  if (pathOrUrl.startsWith('http')) {
    return pathOrUrl;
  }
  const c = await getSupabase();
  const { data, error } = await c.storage
    .from('receipt-images')
    .createSignedUrl(pathOrUrl, 3600);
  if (error || !data) return null;
  return data.signedUrl;
}

export async function getOrgIdString(): Promise<string | null> {
  const client = await getSupabase();
  const { data } = await client.rpc('get_user_org');
  return typeof data === 'string' ? data : null;
}