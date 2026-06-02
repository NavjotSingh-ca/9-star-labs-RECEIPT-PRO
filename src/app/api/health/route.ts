import { NextResponse } from 'next/server';
import { getSupabase } from '@/lib/supabase';

export async function GET() {
  try {
    // Ping Supabase to keep the free-tier database from pausing
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
      db_latency_ms: latency,
    });
  } catch (err: unknown) {
    console.error('[Health]', err);
    return NextResponse.json({
      status: 'error',
      timestamp: new Date().toISOString(),
    }, { status: 500 });
  }
}
