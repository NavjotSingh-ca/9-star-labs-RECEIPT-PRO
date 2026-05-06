import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export async function GET() {
  try {
    // Ping Supabase to keep the free-tier database from pausing
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );

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
      error: error?.message ?? null,
    });
  } catch (err: unknown) {
    return NextResponse.json({
      status: 'error',
      timestamp: new Date().toISOString(),
      error: err instanceof Error ? err.message : 'Unknown error',
    }, { status: 500 });
  }
}
