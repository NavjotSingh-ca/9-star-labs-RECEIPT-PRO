'use client';

import { useQuery } from '@tanstack/react-query';
import type { Plan, PlanGates, Subscription } from '@/lib/services/subscription';
import { getSubscription, getPlanGates, getUsageCount, getTeamSize, checkLimit, formatPlanLabel } from '@/lib/services/subscription';

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
  const { data: sub, isLoading: subLoading } = useQuery({
    queryKey: ['subscription'],
    queryFn: getSubscription,
    staleTime: 5 * 60 * 1000,
  });

  const plan: Plan = !sub ? 'free' : sub.status === 'trialing' ? 'pro' : (sub.plan as Plan);

  const now = new Date();
  const fromDate = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
  const toDate = new Date(now.getFullYear(), now.getMonth() + 1, 1).toISOString();

  const { data: receiptCount = 0 } = useQuery({
    queryKey: ['receipt_count', fromDate, toDate],
    queryFn: () => getUsageCount(fromDate, toDate),
    staleTime: 5 * 60 * 1000,
  });

  const { data: teamSize = 0 } = useQuery({
    queryKey: ['team_size'],
    queryFn: getTeamSize,
    staleTime: 5 * 60 * 1000,
  });

  const gates = getPlanGates(plan);
  const canScan = checkLimit(plan, receiptCount, 'receipt');
  const canInviteUser = checkLimit(plan, teamSize, 'user');
  const isTrialing = sub?.status === 'trialing';

  return {
    plan,
    gates,
    subscription: sub ?? null,
    receiptCount,
    teamSize,
    canScan,
    canInviteUser,
    isTrialing,
    isLoading: subLoading,
    label: formatPlanLabel(plan),
  };
}