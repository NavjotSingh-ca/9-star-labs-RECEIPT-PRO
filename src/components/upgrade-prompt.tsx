'use client';

import type { Plan } from '@/lib/services/subscription';
import { PLAN_GATES } from '@/lib/services/subscription';
import { Crown, AlertTriangle } from 'lucide-react';
import Link from 'next/link';

interface UpgradePromptProps {
  /** Current subscription plan */
  plan: Plan;
  /** Number of receipts used this period */
  receiptCount: number;
  /** Number of team members in the organization */
  teamSize: number;
  /** Whether the account is currently on a free trial */
  isTrialing?: boolean;
  /** Days remaining in the trial period */
  daysLeftInTrial?: number;
}

/**
 * Displays upgrade warnings when plan limits are approaching or reached.
 * Shows specific banners for receipt limits, user limits, and trial expiry.
 * Returns null when no warnings are needed.
 *
 * @example
 * ```tsx
 * <UpgradePrompt plan="free" receiptCount={45} teamSize={1} />
 * ```
 */
export function UpgradePrompt({ plan, receiptCount, teamSize, isTrialing, daysLeftInTrial }: UpgradePromptProps) {
  const gates = PLAN_GATES[plan];
  const receiptsRemaining = typeof gates.receiptLimit === 'number' ? Math.max(0, gates.receiptLimit - receiptCount) : Infinity;
  const usersRemaining = typeof gates.userLimit === 'number' ? Math.max(0, gates.userLimit - teamSize) : Infinity;

  const showReceiptWarning = receiptsRemaining <= 5 && receiptsRemaining !== Infinity && receiptsRemaining > 0;
  const showReceiptBlock = receiptsRemaining === 0;
  const showUserWarning = usersRemaining === 0 && plan !== 'enterprise';
  const showTrialWarning = isTrialing && (daysLeftInTrial !== undefined && daysLeftInTrial <= 3);

  if (!showReceiptWarning && !showReceiptBlock && !showUserWarning && !showTrialWarning) {
    return null;
  }

  return (
    <div className="space-y-2">
      {showReceiptBlock && (
        <div className="flex items-center gap-3 rounded-2xl bg-danger/10 border border-danger/20 px-4 py-3 text-sm text-danger">
          <AlertTriangle className="h-5 w-5 flex-shrink-0" />
          <div className="flex-1">
            <p className="font-semibold">Receipt limit reached</p>
            <p className="text-xs opacity-80">You have used all {gates.receiptLimit} receipts this month. Upgrade to continue scanning.</p>
          </div>
          <Link
            href="/settings/billing"
            className="flex-shrink-0 rounded-2xl bg-champagne px-3 py-1.5 text-xs font-bold text-black transition hover:bg-champagne-dim"
          >
            Upgrade
          </Link>
        </div>
      )}

      {showReceiptWarning && (
        <div className="flex items-center gap-3 rounded-2xl bg-warning/10 border border-warning/20 px-4 py-3 text-sm text-warning">
          <AlertTriangle className="h-5 w-5 flex-shrink-0" />
          <div className="flex-1">
            <p className="font-semibold">Low on receipts</p>
            <p className="text-xs opacity-80">{receiptsRemaining} remaining this month. Upgrade for unlimited receipts.</p>
          </div>
          <Link
            href="/settings/billing"
            className="flex-shrink-0 rounded-2xl bg-surface-raised px-3 py-1.5 text-xs font-semibold text-text-primary transition hover:bg-surface-hover"
          >
            Upgrade
          </Link>
        </div>
      )}

      {showUserWarning && (
        <div className="flex items-center gap-3 rounded-2xl bg-warning/10 border border-warning/20 px-4 py-3 text-sm text-warning">
          <Crown className="h-5 w-5 flex-shrink-0" />
          <div className="flex-1">
            <p className="font-semibold">User limit reached</p>
            <p className="text-xs opacity-80">Your plan allows {gates.userLimit} user{gates.userLimit === 1 ? '' : 's'}. Upgrade to add more team members.</p>
          </div>
          <Link
            href="/settings/billing"
            className="flex-shrink-0 rounded-2xl bg-surface-raised px-3 py-1.5 text-xs font-semibold text-text-primary transition hover:bg-surface-hover"
          >
            Upgrade
          </Link>
        </div>
      )}

      {showTrialWarning && (
        <div className="flex items-center gap-3 rounded-2xl bg-champagne/10 border border-champagne/20 px-4 py-3 text-sm text-champagne">
          <Crown className="h-5 w-5 flex-shrink-0" />
          <div className="flex-1">
            <p className="font-semibold">Trial ending soon</p>
            <p className="text-xs opacity-80">{daysLeftInTrial} day{daysLeftInTrial === 1 ? '' : 's'} left. Upgrade now to keep Pro features.</p>
          </div>
          <Link
            href="/settings/billing"
            className="flex-shrink-0 rounded-2xl bg-champagne px-3 py-1.5 text-xs font-bold text-black transition hover:bg-champagne-dim"
          >
            Upgrade
          </Link>
        </div>
      )}
    </div>
  );
}

