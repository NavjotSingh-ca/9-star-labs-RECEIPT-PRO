/**
 * Advanced Permissions System - Enterprise RBAC with inheritance and approval workflows
 * Supports multi-level approvals, department-based access, and time-bound permissions
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

/**
 * Check if user has specific permission
 */
export async function hasPermission(
  userId: string,
  permission: Permission,
  orgId: string
): Promise<boolean> {
  // In production, check against RPC function that resolves inherited permissions
  const { data } = await fetch(`/api/permissions/check?user=${userId}&perm=${permission}&org=${orgId}`).then(r => r.json());
  return data?.allowed ?? false;
}

/**
 * Get user's effective permissions (including inherited)
 */
export async function getEffectivePermissions(userId: string, orgId: string): Promise<Permission[]> {
  const { data } = await fetch(`/api/permissions/user?user=${userId}&org=${orgId}`).then(r => r.json());
  return (data?.permissions as Permission[]) ?? [];
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