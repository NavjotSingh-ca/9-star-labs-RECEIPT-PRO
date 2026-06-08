import { NextResponse } from 'next/server';
import Stripe from 'stripe';
import { env } from '@/lib/env';
import { supabaseAdmin } from '@/lib/supabase-admin';
import { logInfo, logWarn, logError } from '@/lib/logger';

const stripe = env.STRIPE_SECRET_KEY
  ? new Stripe(env.STRIPE_SECRET_KEY)
  : null;

const webhookSecret = env.STRIPE_WEBHOOK_SECRET;

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

    // MED-7: Idempotency — check if we already processed this event
    const { data: existingEvent } = await supabaseAdmin
      .from('processed_webhook_events')
      .select('id')
      .eq('event_id', event.id)
      .single();

    if (existingEvent) {
      return NextResponse.json({ received: true }); // Already processed
    }

    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session;
        const orgId = session.metadata?.org_id;
        const plan = (session.metadata?.plan as 'free' | 'starter' | 'pro' | 'business' | 'enterprise') || 'pro';

        if (!orgId) {
          logWarn('[Stripe Webhook] No org_id in session metadata');
          return NextResponse.json({ received: true });
        }

        const planLimits: Record<string, { receipt_limit: number; user_limit: number }> = {
          free: { receipt_limit: 25, user_limit: 1 },
          starter: { receipt_limit: 200, user_limit: 3 },
          pro: { receipt_limit: 999999, user_limit: 10 },
          business: { receipt_limit: 999999, user_limit: 15 },
          enterprise: { receipt_limit: 999999, user_limit: 999999 },
        };
        const limits = planLimits[plan] || planLimits.free;

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
            receipt_limit: limits.receipt_limit,
            user_limit: limits.user_limit,
            current_period_end: null,
            updated_at: new Date().toISOString(),
          }, { onConflict: 'org_id' });
        break;
      }

      case 'invoice.paid': {
        const invoice = event.data.object as Stripe.Invoice;
        const subId = (invoice as unknown as { subscription?: string }).subscription;
        if (!subId) break;

        const { data: localSub } = await supabaseAdmin
          .from('subscriptions')
          .select('org_id')
          .eq('stripe_subscription_id', subId)
          .maybeSingle();
        if (!localSub) break;

        const periodEnd = (invoice as unknown as { period_end?: number }).period_end;
        await supabaseAdmin
          .from('subscriptions')
          .update({
            status: 'active',
            current_period_end: periodEnd
              ? new Date(periodEnd * 1000).toISOString()
              : null,
            updated_at: new Date().toISOString(),
          })
          .eq('org_id', localSub.org_id);
        break;
      }

      case 'invoice.payment_failed': {
        const invoice = event.data.object as Stripe.Invoice;
        const subId = (invoice as unknown as { subscription?: string }).subscription;
        if (!subId) break;

        const { data: localSub } = await supabaseAdmin
          .from('subscriptions')
          .select('org_id')
          .eq('stripe_subscription_id', subId)
          .maybeSingle();
        if (!localSub) break;

        const periodEnd = (invoice as unknown as { period_end?: number }).period_end;
        await supabaseAdmin
          .from('subscriptions')
          .update({
            status: 'past_due',
            current_period_end: periodEnd
              ? new Date(periodEnd * 1000).toISOString()
              : null,
            updated_at: new Date().toISOString(),
          })
          .eq('org_id', localSub.org_id);
        break;
      }

      case 'customer.subscription.updated': {
        const sub = event.data.object as Stripe.Subscription;
        const orgId = sub.metadata?.org_id;
        if (!orgId) break;

        const status = sub.status === 'canceled' ? 'canceled'
          : sub.status === 'past_due' ? 'past_due'
          : sub.status === 'trialing' ? 'trialing'
          : 'active';

        const periodEnd = (sub as unknown as { current_period_end?: number }).current_period_end;
        await supabaseAdmin
          .from('subscriptions')
          .update({
            status,
            current_period_end: periodEnd
              ? new Date(periodEnd * 1000).toISOString()
              : null,
            updated_at: new Date().toISOString(),
          })
          .eq('org_id', orgId);
        break;
      }

      case 'customer.subscription.deleted': {
        const sub = event.data.object as Stripe.Subscription;
        const orgId = sub.metadata?.org_id;
        if (!orgId) break;

        const periodEnd = (sub as unknown as { current_period_end?: number }).current_period_end;
        await supabaseAdmin
          .from('subscriptions')
          .update({
            status: 'canceled',
            plan: 'free',
            receipt_limit: 25,
            user_limit: 1,
            stripe_subscription_id: null,
            updated_at: new Date().toISOString(),
          })
          .eq('org_id', orgId);
        break;
      }

      default:
        logInfo(`[Stripe Webhook] Unhandled event: ${event.type}`);
    }

    // MED-7: Record processed event for idempotency
    try {
      await supabaseAdmin
        .from('processed_webhook_events')
        .insert({ event_id: event.id, event_type: event.type });
    } catch (err) {
      console.error('[Stripe Webhook] idempotency write failed — duplicates possible:', err);
    }

    return NextResponse.json({ received: true });
  } catch (err: unknown) {
    console.error('[Stripe Webhook]', err);
    return NextResponse.json({ error: 'Webhook processing failed' }, { status: 500 });
  }
}
