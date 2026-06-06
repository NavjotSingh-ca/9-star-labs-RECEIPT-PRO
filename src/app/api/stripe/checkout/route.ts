import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import Stripe from 'stripe';
import { z } from 'zod';
import { env } from '@/lib/env';
import { supabaseAdmin } from '@/lib/supabase-admin';

const stripe = env.STRIPE_SECRET_KEY
  ? new Stripe(env.STRIPE_SECRET_KEY)
  : null;

function getSupabaseClient(token?: string) {
  if (!token) {
    return createClient(env.NEXT_PUBLIC_SUPABASE_URL!, env.NEXT_PUBLIC_SUPABASE_ANON_KEY!);
  }
  return createClient(env.NEXT_PUBLIC_SUPABASE_URL!, env.NEXT_PUBLIC_SUPABASE_ANON_KEY!, {
    global: { headers: { Authorization: `Bearer ${token}` } },
  });
}

export async function POST(request: Request) {
  try {
    if (!stripe) {
      return NextResponse.json({ error: 'Stripe is not configured. Set STRIPE_SECRET_KEY in env.' }, { status: 503 });
    }

    const parsed = z.object({
      priceId: z.string().min(1),
      plan: z.enum(['free', 'starter', 'pro', 'business', 'enterprise']).optional(),
    }).safeParse(await request.json().catch(() => ({})));

    if (!parsed.success) {
      return NextResponse.json({ error: 'Invalid request body' }, { status: 400 });
    }
    const { priceId, plan } = parsed.data;

    // Get auth user from request headers (Supabase SSR token)
    const authHeader = request.headers.get('authorization') || '';
    const token = authHeader.replace('Bearer ', '');

    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { data: { user }, error: authError } = await supabaseAdmin.auth.getUser(token);
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get user's org and current subscription
    const supabaseClient = getSupabaseClient(token);
    const { data: roleData } = await supabaseClient
      .from('user_roles')
      .select('org_id')
      .eq('user_id', user.id)
      .single();

    const orgId = roleData?.org_id as string | undefined;
    if (!orgId) {
      return NextResponse.json({ error: 'No organization found' }, { status: 400 });
    }

    const { data: subRow } = await supabaseClient
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

      await supabaseClient
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
    console.error('[Stripe Checkout]', err);
    return NextResponse.json({ error: 'Checkout failed' }, { status: 500 });
  }
}
