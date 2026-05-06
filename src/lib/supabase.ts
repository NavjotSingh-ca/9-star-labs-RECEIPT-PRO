import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('Supabase credentials missing! Check your Vercel Environment Variables.');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
  },
});

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