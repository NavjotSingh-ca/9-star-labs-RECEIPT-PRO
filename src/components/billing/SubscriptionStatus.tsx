'use client';

import { useEffect, useState, useCallback } from 'react';
import { Loader2, CreditCard, CheckCircle2, AlertTriangle, XCircle, ExternalLink } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';
import { motion } from 'framer-motion';
import { fadeUp } from '@/lib/animations';

type Plan = 'free' | 'starter' | 'pro' | 'business' | 'enterprise';
type SubStatus = 'active' | 'trialing' | 'past_due' | 'canceled' | null;

interface SubscriptionInfo {
  plan: Plan;
  status: SubStatus;
  currentPeriodEnd: string | null;
  trialEndsAt: string | null;
  stripeCustomerId: string | null;
  stripeSubscriptionId: string | null;
}

function formatDate(dateStr: string | null): string {
  if (!dateStr) return '—';
  return new Date(dateStr).toLocaleDateString('en-CA', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
}

function getStatusBadge(status: SubStatus) {
  switch (status) {
    case 'active':
      return { icon: CheckCircle2, color: 'text-emerald-success', bg: 'bg-emerald-success/10', label: 'Active' };
    case 'trialing':
      return { icon: CheckCircle2, color: 'text-champagne', bg: 'bg-champagne/10', label: 'Trial' };
    case 'past_due':
      return { icon: AlertTriangle, color: 'text-warning', bg: 'bg-warning/10', label: 'Past Due' };
    case 'canceled':
      return { icon: XCircle, color: 'text-danger', bg: 'bg-danger/10', label: 'Canceled' };
    default:
      return { icon: CreditCard, color: 'text-text-muted', bg: 'bg-surface-hover', label: 'Free' };
  }
}

function formatPlanLabel(plan: Plan): string {
  switch (plan) {
    case 'free': return 'Free';
    case 'starter': return 'Starter';
    case 'pro': return 'Pro';
    case 'business': return 'Business';
    case 'enterprise': return 'Enterprise';
  }
}

/**
 * Subscription status card showing current plan, status badge,
 * billing period, customer ID, support level, and past-due warnings.
 * Provides a "Manage Billing" button linking to the Stripe Customer Portal.
 */
export function SubscriptionStatus() {
  const [sub, setSub] = useState<SubscriptionInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [portalLoading, setPortalLoading] = useState(false);

  const fetchSub = useCallback(async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.access_token) {
        setLoading(false);
        return;
      }

      const { data: roleData } = await supabase
        .from('user_roles')
        .select('org_id')
        .eq('user_id', session.user.id)
        .single();

      if (!roleData?.org_id) {
        setLoading(false);
        return;
      }

      const { data: subData } = await supabase
        .from('subscriptions')
        .select('*')
        .eq('org_id', roleData.org_id)
        .single();

      if (subData) {
        setSub({
          plan: (subData.plan as Plan) || 'free',
          status: subData.status as SubStatus,
          currentPeriodEnd: subData.current_period_end,
          trialEndsAt: subData.trial_ends_at,
          stripeCustomerId: subData.stripe_customer_id,
          stripeSubscriptionId: subData.stripe_subscription_id,
        });
      } else {
        setSub(null);
      }
    } catch {
      // Silently fail — no subscription is not an error
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchSub();
  }, [fetchSub]);

  async function handleManageBilling() {
    setPortalLoading(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.access_token) {
        toast.error('Please sign in');
        return;
      }

      const res = await fetch('/api/stripe/portal', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${session.access_token}`,
        },
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Failed to open billing portal');
      }

      if (data.url) {
        window.location.href = data.url;
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to open billing portal');
    } finally {
      setPortalLoading(false);
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-6 w-6 animate-spin text-champagne" />
      </div>
    );
  }

  const badge = getStatusBadge(sub?.status ?? null);
  const BadgeIcon = badge.icon;
  const isPaidPlan = sub && sub.plan !== 'free' && sub.plan !== 'starter';
  const isOnTrial = sub?.status === 'trialing';

  return (
    <motion.div
      variants={fadeUp}
      initial="hidden"
      animate="show"
      className="rounded-2xl border border-glass-border bg-card p-6"
    >
      <div className="flex items-center gap-3 mb-4">
        <CreditCard className="h-5 w-5 text-champagne" />
        <h3 className="font-bold text-text-primary">Current Plan</h3>
      </div>

      <div className="flex items-center justify-between mb-6">
        <div>
          <p className="text-2xl font-bold tracking-tight text-text-primary">
            {sub ? formatPlanLabel(sub.plan) : 'Free'}
          </p>
          <div className="mt-1 flex items-center gap-2">
            <span className={`inline-flex items-center gap-1.5 rounded-full px-3 py-0.5 text-xs font-semibold ${badge.bg} ${badge.color}`}>
              <BadgeIcon className="h-3 w-3" />
              {badge.label}
            </span>
          </div>
        </div>

        {sub?.stripeCustomerId && (
          <button
            type="button"
            onClick={handleManageBilling}
            disabled={portalLoading}
            className="inline-flex items-center gap-2 rounded-xl border border-glass-border px-4 py-2 text-sm font-semibold text-text-primary transition hover:bg-surface-hover disabled:opacity-60"
          >
            {portalLoading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <ExternalLink className="h-4 w-4" />
            )}
            Manage Billing
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-sm">
        <div className="rounded-xl bg-surface p-3">
          <p className="text-xs text-text-muted mb-0.5">Period End</p>
          <p className="font-semibold text-text-primary tabular-nums">
            {isOnTrial
              ? formatDate(sub?.trialEndsAt ?? null)
              : formatDate(sub?.currentPeriodEnd ?? null)}
          </p>
        </div>
        <div className="rounded-xl bg-surface p-3">
          <p className="text-xs text-text-muted mb-0.5">Customer ID</p>
          <p className="font-mono text-xs text-text-secondary truncate" title={sub?.stripeCustomerId ?? '—'}>
            {sub?.stripeCustomerId ? `${sub.stripeCustomerId.slice(0, 12)}...` : '—'}
          </p>
        </div>
        <div className="rounded-xl bg-surface p-3">
          <p className="text-xs text-text-muted mb-0.5">Support</p>
          <p className="font-semibold text-text-primary">
            {isPaidPlan ? 'Priority' : 'Community'}
          </p>
        </div>
      </div>

      {sub?.status === 'past_due' && (
        <div className="mt-4 flex items-start gap-3 rounded-xl border border-warning/30 bg-warning/5 p-4">
          <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-warning" />
          <div className="text-sm text-text-secondary">
            <strong className="text-warning">Payment past due.</strong> Your subscription may be suspended. Please update your payment method.
          </div>
        </div>
      )}
    </motion.div>
  );
}
