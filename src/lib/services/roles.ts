import { supabase } from '@/lib/supabase';
import type { UserRole } from '@/lib/types';

export const getUserRole = async (userId: string): Promise<UserRole> => {
  if (!userId) return 'Employee'; // Default to Employee for fail-closed security
  const { data, error } = await supabase
    .from('user_roles')
    .select('role')
    .eq('user_id', userId)
    .single();

  // Default to Employee if no role is found (fail-closed)
  if (error || !data) return 'Employee';
  return data.role as UserRole;
};

export const setUserRole = async (userId: string, role: UserRole): Promise<void> => {
  // Get the user's current org
  const { data: orgData } = await supabase.rpc('get_user_org');
  const orgId = orgData as unknown as string;

  if (!orgId) {
    console.error('setUserRole: no org found for user', userId);
    return;
  }

  // Check if a role row already exists
  const { data: existing } = await supabase
    .from('user_roles')
    .select('id')
    .eq('user_id', userId)
    .eq('org_id', orgId)
    .single();

  if (existing) {
    // Update existing role
    const { error } = await supabase
      .from('user_roles')
      .update({ role })
      .eq('user_id', userId)
      .eq('org_id', orgId);
    if (error) throw error;
  } else {
    // Insert new role
    const { error } = await supabase
      .from('user_roles')
      .insert({ user_id: userId, org_id: orgId, role });
    if (error) throw error;
  }
};
