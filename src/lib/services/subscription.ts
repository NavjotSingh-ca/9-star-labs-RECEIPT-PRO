import { supabase } from '@/lib/supabase';
import { withRetry } from '@/lib/supabase-error-handler';

export type Plan = 'free' | 'pro' | 'enterprise';

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

export const PLAN_GATES: Record<Plan, PlanGates> = {
  free: {
    name: 'free',
    receiptLimit: 50,
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
  pro: {
    name: 'pro',
    receiptLimit: Infinity,
    userLimit: 5,
    hasExports: true,
    hasQBO: true,
    hasXero: true,
    hasApprovalWorkflow: true,
    hasBankReconciliation: true,
    hasAdvancedReports: true,
    hasCustomFields: false,
    hasPrioritySupport: false,
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
    const { data: orgData } = await supabase.rpc('get_user_org');
    const orgId = orgData as unknown as string;
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
      console.error('Error fetching subscription:', error);
      return null;
    }

    return data as Subscription | null;
  } catch (err) {
    console.error('Failed to get subscription:', err);
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
    const { data: orgData } = await supabase.rpc('get_user_org');
    const orgId = orgData as unknown as string;
    if (!orgId) return 0;

    const { count, error } = await supabase
      .from('receipts')
      .select('*', { count: 'exact', head: true })
      .eq('org_id', orgId)
      .eq('is_deleted', false)
      .gte('created_at', fromDate)
      .lte('created_at', toDate);

    if (error) {
      console.error('Error counting usage:', error);
      return 0;
    }
    return count || 0;
  } catch (err) {
    console.error('Failed to get usage count:', err);
    return 0;
  }
}

export async function getTeamSize(): Promise<number> {
  try {
    const { data: orgData } = await supabase.rpc('get_user_org');
    const orgId = orgData as unknown as string;
    if (!orgId) return 0;

    const { count, error } = await supabase
      .from('user_roles')
      .select('*', { count: 'exact', head: true })
      .eq('org_id', orgId);

    if (error) {
      console.error('Error counting team size:', error);
      return 0;
    }
    return count || 0;
  } catch (err) {
    console.error('Failed to get team size:', err);
    return 0;
  }
}

export function formatPlanLabel(plan: Plan): string {
  switch (plan) {
    case 'free': return 'Free';
    case 'pro': return 'Pro';
    case 'enterprise': return 'Enterprise';
    default: return 'Free';
  }
}

export function isFeatureAllowed(plan: Plan, feature: keyof PlanGates): boolean {
  const gates = getPlanGates(plan);
  if (feature === 'receiptLimit' || feature === 'userLimit') return true; // Limits are checked separately
  return !!gates[feature];
}

export function checkLimit(plan: Plan, current: number, limitType: 'receipt' | 'user'): boolean {
  const gates = getPlanGates(plan);
  const limit = limitType === 'receipt' ? gates.receiptLimit : gates.userLimit;
  if (limit === Infinity) return true;
  return current < limit;
}
