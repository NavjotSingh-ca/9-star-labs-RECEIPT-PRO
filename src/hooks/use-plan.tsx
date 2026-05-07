'use client';

import { useState, useEffect, useCallback } from 'react';
import type { Plan, PlanGates, Subscription } from '@/lib/services/subscription';
import { getSubscription, getPlan, getPlanGates, getUsageCount, getTeamSize, checkLimit, formatPlanLabel } from '@/lib/services/subscription';

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
  const [plan, setPlan] = useState<Plan>('free');
  const [subscription, setSubscription] = useState<Subscription | null>(null);
  const [receiptCount, setReceiptCount] = useState(0);
  const [teamSize, setTeamSize] = useState(0);
  const [isLoading, setIsLoading] = useState(true);

  const load = useCallback(async () => {
    setIsLoading(true);
    try {
      const sub = await getSubscription();
      setSubscription(sub);
      const p = await getPlan();
      setPlan(p);

      // Get current billing period dates
      const now = new Date();
      const fromDate = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
      const toDate = new Date(now.getFullYear(), now.getMonth() + 1, 1).toISOString();

      const [usage, users] = await Promise.all([
        getUsageCount(fromDate, toDate),
        getTeamSize(),
      ]);

      setReceiptCount(usage);
      setTeamSize(users);
    } catch (err) {
      console.error('usePlan: failed to load', err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const gates = getPlanGates(plan);
  const canScan = checkLimit(plan, receiptCount, 'receipt');
  const canInviteUser = checkLimit(plan, teamSize, 'user');
  const isTrialing = subscription?.status === 'trialing';

  return {
    plan,
    gates,
    subscription,
    receiptCount,
    teamSize,
    canScan,
    canInviteUser,
    isTrialing,
    isLoading,
    label: formatPlanLabel(plan),
  };
}
