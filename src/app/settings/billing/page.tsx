'use client';

import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { CreditCard, Loader2, AlertCircle, CheckCircle2, Crown, Users, Zap, Shield, ArrowLeft } from 'lucide-react';
import { AuroraBackground } from '@/components/aceternity/aurora-background';
import { useRouter } from 'next/navigation';
import type { Plan, Subscription } from '@/lib/services/subscription';
import { getSubscription, formatPlanLabel, PLAN_GATES } from '@/lib/services/subscription';
import { loadStripe } from '@stripe/stripe-js';
import { env } from '@/lib/env';

const stripePromise = env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY
  ? loadStripe(env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY)
  : null;

export default function BillingSettings() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [subscription, setSubscription] = useState<Subscription | null>(null);
  const [currentPlan, setCurrentPlan] = useState<Plan>('free');
  const [checkoutLoading, setCheckoutLoading] = useState<string | null>(null);

  const loadSub = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const sub = await getSubscription();
      setSubscription(sub);
      if (sub) {
        if (sub.status === 'trialing') setCurrentPlan('pro');
        else if (sub.status === 'active') setCurrentPlan(sub.plan as Plan);
        else setCurrentPlan('free');
      } else {
        setCurrentPlan('free');
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to load subscription');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadSub();
  }, [loadSub]);

  async function startCheckout(priceId: string, plan: Plan) {
    if (!stripePromise) {
      setError('Stripe is not configured. Please contact support.');
      return;
    }
    setCheckoutLoading(priceId);
    setError('');
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const token = session?.access_token;
      if (!token) throw new Error('Not authenticated');

      const res = await fetch('/api/stripe/checkout', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ priceId, plan }),
      });

      const body = await res.json();
      if (!res.ok) throw new Error(body.error || 'Checkout failed');

      window.location.href = body.url;
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Checkout failed');
      setCheckoutLoading(null);
    }
  }

  async function openCustomerPortal() {
    setCheckoutLoading('portal');
    setError('');
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const token = session?.access_token;
      if (!token) throw new Error('Not authenticated');

      const res = await fetch('/api/stripe/portal', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
      });

      const body = await res.json();
      if (!res.ok) throw new Error(body.error || 'Portal failed');

      window.location.href = body.url;
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Portal failed');
      setCheckoutLoading(null);
    }
  }

  const gates = PLAN_GATES[currentPlan];

  const plans: Array<{ id: Plan; name: string; price: string; priceId?: string; description: string; icon: React.ReactNode; features: string[] }> = [
    {
      id: 'free',
      name: 'Free',
      price: '$0/mo',
      description: 'For individuals just getting started.',
      icon: <Zap className="h-5 w-5 text-emerald-400" />,
      features: [
        '50 receipts per month',
        '1 user',
        'Basic CRA compliance',
        'AI receipt scanning',
        'Dashboard & history',
      ],
    },
    {
      id: 'pro',
      name: 'Pro',
      price: '$29/mo',
      priceId: 'price_placeholder_pro', // Replace with real Stripe Price ID after setup
      description: 'For small teams and growing businesses.',
      icon: <Crown className="h-5 w-5 text-amber-400" />,
      features: [
        'Unlimited receipts',
        'Up to 5 users',
        'QBO & Xero sync',
        'All exports (PDF, CSV, Excel)',
        'Approval & reimbursement workflows',
        'Bank reconciliation (CSV upload)',
        '14-day free trial',
      ],
    },
    {
      id: 'enterprise',
      name: 'Enterprise',
      price: '$99/mo',
      priceId: 'price_placeholder_enterprise', // Replace with real Stripe Price ID after setup
      description: 'For accounting firms & large orgs.',
      icon: <Shield className="h-5 w-5 text-purple-400" />,
      features: [
        'Unlimited everything',
        'Unlimited users',
        'SSO / SAML',
        'Custom fields & API access',
        'White-label options',
        'Dedicated support',
      ],
    },
  ];

  return (
    <AuroraBackground>
      <div className="relative mx-auto flex min-h-screen w-full max-w-5xl flex-col px-4 py-24 z-10">
        <div className="mb-6">
          <button onClick={() => router.push('/')} className="text-sm font-semibold text-text-secondary hover:text-champagne transition flex items-center gap-1">
            <ArrowLeft className="h-4 w-4" /> Back to Dashboard
          </button>
        </div>

        <div className="w-full rounded-3xl border border-glass-border bg-surface/80 p-8 shadow-2xl backdrop-blur-xl sm:p-12">
          <div className="mb-8 flex items-center gap-4 border-b border-glass-border pb-6">
            <div className="flex h-14 w-14 items-center justify-center rounded-[2rem] bg-champagne/15">
              <CreditCard className="h-7 w-7 text-champagne" />
            </div>
            <div>
              <h1 className="text-2xl font-bold tracking-tight text-text-primary">Billing & Plan</h1>
              <p className="text-sm text-text-secondary">Manage your subscription and payment method</p>
            </div>
          </div>

          {error && (
            <div className="mb-6 flex items-center gap-2 rounded-[2rem] bg-red-500/10 px-4 py-3 text-sm text-red-400 border border-red-500/20">
              <AlertCircle className="h-4 w-4" />
              <span>{error}</span>
            </div>
          )}

          {success && (
            <div className="mb-6 flex items-center gap-2 rounded-[2rem] bg-emerald-500/10 px-4 py-3 text-sm text-emerald-400 border border-emerald-500/20">
              <CheckCircle2 className="h-4 w-4" />
              <span>{success}</span>
            </div>
          )}

          {loading ? (
            <div className="flex justify-center py-12"><Loader2 className="h-8 w-8 animate-spin text-champagne" /></div>
          ) : (
            <div className="space-y-10">
              {/* Current Plan Card */}
              <div className="rounded-[3rem] border border-glass-border bg-black/20 p-6">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h2 className="text-lg font-bold text-text-primary">Current Plan</h2>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-xl font-bold text-champagne">{formatPlanLabel(currentPlan)}</span>
                      {subscription?.status === 'trialing' && (
                        <span className="text-xs bg-amber-100 text-amber-700 px-2 py-0.5 rounded-full font-semibold">Trial</span>
                      )}
                      {subscription?.status === 'past_due' && (
                        <span className="text-xs bg-red-100 text-red-700 px-2 py-0.5 rounded-full font-semibold">Past Due</span>
                      )}
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-xs text-text-muted">Receipts</p>
                    <p className="text-sm font-bold text-white">
                      {gates.receiptLimit === Infinity ? 'Unlimited' : gates.receiptLimit}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-3 text-sm text-text-secondary mb-4">
                  <Users className="h-4 w-4" />
                  <span>Up to {gates.userLimit === Infinity ? 'Unlimited' : gates.userLimit} users</span>
                </div>

                {subscription?.current_period_end && (
                  <p className="text-xs text-text-muted mb-4">
                    Current period ends: {new Date(subscription.current_period_end).toLocaleDateString('en-CA')}
                  </p>
                )}

                {subscription?.stripe_customer_id && (
                  <button
                    onClick={openCustomerPortal}
                    disabled={checkoutLoading === 'portal'}
                    className="rounded-[2rem] border border-glass-border bg-white/5 px-4 py-2 text-sm font-semibold text-text-primary transition hover:bg-white/10 disabled:opacity-50"
                  >
                    {checkoutLoading === 'portal' ? <Loader2 className="h-4 w-4 animate-spin inline mr-2" /> : null}
                    Manage Payment Method / Cancel
                  </button>
                )}
              </div>

              {/* Plan Selection */}
              <div>
                <h2 className="text-lg font-bold text-text-primary mb-4">Choose Your Plan</h2>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {plans.map((p) => {
                    const isCurrent = currentPlan === p.id;
                    return (
                      <div
                        key={p.id}
                        className={`rounded-[2rem] border p-6 transition ${
                          isCurrent
                            ? 'border-champagne bg-champagne/5'
                            : 'border-glass-border bg-black/20 hover:border-white/20'
                        }`}
                      >
                        <div className="flex items-center gap-2 mb-3">
                          {p.icon}
                          <h3 className="font-bold text-text-primary">{p.name}</h3>
                          {isCurrent && (
                            <span className="ml-auto text-[10px] bg-champagne text-black px-2 py-0.5 rounded-full font-bold">ACTIVE</span>
                          )}
                        </div>
                        <p className="text-2xl font-bold text-white mb-1">{p.price}</p>
                        <p className="text-xs text-text-muted mb-4">{p.description}</p>
                        <ul className="space-y-2 mb-6">
                          {p.features.map((f, i) => (
                            <li key={i} className="flex items-start gap-2 text-xs text-text-secondary">
                              <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400 mt-0.5 flex-shrink-0" />
                              {f}
                            </li>
                          ))}
                        </ul>

                        {p.priceId && !isCurrent && (
                          <button
                            onClick={() => startCheckout(p.priceId!, p.id)}
                            disabled={!!checkoutLoading}
                            className="w-full rounded-[2rem] bg-champagne px-4 py-2.5 text-sm font-bold text-black transition hover:bg-champagne/90 disabled:opacity-50"
                          >
                            {checkoutLoading === p.priceId ? (
                              <Loader2 className="h-4 w-4 animate-spin inline mr-2" />
                            ) : null}
                            {currentPlan === 'free' && p.id === 'pro' ? 'Start Free Trial' : 'Upgrade'}
                          </button>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>

              {!env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY && (
                <div className="rounded-[2rem] border border-amber-500/20 bg-amber-500/5 p-4 text-xs text-amber-300">
                  <strong>Stripe is not configured.</strong> Add <code>NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY</code> and <code>STRIPE_SECRET_KEY</code> to your environment variables to enable billing.
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </AuroraBackground>
  );
}
