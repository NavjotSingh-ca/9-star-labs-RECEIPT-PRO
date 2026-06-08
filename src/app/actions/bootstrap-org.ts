'use server';

import { supabaseAdmin } from '@/lib/supabase-admin';

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
