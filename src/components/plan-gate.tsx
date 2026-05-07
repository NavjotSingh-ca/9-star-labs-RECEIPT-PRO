'use client';

import { ReactNode } from 'react';
import type { Plan } from '@/lib/services/subscription';
import { PLAN_GATES, isFeatureAllowed } from '@/lib/services/subscription';
import { Lock, Crown } from 'lucide-react';
import Link from 'next/link';

interface PlanGateProps {
  plan: Plan;
  feature: keyof typeof PLAN_GATES.free;
  children: ReactNode;
  fallback?: ReactNode;
}

export function PlanGate({ plan, feature, children, fallback }: PlanGateProps) {
  const allowed = isFeatureAllowed(plan, feature);

  if (allowed) return <>{children}</>;

  if (fallback) return <>{fallback}</>;

  return (
    <div className="rounded-[2rem] border border-glass-border bg-black/20 p-6 text-center">
      <Lock className="h-8 w-8 text-text-muted mx-auto mb-3" />
      <p className="text-sm font-semibold text-text-primary mb-1">This feature requires an upgrade.</p>
      <p className="text-xs text-text-muted mb-4">Your current plan does not include this feature.</p>
      <Link
        href="/settings/billing"
        className="inline-flex items-center gap-2 rounded-[2rem] bg-champagne px-4 py-2 text-sm font-bold text-black transition hover:bg-champagne/90"
      >
        <Crown className="h-4 w-4" />
        Upgrade Plan
      </Link>
    </div>
  );
}
