import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { env } from '@/lib/env';
import crypto from 'crypto';

const QBO_CLIENT_ID = process.env.QBO_CLIENT_ID || '';
const QBO_REDIRECT_URI = `${env.NEXT_PUBLIC_SITE_URL}/api/qbo/callback`;

const supabaseAdmin = createClient(
  env.NEXT_PUBLIC_SUPABASE_URL!,
  env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export async function GET(request: Request) {
  try {
    if (!QBO_CLIENT_ID) {
      return NextResponse.json({ error: 'QBO not configured. Set QBO_CLIENT_ID in env.' }, { status: 503 });
    }

    const authHeader = request.headers.get('authorization') || '';
    const token = authHeader.replace('Bearer ', '');

    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

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

    // Generate state and nonce for security
    const state = crypto.randomUUID();
    const nonce = crypto.randomUUID();

    // Store state/nonce in org settings temporarily (valid for 10 minutes)
    await supabaseAdmin
      .from('organization_settings')
      .upsert({
        org_id: orgId,
        qbo_auth_state: state,
        qbo_auth_nonce: nonce,
        qbo_auth_started_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      }, { onConflict: 'org_id' });

    // Build QBO OAuth URL
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
    const msg = err instanceof Error ? err.message : 'QBO auth failed';
    console.error('[QBO Auth]', err);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
