import { NextResponse } from 'next/server';
import { getSupabase } from '@/lib/supabase';
import { env } from '@/lib/env';
import { logError } from '@/lib/logger';

export async function GET(request: Request) {
  const authHeader = request.headers.get('authorization');
  const cronSecret = env.CRON_SECRET;
  if (!cronSecret || authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const supabase = getSupabase();

    const start = Date.now();
    const { error } = await supabase
      .from('organizations')
      .select('id')
      .limit(1);

    const latency = Date.now() - start;

    return NextResponse.json({
      status: error ? 'degraded' : 'ok',
      timestamp: new Date().toISOString(),
    });
  } catch (err: unknown) {
    logError(err, { action: 'health_check' });
    return NextResponse.json({
      status: 'error',
      timestamp: new Date().toISOString(),
    }, { status: 500 });
  }
}
