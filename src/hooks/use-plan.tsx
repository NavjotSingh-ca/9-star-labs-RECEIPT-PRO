'use client';

import type { Plan, PlanGates, Subscription } from '@/lib/services/subscription';
import {
  getPlanGates,
  formatPlanLabel,
} from '@/lib/services/subscription';

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

/**
 * Aggregates subscription, usage, and team data into a single PlanInfo object.
 * Paywalling is removed: every account is full-access "enterprise" with
 * unlimited receipts/users, so usage-count queries are no longer needed.
 */
export function usePlan(): PlanInfo {
  const plan: Plan = 'enterprise';
  const gates = getPlanGates(plan);
  const canScan = true;
  const canInviteUser = true;
  const isTrialing = false;

  return {
    plan,
    gates,
    subscription: null,
    receiptCount: 0,
    teamSize: 0,
    canScan,
    canInviteUser,
    isTrialing,
    isLoading: false,
    label: formatPlanLabel(plan),
  };
}
