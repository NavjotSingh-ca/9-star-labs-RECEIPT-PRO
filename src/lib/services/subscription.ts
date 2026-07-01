// LOCKED: NON-CORE

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

export const PLAN_GATES: Record<Plan, PlanGates> = {
  free: { name: 'free', receiptLimit: 25, userLimit: 1, hasExports: false, hasQBO: false, hasXero: false, hasApprovalWorkflow: false, hasBankReconciliation: false, hasAdvancedReports: false, hasCustomFields: false, hasPrioritySupport: false },
  starter: { name: 'starter', receiptLimit: 200, userLimit: 3, hasExports: true, hasQBO: true, hasXero: false, hasApprovalWorkflow: false, hasBankReconciliation: false, hasAdvancedReports: false, hasCustomFields: false, hasPrioritySupport: false },
  pro: { name: 'pro', receiptLimit: Infinity, userLimit: 10, hasExports: true, hasQBO: true, hasXero: true, hasApprovalWorkflow: true, hasBankReconciliation: true, hasAdvancedReports: true, hasCustomFields: false, hasPrioritySupport: false },
  business: { name: 'business', receiptLimit: Infinity, userLimit: 15, hasExports: true, hasQBO: true, hasXero: true, hasApprovalWorkflow: true, hasBankReconciliation: true, hasAdvancedReports: true, hasCustomFields: true, hasPrioritySupport: true },
  enterprise: { name: 'enterprise', receiptLimit: Infinity, userLimit: Infinity, hasExports: true, hasQBO: true, hasXero: true, hasApprovalWorkflow: true, hasBankReconciliation: true, hasAdvancedReports: true, hasCustomFields: true, hasPrioritySupport: true },
};

export async function getSubscription(): Promise<Subscription | null> {
  return null;
}

export async function getPlan(): Promise<Plan> {
  return 'free';
}

export function getPlanGates(plan: Plan): PlanGates {
  return PLAN_GATES[plan] || PLAN_GATES.free;
}

export async function getUsageCount(_fromDate: string, _toDate: string): Promise<number> {
  return 0;
}

export async function getTeamSize(): Promise<number> {
  return 0;
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

export function isFeatureAllowed(plan: Plan, _feature: keyof PlanGates): boolean {
  return plan !== 'free';
}

export function checkLimit(_plan: Plan, _current: number, _limitType: 'receipt' | 'user'): boolean {
  return true;
}
