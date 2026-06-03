'use client';

import type { Plan } from '@/lib/services/subscription';
import { PLAN_GATES } from '@/lib/services/subscription';
import { Crown, AlertTriangle } from 'lucide-react';
import Link from 'next/link';

interface UpgradePromptProps {
  plan: Plan;
  receiptCount: number;
  teamSize: number;
  isTrialing?: boolean;
  daysLeftInTrial?: number;
}

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
        <div className="flex items-center gap-3 rounded-[2rem] bg-red-500/10 border border-red-500/20 px-4 py-3 text-sm text-red-300">
          <AlertTriangle className="h-5 w-5 flex-shrink-0" />
          <div className="flex-1">
            <p className="font-semibold">Receipt limit reached</p>
            <p className="text-xs opacity-80">You have used all {gates.receiptLimit} receipts this month. Upgrade to continue scanning.</p>
          </div>
          <Link
            href="/settings/billing"
            className="flex-shrink-0 rounded-[2rem] bg-champagne px-3 py-1.5 text-xs font-bold text-black transition hover:bg-champagne/90"
          >
            Upgrade
          </Link>
        </div>
      )}

      {showReceiptWarning && (
        <div className="flex items-center gap-3 rounded-[2rem] bg-amber-500/10 border border-amber-500/20 px-4 py-3 text-sm text-amber-200">
          <AlertTriangle className="h-5 w-5 flex-shrink-0" />
          <div className="flex-1">
            <p className="font-semibold">Low on receipts</p>
            <p className="text-xs opacity-80">{receiptsRemaining} remaining this month. Upgrade for unlimited receipts.</p>
          </div>
          <Link
            href="/settings/billing"
            className="flex-shrink-0 rounded-[2rem] bg-surface-raised px-3 py-1.5 text-xs font-semibold text-text-primary transition hover:bg-surface-hover"
          >
            Upgrade
          </Link>
        </div>
      )}

      {showUserWarning && (
        <div className="flex items-center gap-3 rounded-[2rem] bg-amber-500/10 border border-amber-500/20 px-4 py-3 text-sm text-amber-200">
          <Crown className="h-5 w-5 flex-shrink-0" />
          <div className="flex-1">
            <p className="font-semibold">User limit reached</p>
            <p className="text-xs opacity-80">Your plan allows {gates.userLimit} user{gates.userLimit === 1 ? '' : 's'}. Upgrade to add more team members.</p>
          </div>
          <Link
            href="/settings/billing"
            className="flex-shrink-0 rounded-[2rem] bg-surface-raised px-3 py-1.5 text-xs font-semibold text-text-primary transition hover:bg-surface-hover"
          >
            Upgrade
          </Link>
        </div>
      )}

      {showTrialWarning && (
        <div className="flex items-center gap-3 rounded-[2rem] bg-champagne/10 border border-champagne/20 px-4 py-3 text-sm text-champagne">
          <Crown className="h-5 w-5 flex-shrink-0" />
          <div className="flex-1">
            <p className="font-semibold">Trial ending soon</p>
            <p className="text-xs opacity-80">{daysLeftInTrial} day{daysLeftInTrial === 1 ? '' : 's'} left. Upgrade now to keep Pro features.</p>
          </div>
          <Link
            href="/settings/billing"
            className="flex-shrink-0 rounded-[2rem] bg-champagne px-3 py-1.5 text-xs font-bold text-black transition hover:bg-champagne/90"
          >
            Upgrade
          </Link>
        </div>
      )}
    </div>
  );
}

