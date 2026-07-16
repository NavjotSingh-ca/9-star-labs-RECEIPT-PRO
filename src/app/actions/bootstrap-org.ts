'use server';

import { supabaseAdmin } from '@/lib/supabase-admin';

/**
 * Bootstraps a new organization for a user on first login.
 * Calls the bootstrap_first_user_org RPC which creates the org, assigns Owner role,
 * and sets up default settings.
 *
 * @param userId - The authenticated user's UUID.
 * @param orgName - Display name for the new org (default: 'My Business').
 * @returns { ok: true } on success, or { ok: false, error: string } on failure.
 */
export async function bootstrapOrgAction(userId: string, orgName = 'My Business'): Promise<{ ok: true } | { ok: false; error: string }> {
  try {
    const { error } = await supabaseAdmin.rpc('bootstrap_first_user_org', {
      p_user_id: userId,
      p_org_name: orgName,
    });

    if (error) return { ok: false, error: error.message };
    return { ok: true };
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : 'Unknown error' };
  }
}
