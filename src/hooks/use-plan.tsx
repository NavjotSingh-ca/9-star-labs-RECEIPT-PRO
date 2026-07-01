// LOCKED: UNSTABLE
'use client';

import type { Plan, PlanGates, Subscription } from '@/lib/services/subscription';

export interface PlanInfo {
  plan: Plan;
  gates: PlanGates;
  subscription: Subscription | null;
  receiptCount: number;
  teamSize: number;
  canScan: boolean;
  canInviteUser: boolean;
  isTrialing: boolean;
  isLoading: boolean;
  label: string;
}

export function usePlan(): PlanInfo {
  return {
    plan: 'free',
    gates: { name: 'free', receiptLimit: 25, userLimit: 1, hasExports: false, hasQBO: false, hasXero: false, hasApprovalWorkflow: false, hasBankReconciliation: false, hasAdvancedReports: false, hasCustomFields: false, hasPrioritySupport: false } as PlanGates,
    subscription: null,
    receiptCount: 0,
    teamSize: 0,
    canScan: true,
    canInviteUser: true,
    isTrialing: false,
    isLoading: false,
    label: 'Free',
  };
}
