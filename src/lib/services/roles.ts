import { supabase, getOrgIdString } from '@/lib/supabase';
import { logError } from '@/lib/logger';
import type { UserRole } from '@/lib/types';

const VALID_ROLES: ReadonlySet<UserRole> = new Set(['Owner', 'Accountant', 'Employee']);

/**
 * Retrieve the role of a user within their organization.
 * Defaults to 'Employee' (fail-closed) if no role is found or on error.
 *
 * @param userId - The UUID of the user whose role to look up.
 * @returns The user's role, or 'Employee' as default.
 */
export const getUserRole = async (userId: string): Promise<UserRole> => {
  if (!userId) {
    return 'Employee';
  }

  try {
    const { data, error } = await supabase
      .from('user_roles')
      .select('role')
      .eq('user_id', userId)
      .single();

    if (error || !data?.role) {
      return 'Employee';
    }

    const role = data.role;
    if (VALID_ROLES.has(role as UserRole)) {
      return role as UserRole;
    }

    return 'Employee';
  } catch (err) {
    logError(err, { action: 'get_user_role', userId });
    return 'Employee';
  }
};

/**
 * Set or update a user's role within the same organization.
 * Only Owners can change roles. Target user must be in the same org.
 *
 * @param targetUserId - UUID of the user whose role to change.
 * @param role - The target role to assign.
 * @param callerUserId - UUID of the user making the change.
 * @throws {Error} If caller is not an Owner, target is outside org, or DB operation fails.
 */
export const setUserRole = async (targetUserId: string, role: UserRole, callerUserId: string): Promise<void> => {
  if (!targetUserId) {
    throw new Error('Target user ID is required');
  }

  if (!callerUserId) {
    throw new Error('Caller user ID is required');
  }

  if (!VALID_ROLES.has(role)) {
    throw new Error('Invalid role: ' + role);
  }

  try {
    const callerRole = await getUserRole(callerUserId);
    if (callerRole !== 'Owner') {
      throw new Error('Unauthorized: only Owners can change roles');
    }

    const orgId = await getOrgIdString();
    if (!orgId) {
      throw new Error('No organization found for user. Cannot set role.');
    }

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

    if (error) {
      throw error;
    }
  } catch (err) {
    if (err instanceof Error && (err.message.startsWith('Unauthorized:') || err.message.startsWith('Cannot modify') || err.message.startsWith('No organization'))) {
      throw err;
    }
    logError(err, { action: 'set_user_role', targetUserId, role, callerUserId });
    throw new Error('Failed to update user role. Please try again.');
  }
};
