import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { env } from '@/lib/env';

export async function GET(request: Request) {
  try {
    const authHeader = request.headers.get('Authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Missing authorization header' }, { status: 401 });
    }

    const token = authHeader.slice(7);
    const supabase = createClient(
      env.NEXT_PUBLIC_SUPABASE_URL!,
      env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        global: { headers: { Authorization: `Bearer ${token}` } },
        auth: { persistSession: false, autoRefreshToken: false },
      }
    );

    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { data: orgRows } = await supabase
      .from('user_roles')
      .select('org_id')
      .eq('user_id', user.id)
      .maybeSingle();
    const userOrgId = (orgRows as { org_id: string } | null)?.org_id ?? null;

    const [receiptsResult, unitsResult, auditResult, mileageResult, vehiclesResult, projectsResult, commentsResult, subscriptionsResult] = await Promise.all([
      supabase.from('receipts').select('*').eq('user_id', user.id),
      userOrgId ? supabase.from('business_units').select('*').eq('org_id', userOrgId) : supabase.from('business_units').select('*').limit(0),
      supabase.from('audit_logs').select('*').eq('user_id', user.id).order('created_at', { ascending: false }).limit(500),
      userOrgId ? supabase.from('mileage_logs').select('*').eq('user_id', user.id) : supabase.from('mileage_logs').select('*').limit(0),
      userOrgId ? supabase.from('vehicles').select('*').eq('user_id', user.id) : supabase.from('vehicles').select('*').limit(0),
      userOrgId ? supabase.from('projects').select('*').eq('user_id', user.id) : supabase.from('projects').select('*').limit(0),
      supabase.from('receipt_comments').select('*').eq('user_id', user.id),
      userOrgId ? supabase.from('subscriptions').select('*').eq('org_id', userOrgId).single() : supabase.from('subscriptions').select('*').limit(0),
    ]);

    const exportData = {
      exported_at: new Date().toISOString(),
      user: {
        id: user.id,
        email: user.email,
        created_at: user.created_at,
      },
      receipts: receiptsResult.data ?? [],
      business_units: unitsResult.data ?? [],
      audit_logs: auditResult.data ?? [],
      mileage_logs: mileageResult.data ?? [],
      vehicles: vehiclesResult.data ?? [],
      projects: projectsResult.data ?? [],
      receipt_comments: commentsResult.data ?? [],
      subscriptions: subscriptionsResult.data ?? null,
    };

    return NextResponse.json(exportData, {
      headers: {
        'Content-Disposition': `attachment; filename="9sl-data-export-${user.id.slice(0, 8)}.json"`,
        'Content-Type': 'application/json',
      },
    });
  } catch (err) {
    console.error('[EXPORT] Failed:', err);
    return NextResponse.json({ error: 'Export failed' }, { status: 500 });
  }
}
