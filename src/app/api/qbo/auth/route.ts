import { NextResponse } from 'next/server';
import { env } from '@/lib/env';
import { supabaseAdmin } from '@/lib/supabase-admin';
import { requireAuth } from '@/lib/auth-helpers';
import { logError } from '@/lib/logger';
import { withRateLimit } from '@/lib/rate-limiter';
import crypto from 'crypto';

const QBO_CLIENT_ID = env.QBO_CLIENT_ID || '';
const QBO_REDIRECT_URI = `${env.NEXT_PUBLIC_SITE_URL}/api/qbo/callback`;

/**
 * GET /api/qbo/auth
 *
 * Initiates the QuickBooks Online OAuth 2.0 authorization flow.
 * Requires a valid Bearer token for authentication.
 * Stores CSRF state + nonce in organization_settings (10-min expiry).
 *
 * Returns: { url: string } — Intuit OAuth URL to redirect the user to.
 * Rate limited: 5 requests per 60s.
 */
async function handler(request: Request) {
  try {
    if (!QBO_CLIENT_ID) {
      return NextResponse.json({ error: 'QBO not configured. Set QBO_CLIENT_ID in env.' }, { status: 503 });
    }

    const auth = await requireAuth(request);
    if (!auth) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    const { user } = auth;

    const { data: roleData } = await supabaseAdmin
      .from('user_roles')
      .select('org_id')
      .eq('user_id', user.id)
      .single();

    const orgId = roleData?.org_id as string | undefined;
    if (!orgId) {
      return NextResponse.json({ error: 'No organization found' }, { status: 400 });
    }

    const state = crypto.randomUUID();
    const nonce = crypto.randomUUID();

    await supabaseAdmin
      .from('organization_settings')
      .upsert({
        org_id: orgId,
        qbo_auth_state: state,
        qbo_auth_nonce: nonce,
        qbo_auth_started_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      }, { onConflict: 'org_id' });

    const scopes = [
      'com.intuit.quickbooks.accounting',
      'com.intuit.quickbooks.payment',
    ].join(' ');

    const authUrl = new URL('https://appcenter.intuit.com/connect/oauth2');
    authUrl.searchParams.set('client_id', QBO_CLIENT_ID);
    authUrl.searchParams.set('redirect_uri', QBO_REDIRECT_URI);
    authUrl.searchParams.set('response_type', 'code');
    authUrl.searchParams.set('scope', scopes);
    authUrl.searchParams.set('state', state);
    authUrl.searchParams.set('nonce', nonce);

    return NextResponse.json({ url: authUrl.toString() });
  } catch (err: unknown) {
    logError(err, { action: 'qbo_oauth_init' });
    return NextResponse.json({ error: 'QBO authentication failed' }, { status: 500 });
  }
}

export const GET = withRateLimit(handler, { maxTokens: 5, windowMs: 60_000, keyPrefix: 'qbo:auth' });
