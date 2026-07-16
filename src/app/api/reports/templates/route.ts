import { NextResponse } from 'next/server';
import { withRateLimit } from '@/lib/rate-limiter';
import { getPrebuiltTemplates, getCustomTemplates, saveCustomTemplate, ReportConfigSchema } from '@/lib/services/reports';
import { getOrgIdString } from '@/lib/supabase';
import { supabase } from '@/lib/supabase';
import { logError } from '@/lib/logger';

/**
 * GET /api/reports/templates
 *
 * Returns all available report templates (built-in + custom for the org).
 * Rate limited: 30 requests per 60s.
 */
async function GET(_request: Request) {
  try {
    const orgId = await getOrgIdString();
    if (!orgId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    const builtin = getPrebuiltTemplates();
    const custom = await getCustomTemplates(orgId);
    return NextResponse.json({ templates: [...builtin, ...custom] });
  } catch (err) {
    logError(err, { action: 'get_report_templates' });
    return NextResponse.json({ error: 'Failed to load templates' }, { status: 500 });
  }
}

/**
 * POST /api/reports/templates
 *
 * Saves a custom report template for the caller's organization.
 * Body: { name: string, config: ReportConfig }
 * Rate limited: 20 requests per 60s.
 */
async function POST(request: Request) {
  try {
    const body = await request.json();
    const { name, config } = body;
    if (!name || typeof name !== 'string') {
      return NextResponse.json({ error: 'Template name is required' }, { status: 400 });
    }
    const parsed = ReportConfigSchema.parse(config);
    const orgId = await getOrgIdString();
    if (!orgId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    await saveCustomTemplate(orgId, user.id, name, parsed);
    return NextResponse.json({ success: true });
  } catch (err) {
    logError(err, { action: 'save_template' });
    return NextResponse.json({ error: 'Failed to save template' }, { status: 500 });
  }
}

export const getTemplates = withRateLimit(GET, { maxTokens: 30, keyPrefix: 'reports:templates' });
export const createTemplate = withRateLimit(POST, { maxTokens: 20, keyPrefix: 'reports:templates' });
export { getTemplates as GET, createTemplate as POST };
