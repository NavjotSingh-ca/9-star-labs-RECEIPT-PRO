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

    const [receiptsResult, unitsResult, auditResult] = await Promise.all([
      supabase.from('receipts').select('*').eq('user_id', user.id),
      supabase.from('business_units').select('*'),
      supabase.from('audit_logs').select('*').eq('user_id', user.id).order('created_at', { ascending: false }).limit(500),
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
