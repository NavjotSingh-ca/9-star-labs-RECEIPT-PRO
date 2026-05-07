import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { env } from '@/lib/env';

const QBO_CLIENT_ID = process.env.QBO_CLIENT_ID || '';
const QBO_CLIENT_SECRET = process.env.QBO_CLIENT_SECRET || '';

const supabaseAdmin = createClient(
  env.NEXT_PUBLIC_SUPABASE_URL!,
  env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export async function POST(request: Request) {
  try {
    if (!QBO_CLIENT_ID || !QBO_CLIENT_SECRET) {
      return NextResponse.json({ error: 'QBO not configured' }, { status: 503 });
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

    const { data: settings } = await supabaseAdmin
      .from('organization_settings')
      .select('qbo_refresh_token')
      .eq('org_id', orgId)
      .single();

    const refreshToken = settings?.qbo_refresh_token;
    if (!refreshToken) {
      return NextResponse.json({ error: 'QBO not connected' }, { status: 400 });
    }

    // Refresh the token
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
      console.error('[QBO Refresh] Failed:', errorText);
      return NextResponse.json({ error: 'Token refresh failed' }, { status: 500 });
    }

    const tokenData = await tokenResponse.json();
    const { access_token, refresh_token: newRefreshToken, expires_in } = tokenData;

    // Update stored tokens
    await supabaseAdmin
      .from('organization_settings')
      .update({
        qbo_access_token: access_token,
        qbo_refresh_token: newRefreshToken || refreshToken, // Use new if provided, else keep old
        qbo_token_expires_at: new Date(Date.now() + expires_in * 1000).toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq('org_id', orgId);

    return NextResponse.json({ success: true });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Refresh failed';
    console.error('[QBO Refresh]', err);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
