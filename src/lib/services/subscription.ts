import { supabase, getOrgIdString } from '@/lib/supabase';
import { withRetry } from '@/lib/supabase-error-handler';
import { logError } from '@/lib/logger';

export type Plan = 'free' | 'starter' | 'pro' | 'business' | 'enterprise';

export interface Subscription {
  org_id: string;
  plan: Plan;
  status: 'active' | 'trialing' | 'past_due' | 'canceled';
  receipt_limit: number;
  user_limit: number;
  trial_ends_at: string | null;
  current_period_end: string | null;
}

export interface PlanGates {
  name: Plan;
  receiptLimit: number;
  userLimit: number;
  hasExports: boolean;
  hasQBO: boolean;
  hasXero: boolean;
  hasApprovalWorkflow: boolean;
  hasBankReconciliation: boolean;
  hasAdvancedReports: boolean;
  hasCustomFields: boolean;
  hasPrioritySupport: boolean;
}

// ─── Plan gates with real limits ───
// Free: basic scanning, 25 receipts, 1 user, no exports/QBO/Xero/approval/banking
// Starter: 200 receipts, 3 users, exports + banking
// Pro: unlimited receipts, 10 users, all features, priority support
// Business: unlimited, 15 users, all features
// Enterprise: unlimited everything

export const PLAN_GATES: Record<Plan, PlanGates> = {
  free: {
    name: 'free',
    receiptLimit: 25,
    userLimit: 1,
    hasExports: false,
    hasQBO: false,
    hasXero: false,
    hasApprovalWorkflow: false,
    hasBankReconciliation: false,
    hasAdvancedReports: false,
    hasCustomFields: false,
    hasPrioritySupport: false,
  },
  starter: {
    name: 'starter',
    receiptLimit: 200,
    userLimit: 3,
    hasExports: true,
    hasQBO: false,
    hasXero: false,
    hasApprovalWorkflow: false,
    hasBankReconciliation: true,
    hasAdvancedReports: false,
    hasCustomFields: false,
    hasPrioritySupport: false,
  },
  pro: {
    name: 'pro',
    receiptLimit: Infinity,
    userLimit: 10,
    hasExports: true,
    hasQBO: true,
    hasXero: true,
    hasApprovalWorkflow: true,
    hasBankReconciliation: true,
    hasAdvancedReports: true,
    hasCustomFields: true,
    hasPrioritySupport: true,
  },
  business: {
    name: 'business',
    receiptLimit: Infinity,
    userLimit: 15,
    hasExports: true,
    hasQBO: true,
    hasXero: true,
    hasApprovalWorkflow: true,
    hasBankReconciliation: true,
    hasAdvancedReports: true,
    hasCustomFields: true,
    hasPrioritySupport: true,
  },
  enterprise: {
    name: 'enterprise',
    receiptLimit: Infinity,
    userLimit: Infinity,
    hasExports: true,
    hasQBO: true,
    hasXero: true,
    hasApprovalWorkflow: true,
    hasBankReconciliation: true,
    hasAdvancedReports: true,
    hasCustomFields: true,
    hasPrioritySupport: true,
  },
};

/**
 * Fetch the subscription record for the current user's organization.
 *
 * @returns The subscription object, or null if no subscription exists or on error.
 */
export async function getSubscription(): Promise<Subscription | null> {
  try {
    const orgId = await getOrgIdString();
    if (!orgId) return null;

    const { data, error } = await withRetry(
      () => supabase
        .from('subscriptions')
        .select('*')
        .eq('org_id', orgId)
        .single(),
      { maxRetries: 2, delayMs: 500 }
    );

    if (error) {
      logError(error, { action: 'get_subscription_query' });
      return null;
    }

    return data as Subscription | null;
  } catch (err) {
    logError(err, { action: 'get_subscription_fallback' });
    return null;
  }
}

/**
 * Resolve the effective plan for the current user's organization.
 * Accounts for trial status (treated as pro) and expired/canceled periods (downgraded to free).
 *
 * @returns The effective plan name.
 */
export async function getPlan(): Promise<Plan> {
  const sub = await getSubscription();
  if (!sub) return 'free';

  if (sub.status === 'trialing') return 'pro';

  if (sub.status === 'canceled' || sub.status === 'past_due') {
    const periodEnd = sub.current_period_end ? new Date(sub.current_period_end) : null;
    if (periodEnd && periodEnd > new Date()) {
      return sub.plan as Plan;
    }
    return 'free';
  }

  return sub.plan as Plan;
}

/**
 * Get feature gates for a given plan.
 *
 * @param plan - The plan name.
 * @returns The PlanGates object with all feature flags. Defaults to free if plan is unknown.
 */
export function getPlanGates(plan: Plan): PlanGates {
  return PLAN_GATES[plan] || PLAN_GATES.free;
}

/**
 * Count receipts created within a date range for the current org.
 *
 * @param fromDate - Start date string (ISO 8601).
 * @param toDate - End date string (ISO 8601).
 * @returns The count of non-deleted receipts, or 0 on error.
 */
export async function getUsageCount(fromDate: string, toDate: string): Promise<number> {
  if (!fromDate || !toDate) return 0;

  try {
    const orgId = await getOrgIdString();
    if (!orgId) return 0;

    const { count, error } = await supabase
      .from('receipts')
      .select('*', { count: 'exact', head: true })
      .eq('org_id', orgId)
      .eq('is_deleted', false)
      .gte('created_at', fromDate)
      .lte('created_at', toDate);

    if (error) {
      logError(error, { action: 'get_usage_count' });
      return 0;
    }
    return count || 0;
  } catch (err) {
    logError(err, { action: 'get_usage_count_fallback' });
    return 0;
  }
}

/**
 * Get the number of team members in the current user's organization.
 *
 * @returns Team member count, or 0 on error.
 */
export async function getTeamSize(): Promise<number> {
  try {
    const orgId = await getOrgIdString();
    if (!orgId) return 0;

    const { count, error } = await supabase
      .from('user_roles')
      .select('*', { count: 'exact', head: true })
      .eq('org_id', orgId);

    if (error) {
      logError(error, { action: 'get_team_size' });
      return 0;
    }
    return count || 0;
  } catch (err) {
    logError(err, { action: 'get_team_size_fallback' });
    return 0;
  }
}

/**
 * Format a plan name for human-readable display.
 *
 * @param plan - The plan name.
 * @returns Capitalized display label (e.g., "Pro", "Business").
 */
export function formatPlanLabel(plan: Plan): string {
  const labels: Record<Plan, string> = {
    free: 'Free',
    starter: 'Starter',
    pro: 'Pro',
    business: 'Business',
    enterprise: 'Enterprise',
  };
  return labels[plan] || 'Free';
}

/**
 * Check whether a given feature is allowed for the specified plan.
 *
 * @param plan - The plan name.
 * @param feature - The feature key to check (from PlanGates).
 * @returns True if the feature is enabled for this plan.
 */
export function isFeatureAllowed(plan: Plan, feature: keyof PlanGates): boolean {
  const gates = getPlanGates(plan);
  if (feature === 'name') return true;
  return gates[feature] === true;
}

/**
 * Check whether a usage limit has been reached.
 *
 * @param plan - The plan name.
 * @param current - Current usage count.
 * @param limitType - 'receipt' or 'user'.
 * @returns True if under the limit, false if exceeded.
 */
export function checkLimit(plan: Plan, current: number, limitType: 'receipt' | 'user'): boolean {
  const gates = getPlanGates(plan);
  const limit = limitType === 'receipt' ? gates.receiptLimit : gates.userLimit;
  return current < limit;
}
