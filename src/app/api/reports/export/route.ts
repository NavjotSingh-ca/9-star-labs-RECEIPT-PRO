import { NextResponse } from 'next/server';
import { withRateLimit } from '@/lib/rate-limiter';
import { generateReport, ReportConfigSchema, ReportError, formatMetricValue, METRIC_LABELS } from '@/lib/services/reports';
import { getOrgIdString } from '@/lib/supabase';
import { logError } from '@/lib/logger';
import type { Metric } from '@/lib/services/reports';

async function POST(request: Request) {
  try {
    // Auth gate — `generateReport` is org-scoped via get_user_org(), which
    // resolves the caller's org from their session. Without a session the RPC
    // returns null and the report would run unscoped. Reject up front instead.
    const orgId = await getOrgIdString();
    if (!orgId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await request.json();
    const { config: rawConfig, format = 'csv' } = body;
    const config = ReportConfigSchema.parse(rawConfig);
    const result = await generateReport(config);

    if (format === 'csv') {
      const groupByCol = config.groupBy;
      const header = groupByCol
        ? [(METRIC_LABELS[groupByCol] || groupByCol), ...config.metrics.map((m) => METRIC_LABELS[m] || m)]
        : config.metrics.map((m) => METRIC_LABELS[m] || m);

      const rows = result.rows.map((row) =>
        groupByCol
          ? [String(row[groupByCol] ?? ''), ...config.metrics.map((m) => formatMetricValue(m as Metric, Number(row[m] ?? 0)))]
          : config.metrics.map((m) => formatMetricValue(m as Metric, Number(row[m] ?? 0)))
      );

      const csvContent = [header.join(','), ...rows.map((r) => r.join(','))].join('\n');

      return new NextResponse(csvContent, {
        headers: {
          'Content-Type': 'text/csv',
          'Content-Disposition': `attachment; filename="report-${Date.now()}.csv"`,
        },
      });
    }

    return NextResponse.json(result);
  } catch (err) {
    logError(err, { action: 'export_report' });
    if (err instanceof ReportError) {
      return NextResponse.json({ error: err.message }, { status: 400 });
    }
    return NextResponse.json({ error: 'Failed to export report' }, { status: 500 });
  }
}

export const exportReport = withRateLimit(POST, { maxTokens: 20, keyPrefix: 'reports:export' });
export { exportReport as POST };
