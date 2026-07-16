import { NextResponse } from 'next/server';
import Stripe from 'stripe';
import { env } from '@/lib/env';
import { supabaseAdmin } from '@/lib/supabase-admin';
import { logError } from '@/lib/logger';
import { withRateLimit } from '@/lib/rate-limiter';

const stripe = env.STRIPE_SECRET_KEY
  ? new Stripe(env.STRIPE_SECRET_KEY)
  : null;

/**
 * POST /api/stripe/portal
 *
 * Creates a Stripe Billing Portal session for subscription management.
 * Requires a valid Bearer token. Returns the portal URL for redirect.
 *
 * Returns: { url: string } — Stripe Billing Portal session URL.
 * Rate limited: 10 requests per 60s.
 */
async function handler(request: Request) {
  try {
    if (!stripe) {
      return NextResponse.json({ error: 'Stripe is not configured. Set STRIPE_SECRET_KEY in env.' }, { status: 503 });
    }

    const authHeader = request.headers.get('authorization') || '';
    if (!authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const token = authHeader.slice(7);

    const { data: { user }, error: authError } = await supabaseAdmin.auth.getUser(token);
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { data: roleData } = await supabaseAdmin
      .from('user_roles')
      .select('org_id')
      .eq('user_id', user.id)
      .single();

    const orgId = roleData?.org_id as string | undefined;
    if (!orgId) {
      return NextResponse.json({ error: 'No organization found' }, { status: 400 });
    }

    const { data: subRow } = await supabaseAdmin
      .from('subscriptions')
      .select('stripe_customer_id')
      .eq('org_id', orgId)
      .single();

    const customerId = subRow?.stripe_customer_id as string | undefined;
    if (!customerId) {
      return NextResponse.json({ error: 'No Stripe customer found' }, { status: 400 });
    }

    const session = await stripe.billingPortal.sessions.create({
      customer: customerId,
      return_url: `${env.NEXT_PUBLIC_SITE_URL}/settings/billing`,
    });

    return NextResponse.json({ url: session.url });
  } catch (err: unknown) {
    logError(err, { action: 'stripe_portal' });
    return NextResponse.json({ error: 'Portal session failed' }, { status: 500 });
  }
}

export const POST = withRateLimit(handler, { maxTokens: 10, windowMs: 60_000, keyPrefix: 'stripe:portal' });
