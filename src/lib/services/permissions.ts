/**
 * Advanced Permissions System - Enterprise RBAC with inheritance and approval workflows
 * Supports multi-level approvals, department-based access, and time-bound permissions
 *
 * IMPORTANT: All permission checks use direct DB queries (user_roles + local RBAC map).
 * No external API routes are called — the old /api/permissions/check and /api/permissions/user
 * endpoints never existed and would always 404.
 */

export type Permission =
  | 'receipts.create'
  | 'receipts.edit'
  | 'receipts.delete'
  | 'receipts.approve'
  | 'receipts.view_all'
  | 'team.invite'
  | 'team.manage_roles'
  | 'budget.create'
  | 'budget.view'
  | 'export.data'
  | 'export.tax_forms'
  | 'audit.view'
  | 'admin.settings';

export interface RoleDefinition {
  name: string;
  permissions: Permission[];
  level: number;
  inherits?: string;
}

export interface ApprovalWorkflow {
  id: string;
  table: string;
  action: string;
  rule: 'amount_greater_than' | 'category_in' | 'user_not_in_role';
  threshold?: number;
  roles?: string[];
  approvers: string[];
}

// Default role definitions
export const ROLES: Record<string, RoleDefinition> = {
  admin: {
    name: 'Administrator',
    level: 100,
    permissions: [
      'receipts.create',
      'receipts.edit',
      'receipts.delete',
      'receipts.approve',
      'receipts.view_all',
      'team.invite',
      'team.manage_roles',
      'budget.create',
      'budget.view',
      'export.data',
      'export.tax_forms',
      'audit.view',
      'admin.settings',
    ],
  },
  accountant: {
    name: 'Accountant',
    level: 75,
    permissions: [
      'receipts.view_all',
      'receipts.approve',
      'budget.view',
      'export.data',
      'export.tax_forms',
    ],
    inherits: 'employee',
  },
  employee: {
    name: 'Employee',
    level: 50,
    permissions: ['receipts.create', 'receipts.edit'],
  },
  viewer: {
    name: 'Viewer',
    level: 10,
    permissions: ['receipts.view_all', 'budget.view'],
  },
};

// Approval workflows
export const APPROVAL_WORKFLOWS: ApprovalWorkflow[] = [
  {
    id: 'high-value-receipts',
    table: 'receipts',
    action: 'create',
    rule: 'amount_greater_than',
    threshold: 5000,
    approvers: ['admin', 'accountant'],
  },
  {
    id: 'international-expenses',
    table: 'receipts',
    action: 'create',
    rule: 'category_in',
    roles: ['Travel', 'Professional Services'],
    approvers: ['admin'],
  },
];

async function getUserRoleName(userId: string, orgId: string): Promise<string | null> {
  const { supabaseAdmin } = await import('@/lib/supabase-admin');
  const { data } = await supabaseAdmin
    .from('user_roles')
    .select('role')
    .eq('user_id', userId)
    .eq('org_id', orgId)
    .maybeSingle();
  return (data as { role: string } | null)?.role?.toLowerCase() ?? null;
}

/**
 * Resolve effective permissions for a role name using the ROLES map.
 * Handles inheritance: if a role has `inherits`, its permissions are merged.
 */
function resolvePermissionsForRole(roleName: string): Permission[] {
  const roleDef = ROLES[roleName];
  if (!roleDef) return [];

  const perms = new Set<Permission>(roleDef.permissions);

  if (roleDef.inherits && ROLES[roleDef.inherits]) {
    for (const p of ROLES[roleDef.inherits].permissions) {
      perms.add(p);
    }
  }

  return [...perms];
}

/**
 * Check if user has specific permission via DB-backed RBAC.
 * Looks up user_roles, resolves inheritance from the ROLES map.
 *
 * @returns true if the user's role (or inherited role) grants the permission.
 */
export async function hasPermission(
  userId: string,
  permission: Permission,
  orgId: string
): Promise<boolean> {
  try {
    const roleName = await getUserRoleName(userId, orgId);
    if (!roleName) return false;
    const perms = resolvePermissionsForRole(roleName);
    return perms.includes(permission);
  } catch {
    return false;
  }
}

/**
 * Get user's effective permissions (including inherited) via DB-backed RBAC.
 * Returns the merged list of permissions from the user's role and any inherited role.
 */
export async function getEffectivePermissions(userId: string, orgId: string): Promise<Permission[]> {
  try {
    const roleName = await getUserRoleName(userId, orgId);
    if (!roleName) return [];
    return resolvePermissionsForRole(roleName);
  } catch {
    return [];
  }
}

/**
 * Check if action requires approval
 */
export function requiresApproval(
  action: string,
  table: string,
  amount?: number,
  category?: string
): ApprovalWorkflow | null {
  return (
    APPROVAL_WORKFLOWS.find(w => {
      if (w.table !== table || w.action !== action) return false;
      if (w.rule === 'amount_greater_than' && amount && amount > (w.threshold ?? 0)) return true;
      if (w.rule === 'category_in' && category && w.roles?.includes(category)) return true;
      return false;
    }) ?? null
  );
}