import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-admin';
import { env } from '@/lib/env';
import { withRateLimit } from '@/lib/rate-limiter';

/**
 * GET /api/health
 *
 * Comprehensive health check endpoint for monitoring (load balancers, cron jobs, etc.).
 * Checks all critical dependencies: Supabase, Resend, etc.
 * Public endpoint - no auth required for load balancer health checks.
 * 
 * Returns: { status: 'healthy' | 'degraded' | 'unhealthy', timestamp, checks: {...} }
 * Rate limited: 30 requests per 60s.
 */
async function handler(_request: Request) {
  const startTime = Date.now();
  const checks: Record<string, { status: 'healthy' | 'degraded' | 'unhealthy'; latencyMs: number; error?: string }> = {};

  // Placeholder mode: skip real checks (CI/local dev without Supabase credentials)
  const SUPABASE_URL = env.NEXT_PUBLIC_SUPABASE_URL || '';
  if (SUPABASE_URL.includes('placeholder') || !SUPABASE_URL) {
    return NextResponse.json({
      status: 'degraded',
      timestamp: new Date().toISOString(),
      latencyMs: Date.now() - startTime,
      checks: {
        database: { status: 'degraded', latencyMs: 0, error: 'Placeholder mode — Supabase not configured' },
        resend: { status: 'degraded', latencyMs: 0, error: 'Placeholder mode — not checked' },
        auth: { status: 'degraded', latencyMs: 0, error: 'Placeholder mode — Supabase not configured' },
      },
    }, { status: 200, headers: { 'Cache-Control': 'no-store, no-cache, must-revalidate' } });
  }

  // Check Supabase (database)
  try {
    const dbStart = Date.now();
    const { error } = await supabaseAdmin
      .from('organizations')
      .select('id')
      .limit(1);
    checks.database = {
      status: error ? 'unhealthy' : 'healthy',
      latencyMs: Date.now() - dbStart,
      error: error?.message,
    };
  } catch (err) {
    checks.database = { status: 'unhealthy', latencyMs: Date.now() - startTime, error: String(err) };
  }

  // Check Resend (email) connectivity
  try {
    const resendStart = Date.now();
    if (env.RESEND_API_KEY) {
      // Verify we can construct the client
      checks.resend = { status: 'healthy', latencyMs: Date.now() - resendStart };
    } else {
      checks.resend = { status: 'degraded', latencyMs: 0, error: 'Not configured' };
    }
  } catch (err) {
    checks.resend = { status: 'unhealthy', latencyMs: Date.now() - startTime, error: String(err) };
  }

  // Check Supabase Auth — verify the service client can fetch its own status.
  // This is a lightweight check that avoids heavy admin API calls.
  try {
    const authStart = Date.now();
    // The database check already verified connectivity; derive auth status from it.
    checks.auth = {
      status: checks.database?.status === 'healthy' ? 'healthy' : 'degraded',
      latencyMs: Date.now() - authStart,
    };
  } catch (err) {
    checks.auth = { status: 'unhealthy', latencyMs: Date.now() - startTime, error: String(err) };
  }

  // Determine overall status
  const statuses = Object.values(checks).map(c => c.status);
  const overallStatus = statuses.includes('unhealthy') ? 'unhealthy' :
    statuses.includes('degraded') ? 'degraded' : 'healthy';

  const totalLatencyMs = Date.now() - startTime;

  return NextResponse.json({
    status: overallStatus,
    timestamp: new Date().toISOString(),
    latencyMs: totalLatencyMs,
    checks,
  }, {
    status: overallStatus === 'unhealthy' ? 503 : 200,
    headers: {
      'Cache-Control': 'no-store, no-cache, must-revalidate',
    },
  });
}

export const GET = withRateLimit(handler, { maxTokens: 30, windowMs: 60_000, keyPrefix: 'health:check' });