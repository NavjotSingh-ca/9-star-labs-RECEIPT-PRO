'use client';

import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { Loader2, AlertCircle, CheckCircle2, Crown, Users, Zap, Shield } from 'lucide-react';
import { useRouter } from 'next/navigation';
import type { Plan, Subscription } from '@/lib/services/subscription';
import { getSubscription, formatPlanLabel, PLAN_GATES } from '@/lib/services/subscription';
import { env } from '@/lib/env';
import { ErrorBoundary } from '@/components/ErrorBoundary';

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
    if (!env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY) {
      setError('Stripe is not configured. Please contact support.');
      return;
    }
    setCheckoutLoading(priceId);
    setError('');
    try {
      const { data: { user }, error: authError } = await supabase.auth.getUser();
      if (authError || !user) throw new Error('Not authenticated');
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
      icon: <Zap className="h-5 w-5 text-emerald-light" />,
      features: [
        '25 receipts per month',
        '1 user',
        'Basic CRA compliance',
        'AI receipt scanning',
        'Dashboard & history',
      ],
    },
    {
      id: 'starter',
      name: 'Starter',
      price: '$19/mo',
      priceId: 'price_placeholder_starter',
      description: 'For growing businesses with moderate volume.',
      icon: <Zap className="h-5 w-5 text-champagne" />,
      features: [
        '200 receipts per month',
        'Up to 3 users',
        'QBO sync',
        'CSV & Excel exports',
        'Basic CRA compliance',
      ],
    },
    {
      id: 'pro',
      name: 'Pro',
      price: '$35/mo',
      priceId: 'price_placeholder_pro',
      description: 'For small teams and growing businesses.',
      icon: <Crown className="h-5 w-5 text-warning" />,
      features: [
        'Unlimited receipts',
        'Up to 10 users',
        'QBO & Xero sync',
        'All exports (PDF, CSV, Excel)',
        'Approval & reimbursement workflows',
        'Bank reconciliation (CSV upload)',
        'Advanced CRA scoring',
        '14-day free trial',
      ],
    },
    {
      id: 'business',
      name: 'Business',
      price: '$79/mo',
      priceId: 'price_placeholder_business',
      description: 'For larger organizations with advanced needs.',
      icon: <Users className="h-5 w-5 text-champagne" />,
      features: [
        'Unlimited receipts',
        'Up to 15 users',
        'QBO & Xero sync',
        'All exports & reports',
        'Custom fields',
        'Priority support',
        'Advanced approval workflows',
      ],
    },
    {
      id: 'enterprise',
      name: 'Enterprise',
      price: 'Custom',
      priceId: '',
      description: 'For accounting firms & large orgs.',
      icon: <Shield className="h-5 w-5 text-champagne" />,
      features: [
        'Unlimited everything',
        'Unlimited users',
        'SSO / SAML',
        'API access',
        'White-label options',
        'Dedicated account manager',
        'Custom integrations',
      ],
    },
  ];

  return (
    <>
      <div className="mb-6">
        <h1 className="text-xl font-bold tracking-tight text-text-primary">Billing & Plan</h1>
        <p className="mt-1 text-sm text-text-secondary">Manage your subscription and payment method</p>
      </div>

          {error && (
            <div className="mb-6 flex items-center gap-2 rounded-[2rem] bg-danger/10 px-4 py-3 text-sm text-danger border border-danger/20" role="alert">
              <AlertCircle className="h-4 w-4" />
              <span>{error}</span>
            </div>
          )}

          {success && (
            <div className="mb-6 flex items-center gap-2 rounded-[2rem] bg-emerald-success/10 px-4 py-3 text-sm text-emerald-light border border-emerald-success/20" role="status" aria-live="polite">
              <CheckCircle2 className="h-4 w-4" />
              <span>{success}</span>
            </div>
          )}

          {loading ? (
            <div className="flex justify-center py-12" role="status" aria-live="polite" aria-label="Loading billing"><Loader2 className="h-8 w-8 animate-spin text-champagne" /></div>
          ) : (
            <ErrorBoundary componentName="BillingSettings">
            <div className="space-y-10">
              {/* Current Plan Card */}
              <div className="rounded-[3rem] border border-glass-border bg-surface-raised p-6">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h2 className="text-lg font-bold text-text-primary">Current Plan</h2>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-xl font-bold text-champagne">{formatPlanLabel(currentPlan)}</span>
                      {subscription?.status === 'trialing' && (
                        <span className="text-xs bg-warning/10 text-warning px-2 py-0.5 rounded-full font-semibold">Trial</span>
                      )}
                      {subscription?.status === 'past_due' && (
                        <span className="text-xs bg-danger/10 text-danger px-2 py-0.5 rounded-full font-semibold">Past Due</span>
                      )}
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-xs text-text-muted">Receipts</p>
                    <p className="text-sm font-bold text-text-primary">
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
                    className="rounded-[2rem] border border-glass-border bg-surface-raised px-4 py-2 text-sm font-semibold text-text-primary transition hover:bg-surface-hover disabled:opacity-50"
                  >
                    {checkoutLoading === 'portal' ? <Loader2 className="h-4 w-4 animate-spin inline mr-2" /> : null}
                    Manage Payment Method / Cancel
                  </button>
                )}
              </div>

              {/* Plan Selection */}
              <div>
                <h2 className="text-lg font-bold text-text-primary mb-4">Choose Your Plan</h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
                  {plans.map((p) => {
                    const isCurrent = currentPlan === p.id;
                    return (
                      <div
                        key={p.id}
                        className={`rounded-[2rem] border p-6 transition ${
                          isCurrent
                            ? 'border-champagne bg-champagne/5'
                            : 'border-glass-border bg-surface-raised hover:border-glass-border-hover'
                        }`}
                      >
                        <div className="flex items-center gap-2 mb-3">
                          {p.icon}
                          <h3 className="font-bold text-text-primary">{p.name}</h3>
                          {isCurrent && (
                            <span className="ml-auto text-[10px] bg-champagne text-black px-2 py-0.5 rounded-full font-bold">ACTIVE</span>
                          )}
                        </div>
                        <p className="text-2xl font-bold text-text-primary mb-1">{p.price}</p>
                        <p className="text-xs text-text-muted mb-4">{p.description}</p>
                        <ul className="space-y-2 mb-6">
                          {p.features.map((f, i) => (
                            <li key={i} className="flex items-start gap-2 text-xs text-text-secondary">
                              <CheckCircle2 className="h-3.5 w-3.5 text-emerald-light mt-0.5 flex-shrink-0" />
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
                            {currentPlan === 'free' && p.id === 'pro' ? 'Start Free Trial' : p.id === 'enterprise' ? 'Contact Us' : 'Upgrade'}
                          </button>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>

              {!env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY && (
                <div className="rounded-[2rem] border border-warning/20 bg-warning/5 p-4 text-xs text-warning">
                  <strong>Stripe is not configured.</strong> Add <code>NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY</code> and <code>STRIPE_SECRET_KEY</code> to your environment variables to enable billing.
                </div>
              )}
            </div>
            </ErrorBoundary>
          )}
    </>
  );
}
