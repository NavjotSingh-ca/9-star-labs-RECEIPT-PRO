/**
 * Feature configuration service — server-side DB operations for org feature flags.
 * Handles CRUD for org_features table, role-based access, and bootstrapping defaults.
 * Owner role is always granted full access regardless of allowed_roles config.
 */
import { getSupabase } from '@/lib/supabase';
import { logError } from '@/lib/logger';
import type { FeatureKey } from '@/lib/features/registry';
import { ALL_FEATURE_KEYS } from '@/lib/features/registry';
import type { UserRole } from '@/lib/types';

export interface OrgFeatureRow {
  id: string;
  org_id: string;
  feature_key: string;
  enabled: boolean;
  config: Record<string, unknown>;
  allowed_roles: string[];
}

/** Map of feature key → enabled boolean, filtered by role if applicable */
export type FeaturesMap = Record<FeatureKey, boolean>;

/** All available role keys in the system */
export const ALL_ROLES: UserRole[] = ['Owner', 'Admin', 'Employee', 'Accountant', 'Auditor'];

// ─── Default allowed roles per feature category ────────────────

const DEFAULT_ROLES_ALL: UserRole[] = ['Owner', 'Admin', 'Employee', 'Accountant', 'Auditor'];
const DEFAULT_ROLES_OWNER_ADMIN: UserRole[] = ['Owner', 'Admin'];
const DEFAULT_ROLES_TRACKING: UserRole[] = ['Owner', 'Admin', 'Employee'];
const DEFAULT_ROLES_FINANCE: UserRole[] = ['Owner', 'Admin', 'Accountant'];
const DEFAULT_ROLES_OVERSIGHT: UserRole[] = ['Owner', 'Admin', 'Auditor'];
const DEFAULT_ROLES_PRODUCTIVITY: UserRole[] = ['Owner', 'Admin', 'Employee', 'Accountant'];

/** Get default allowed roles for a given feature key */
export function getDefaultRolesForKey(featureKey: FeatureKey): UserRole[] {
  const financeKeys: FeatureKey[] = ['export', 'banking', 'payables', 'budgets', 'tax', 'cashflow', 'multi_currency', 'vendors'];
  const oversightKeys: FeatureKey[] = ['approvals', 'audit', 'alerts', 'reports'];
  const trackingKeys: FeatureKey[] = ['mileage', 'time_tracking'];
  const productivityKeys: FeatureKey[] = ['batch_ops', 'kanban'];
  const ownerAdminKeys: FeatureKey[] = ['integrations'];

  if (financeKeys.includes(featureKey)) return DEFAULT_ROLES_FINANCE;
  if (oversightKeys.includes(featureKey)) return DEFAULT_ROLES_OVERSIGHT;
  if (trackingKeys.includes(featureKey)) return DEFAULT_ROLES_TRACKING;
  if (productivityKeys.includes(featureKey)) return DEFAULT_ROLES_PRODUCTIVITY;
  if (ownerAdminKeys.includes(featureKey)) return DEFAULT_ROLES_OWNER_ADMIN;
  return DEFAULT_ROLES_ALL;
}

// ─── Role-based feature access ─────────────────────────────────

/**
 * Check whether a role is allowed to use a feature.
 * Owner always has access regardless of allowed_roles.
 */
export function isRoleAllowedForFeature(
  role: UserRole,
  allowedRoles: string[],
): boolean {
  if (role === 'Owner') return true;
  return allowedRoles.includes(role);
}

// ─── Fetch features ────────────────────────────────────────────

/**
 * Fetch all features with their allowed_roles for an organization.
 * Returns raw rows including role configuration.
 */
export async function getOrgFeaturesRaw(orgId: string): Promise<OrgFeatureRow[]> {
  try {
    const supabase = await getSupabase();
    const { data, error } = await supabase
      .from('org_features')
      .select('*')
      .eq('org_id', orgId);

    if (error) {
      logError(error, { action: 'getOrgFeaturesRaw_failed', orgId });
      return [];
    }
    return (data ?? []) as OrgFeatureRow[];
  } catch (err) {
    logError(err, { action: 'getOrgFeaturesRaw_failed', orgId });
    return [];
  }
}

/**
 * Fetch features for an organization.
 * Role-based filtering is removed: every org member sees the org's enabled
 * feature set (org-level toggles still respected, role no longer narrows it).
 * If no rows exist, returns all features enabled (backwards-compatible).
 */
