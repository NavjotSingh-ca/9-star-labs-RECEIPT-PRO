import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { logError } from '@/lib/logger';
import { env } from '@/lib/env';
import { APP_NAME } from '@/lib/constants';
import { withRateLimit } from '@/lib/rate-limiter';

async function* jsonChunks(
  user: { id: string; email?: string | null; created_at?: string | null },
  userOrgId: string | null,
  token: string,
) {
  const supabase = createClient(
    env.NEXT_PUBLIC_SUPABASE_URL!,
    env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      global: { headers: { Authorization: `Bearer ${token}` } },
      auth: { persistSession: false, autoRefreshToken: false },
    }
  );

  yield '{\n';

  yield `"exported_at":${JSON.stringify(new Date().toISOString())},\n`;
  yield `"app":${JSON.stringify(APP_NAME)},\n`;
  yield `"user":${JSON.stringify({ id: user.id, email: user.email, created_at: user.created_at })},\n`;

  const receiptsPromise = supabase
    .from('receipts')
    .select('id,user_id,org_id,vendor_name,total_amount,cad_equivalent,currency,tax_amount,pst_amount,category,transaction_date,receipt_url,description,approval_status,paid_by,payment_account,payment_date,reimbursement_status,business_unit_id,project_id,is_deleted,duplicate_hash,flagged_audit,comment')
    .eq('user_id', user.id);

  const unitsPromise = userOrgId
    ? supabase.from('business_units').select('id,org_id,name,code').eq('org_id', userOrgId)
    : supabase.from('business_units').select('id').limit(0);

  const auditPromise = supabase
    .from('audit_logs')
    .select('id,user_id,org_id,action,entity_type,entity_id,details,created_at')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })
    .limit(500);

  const mileagePromise = userOrgId
    ? supabase.from('mileage_logs').select('id,user_id,org_id,trip_date,purpose,distance_km,total_amount,vehicle_id,notes').eq('user_id', user.id)
    : supabase.from('mileage_logs').select('id').limit(0);

  const vehiclesPromise = userOrgId
    ? supabase.from('vehicles').select('id,user_id,org_id,nickname,make,model,year,plate,is_default').eq('user_id', user.id)
    : supabase.from('vehicles').select('id').limit(0);

  const projectsPromise = userOrgId
    ? supabase.from('projects').select('id,user_id,org_id,name,description,budget,start_date,end_date,status').eq('user_id', user.id)
    : supabase.from('projects').select('id').limit(0);

  const commentsPromise = supabase
    .from('receipt_comments')
    .select('id,receipt_id,user_id,content,created_at')
    .eq('user_id', user.id);

  const subscriptionsPromise = userOrgId
    ? supabase.from('subscriptions').select('id,org_id,plan_type,status,current_period_start,current_period_end,stripe_subscription_id').eq('org_id', userOrgId).single()
    : supabase.from('subscriptions').select('id').limit(0);

  yield '"receipts":';
  yield JSON.stringify((await receiptsPromise).data ?? []);
  yield ',\n';

  yield '"business_units":';
  yield JSON.stringify((await unitsPromise).data ?? []);
  yield ',\n';

  yield '"audit_logs":';
  yield JSON.stringify((await auditPromise).data ?? []);
  yield ',\n';

  yield '"mileage_logs":';
  yield JSON.stringify((await mileagePromise).data ?? []);
  yield ',\n';

  yield '"vehicles":';
  yield JSON.stringify((await vehiclesPromise).data ?? []);
  yield ',\n';

  yield '"projects":';
  yield JSON.stringify((await projectsPromise).data ?? []);
  yield ',\n';

  yield '"receipt_comments":';
  yield JSON.stringify((await commentsPromise).data ?? []);
  yield ',\n';

  yield '"subscriptions":';
  yield JSON.stringify((await subscriptionsPromise).data ?? null);
  yield '\n';

  yield '}';
}

async function exportHandler(request: Request): Promise<Response> {
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

    const stream = new ReadableStream({
      async start(controller) {
        try {
          for await (const chunk of jsonChunks(user, userOrgId, token)) {
            const encoded = new TextEncoder().encode(chunk);
            controller.enqueue(encoded);
          }
        } catch (err) {
          logError(err, { action: 'export_data_stream' });
          const errorChunk = new TextEncoder().encode(`\n,"_stream_error":${JSON.stringify(err instanceof Error ? err.message : 'Unknown error')}}\n`);
          controller.enqueue(errorChunk);
        } finally {
          controller.close();
        }
      },
    });

    return new Response(stream, {
      status: 200,
      headers: {
        'Content-Disposition': `attachment; filename="${APP_NAME.toLowerCase().replace(/\s/g, '-')}-data-export-${user.id.slice(0, 8)}.json"`,
        'Content-Type': 'application/json',
      },
    });
  } catch (err) {
    logError(err, { action: 'export_data' });
    return NextResponse.json({ error: 'Export failed' }, { status: 500 });
  }
}

export const GET = withRateLimit(exportHandler, { maxTokens: 5, windowMs: 120_000, keyPrefix: 'export_data' });
