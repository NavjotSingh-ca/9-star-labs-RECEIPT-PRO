import { NextResponse } from 'next/server';
import { env } from '@/lib/env';
import { supabaseAdmin } from '@/lib/supabase-admin';
import { requireAuth } from '@/lib/auth-helpers';
import { logError } from '@/lib/logger';
import { decryptToken, encryptToken } from '@/lib/encryption';
import { withRateLimit } from '@/lib/rate-limiter';

const QBO_CLIENT_ID = env.QBO_CLIENT_ID || '';
const QBO_CLIENT_SECRET = env.QBO_CLIENT_SECRET || '';

/**
 * POST /api/qbo/refresh
 *
 * Refreshes the QBO OAuth token for the caller's organization.
 * Requires a valid Bearer token. Decrypts stored refresh token,
 * exchanges it at Intuit, and stores the new encrypted tokens.
 *
 * Returns: { success: true } or { error: string }
 * Rate limited: 5 requests per 60s.
 */
async function handler(request: Request) {
  try {
    if (!QBO_CLIENT_ID || !QBO_CLIENT_SECRET) {
      return NextResponse.json({ error: 'QBO not configured' }, { status: 503 });
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

    const { data: settings } = await supabaseAdmin
      .from('organization_settings')
      .select('qbo_refresh_token')
      .eq('org_id', orgId)
      .single();

    const encryptedRefreshToken = settings?.qbo_refresh_token;
    if (!encryptedRefreshToken) {
      return NextResponse.json({ error: 'QBO not connected' }, { status: 400 });
    }

    const refreshToken = decryptToken(encryptedRefreshToken);

    const tokenUrl = 'https://oauth.platform.intuit.com/oauth2/v1/tokens/bearer';
    const tokenResponse = await fetch(tokenUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Authorization': `Basic ${Buffer.from(`${QBO_CLIENT_ID}:${QBO_CLIENT_SECRET}`).toString('base64')}`,
      },
      body: new URLSearchParams({
        grant_type: 'refresh_token',
        refresh_token: refreshToken,
      }),
    });

    if (!tokenResponse.ok) {
      const errorText = await tokenResponse.text();
      logError(errorText, { action: 'qbo_token_refresh' });
      return NextResponse.json({ error: 'Token refresh failed' }, { status: 500 });
    }

    const tokenData = await tokenResponse.json();
    // Handle revoked or expired token
    if (tokenData?.error === 'invalid_grant') {
      await supabaseAdmin
        .from('organization_settings')
        .update({
          qbo_access_token: null,
          qbo_refresh_token: null,
          qbo_token_expires_at: null,
          updated_at: new Date().toISOString(),
        })
        .eq('org_id', orgId);
      return NextResponse.json({ error: 'Token revoked – re-auth required' }, { status: 401 });
    }
    const { access_token, refresh_token: newRefreshToken, expires_in } = tokenData;

    await supabaseAdmin
      .from('organization_settings')
      .update({
        qbo_access_token: encryptToken(access_token),
        qbo_refresh_token: encryptToken(newRefreshToken || refreshToken),
        qbo_token_expires_at: new Date(Date.now() + expires_in * 1000).toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq('org_id', orgId);

    return NextResponse.json({ success: true });
  } catch (err: unknown) {
    logError(err, { action: 'qbo_token_refresh' });
    return NextResponse.json({ error: 'Token refresh failed' }, { status: 500 });
  }
}

export const POST = withRateLimit(handler, { maxTokens: 5, windowMs: 60_000, keyPrefix: 'qbo:refresh' });
