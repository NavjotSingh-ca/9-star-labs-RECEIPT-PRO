import { NextResponse } from 'next/server';
import { z } from 'zod';
import { env } from '@/lib/env';
import { supabaseAdmin } from '@/lib/supabase-admin';
import { logError } from '@/lib/logger';
import { encryptToken } from '@/lib/encryption';

const callbackQuerySchema = z.object({
  code: z.string().min(1),
  state: z.string().uuid(),
  realmId: z.string().regex(/^\d+$/),
  error: z.string().optional(),
});

const QBO_CLIENT_ID = env.QBO_CLIENT_ID || '';
const QBO_CLIENT_SECRET = env.QBO_CLIENT_SECRET || '';
const QBO_REDIRECT_URI = `${env.NEXT_PUBLIC_SITE_URL}/api/qbo/callback`;

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const raw = {
      code: searchParams.get('code'),
      state: searchParams.get('state'),
      realmId: searchParams.get('realmId'),
      error: searchParams.get('error'),
    };
    const parsed = callbackQuerySchema.safeParse(raw);

    if (!parsed.success) {
      const qboError = raw.error ? encodeURIComponent(raw.error) : 'invalid_params';
      return NextResponse.redirect(`${env.NEXT_PUBLIC_SITE_URL}/settings/org?qbo_error=${qboError}`);
    }

    const { code, state, realmId, error } = parsed.data;

    if (error) {
      return NextResponse.redirect(`${env.NEXT_PUBLIC_SITE_URL}/settings/org?qbo_error=${encodeURIComponent(error)}`);
    }

    if (!QBO_CLIENT_ID || !QBO_CLIENT_SECRET) {
      return NextResponse.redirect(`${env.NEXT_PUBLIC_SITE_URL}/settings/org?qbo_error=not_configured`);
    }

    // Find org by state
    const { data: settingsData } = await supabaseAdmin
      .from('organization_settings')
      .select('org_id, qbo_auth_state, qbo_auth_nonce, qbo_auth_started_at')
      .eq('qbo_auth_state', state)
      .single();

    if (!settingsData) {
      return NextResponse.redirect(`${env.NEXT_PUBLIC_SITE_URL}/settings/org?qbo_error=invalid_state`);
    }

    // MED-5 / CRIT-6: Validate OAuth state expiry (10 minute window)
    if (settingsData.qbo_auth_started_at) {
      const startedAt = new Date(settingsData.qbo_auth_started_at).getTime();
      const tenMinutesMs = 10 * 60 * 1000;
      if (Date.now() - startedAt > tenMinutesMs) {
        return NextResponse.redirect(`${env.NEXT_PUBLIC_SITE_URL}/settings/org?qbo_error=state_expired`);
      }
    } else {
      // If no started_at timestamp, reject as potentially replayed
      return NextResponse.redirect(`${env.NEXT_PUBLIC_SITE_URL}/settings/org?qbo_error=state_expired`);
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
      logError(errorText, { action: 'qbo_token_exchange' });
      return NextResponse.redirect(`${env.NEXT_PUBLIC_SITE_URL}/settings/org?qbo_error=token_exchange`);
    }

    const tokenData = await tokenResponse.json();
    const { access_token, refresh_token, expires_in } = tokenData;

    // CRIT-6: Encrypt tokens before storing
    await supabaseAdmin
      .from('organization_settings')
      .update({
        qbo_refresh_token: encryptToken(refresh_token),
        qbo_realm_id: realmId,
        qbo_access_token: encryptToken(access_token),
        qbo_token_expires_at: new Date(Date.now() + expires_in * 1000).toISOString(),
        qbo_connected_at: new Date().toISOString(),
        qbo_auth_state: null,
        qbo_auth_nonce: null,
        updated_at: new Date().toISOString(),
      })
      .eq('org_id', orgId);

    return NextResponse.redirect(`${env.NEXT_PUBLIC_SITE_URL}/settings/org?qbo_success=1`);
  } catch (err: unknown) {
    logError(err, { action: 'qbo_oauth_callback' });
    return NextResponse.redirect(`${env.NEXT_PUBLIC_SITE_URL}/settings/org?qbo_error=server`);
  }
}
