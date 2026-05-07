import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { env } from '@/lib/env';

const QBO_CLIENT_ID = process.env.QBO_CLIENT_ID || '';
const QBO_CLIENT_SECRET = process.env.QBO_CLIENT_SECRET || '';
const QBO_REDIRECT_URI = `${env.NEXT_PUBLIC_SITE_URL}/api/qbo/callback`;

const supabaseAdmin = createClient(
  env.NEXT_PUBLIC_SUPABASE_URL!,
  env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const code = searchParams.get('code');
    const state = searchParams.get('state');
    const realmId = searchParams.get('realmId');
    const error = searchParams.get('error');

    if (error) {
      return NextResponse.redirect(`${env.NEXT_PUBLIC_SITE_URL}/settings/org?qbo_error=${encodeURIComponent(error)}`);
    }

    if (!code || !state || !realmId) {
      return NextResponse.redirect(`${env.NEXT_PUBLIC_SITE_URL}/settings/org?qbo_error=missing_params`);
    }

    if (!QBO_CLIENT_ID || !QBO_CLIENT_SECRET) {
      return NextResponse.redirect(`${env.NEXT_PUBLIC_SITE_URL}/settings/org?qbo_error=not_configured`);
    }

    // Find org by state
    const { data: settingsData } = await supabaseAdmin
      .from('organization_settings')
      .select('org_id, qbo_auth_state, qbo_auth_nonce')
      .eq('qbo_auth_state', state)
      .single();

    if (!settingsData) {
      return NextResponse.redirect(`${env.NEXT_PUBLIC_SITE_URL}/settings/org?qbo_error=invalid_state`);
    }

    const orgId = settingsData.org_id;

    // Exchange code for tokens
    const tokenUrl = 'https://oauth.platform.intuit.com/oauth2/v1/tokens/bearer';
    const tokenResponse = await fetch(tokenUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Authorization': `Basic ${Buffer.from(`${QBO_CLIENT_ID}:${QBO_CLIENT_SECRET}`).toString('base64')}`,
      },
      body: new URLSearchParams({
        grant_type: 'authorization_code',
        code,
        redirect_uri: QBO_REDIRECT_URI,
      }),
    });

    if (!tokenResponse.ok) {
      const errorText = await tokenResponse.text();
      console.error('[QBO Callback] Token exchange failed:', errorText);
      return NextResponse.redirect(`${env.NEXT_PUBLIC_SITE_URL}/settings/org?qbo_error=token_exchange`);
    }

    const tokenData = await tokenResponse.json();
    const { access_token, refresh_token, expires_in } = tokenData;

    // Store tokens securely (encrypted in the future, for now stored as-is with RLS)
    await supabaseAdmin
      .from('organization_settings')
      .update({
        qbo_refresh_token: refresh_token,
        qbo_realm_id: realmId,
        qbo_access_token: access_token, // Temporary, should be refreshed
        qbo_token_expires_at: new Date(Date.now() + expires_in * 1000).toISOString(),
        qbo_connected_at: new Date().toISOString(),
        qbo_auth_state: null,
        qbo_auth_nonce: null,
        updated_at: new Date().toISOString(),
      })
      .eq('org_id', orgId);

    return NextResponse.redirect(`${env.NEXT_PUBLIC_SITE_URL}/settings/org?qbo_success=1`);
  } catch (err: unknown) {
    console.error('[QBO Callback]', err);
    return NextResponse.redirect(`${env.NEXT_PUBLIC_SITE_URL}/settings/org?qbo_error=server`);
  }
}
