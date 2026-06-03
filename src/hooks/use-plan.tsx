'use client';

import { useState, useEffect } from 'react';
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
  const [plan, setPlan] = useState<Plan>('free');
  const [subscription, setSubscription] = useState<Subscription | null>(null);
  const [receiptCount, setReceiptCount] = useState(0);
  const [teamSize, setTeamSize] = useState(0);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let active = true;
    async function load() {
      setIsLoading(true);
      try {
        const sub = await getSubscription();
        if (!active) return;
        setSubscription(sub);
        const p = !sub ? 'free' as Plan : sub.status === 'trialing' ? 'pro' as Plan : sub.plan as Plan;
        if (!active) return;
        setPlan(p);

        const now = new Date();
        const fromDate = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
        const toDate = new Date(now.getFullYear(), now.getMonth() + 1, 1).toISOString();

        const [usage, users] = await Promise.all([
          getUsageCount(fromDate, toDate),
          getTeamSize(),
        ]);
        if (!active) return;

        setReceiptCount(usage);
        setTeamSize(users);
      } catch (err) {
        console.error('usePlan: failed to load', err);
      } finally {
        if (active) setIsLoading(false);
      }
    }
    load();
    return () => { active = false; };
  }, []);

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
