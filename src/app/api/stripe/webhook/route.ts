import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import Stripe from 'stripe';
import { env } from '@/lib/env';

const stripe = env.STRIPE_SECRET_KEY
  ? new Stripe(env.STRIPE_SECRET_KEY, { apiVersion: '2026-04-22.dahlia' as any })
  : null;

const webhookSecret = env.STRIPE_WEBHOOK_SECRET;

const supabaseAdmin = createClient(
  env.NEXT_PUBLIC_SUPABASE_URL!,
  env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export async function POST(request: Request) {
  try {
    if (!stripe || !webhookSecret) {
      return NextResponse.json({ error: 'Stripe webhook not configured' }, { status: 503 });
    }

    const payload = await request.text();
    const signature = request.headers.get('stripe-signature') || '';

    let event: Stripe.Event;
    try {
      event = stripe.webhooks.constructEvent(payload, signature, webhookSecret);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Invalid signature';
      return NextResponse.json({ error: msg }, { status: 400 });
    }

    const subscription = event.data.object as Stripe.Subscription;
    const orgId = subscription.metadata?.org_id;
    const plan = (subscription.metadata?.plan as 'free' | 'pro' | 'enterprise') || 'pro';

    if (!orgId) {
      console.warn('[Stripe Webhook] No org_id in subscription metadata');
      return NextResponse.json({ received: true });
    }

    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session;
        const subId = session.subscription as string;
        const custId = session.customer as string;

        await supabaseAdmin
          .from('subscriptions')
          .upsert({
            org_id: orgId,
            plan,
            stripe_customer_id: custId,
            stripe_subscription_id: subId,
            status: 'active',
            receipt_limit: plan === 'pro' ? 999999 : 50,
            user_limit: plan === 'pro' ? 5 : 1,
            current_period_end: (subscription as any).current_period_end
              ? new Date((subscription as any).current_period_end * 1000).toISOString()
              : null,
            updated_at: new Date().toISOString(),
          }, { onConflict: 'org_id' });
        break;
      }

      case 'invoice.paid': {
        await supabaseAdmin
          .from('subscriptions')
          .update({
            status: 'active',
            current_period_end: (subscription as any).current_period_end
              ? new Date((subscription as any).current_period_end * 1000).toISOString()
              : null,
            updated_at: new Date().toISOString(),
          })
          .eq('org_id', orgId);
        break;
      }

      case 'invoice.payment_failed':
      case 'customer.subscription.updated': {
        const status = subscription.status === 'canceled' ? 'canceled'
          : subscription.status === 'past_due' ? 'past_due'
          : subscription.status === 'trialing' ? 'trialing'
          : 'active';

        await supabaseAdmin
          .from('subscriptions')
          .update({
            status,
            current_period_end: (subscription as any).current_period_end
              ? new Date((subscription as any).current_period_end * 1000).toISOString()
              : null,
            updated_at: new Date().toISOString(),
          })
          .eq('org_id', orgId);
        break;
      }

      case 'customer.subscription.deleted': {
        await supabaseAdmin
          .from('subscriptions')
          .update({
            status: 'canceled',
            plan: 'free',
            receipt_limit: 50,
            user_limit: 1,
            stripe_subscription_id: null,
            updated_at: new Date().toISOString(),
          })
          .eq('org_id', orgId);
        break;
      }

      default:
        console.log(`[Stripe Webhook] Unhandled event: ${event.type}`);
    }

    return NextResponse.json({ received: true });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Webhook processing failed';
    console.error('[Stripe Webhook]', err);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
