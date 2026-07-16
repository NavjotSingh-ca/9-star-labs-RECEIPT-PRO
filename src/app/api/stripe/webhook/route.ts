import { NextResponse } from 'next/server';
import Stripe from 'stripe';
import { env } from '@/lib/env';
import { supabaseAdmin } from '@/lib/supabase-admin';
import { logInfo, logWarn, logError } from '@/lib/logger';

const stripe = env.STRIPE_SECRET_KEY
  ? new Stripe(env.STRIPE_SECRET_KEY)
  : null;

const webhookSecret = env.STRIPE_WEBHOOK_SECRET;

/**
 * POST /api/stripe/webhook
 * 
 * Handles incoming Stripe webhook events with signature verification.
 * Processes: checkout.session.completed, invoice.paid, invoice.payment_failed,
 * customer.subscription.updated, customer.subscription.deleted.
 * 
 * Idempotency: Uses atomic PG function with status machine to prevent race conditions.
 * Not rate limited (Stripe manages webhook delivery retry).
 */
export async function POST(request: Request) {
  if (!stripe || !webhookSecret) {
    return NextResponse.json({ error: 'Stripe webhook not configured' }, { status: 503 });
  }

    const payload = await request.text();
    const signature = request.headers.get('stripe-signature') || '';

    let event: Stripe.Event;
    try {
      event = stripe.webhooks.constructEvent(payload, signature, webhookSecret);
    } catch (err: unknown) {
      logError(err, { action: 'stripe_webhook_signature' });
      return NextResponse.json({ error: 'Invalid webhook signature' }, { status: 400 });
    }

    // Use webhook admin client (service role) for system-level webhook processing
    // Safe because we verify Stripe signature first
    const supabase = supabaseAdmin;

    // Atomic idempotency check-and-claim
    const { data: claimed, error: claimError } = await supabase.rpc('claim_webhook_event', {
      p_event_id: event.id,
      p_event_type: event.type,
    });

    if (claimError) {
      // Unique violation (23505) means another delivery already claimed this event
      if (claimError.code === '23505') {
        return NextResponse.json({ received: true });
      }
      logError(claimError, { action: 'stripe_webhook_claim', eventId: event.id });
      return NextResponse.json({ error: 'Idempotency check failed' }, { status: 500 });
    }

    // If already processed, acknowledge
    if (!claimed) {
      return NextResponse.json({ received: true });
    }

    const planLimits: Record<string, { receipt_limit: number; user_limit: number }> = {
      free: { receipt_limit: 25, user_limit: 1 },
      starter: { receipt_limit: 200, user_limit: 3 },
      pro: { receipt_limit: 999999, user_limit: 10 },
      business: { receipt_limit: 999999, user_limit: 15 },
      enterprise: { receipt_limit: 999999, user_limit: 999999 },
    };

    try {
      switch (event.type) {
        case 'checkout.session.completed': {
          const session = event.data.object as Stripe.Checkout.Session;
          const orgId = session.metadata?.org_id;
          const plan = (session.metadata?.plan as 'free' | 'starter' | 'pro' | 'business' | 'enterprise') || 'pro';

          if (!orgId) {
            logWarn('[Stripe Webhook] No org_id in session metadata');
            break;
          }

          const limits = planLimits[plan] || planLimits.free;
          const subId = session.subscription as string;
          const custId = session.customer as string;

          await supabase
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

          const { data: localSub } = await supabase
            .from('subscriptions')
            .select('org_id')
            .eq('stripe_subscription_id', subId)
            .maybeSingle();
          if (!localSub) break;

          const periodEnd = (invoice as unknown as { period_end?: number }).period_end;
          await supabase
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

          const { data: localSub } = await supabase
            .from('subscriptions')
            .select('org_id')
            .eq('stripe_subscription_id', subId)
            .maybeSingle();
          if (!localSub) break;

          const periodEnd = (invoice as unknown as { period_end?: number }).period_end;
          await supabase
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
          await supabase
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
          await supabase
            .from('subscriptions')
            .update({
              status: 'canceled',
              plan: 'free',
              receipt_limit: 25,
              user_limit: 1,
              stripe_subscription_id: null,
              current_period_end: periodEnd ? new Date(periodEnd * 1000).toISOString() : null,
              updated_at: new Date().toISOString(),
            })
            .eq('org_id', orgId);
          break;
        }

        default:
          logInfo(`[Stripe Webhook] Unhandled event: ${event.type}`);
      }

      // Mark webhook event as completed
      await supabase.rpc('complete_webhook_event', { p_event_id: event.id });

      return NextResponse.json({ received: true });
} catch (err: unknown) {
      logError(err, { action: 'stripe_webhook_processing' });
      // Mark as failed for retry
      try {
        await supabaseAdmin.rpc('fail_webhook_event', { p_event_id: event.id, p_error: err instanceof Error ? err.message : 'Unknown error' });
      } catch {
        // Ignore secondary errors
      }
      return NextResponse.json({ error: 'Webhook processing failed' }, { status: 500 });
    }
    }