export async function getOrgFeatures(
  orgId: string,
  _role?: UserRole,
): Promise<FeaturesMap> {
  try {
    const supabase = await getSupabase();
    const { data, error } = await supabase
      .from('org_features')
      .select('feature_key, enabled')
      .eq('org_id', orgId);

    if (error) {
      logError(error, { action: 'getOrgFeatures_failed', orgId });
      return getAllEnabled();
    }

    type OrgFeatureRow = { feature_key: string; enabled: boolean };
    const rows = (data as OrgFeatureRow[]) || [];

    if (rows.length === 0) {
      return getAllEnabled();
    }

    const result: FeaturesMap = {} as FeaturesMap;

    for (const key of ALL_FEATURE_KEYS) {
      const row = rows.find((r) => r.feature_key === key);
      result[key] = row ? row.enabled : true;
    }
    return result;
  } catch (err) {
    logError(err, { action: 'getOrgFeatures_failed', orgId });
    return getAllEnabled();
  }
}

// ─── Toggle features ───────────────────────────────────────────

/**
 * Toggle a single feature on or off for an organization.
 */
export async function setOrgFeature(
  orgId: string,
  featureKey: FeatureKey,
  enabled: boolean,
): Promise<{ success: boolean; features?: FeaturesMap; error?: string }> {
  try {
    const client1 = await getSupabase();
    const { error } = await client1
      .from('org_features')
      .upsert(
        { org_id: orgId, feature_key: featureKey, enabled },
        { onConflict: 'org_id, feature_key' },
      );

    if (error) {
      return { success: false, error: error.message };
    }

    const features = await getOrgFeatures(orgId);
    return { success: true, features };
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Failed to update feature';
    logError(err, { action: 'setOrgFeature_failed', featureKey });
    return { success: false, error: msg };
  }
}

/**
 * Update allowed_roles for a specific feature (Owner-only operation).
 */
export async function setFeatureRoles(
  orgId: string,
  featureKey: FeatureKey,
  allowedRoles: string[],
): Promise<{ success: boolean; error?: string }> {
  try {
    // Validate roles
    const validRoles = ALL_ROLES;
    const invalid = allowedRoles.filter((r) => !validRoles.includes(r as UserRole));
    if (invalid.length > 0) {
      return { success: false, error: `Invalid roles: ${invalid.join(', ')}` };
    }

    const supabase3 = await getSupabase();
    const { error } = await supabase3
      .from('org_features')
      .upsert(
        { org_id: orgId, feature_key: featureKey, allowed_roles: allowedRoles },
        { onConflict: 'org_id, feature_key' },
      );

    if (error) {
      return { success: false, error: error.message };
    }
    return { success: true };
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Failed to update feature roles';
    logError(err, { action: 'setFeatureRoles_failed', featureKey });
    return { success: false, error: msg };
  }
}

// ─── Bulk operations ───────────────────────────────────────────

/**
 * Bulk-set features (used during onboarding wizard).
 */
export async function setOrgFeaturesBulk(
  orgId: string,
  updates: Partial<FeaturesMap>,
): Promise<{ success: boolean; features?: FeaturesMap; error?: string }> {
  try {
    const rows = Object.entries(updates).map(([feature_key, enabled]) => ({
      org_id: orgId,
      feature_key,
      enabled: Boolean(enabled),
    }));

    const supabase4 = await getSupabase();
    const { error } = await supabase4
      .from('org_features')
      .upsert(rows, { onConflict: 'org_id, feature_key' });

    if (error) {
      return { success: false, error: error.message };
    }

    const features = await getOrgFeatures(orgId);
    return { success: true, features };
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Failed to update features';
    logError(err, { action: 'setOrgFeaturesBulk_failed' });
    return { success: false, error: msg };
  }
}

/**
 * Bootstrap default feature flags for a newly created organization.
 */
export async function bootstrapOrgFeatures(orgId: string): Promise<boolean> {
  try {
    const supabase5 = await getSupabase();
    const { error } = await supabase5.rpc('bootstrap_org_features', { p_org_id: orgId });
    if (error) {
      logError(error, { action: 'bootstrapOrgFeatures_rpc_failed', orgId });
      return false;
    }
    return true;
  } catch (err) {
    logError(err, { action: 'bootstrapOrgFeatures_failed', orgId });
    return false;
  }
}

// ─── Helpers ───────────────────────────────────────────────────

/** Returns a FeaturesMap with all features enabled */
function getAllEnabled(): FeaturesMap {
  const result = {} as FeaturesMap;
  for (const key of ALL_FEATURE_KEYS) {
    result[key] = true;
  }
  return result;
}
