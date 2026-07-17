'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Check, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '@/lib/supabase';
import { env } from '@/lib/env';
import { motion } from 'framer-motion';
import { fadeUp, springGentle } from '@/lib/animations';

// ─── Plan Configuration ────────────────────────────────────────
// PricingTable.tsx — All plans currently on free trial until Apr 2027
// To enable real billing, set NEXT_PUBLIC_STRIPE_PRICE_PRO and NEXT_PUBLIC_STRIPE_PRICE_BUSINESS
// Create prices in Stripe Dashboard → Products → Add Product.

const TRIAL_EXPIRY_DATE = 'April 2027';

const PLANS = [
  {
    id: 'free' as const,
    name: 'Free Trial',
    price: '$0',
    description: 'Basic receipt tracking with generous limits (trial expires ' + TRIAL_EXPIRY_DATE + ')',
    priceId: '', // Free plan — no checkout
    features: [
      'Up to 50 receipts/month',
      '1 user',
      'Basic receipt scanning',
      'CSV export',
      'Manual categorization',
    ],
    highlighted: true,
    cta: 'Current Plan',
    locked: false,
  },
  {
    id: 'pro' as const,
    name: 'Pro',
    price: '$19',
    description: 'For professionals who need more power',
    priceId: process.env.NEXT_PUBLIC_STRIPE_PRICE_PRO || '',
    features: [
      'Unlimited receipts',
      'Up to 5 users',
      'AI-powered receipt scanning',
      'QBO & Xero integration',
      'Bank reconciliation',
      'Approval workflows',
      'All export formats (PDF, CSV, JSON)',
      'Email receipt forwarding',
    ],
    highlighted: false,
    cta: 'Available Soon',
    locked: true, // Locked until ' + TRIAL_EXPIRY_DATE
  },
  {
    id: 'business' as const,
    name: 'Business',
    price: '$49',
    description: 'For teams with advanced needs',
    priceId: process.env.NEXT_PUBLIC_STRIPE_PRICE_BUSINESS || '',
    features: [
      'Everything in Pro',
      'Unlimited users',
      'Advanced analytics & reports',
      'Custom fields & tags',
      'Multi-currency support',
      'Priority support',
      'Audit log exports',
      'Custom branding',
    ],
    highlighted: false,
    cta: 'Available Soon',
    locked: true, // Locked until ' + TRIAL_EXPIRY_DATE
  },
  {
    id: 'enterprise' as const,
    name: 'Enterprise',
    price: 'Custom',
    description: 'For large organizations',
    priceId: '', // Enterprise — contact sales
    features: [
      'Everything in Business',
      'Custom integrations',
      'Dedicated account manager',
      'SLA guarantees',
      'On-premise deployment option',
      'Custom contract terms',
      'SSO / SAML',
    ],
    highlighted: false,
    cta: 'Contact Sales',
    locked: false,
  },
] as const;

type PlanId = (typeof PLANS)[number]['id'];

/**
 * Pricing table displaying available subscription plans.
 * Handles checkout flow via Stripe, enterprise contact link,
 * and shows a warning when Stripe is not configured.
 */
export function PricingTable() {
  const router = useRouter();
  const [loadingId, setLoadingId] = useState<PlanId | null>(null);

  async function handlePlanClick(plan: { id: PlanId; priceId: string; locked?: boolean }) {
    // Handle locked plans (Pro/Business during trial period)
    if (plan.locked) {
      toast.info('Upgrade options become available in ' + TRIAL_EXPIRY_DATE + '. For early access, contact support.');
      return;
    }

    if (plan.id === 'enterprise') {
      window.location.href = 'mailto:sales@9starlabs.ca?subject=Enterprise%20Plan%20Inquiry';
      return;
    }

    if (plan.id === 'free') {
      // Free plan — no checkout needed, redirect to app
      router.push('/');
      return;
    }

    if (!plan.priceId) {
      toast.error('Stripe price ID not configured. Set price IDs in PricingTable.tsx');
      return;
    }

    setLoadingId(plan.id);

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.access_token) {
        toast.error('Please sign in first');
        router.push('/');
        return;
      }

      const res = await fetch('/api/stripe/checkout', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({
          priceId: plan.priceId,
          plan: plan.id,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Checkout failed');
      }

      if (data.url) {
        window.location.href = data.url;
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to start checkout');
    } finally {
      setLoadingId(null);
    }
  }

  return (
    <section>
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-4 lg:gap-4">
        {PLANS.map((plan, i) => (
          <motion.div
            key={plan.id}
            variants={fadeUp}
            initial="hidden"
            animate="show"
            transition={{ ...springGentle, delay: i * 0.08 }}
            className={`relative flex flex-col rounded-2xl border p-6 transition-all duration-200 ${
              plan.highlighted
                ? 'border-champagne/40 bg-card shadow-lg shadow-champagne/5 scale-[1.02] z-10'
                : 'border-glass-border bg-card hover:shadow-md'
            }`}
          >
            {plan.highlighted && (
              <div className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-champagne px-4 py-1 text-[10px] font-bold uppercase tracking-wider text-obsidian">
                Most Popular
              </div>
            )}

            <h3 className="text-lg font-bold text-text-primary">{plan.name}</h3>

            <div className="mt-3 flex items-baseline gap-1">
              <span className="text-4xl font-bold tracking-tight tabular-nums text-text-primary">
                {plan.price}
              </span>
              {plan.price !== 'Custom' && <span className="text-xs text-text-muted">/month</span>}
            </div>

            <p className="mt-2 text-xs text-text-muted">{plan.description}</p>

            <ul className="mt-5 flex-1 space-y-2.5">
              {plan.features.map((f) => (
                <li key={f} className="flex items-start gap-2 text-xs text-text-secondary">
                  <Check className="mt-0.5 h-3.5 w-3.5 shrink-0 text-emerald-success" />
                  {f}
                </li>
              ))}
            </ul>

            <button
              type="button"
              onClick={() => handlePlanClick(plan)}
              disabled={loadingId === plan.id}
              className={`mt-6 flex w-full items-center justify-center gap-2 rounded-xl py-2.5 text-sm font-bold transition disabled:opacity-60 ${
                plan.highlighted
                  ? 'bg-champagne text-obsidian hover:bg-champagne-dim'
                  : 'border border-glass-border bg-surface-raised text-text-primary hover:bg-surface-hover'
              }`}
            >
              {loadingId === plan.id ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                plan.cta
              )}
            </button>
          </motion.div>
        ))}
      </div>

      {!env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY && (
        <div className="mt-6 rounded-xl border border-warning/30 bg-warning/5 p-4 text-center text-sm text-text-secondary">
          <strong className="text-warning">Stripe not configured.</strong> Set{' '}
          <code className="rounded bg-surface-hover px-1.5 py-0.5 text-xs font-mono">
            NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY
          </code>
          {' '}and{' '}
          <code className="rounded bg-surface-hover px-1.5 py-0.5 text-xs font-mono">
            STRIPE_SECRET_KEY
          </code>
          {' '}in your environment variables to activate billing.
        </div>
      )}
    </section>
  );
}
