import { NextResponse } from 'next/server';
import { withRateLimit } from '@/lib/rate-limiter';

/**
 * GET /api/integrations/qbo
 *
 * Stub endpoint — QBO integration is planned for a future release.
 * Returns 503 with a descriptive message.
 */
async function getHandler() {
  return NextResponse.json({
    status: 'coming_soon',
    message: 'QuickBooks Online integration is coming in a future update.',
  }, { status: 503 });
}

/**
 * POST /api/integrations/qbo
 *
 * Stub endpoint — QBO integration is planned for a future release.
 * Returns 503 with a descriptive message.
 */
async function postHandler() {
  return NextResponse.json({
    status: 'coming_soon',
    message: 'QuickBooks Online integration is coming in a future update.',
  }, { status: 503 });
}

export const GET = withRateLimit(getHandler, { maxTokens: 10, windowMs: 60_000, keyPrefix: 'integrations:qbo' });
export const POST = withRateLimit(postHandler, { maxTokens: 10, windowMs: 60_000, keyPrefix: 'integrations:qbo' });
