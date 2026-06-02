import { supabase, getOrgIdString } from '@/lib/supabase';
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

export const setUserRole = async (targetUserId: string, role: UserRole, callerUserId: string): Promise<void> => {
  if (!callerUserId) throw new Error('Unauthorized: callerUserId is required');
  const callerRole = await getUserRole(callerUserId);
  if (callerRole !== 'Owner') {
    throw new Error('Unauthorized: only Owners can change roles');
  }

  // Get the caller's org for scoping
  const orgId = await getOrgIdString();
  if (!orgId) throw new Error('No organization found for user. Cannot set role.');

  // Verify target user is in the same org
  const { data: targetRoleData } = await supabase
    .from('user_roles')
    .select('org_id')
    .eq('user_id', targetUserId)
    .single();

  if (targetRoleData && targetRoleData.org_id !== orgId) {
    throw new Error('Cannot modify roles for users outside your organization.');
  }

  // Use SECURITY DEFINER RPC to bypass user_roles RLS restrictions
  const { error } = await supabase.rpc('upsert_user_role', {
    p_target_user_id: targetUserId,
    p_role: role,
    p_org_id: orgId,
  });
  if (error) throw error;
};
