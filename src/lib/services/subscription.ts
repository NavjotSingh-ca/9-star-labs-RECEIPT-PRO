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
  stripe_customer_id: string | null;
  stripe_subscription_id: string | null;
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

// ─── Open Source: All features unlocked across all plan tiers ───
// Plan system is kept for informational/self-hosted Stripe support.
// No functional limits are enforced on any tier.

export const PLAN_GATES: Record<Plan, PlanGates> = {
  free: {
    name: 'free',
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
  starter: {
    name: 'starter',
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
  pro: {
    name: 'pro',
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
  business: {
    name: 'business',
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

export async function getPlan(): Promise<Plan> {
  const sub = await getSubscription();
  if (!sub) return 'free';
  // If trialing, treat as pro
  if (sub.status === 'trialing') return 'pro';
  // If past_due or canceled, downgrade to free after grace period
  if (sub.status === 'canceled' || sub.status === 'past_due') {
    const periodEnd = sub.current_period_end ? new Date(sub.current_period_end) : null;
    if (periodEnd && periodEnd > new Date()) {
      // Still within current period, allow existing features
      return sub.plan as Plan;
    }
    return 'free';
  }
  return sub.plan as Plan;
}

export function getPlanGates(plan: Plan): PlanGates {
  return PLAN_GATES[plan] || PLAN_GATES.free;
}

export async function getUsageCount(fromDate: string, toDate: string): Promise<number> {
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

export function formatPlanLabel(plan: Plan): string {
  switch (plan) {
    case 'free': return 'Free';
    case 'starter': return 'Starter';
    case 'pro': return 'Pro';
    case 'business': return 'Business';
    case 'enterprise': return 'Enterprise';
    default: return 'Free';
  }
}

// ─── Always allowed in open source — all features unlocked ───

export function isFeatureAllowed(_plan: Plan, _feature: keyof PlanGates): boolean {
  return true;
}

export function checkLimit(_plan: Plan, _current: number, _limitType: 'receipt' | 'user'): boolean {
  return true;
}
