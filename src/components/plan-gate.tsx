'use client';

import { ReactNode } from 'react';
import type { Plan } from '@/lib/services/subscription';
import { PLAN_GATES, isFeatureAllowed } from '@/lib/services/subscription';
import { Lock, Crown } from 'lucide-react';
import Link from 'next/link';

interface PlanGateProps {
  /** Current subscription plan */
  plan: Plan;
  /** Feature key to check access for (e.g., 'receiptLimit', 'userLimit') */
  feature: keyof typeof PLAN_GATES.free;
  /** Content to render when the feature is allowed */
  children: ReactNode;
  /** Optional custom fallback UI when feature is not allowed */
  fallback?: ReactNode;
}

/**
 * Feature gate that conditionally renders children only if the current plan
 * allows the specified feature. Shows an upgrade prompt when access is denied.
 *
 * @example
 * ```tsx
 * <PlanGate plan="free" feature="advancedExport">
 *   <QBOExport />
 * </PlanGate>
 * ```
 */
export function PlanGate({ plan, feature, children, fallback }: PlanGateProps) {
  const allowed = isFeatureAllowed(plan, feature);

  if (allowed) return <>{children}</>;

  if (fallback) return <>{fallback}</>;

  return (
    <div className="rounded-2xl border border-glass-border bg-surface-raised p-6 text-center">
      <Lock className="h-8 w-8 text-text-muted mx-auto mb-3" />
      <p className="text-sm font-semibold text-text-primary mb-1">This feature requires an upgrade.</p>
      <p className="text-xs text-text-muted mb-4">Your current plan does not include this feature.</p>
      <Link
        href="/settings/billing"
        className="inline-flex items-center gap-2 rounded-2xl bg-champagne px-4 py-2 text-sm font-bold text-obsidian transition hover:bg-champagne-dim"
      >
        <Crown className="h-4 w-4" />
        Upgrade Plan
      </Link>
    </div>
  );
}
