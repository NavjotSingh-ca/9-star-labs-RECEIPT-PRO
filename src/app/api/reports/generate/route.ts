import { NextResponse } from 'next/server';
import { withRateLimit } from '@/lib/rate-limiter';
import { generateReport, ReportConfigSchema, ReportError } from '@/lib/services/reports';
import { getOrgIdString } from '@/lib/supabase';
import { logError } from '@/lib/logger';

async function POST(request: Request) {
  try {
    // Auth gate — `generateReport` is org-scoped via get_user_org(). Without
    // a session the RPC returns null and the report would run unscoped.
    const orgId = await getOrgIdString();
    if (!orgId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await request.json();
    const parsed = ReportConfigSchema.parse(body);
    const result = await generateReport(parsed);
    return NextResponse.json(result);
  } catch (err) {
    logError(err, { action: 'generate_report' });
    if (err instanceof ReportError) {
      return NextResponse.json({ error: err.message }, { status: 400 });
    }
    return NextResponse.json({ error: 'Failed to generate report' }, { status: 500 });
  }
}

export const generate = withRateLimit(POST, { maxTokens: 30, keyPrefix: 'reports:generate' });
export { generate as POST };
