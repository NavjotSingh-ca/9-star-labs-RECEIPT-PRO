import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import Stripe from 'stripe';
import { z } from 'zod';
import { env } from '@/lib/env';
import { logError } from '@/lib/logger';
import { withRateLimit } from '@/lib/rate-limiter';

const stripe = env.STRIPE_SECRET_KEY
  ? new Stripe(env.STRIPE_SECRET_KEY)
  : null;

function getUserClient(token?: string) {
  return createClient(env.NEXT_PUBLIC_SUPABASE_URL!, env.NEXT_PUBLIC_SUPABASE_ANON_KEY!, {
    global: token ? { headers: { Authorization: `Bearer ${token}` } } : {},
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

const checkoutSchema = z.object({
  priceId: z.string().min(1),
  plan: z.enum(['free', 'starter', 'pro', 'business', 'enterprise']).optional(),
});

/**
 * POST /api/stripe/checkout
 * Creates a Stripe Checkout session for subscription purchases.
 * Requires a valid Bearer token. Auto-creates a Stripe customer if one doesn't exist.
 * Pro plans get a 14-day trial period.
 * 
 * Body: { priceId: string, plan?: 'free' | 'starter' | 'pro' | 'business' | 'enterprise' }
 * Returns: { url: string } — Stripe Checkout session URL.
 * Rate limited: 10 requests per 60s.
 */
async function handler(request: Request) {
  try {
    if (!stripe) {
      return NextResponse.json({ error: 'Stripe is not configured. Set STRIPE_SECRET_KEY in env.' }, { status: 503 });
    }

    const parsed = checkoutSchema.safeParse(await request.json().catch(() => ({})));
    if (!parsed.success) {
      return NextResponse.json({ error: 'Invalid request body' }, { status: 400 });
    }
    const { priceId, plan } = parsed.data;

    const authHeader = request.headers.get('authorization') || '';
    if (!authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const token = authHeader.slice(7);

    const userClient = getUserClient(token);
    const { data: { user }, error: authError } = await userClient.auth.getUser(token);
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { data: roleData } = await userClient
      .from('user_roles')
      .select('org_id')
      .eq('user_id', user.id)
      .single();

    const orgId = roleData?.org_id as string | undefined;
    if (!orgId) {
      return NextResponse.json({ error: 'No organization found' }, { status: 400 });
    }

    const { data: subRow } = await userClient
      .from('subscriptions')
      .select('stripe_customer_id')
      .eq('org_id', orgId)
      .single();

    let customerId = subRow?.stripe_customer_id as string | undefined;

    if (!customerId) {
      const customer = await stripe.customers.create({
        email: user.email,
        metadata: { org_id: orgId, user_id: user.id },
      });
      customerId = customer.id;

      await userClient
        .from('subscriptions')
        .upsert({
          org_id: orgId,
          stripe_customer_id: customerId,
          plan: plan || 'pro',
          updated_at: new Date().toISOString(),
        }, { onConflict: 'org_id' });
    }

    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      line_items: [{ price: priceId, quantity: 1 }],
      mode: 'subscription',
      success_url: `${env.NEXT_PUBLIC_SITE_URL}/settings/billing?success=1`,
      cancel_url: `${env.NEXT_PUBLIC_SITE_URL}/settings/billing?canceled=1`,
      subscription_data: {
        metadata: { org_id: orgId, plan: plan || 'pro' },
        trial_period_days: plan === 'pro' ? 14 : undefined,
      },
    });

    return NextResponse.json({ url: session.url });
  } catch (err: unknown) {
    logError(err, { action: 'stripe_checkout' });
    return NextResponse.json({ error: 'Checkout failed' }, { status: 500 });
  }
}

export const POST = withRateLimit(handler, { maxTokens: 10, windowMs: 60_000, keyPrefix: 'stripe:checkout' });