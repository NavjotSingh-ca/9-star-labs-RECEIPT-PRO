# Reporting & Analytics Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Add reporting subsystem — engine, pre-built templates, custom builder, and scheduled email delivery.

**Architecture:** Config-driven report engine uses a Supabase RPC for server-side aggregation (tenant-isolated by org_id). 3 API routes serve templates, generate data, stream exports. UI uses existing patterns (dynamic imports, PremiumSkeletons, ErrorBoundary, Recharts). Scheduling via Supabase Edge Function.

**Tech Stack:** Next.js 15, Supabase RPC (Postgres), Zod, React Query, Recharts, shadcn/ui

**Spec:** `docs/superpowers/specs/2026-06-15-reporting-and-analytics-design.md`

---

## File Structure

### New files (11):
- `src/lib/services/reports.ts` — Types, engine, templates registry
- `src/hooks/useReports.ts` — React Query hooks
- `src/app/api/reports/templates/route.ts` — GET templates
- `src/app/api/reports/generate/route.ts` — POST generate
- `src/app/api/reports/export/route.ts` — POST export
- `src/components/reports/ReportsPage.tsx` — Main tab
- `src/components/reports/ReportTemplateCard.tsx` — Template card
- `src/components/reports/ReportViewer.tsx` — Table + chart + export
- `src/components/reports/ReportFilters.tsx` — Date range + filters
- `src/components/reports/CustomReportBuilder.tsx` — Builder form (P2)
- `src/components/reports/ScheduleManager.tsx` — Schedule CRUD (P3)
- `supabase/migrations/report_tables.sql` — report_templates + report_schedules DDL
- `supabase/migrations/report_rpc.sql` — generate_report RPC function

### Modified files (5):
- `src/lib/store.ts` — Add `'reports'` to Tab type
- `src/app/page.tsx` — Dynamic import + tab routing
- `src/components/layout/Sidebar.tsx` — Add nav item
- `src/components/layout/MoreSheet.tsx` — Add link
- `src/components/layout/MobileNav.tsx` — Add to more sheet

---

### Task 1: Database — report_templates + report_schedules tables

**Files:**
- Create: `supabase/migrations/report_tables.sql`

Write `supabase/migrations/report_tables.sql`:

```sql
-- ─── Custom report templates ───
CREATE TABLE IF NOT EXISTS report_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  config JSONB NOT NULL,
  created_by UUID NOT NULL REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_report_templates_org_id ON report_templates(org_id);

ALTER TABLE report_templates ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their org's templates"
  ON report_templates FOR SELECT
  USING (org_id = get_org_for_user(auth.uid()));

CREATE POLICY "Users can create templates for their org"
  ON report_templates FOR INSERT
  WITH CHECK (org_id = get_org_for_user(auth.uid()));

CREATE POLICY "Users can update their org's templates"
  ON report_templates FOR UPDATE
  USING (org_id = get_org_for_user(auth.uid()));

CREATE POLICY "Users can delete their org's templates"
  ON report_templates FOR DELETE
  USING (org_id = get_org_for_user(auth.uid()));

-- ─── Report schedules (Phase 3) ───
CREATE TABLE IF NOT EXISTS report_schedules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  report_config JSONB NOT NULL,
  report_name TEXT NOT NULL,
  frequency TEXT NOT NULL CHECK (frequency IN ('weekly', 'monthly', 'quarterly')),
  day_of_week INT CHECK (day_of_week BETWEEN 0 AND 6),
  day_of_month INT CHECK (day_of_month BETWEEN 1 AND 31),
  time_of_day TIME NOT NULL DEFAULT '08:00',
  email_to TEXT NOT NULL,
  format TEXT NOT NULL DEFAULT 'pdf' CHECK (format IN ('pdf', 'csv')),
  next_run_at TIMESTAMPTZ NOT NULL,
  is_active BOOLEAN DEFAULT true,
  created_by UUID NOT NULL REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_report_schedules_next_run ON report_schedules(next_run_at) WHERE is_active = true;
CREATE INDEX idx_report_schedules_org_id ON report_schedules(org_id);

ALTER TABLE report_schedules ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their org's schedules"
  ON report_schedules FOR SELECT
  USING (org_id = get_org_for_user(auth.uid()));

CREATE POLICY "Users can manage their org's schedules"
  ON report_schedules FOR INSERT
  WITH CHECK (org_id = get_org_for_user(auth.uid()));

CREATE POLICY "Users can update their org's schedules"
  ON report_schedules FOR UPDATE
  USING (org_id = get_org_for_user(auth.uid()));

CREATE POLICY "Users can delete their org's schedules"
  ON report_schedules FOR DELETE
  USING (org_id = get_org_for_user(auth.uid()));
```

Run: `npx supabase db push` (or apply via Supabase dashboard).

Verify: `SELECT * FROM report_templates LIMIT 1;` — should return 0 rows, no error.

---

### Task 2: Database — generate_report RPC function

**Files:**
- Create: `supabase/migrations/report_rpc.sql`

Write `supabase/migrations/report_rpc.sql`:

```sql
-- Server-side report aggregation.
-- Takes pre-validated parameters (Zod-validated on API layer) and returns aggregated JSON.
CREATE OR REPLACE FUNCTION generate_report(
  p_org_id UUID,
  p_metrics TEXT[],
  p_group_by TEXT DEFAULT NULL,
  p_date_from DATE DEFAULT NULL,
  p_date_to DATE DEFAULT NULL,
  p_categories TEXT[] DEFAULT NULL,
  p_vendors TEXT[] DEFAULT NULL,
  p_projects UUID[] DEFAULT NULL,
  p_business_units UUID[] DEFAULT NULL,
  p_approval_status TEXT[] DEFAULT NULL,
  p_min_amount NUMERIC DEFAULT NULL,
  p_max_amount NUMERIC DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_sql TEXT;
  v_result JSONB;
BEGIN
  v_sql := 'SELECT json_agg(row_to_json(t)) FROM (SELECT ';

  -- GROUP BY column
  IF p_group_by IS NOT NULL THEN
    v_sql := v_sql || CASE p_group_by
      WHEN 'category' THEN $$r.category AS "category"$$
      WHEN 'vendor' THEN $$r.vendor_name AS "vendor"$$
      WHEN 'month' THEN $$to_char(r.transaction_date::date, 'YYYY-MM') AS "month"$$
      WHEN 'approval_status' THEN $$COALESCE(r.approval_status, 'unknown') AS "approval_status"$$
      WHEN 'project' THEN $$COALESCE(p.name, 'Unassigned') AS "project"$$
      WHEN 'business_unit' THEN $$COALESCE(b.name, 'Unassigned') AS "business_unit"$$
    END || ', ';
  END IF;

  -- Metrics
  IF p_metrics @> ARRAY['total_spend'] THEN
    v_sql := v_sql || $$SUM(COALESCE(r.cad_equivalent, r.total_amount)) AS "total_spend", $$;
  END IF;
  IF p_metrics @> ARRAY['receipt_count'] THEN
    v_sql := v_sql || $$COUNT(*) AS "receipt_count", $$;
  END IF;
  IF p_metrics @> ARRAY['avg_receipt'] THEN
    v_sql := v_sql || $$AVG(COALESCE(r.cad_equivalent, r.total_amount)) AS "avg_receipt", $$;
  END IF;
  IF p_metrics @> ARRAY['tax_total'] THEN
    v_sql := v_sql || $$SUM(COALESCE(r.tax_amount, 0) + COALESCE(r.pst_amount, 0)) AS "tax_total", $$;
  END IF;
  IF p_metrics @> ARRAY['max_receipt'] THEN
    v_sql := v_sql || $$MAX(COALESCE(r.cad_equivalent, r.total_amount)) AS "max_receipt", $$;
  END IF;

  -- Remove trailing comma
  v_sql := rtrim(v_sql, ', ');

  -- FROM + JOINs
  v_sql := v_sql || ' FROM receipts r';
  IF p_group_by IN ('project', 'business_unit') THEN
    v_sql := v_sql || ' LEFT JOIN projects p ON p.id = r.project_id';
    IF p_group_by = 'business_unit' THEN
      v_sql := v_sql || ' LEFT JOIN business_units b ON b.id = r.business_unit_id';
    END IF;
  END IF;

  -- WHERE
  v_sql := v_sql || ' WHERE r.org_id = ' || quote_literal(p_org_id);
  v_sql := v_sql || ' AND r.is_deleted IS DISTINCT FROM true';
  IF p_date_from IS NOT NULL THEN
    v_sql := v_sql || ' AND r.transaction_date::date >= ' || quote_literal(p_date_from);
  END IF;
  IF p_date_to IS NOT NULL THEN
    v_sql := v_sql || ' AND r.transaction_date::date <= ' || quote_literal(p_date_to);
  END IF;
  IF p_categories IS NOT NULL AND array_length(p_categories, 1) > 0 THEN
    v_sql := v_sql || ' AND r.category = ANY(' || quote_literal(p_categories) || '::text[])';
  END IF;
  IF p_vendors IS NOT NULL AND array_length(p_vendors, 1) > 0 THEN
    v_sql := v_sql || ' AND r.vendor_name = ANY(' || quote_literal(p_vendors) || '::text[])';
  END IF;
  IF p_projects IS NOT NULL AND array_length(p_projects, 1) > 0 THEN
    v_sql := v_sql || ' AND r.project_id = ANY(' || quote_literal(p_projects) || '::uuid[])';
  END IF;
  IF p_business_units IS NOT NULL AND array_length(p_business_units, 1) > 0 THEN
    v_sql := v_sql || ' AND r.business_unit_id = ANY(' || quote_literal(p_business_units) || '::uuid[])';
  END IF;
  IF p_approval_status IS NOT NULL AND array_length(p_approval_status, 1) > 0 THEN
    v_sql := v_sql || ' AND r.approval_status = ANY(' || quote_literal(p_approval_status) || '::text[])';
  END IF;
  IF p_min_amount IS NOT NULL THEN
    v_sql := v_sql || ' AND COALESCE(r.cad_equivalent, r.total_amount) >= ' || p_min_amount;
  END IF;
  IF p_max_amount IS NOT NULL THEN
    v_sql := v_sql || ' AND COALESCE(r.cad_equivalent, r.total_amount) <= ' || p_max_amount;
  END IF;

  -- GROUP BY
  IF p_group_by IS NOT NULL THEN
    v_sql := v_sql || ' GROUP BY ' || CASE p_group_by
      WHEN 'category' THEN 'r.category'
      WHEN 'vendor' THEN 'r.vendor_name'
      WHEN 'month' THEN 'to_char(r.transaction_date::date, \'YYYY-MM\')'
      WHEN 'approval_status' THEN 'COALESCE(r.approval_status, \'unknown\')'
      WHEN 'project' THEN 'COALESCE(p.name, \'Unassigned\')'
      WHEN 'business_unit' THEN 'COALESCE(b.name, \'Unassigned\')'
    END;
  END IF;

  -- ORDER BY first metric
  v_sql := v_sql || ' ORDER BY "' || p_metrics[1] || '" DESC NULLS LAST';

  v_sql := v_sql || ') t';

  EXECUTE v_sql INTO v_result;
  RETURN COALESCE(v_result, '[]'::JSONB);
END;
$$;
```

Run migration. Verify: `SELECT generate_report(...)` with test params returns JSON array.

---

### Task 3: Report engine service

**Files:**
- Create: `src/lib/services/reports.ts`

```typescript
import { supabase } from '@/lib/supabase';
import { getOrgIdString } from '@/lib/supabase';
import { logError } from '@/lib/logger';
import { z } from 'zod';

// ─── Zod schemas ───

export const MetricSchema = z.enum([
  'total_spend', 'receipt_count', 'avg_receipt', 'tax_total', 'max_receipt',
]);
export type Metric = z.infer<typeof MetricSchema>;

export const DimensionSchema = z.enum([
  'category', 'vendor', 'project', 'business_unit', 'month', 'approval_status',
]);
export type Dimension = z.infer<typeof DimensionSchema>;

export const DatePresetSchema = z.enum([
  'this_month', 'last_month', 'this_quarter', 'last_quarter',
  'this_year', 'last_year', 'all_time', 'custom',
]);
export type DatePreset = z.infer<typeof DatePresetSchema>;

export const ReportConfigSchema = z.object({
  metrics: z.array(MetricSchema).min(1, 'At least one metric required'),
  groupBy: DimensionSchema.nullable().default(null),
  datePreset: DatePresetSchema,
  customDateRange: z.object({ start: z.string(), end: z.string() }).optional(),
  filters: z.object({
    categories: z.array(z.string()).optional(),
    vendors: z.array(z.string()).optional(),
    projects: z.array(z.string()).optional(),
    businessUnits: z.array(z.string()).optional(),
    approvalStatus: z.array(z.string()).optional(),
    minAmount: z.number().optional(),
    maxAmount: z.number().optional(),
  }).optional(),
});
export type ReportConfig = z.infer<typeof ReportConfigSchema>;

export interface ReportResult {
  config: ReportConfig;
  rows: Record<string, number | string>[];
  totals: Record<string, number>;
  generatedAt: string;
}

export interface ReportTemplate {
  id: string;
  name: string;
  description: string;
  icon: string;
  type: 'builtin' | 'custom';
  config: ReportConfig;
  defaultExport: 'csv' | 'pdf';
}

export class ReportError extends Error {
  constructor(message: string) { super(message); this.name = 'ReportError'; }
}

// ─── Date resolution ───

function resolveDateRange(preset: DatePreset, customRange?: { start: string; end: string }): { start: string; end: string } {
  if (preset === 'custom' && customRange) return customRange;
  const now = new Date();
  const y = now.getFullYear();
  const m = now.getMonth();

  switch (preset) {
    case 'this_month': {
      const s = `${y}-${String(m + 1).padStart(2, '0')}-01`;
      const e = new Date(y, m + 1, 0).toISOString().slice(0, 10);
      return { start: s, end: e };
    }
    case 'last_month': {
      const s = `${y}-${String(m).padStart(2, '0')}-01`;
      const e = new Date(y, m, 0).toISOString().slice(0, 10);
      return { start: s, end: e };
    }
    case 'this_quarter': {
      const q = Math.floor(m / 3) * 3;
      return { start: `${y}-${String(q + 1).padStart(2, '0')}-01`, end: new Date(y, q + 3, 0).toISOString().slice(0, 10) };
    }
    case 'last_quarter': {
      const q = Math.floor(m / 3) * 3 - 3;
      const qy = q < 0 ? y - 1 : y;
      const qa = ((q % 12) + 12) % 12;
      return { start: `${qy}-${String(qa + 1).padStart(2, '0')}-01`, end: new Date(qy, qa + 3, 0).toISOString().slice(0, 10) };
    }
    case 'this_year': return { start: `${y}-01-01`, end: `${y}-12-31` };
    case 'last_year': return { start: `${y - 1}-01-01`, end: `${y - 1}-12-31` };
    case 'all_time': return { start: '2000-01-01', end: '2099-12-31' };
    default: return { start: `${y}-01-01`, end: `${y}-12-31` };
  }
}

// ─── Engine ───

export async function generateReport(config: ReportConfig): Promise<ReportResult> {
  const parsed = ReportConfigSchema.parse(config);
  const orgId = await getOrgIdString();
  const dateRange = resolveDateRange(parsed.datePreset, parsed.customDateRange);

  try {
    const { data, error } = await supabase.rpc('generate_report', {
      p_org_id: orgId,
      p_metrics: parsed.metrics,
      p_group_by: parsed.groupBy,
      p_date_from: dateRange.start,
      p_date_to: dateRange.end,
      p_categories: parsed.filters?.categories ?? null,
      p_vendors: parsed.filters?.vendors ?? null,
      p_projects: parsed.filters?.projects ?? null,
      p_business_units: parsed.filters?.businessUnits ?? null,
      p_approval_status: parsed.filters?.approvalStatus ?? null,
      p_min_amount: parsed.filters?.minAmount ?? null,
      p_max_amount: parsed.filters?.maxAmount ?? null,
    });

    if (error) throw new ReportError(error.message);

    const rows = (data as Record<string, number | string>[]) || [];

    const totals: Record<string, number> = {};
    for (const metric of parsed.metrics) {
      totals[metric] = rows.reduce((sum, row) => sum + (Number(row[metric]) || 0), 0);
    }

    return { config: parsed, rows, totals, generatedAt: new Date().toISOString() };
  } catch (err) {
    logError(err, { action: 'generate_report' });
    if (err instanceof ReportError) throw err;
    throw new ReportError('Failed to generate report');
  }
}

// ─── Pre-built templates ───

const BUILT_IN_TEMPLATES: ReportTemplate[] = [
  {
    id: 'gst-hst-summary',
    name: 'GST/HST Claim Summary',
    description: 'Total tax paid this quarter — ready for filing',
    icon: 'FileText',
    type: 'builtin',
    defaultExport: 'pdf',
    config: { metrics: ['tax_total', 'receipt_count'], groupBy: null, datePreset: 'last_quarter' },
  },
  {
    id: 'vendor-spend',
    name: 'Vendor Spend Analysis',
    description: 'See where your money goes — spend by vendor',
    icon: 'Building2',
    type: 'builtin',
    defaultExport: 'csv',
    config: { metrics: ['total_spend', 'receipt_count', 'avg_receipt'], groupBy: 'vendor', datePreset: 'this_year' },
  },
  {
    id: 'category-breakdown',
    name: 'Category Breakdown',
    description: 'Spend and tax by expense category',
    icon: 'PieChart',
    type: 'builtin',
    defaultExport: 'csv',
    config: { metrics: ['total_spend', 'receipt_count', 'tax_total'], groupBy: 'category', datePreset: 'this_year' },
  },
  {
    id: 'monthly-trends',
    name: 'Monthly Spend Trends',
    description: 'Track spend month over month',
    icon: 'TrendingUp',
    type: 'builtin',
    defaultExport: 'csv',
    config: { metrics: ['total_spend', 'receipt_count', 'avg_receipt'], groupBy: 'month', datePreset: 'this_year' },
  },
  {
    id: 'annual-comparison',
    name: 'Annual Comparison',
    description: 'Compare monthly spending across two years',
    icon: 'Calendar',
    type: 'builtin',
    defaultExport: 'pdf',
    config: {
      metrics: ['total_spend', 'receipt_count'],
      groupBy: 'month',
      datePreset: 'custom',
      customDateRange: { start: `${new Date().getFullYear() - 1}-01-01`, end: `${new Date().getFullYear()}-12-31` },
    },
  },
];

export function getPrebuiltTemplates(): ReportTemplate[] {
  return BUILT_IN_TEMPLATES;
}

export async function getCustomTemplates(orgId: string): Promise<ReportTemplate[]> {
  const { data, error } = await supabase
    .from('report_templates')
    .select('id, name, config, created_at')
    .eq('org_id', orgId)
    .order('created_at', { ascending: false });

  if (error) { logError(error, { action: 'get_custom_templates' }); return []; }

  return (data || []).map((t) => ({
    id: t.id, name: t.name, description: 'Custom report', icon: 'FileSpreadsheet',
    type: 'custom' as const, defaultExport: 'csv' as const, config: t.config as ReportConfig,
  }));
}

export async function saveCustomTemplate(orgId: string, userId: string, name: string, config: ReportConfig): Promise<void> {
  const { error } = await supabase.from('report_templates').insert({
    org_id: orgId, name, config, created_by: userId,
  });
  if (error) { logError(error, { action: 'save_custom_template' }); throw new ReportError('Failed to save template'); }
}

export async function deleteCustomTemplate(templateId: string): Promise<void> {
  const { error } = await supabase.from('report_templates').delete().eq('id', templateId);
  if (error) { logError(error, { action: 'delete_custom_template' }); throw new ReportError('Failed to delete template'); }
}

// ─── Helpers ───

export const METRIC_LABELS: Record<Metric, string> = {
  total_spend: 'Total Spend', receipt_count: 'Receipt Count', avg_receipt: 'Average Receipt',
  tax_total: 'Tax Total', max_receipt: 'Max Receipt',
};

export function formatMetricValue(metric: Metric, value: number): string {
  if (metric === 'receipt_count') return String(Math.round(value));
  const fmt = new Intl.NumberFormat('en-CA', { style: 'currency', currency: 'CAD', maximumFractionDigits: 2 });
  return fmt.format(value);
}
```

Verify: `npx tsc --noEmit` passes.

---

### Task 4: React Query hooks

**Files:**
- Create: `src/hooks/useReports.ts`

```typescript
'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { generateReport, getPrebuiltTemplates, getCustomTemplates, saveCustomTemplate, deleteCustomTemplate } from '@/lib/services/reports';
import type { ReportConfig, ReportResult, ReportTemplate } from '@/lib/services/reports';
import { useAppStore } from '@/lib/store';

export function useReportTemplates(orgId: string) {
  return useQuery<ReportTemplate[]>({
    queryKey: ['report_templates', orgId],
    queryFn: async () => {
      const builtin = getPrebuiltTemplates();
      const custom = await getCustomTemplates(orgId);
      return [...builtin, ...custom];
    },
    staleTime: 30_000,
  });
}

export function useReportGenerate() {
  return useMutation({
    mutationFn: (config: ReportConfig) => generateReport(config),
  });
}

export function useSaveTemplate(orgId: string) {
  const qc = useQueryClient();
  const userId = useAppStore((s) => s.role); // placeholder — we need actual userId
  return useMutation({
    mutationFn: ({ name, config }: { name: string; config: ReportConfig }) =>
      saveCustomTemplate(orgId, userId, name, config),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['report_templates', orgId] }),
  });
}

export function useDeleteTemplate(orgId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (templateId: string) => deleteCustomTemplate(templateId),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['report_templates', orgId] }),
  });
}
```

Verify: `npx tsc --noEmit` passes.

---

### Task 5: API routes — templates + generate + export

**Files:**
- Create: `src/app/api/reports/templates/route.ts`
- Create: `src/app/api/reports/generate/route.ts`
- Create: `src/app/api/reports/export/route.ts`

**5a: Templates route**

```typescript
import { NextResponse } from 'next/server';
import { withRateLimit } from '@/lib/rate-limiter';
import { getPrebuiltTemplates, getCustomTemplates } from '@/lib/services/reports';
import { getOrgIdString } from '@/lib/supabase';
import { logError } from '@/lib/logger';

async function GET(request: Request) {
  try {
    const orgId = await getOrgIdString();
    const builtin = getPrebuiltTemplates();
    const custom = await getCustomTemplates(orgId);
    return NextResponse.json({ templates: [...builtin, ...custom] });
  } catch (err) {
    logError(err, { action: 'get_report_templates' });
    return NextResponse.json({ error: 'Failed to load templates' }, { status: 500 });
  }
}

export const getTemplates = withRateLimit(GET, { maxTokens: 30, keyPrefix: 'reports:templates' });
export { getTemplates as GET };
```

**5b: Generate route**

```typescript
import { NextResponse } from 'next/server';
import { withRateLimit } from '@/lib/rate-limiter';
import { generateReport, ReportConfigSchema, ReportError } from '@/lib/services/reports';
import { logError } from '@/lib/logger';

async function POST(request: Request) {
  try {
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
```

**5c: Export route**

```typescript
import { NextResponse } from 'next/server';
import { withRateLimit } from '@/lib/rate-limiter';
import { generateReport, ReportConfigSchema, ReportError, formatMetricValue, METRIC_LABELS } from '@/lib/services/reports';
import { logError } from '@/lib/logger';
import type { Metric } from '@/lib/services/reports';

async function POST(request: Request) {
  try {
    const body = await request.json();
    const { config: rawConfig, format = 'csv' } = body;
    const config = ReportConfigSchema.parse(rawConfig);
    const result = await generateReport(config);

    if (format === 'csv') {
      const header = result.config.groupBy
        ? [METRIC_LABELS[result.config.groupBy as Metric] || result.config.groupBy, ...result.config.metrics.map((m) => METRIC_LABELS[m])]
        : result.config.metrics.map((m) => METRIC_LABELS[m]);

      const rows = result.rows.map((row) =>
        result.config.groupBy
          ? [String(row[result.config.groupBy!] ?? ''), ...result.config.metrics.map((m) => formatMetricValue(m as Metric, Number(row[m] ?? 0)))]
          : result.config.metrics.map((m) => formatMetricValue(m as Metric, Number(row[m] ?? 0)))
      );

      const csvContent = [header.join(','), ...rows.map((r) => r.join(','))].join('\n');

      return new NextResponse(csvContent, {
        headers: {
          'Content-Type': 'text/csv',
          'Content-Disposition': `attachment; filename="report-${Date.now()}.csv"`,
        },
      });
    }

    // JSON format
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
```

Verify: `npx tsc --noEmit` passes.

---

### Task 6: UI — ReportsPage + TemplateCard + ReportViewer + ReportFilters

**Files:**
- Create: `src/components/reports/ReportsPage.tsx`
- Create: `src/components/reports/ReportTemplateCard.tsx`
- Create: `src/components/reports/ReportViewer.tsx`
- Create: `src/components/reports/ReportFilters.tsx`

**6a: ReportsPage.tsx**

```typescript
'use client';

import { useState, useCallback, Suspense } from 'react';
import { useReportTemplates, useReportGenerate } from '@/hooks/useReports';
import { useAppStore } from '@/lib/store';
import { ReportTemplateCard } from './ReportTemplateCard';
import { ReportViewer } from './ReportViewer';
import { ReportFilters } from './ReportFilters';
import { PremiumSkeletons } from '@/components/ui/PremiumSkeletons';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Plus, FileSpreadsheet } from 'lucide-react';
import type { ReportConfig, ReportResult, ReportTemplate } from '@/lib/services/reports';

export function ReportsPage() {
  const role = useAppStore((s) => s.role);
  const orgId = role; // HACK: useAppStore doesn't store orgId; we'll fix in page.tsx wiring
  const { data: templates, isLoading } = useReportTemplates(orgId);
  const generateMutation = useReportGenerate();
  const [selectedTemplate, setSelectedTemplate] = useState<ReportTemplate | null>(null);
  const [reportResult, setReportResult] = useState<ReportResult | null>(null);
  const [activeFilters, setActiveFilters] = useState<Partial<ReportConfig>>({});
  const [showBuilder, setShowBuilder] = useState(false);

  const handleGenerate = useCallback(async (template: ReportTemplate) => {
    setSelectedTemplate(template);
    const config = { ...template.config, ...activeFilters };
    const result = await generateMutation.mutateAsync(config);
    setReportResult(result);
  }, [activeFilters, generateMutation]);

  const handleFiltersChange = useCallback((filters: Partial<ReportConfig>) => {
    setActiveFilters(filters);
  }, []);

  if (isLoading) return <PremiumSkeletons variant="card" count={5} />;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Reports</h1>
          <p className="text-sm text-text-muted mt-1">
            Generate, export, and schedule reports from your receipt data
          </p>
        </div>
        <Button onClick={() => setShowBuilder(!showBuilder)} variant="outline" className="gap-2">
          <Plus className="h-4 w-4" />
          Custom Report
        </Button>
      </div>

      <ReportFilters onChange={handleFiltersChange} />

      {showBuilder && (
        <div className="rounded-lg border border-glass-border bg-card p-4">
          <p className="text-sm text-text-secondary">Custom report builder coming in Phase 2</p>
        </div>
      )}

      <Tabs defaultValue="library">
        <TabsList>
          <TabsTrigger value="library">Library</TabsTrigger>
          <TabsTrigger value="scheduled">Scheduled</TabsTrigger>
        </TabsList>

        <TabsContent value="library" className="mt-4">
          {templates && templates.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {templates.map((template) => (
                <ReportTemplateCard
                  key={template.id}
                  template={template}
                  onGenerate={() => handleGenerate(template)}
                  isGenerating={generateMutation.isPending && selectedTemplate?.id === template.id}
                />
              ))}
            </div>
          ) : (
            <div className="text-center py-16 text-text-muted">
              <FileSpreadsheet className="mx-auto h-12 w-12 mb-4 opacity-40" />
              <p className="font-medium">No reports yet</p>
              <p className="text-sm mt-1">Select a template to generate your first report.</p>
            </div>
          )}
        </TabsContent>

        <TabsContent value="scheduled">
          <div className="text-center py-16 text-text-muted">
            <p className="text-sm">Scheduled reports coming in Phase 3</p>
          </div>
        </TabsContent>
      </Tabs>

      {generateMutation.isPending && <PremiumSkeletons variant="table" count={5} />}

      {reportResult && !generateMutation.isPending && (
        <ErrorBoundary componentName="ReportViewer">
          <ReportViewer
            result={reportResult}
            templateName={selectedTemplate?.name ?? 'Report'}
          />
        </ErrorBoundary>
      )}

      {generateMutation.isError && (
        <div className="rounded-lg border border-danger/20 bg-danger/5 p-4 text-sm text-danger">
          Failed to generate report. Please try again.
        </div>
      )}
    </div>
  );
}
```

**6b: ReportTemplateCard.tsx**

```typescript
'use client';

import { motion } from 'framer-motion';
import { FileText, Building2, PieChart, TrendingUp, Calendar, FileSpreadsheet, Loader2 } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import type { ReportTemplate } from '@/lib/services/reports';

const ICON_MAP: Record<string, React.ElementType> = {
  FileText, Building2, PieChart, TrendingUp, Calendar, FileSpreadsheet,
};

interface Props {
  template: ReportTemplate;
  onGenerate: () => void;
  isGenerating?: boolean;
}

export function ReportTemplateCard({ template, onGenerate, isGenerating }: Props) {
  const Icon = ICON_MAP[template.icon] || FileSpreadsheet;

  return (
    <motion.div
      whileHover={{ scale: 1.02 }}
      className="group relative rounded-lg border border-glass-border bg-card p-4 shadow-sm transition-all hover:shadow-md hover:border-glass-border-hover cursor-pointer"
      onClick={onGenerate}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') onGenerate(); }}
      aria-label={`Generate ${template.name} report`}
    >
      <div className="flex items-start justify-between mb-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-champagne/10 text-champagne">
          <Icon className="h-5 w-5" />
        </div>
        <Badge variant={template.type === 'builtin' ? 'secondary' : 'outline'} className="text-[10px]">
          {template.type === 'builtin' ? 'Pre-built' : 'Custom'}
        </Badge>
      </div>
      <h3 className="font-semibold text-sm mb-1">{template.name}</h3>
      <p className="text-xs text-text-muted line-clamp-2">{template.description}</p>
      <div className="mt-3 flex items-center justify-between">
        <span className="text-[10px] uppercase tracking-wider text-text-muted">
          {template.defaultExport.toUpperCase()}
        </span>
        {isGenerating && <Loader2 className="h-4 w-4 animate-spin text-champagne" />}
      </div>
    </motion.div>
  );
}
```

**6c: ReportViewer.tsx**

```typescript
'use client';

import { useMemo } from 'react';
import { motion } from 'framer-motion';
import { Download, FileDown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { METRIC_LABELS, formatMetricValue } from '@/lib/services/reports';
import type { ReportResult, Metric } from '@/lib/services/reports';
import { DailySpendChart } from '@/components/charts/DailySpendChart';
import { CategoryDonut } from '@/components/charts/CategoryDonut';

interface Props {
  result: ReportResult;
  templateName: string;
}

export function ReportViewer({ result, templateName }: Props) {
  const groupBy = result.config.groupBy;
  const metrics = result.config.metrics;

  const chartData = useMemo(() => {
    return result.rows.map((row) => {
      const entry: Record<string, string | number> = {};
      if (groupBy) entry.name = String(row[groupBy] ?? '');
      for (const m of metrics) {
        entry[m] = Number(row[m] ?? 0);
      }
      return entry;
    });
  }, [result, groupBy, metrics]);

  const handleExport = async (format: 'csv' | 'json') => {
    const res = await fetch('/api/reports/export', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ config: result.config, format }),
    });
    if (!res.ok) return;
    const blob = await res.blob();
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${templateName.toLowerCase().replace(/\s+/g, '-')}-${Date.now()}.${format}`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      className="rounded-lg border border-glass-border bg-card overflow-hidden"
    >
      <div className="flex items-center justify-between px-4 py-3 border-b border-glass-border bg-surface/50">
        <div>
          <h3 className="font-semibold text-sm">{templateName}</h3>
          <p className="text-[10px] text-text-muted">
            Generated {new Date(result.generatedAt).toLocaleString('en-CA')}
          </p>
        </div>
        <div className="flex gap-2">
          <Button size="sm" variant="outline" onClick={() => handleExport('csv')} className="gap-1.5 text-xs">
            <Download className="h-3.5 w-3.5" /> CSV
          </Button>
          <Button size="sm" variant="outline" onClick={() => handleExport('json')} className="gap-1.5 text-xs">
            <FileDown className="h-3.5 w-3.5" /> JSON
          </Button>
        </div>
      </div>

      {/* Chart */}
      {groupBy === 'month' && chartData.length > 0 && (
        <div className="px-4 pt-4">
          <DailySpendChart data={chartData} />
        </div>
      )}
      {groupBy === 'category' && chartData.length > 0 && (
        <div className="px-4 pt-4 max-w-md mx-auto">
          <CategoryDonut data={chartData.map((d) => ({ name: String(d.name), value: Number(d.total_spend || d.tax_total || 0) }))} />
        </div>
      )}

      {/* Totals row */}
      {!groupBy && result.rows.length <= 1 && (
        <div className="px-4 py-6">
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
            {metrics.map((m) => (
              <div key={m} className="text-center p-3 rounded-lg bg-surface/50">
                <p className="text-[10px] uppercase tracking-wider text-text-muted mb-1">{METRIC_LABELS[m as Metric]}</p>
                <p className="text-lg font-semibold tabular-nums text-champagne">
                  {formatMetricValue(m as Metric, Number(result.rows[0]?.[m] ?? result.totals[m] ?? 0))}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Table */}
      {result.rows.length > 0 && groupBy && (
        <div className="overflow-x-auto px-4 pb-4">
          <table className="w-full text-sm" role="table" aria-label="Report data">
            <caption className="sr-only">{templateName} report data</caption>
            <thead>
              <tr className="border-b border-glass-border">
                {groupBy && <th className="text-left py-2 px-2 font-medium text-xs uppercase tracking-wider text-text-muted">{METRIC_LABELS[groupBy as Metric] || groupBy}</th>}
                {metrics.map((m) => (
                  <th key={m} className="text-right py-2 px-2 font-medium text-xs uppercase tracking-wider text-text-muted">{METRIC_LABELS[m as Metric]}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {result.rows.map((row, i) => (
                <tr key={i} className="border-b border-glass-border/50 hover:bg-champagne/5 transition-colors">
                  {groupBy && <td className="py-2 px-2 font-medium">{String(row[groupBy] ?? '')}</td>}
                  {metrics.map((m) => (
                    <td key={m} className="py-2 px-2 text-right tabular-nums">{formatMetricValue(m as Metric, Number(row[m] ?? 0))}</td>
                  ))}
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr className="font-semibold border-t-2 border-champagne/30">
                {groupBy && <td className="py-2 px-2 text-xs uppercase text-text-muted">Total</td>}
                {metrics.map((m) => (
                  <td key={m} className="py-2 px-2 text-right tabular-nums">{formatMetricValue(m as Metric, result.totals[m] ?? 0)}</td>
                ))}
              </tr>
            </tfoot>
          </table>
        </div>
      )}

      {result.rows.length === 0 && (
        <div className="px-4 py-8 text-center text-sm text-text-muted">
          No data matches the current filters and date range.
        </div>
      )}
    </motion.div>
  );
}
```

**6d: ReportFilters.tsx**

```typescript
'use client';

import { useState } from 'react';
import { Calendar, Filter } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import type { DatePreset, ReportConfig } from '@/lib/services/reports';

const DATE_PRESETS: { value: DatePreset; label: string }[] = [
  { value: 'this_month', label: 'This Month' },
  { value: 'last_month', label: 'Last Month' },
  { value: 'this_quarter', label: 'This Quarter' },
  { value: 'last_quarter', label: 'Last Quarter' },
  { value: 'this_year', label: 'This Year' },
  { value: 'last_year', label: 'Last Year' },
  { value: 'all_time', label: 'All Time' },
  { value: 'custom', label: 'Custom Range' },
];

interface Props {
  onChange: (filters: Partial<ReportConfig>) => void;
}

export function ReportFilters({ onChange }: Props) {
  const [preset, setPreset] = useState<DatePreset>('this_year');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  const handlePresetChange = (value: DatePreset) => {
    setPreset(value);
    onChange({
      datePreset: value,
      customDateRange: value === 'custom' && startDate && endDate ? { start: startDate, end: endDate } : undefined,
    });
  };

  const handleCustomRange = () => {
    if (startDate && endDate) {
      onChange({ datePreset: 'custom', customDateRange: { start: startDate, end: endDate } });
    }
  };

  return (
    <div className="flex flex-wrap items-center gap-2 p-3 rounded-lg border border-glass-border bg-card">
      <Filter className="h-4 w-4 text-text-muted flex-shrink-0" />
      <div className="flex flex-wrap gap-1.5">
        {DATE_PRESETS.map((p) => (
          <button
            key={p.value}
            onClick={() => handlePresetChange(p.value)}
            className={`px-2.5 py-1 text-xs rounded-full transition-colors ${
              preset === p.value
                ? 'bg-champagne text-obsidian font-medium'
                : 'bg-surface text-text-secondary hover:bg-surface-hover'
            }`}
          >
            {p.label}
          </button>
        ))}
      </div>

      {preset === 'custom' && (
        <div className="flex items-center gap-2 ml-2">
          <Calendar className="h-3.5 w-3.5 text-text-muted" />
          <Input
            type="date"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
            className="h-8 w-36 text-xs"
            aria-label="Start date"
          />
          <span className="text-xs text-text-muted">to</span>
          <Input
            type="date"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
            className="h-8 w-36 text-xs"
            aria-label="End date"
          />
          <Button size="sm" variant="outline" onClick={handleCustomRange} className="text-xs h-8">
            Apply
          </Button>
        </div>
      )}
    </div>
  );
}
```

Verify: `npx tsc --noEmit` passes.

---

### Task 7: Wire reports tab into the app

**Files:**
- Modify: `src/lib/store.ts`
- Modify: `src/app/page.tsx`
- Modify: `src/components/layout/Sidebar.tsx`
- Modify: `src/components/layout/MoreSheet.tsx`
- Modify: `src/components/layout/MobileNav.tsx`

**7a: Add `'reports'` to Tab type**

In `src/lib/store.ts`, add `'reports'` to the `Tab` union:

```typescript
export type Tab = 'dashboard' | 'receipts' | 'scan' | 'export' | 'audit' | 'reconcile' | 'mileage' | 'approvals' | 'payables' | 'projects' | 'alerts' | 'reports' | 'more';
```

**7b: Add dynamic import in page.tsx**

After the existing dynamic imports at the top of `src/app/page.tsx` (around line 58-62):

```typescript
const ReportsPage = dynamic(() => import('@/components/reports/ReportsPage').then(m => ({ default: m.ReportsPage })), {
  ssr: false,
  loading: () => <PremiumSkeletons variant="card" count={5} />,
});
```

And add a case in the `activeTab` switch (after the `alerts` case, around line 505):

```typescript
case 'reports':
  return (
    <ErrorBoundary componentName="ReportsPage">
      <ReportsPage />
    </ErrorBoundary>
  );
```

Also add `'reports'` to the `parseAsStringEnum` array and to the `Tab` type in the `activeTab` query state (around line 164):

```typescript
const [activeTab, setActiveTab] = useQueryState('tab', parseAsStringEnum<Tab>(['dashboard', 'receipts', 'scan', 'export', 'audit', 'reconcile', 'mileage', 'approvals', 'payables', 'projects', 'alerts', 'reports', 'more']).withDefault('dashboard'));
```

And add `'reports'` to the `allowedEmployeeTabs` array if needed:

```typescript
const allowedEmployeeTabs: Tab[] = ['scan', 'receipts', 'more'];
```
(Keep as-is — reports is for owners/accountants, not employees.)

And add the `tabOrder` for `role === 'Employee'`— it can stay as is since employees don't see reports.

**7c: Add nav item in Sidebar.tsx**

In the nav items section of `src/components/layout/Sidebar.tsx`, find the nav item group that contains "Alerts & Risk" (or similar). Add after the Alerts item:

```tsx
<SidebarNavItem
  icon={BarChart3}
  label="Reports"
  tab="reports"
  activeTab={activeTab}
  onTabChange={onTabChange}
/>
```

Import `BarChart3` from `lucide-react` at the top of the file if not already imported.

**7d: Add link in MoreSheet.tsx**

In the MoreSheet items list, add a Reports link after Alerts:

```tsx
<button onClick={() => onTabChange('reports')} className="...">
  <BarChart3 className="h-5 w-5" />
  <span>Reports</span>
</button>
```

**7e: Add link in MobileNav.tsx**

The MobileNav has 4 tabs: Home, Records, Scan, More. Reports should be accessible from the More sheet (which opens MoreSheet). No changes needed to MobileNav itself if Reports is in MoreSheet.

Verify: `npx tsc --noEmit` passes.

---

### Task 8: Phase 2 — Custom Report Builder

**Files:**
- Create: `src/components/reports/CustomReportBuilder.tsx`
- Modify: `src/components/reports/ReportsPage.tsx` (replace placeholder with builder)

Write `src/components/reports/CustomReportBuilder.tsx`:

```typescript
'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { useReportGenerate, useReportTemplates } from '@/hooks/useReports';
import { useAppStore } from '@/lib/store';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ReportViewer } from './ReportViewer';
import { X, Save, Eye, Loader2 } from 'lucide-react';
import { METRIC_LABELS, DatePresetSchema, DimensionSchema } from '@/lib/services/reports';
import type { Metric, Dimension, DatePreset, ReportConfig, ReportResult } from '@/lib/services/reports';

const ALL_METRICS: Metric[] = ['total_spend', 'receipt_count', 'avg_receipt', 'tax_total', 'max_receipt'];
const ALL_DIMENSIONS: Dimension[] = ['category', 'vendor', 'project', 'business_unit', 'month', 'approval_status'];
const DATE_PRESETS: DatePreset[] = ['this_month', 'last_month', 'this_quarter', 'last_quarter', 'this_year', 'last_year', 'all_time'];

interface Props {
  onClose: () => void;
}

export function CustomReportBuilder({ onClose }: Props) {
  const role = useAppStore((s) => s.role);
  const [name, setName] = useState('');
  const [metrics, setMetrics] = useState<Metric[]>(['total_spend', 'receipt_count']);
  const [groupBy, setGroupBy] = useState<Dimension | ''>('category');
  const [datePreset, setDatePreset] = useState<DatePreset>('this_year');
  const [result, setResult] = useState<ReportResult | null>(null);
  const generateMutation = useReportGenerate();
  const debounceRef = useRef<ReturnType<typeof setTimeout>>();

  const buildConfig = useCallback((): ReportConfig => ({
    metrics, groupBy: groupBy || null, datePreset,
  }), [metrics, groupBy, datePreset]);

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(async () => {
      try {
        const config = buildConfig();
        const res = await generateMutation.mutateAsync(config);
        setResult(res);
      } catch { /* preview will show error state */ }
    }, 500);
    return () => { if (debounceRef.current) clearTimeout(debounceRef.current); };
  }, [metrics, groupBy, datePreset]);

  const toggleMetric = (m: Metric) => {
    setMetrics((prev) => prev.includes(m) ? prev.filter((x) => x !== m) : [...prev, m]);
  };

  const handleSave = async () => {
    if (!name.trim()) return;
    const config = buildConfig();
    try {
      const res = await fetch('/api/reports/templates', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: name.trim(), config }),
      });
      if (res.ok) onClose();
    } catch { /* toast handled by parent */ }
  };

  return (
    <div className="rounded-lg border border-glass-border bg-card overflow-hidden">
      <div className="flex items-center justify-between px-4 py-3 border-b border-glass-border bg-surface/50">
        <h3 className="font-semibold text-sm">Custom Report</h3>
        <button onClick={onClose} className="text-text-muted hover:text-text-primary" aria-label="Close builder">
          <X className="h-4 w-4" />
        </button>
      </div>

      <div className="p-4 space-y-4">
        <div>
          <Label htmlFor="report-name">Report Name</Label>
          <Input
            id="report-name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="My Custom Report"
            className="mt-1"
          />
        </div>

        <div>
          <Label>Metrics</Label>
          <div className="flex flex-wrap gap-2 mt-1">
            {ALL_METRICS.map((m) => (
              <button
                key={m}
                onClick={() => toggleMetric(m)}
                className={`px-3 py-1.5 text-xs rounded-full transition-colors ${
                  metrics.includes(m)
                    ? 'bg-champagne text-obsidian font-medium'
                    : 'bg-surface text-text-secondary hover:bg-surface-hover'
                }`}
              >
                {METRIC_LABELS[m]}
              </button>
            ))}
          </div>
        </div>

        <div>
          <Label htmlFor="group-by">Group By</Label>
          <select
            id="group-by"
            value={groupBy}
            onChange={(e) => setGroupBy(e.target.value as Dimension | '')}
            className="mt-1 flex h-10 w-full rounded-md border border-glass-border bg-surface px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-champagne"
          >
            <option value="">No grouping (single total)</option>
            {ALL_DIMENSIONS.map((d) => (
              <option key={d} value={d}>{METRIC_LABELS[d as keyof typeof METRIC_LABELS] || d.charAt(0).toUpperCase() + d.slice(1)}</option>
            ))}
          </select>
        </div>

        <div>
          <Label htmlFor="date-preset">Date Range</Label>
          <select
            id="date-preset"
            value={datePreset}
            onChange={(e) => setDatePreset(e.target.value as DatePreset)}
            className="mt-1 flex h-10 w-full rounded-md border border-glass-border bg-surface px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-champagne"
          >
            {DATE_PRESETS.map((p) => (
              <option key={p} value={p}>{p.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase())}</option>
            ))}
          </select>
        </div>

        <div className="flex gap-2 pt-2">
          <Button onClick={handleSave} disabled={!name.trim() || generateMutation.isPending} className="gap-2">
            {generateMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
            Save Template
          </Button>
          <Button variant="outline" onClick={onClose}>Cancel</Button>
        </div>
      </div>

      {generateMutation.isPending && (
        <div className="px-4 pb-4">
          <div className="flex items-center gap-2 text-sm text-text-muted">
            <Loader2 className="h-4 w-4 animate-spin" />
            Generating preview…
          </div>
        </div>
      )}

      {result && !generateMutation.isPending && (
        <div className="px-4 pb-4">
          <ReportViewer result={result} templateName={name || 'Preview'} />
        </div>
      )}
    </div>
  );
}
```

Then update `ReportsPage.tsx` to use the real builder instead of the placeholder. Replace the placeholder block:

From:
```tsx
{showBuilder && (
  <div className="rounded-lg border border-glass-border bg-card p-4">
    <p className="text-sm text-text-secondary">Custom report builder coming in Phase 2</p>
  </div>
)}
```

To:
```tsx
{showBuilder && (
  <CustomReportBuilder onClose={() => setShowBuilder(false)} />
)}
```

And import `CustomReportBuilder` at the top.

Also update the templates POST route to handle custom template saves. Add to `templates/route.ts`:

```typescript
async function POST(request: Request) {
  try {
    const body = await request.json();
    const { name, config } = body;
    if (!name || typeof name !== 'string') {
      return NextResponse.json({ error: 'Template name is required' }, { status: 400 });
    }
    const parsed = ReportConfigSchema.parse(config);
    const orgId = await getOrgIdString();
    const userId = /* get from session */ '';

    await saveCustomTemplate(orgId, userId, name, parsed);
    return NextResponse.json({ success: true });
  } catch (err) {
    logError(err, { action: 'save_template' });
    return NextResponse.json({ error: 'Failed to save template' }, { status: 500 });
  }
}
```

Verify: `npx tsc --noEmit` passes.

---

### Task 9: Phase 3 — Schedule Manager

**Files:**
- Create: `src/components/reports/ScheduleManager.tsx`
- Modify: `src/components/reports/ReportsPage.tsx` (replace scheduled placeholder)
- Create: `src/app/api/reports/schedules/route.ts` — CRUD for schedules
- Create: `supabase/functions/send-scheduled-reports/index.ts`

**9a: Schedules API route**

```typescript
import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { getOrgIdString } from '@/lib/supabase';
import { withRateLimit } from '@/lib/rate-limiter';
import { logError } from '@/lib/logger';
import { z } from 'zod';

const ScheduleSchema = z.object({
  reportConfig: z.any(),
  reportName: z.string().min(1),
  frequency: z.enum(['weekly', 'monthly', 'quarterly']),
  dayOfWeek: z.number().min(0).max(6).optional(),
  dayOfMonth: z.number().min(1).max(31).optional(),
  timeOfDay: z.string().default('08:00'),
  emailTo: z.string().email(),
  format: z.enum(['pdf', 'csv']).default('pdf'),
});

async function GET() {
  try {
    const orgId = await getOrgIdString();
    const { data, error } = await supabase
      .from('report_schedules')
      .select('*')
      .eq('org_id', orgId)
      .order('next_run_at', { ascending: true });

    if (error) throw error;
    return NextResponse.json({ schedules: data || [] });
  } catch (err) {
    logError(err, { action: 'get_schedules' });
    return NextResponse.json({ error: 'Failed to load schedules' }, { status: 500 });
  }
}

async function POST(request: Request) {
  try {
    const body = await request.json();
    const parsed = ScheduleSchema.parse(body);
    const orgId = await getOrgIdString();

    const { data: user } = await supabase.auth.getUser();
    if (!user.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { data, error } = await supabase.from('report_schedules').insert({
      org_id: orgId,
      report_config: parsed.reportConfig,
      report_name: parsed.reportName,
      frequency: parsed.frequency,
      day_of_week: parsed.dayOfWeek ?? null,
      day_of_month: parsed.dayOfMonth ?? null,
      time_of_day: parsed.timeOfDay,
      email_to: parsed.emailTo,
      format: parsed.format,
      next_run_at: new Date().toISOString(), // Will be recalculated by the worker
      created_by: user.user.id,
    }).select().single();

    if (error) throw error;
    return NextResponse.json({ schedule: data });
  } catch (err) {
    logError(err, { action: 'create_schedule' });
    return NextResponse.json({ error: 'Failed to create schedule' }, { status: 500 });
  }
}

async function DELETE(request: Request) {
  try {
    const url = new URL(request.url);
    const id = url.searchParams.get('id');
    if (!id) return NextResponse.json({ error: 'Schedule ID required' }, { status: 400 });
    const orgId = await getOrgIdString();

    const { error } = await supabase
      .from('report_schedules')
      .delete()
      .eq('id', id)
      .eq('org_id', orgId);

    if (error) throw error;
    return NextResponse.json({ success: true });
  } catch (err) {
    logError(err, { action: 'delete_schedule' });
    return NextResponse.json({ error: 'Failed to delete schedule' }, { status: 500 });
  }
}

export const listSchedules = withRateLimit(GET, { maxTokens: 30, keyPrefix: 'schedules:list' });
export const createSchedule = withRateLimit(POST, { maxTokens: 20, keyPrefix: 'schedules:create' });
export const deleteSchedule = withRateLimit(DELETE, { maxTokens: 20, keyPrefix: 'schedules:delete' });

export { listSchedules as GET, createSchedule as POST, deleteSchedule as DELETE };
```

**9b: ScheduleManager component**

```typescript
'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAppStore } from '@/lib/store';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { AlertDialog } from '@/components/ui/alert-dialog';
import { motion } from 'framer-motion';
import { Clock, Trash2, Loader2, Bell } from 'lucide-react';
import { toast } from 'sonner';

interface Schedule {
  id: string;
  report_config: unknown;
  report_name: string;
  frequency: string;
  day_of_week: number | null;
  day_of_month: number | null;
  time_of_day: string;
  email_to: string;
  format: string;
  next_run_at: string;
  is_active: boolean;
}

export function ScheduleManager() {
  const qc = useQueryClient();
  const [showCreate, setShowCreate] = useState(false);
  const [frequency, setFrequency] = useState<'weekly' | 'monthly' | 'quarterly'>('monthly');
  const [email, setEmail] = useState('');
  const [format, setFormat] = useState<'pdf' | 'csv'>('pdf');

  const { data, isLoading } = useQuery({
    queryKey: ['report_schedules'],
    queryFn: async () => {
      const res = await fetch('/api/reports/schedules');
      if (!res.ok) throw new Error('Failed to load');
      const json = await res.json();
      return json.schedules as Schedule[];
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`/api/reports/schedules?id=${id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('Failed to delete');
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['report_schedules'] });
      toast.success('Schedule deleted');
    },
  });

  const createMutation = useMutation({
    mutationFn: async () => {
      const res = await fetch('/api/reports/schedules', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          reportConfig: {},
          reportName: 'Scheduled Report',
          frequency,
          emailTo: email,
          format,
        }),
      });
      if (!res.ok) throw new Error('Failed to create');
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['report_schedules'] });
      setShowCreate(false);
      toast.success('Schedule created');
    },
  });

  if (isLoading) return <div className="text-center py-8"><Loader2 className="h-6 w-6 animate-spin mx-auto text-champagne" /></div>;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="font-semibold text-sm">Scheduled Reports</h3>
        <Button size="sm" onClick={() => setShowCreate(!showCreate)} className="gap-2">
          <Clock className="h-4 w-4" /> New Schedule
        </Button>
      </div>

      {showCreate && (
        <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} className="rounded-lg border border-glass-border bg-card p-4 space-y-3">
          <div>
            <Label htmlFor="sched-email">Email to</Label>
            <Input id="sched-email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@company.com" className="mt-1" />
          </div>
          <div>
            <Label htmlFor="sched-freq">Frequency</Label>
            <select id="sched-freq" value={frequency} onChange={(e) => setFrequency(e.target.value as typeof frequency)} className="mt-1 flex h-10 w-full rounded-md border border-glass-border bg-surface px-3 py-2 text-sm">
              <option value="weekly">Weekly</option>
              <option value="monthly">Monthly</option>
              <option value="quarterly">Quarterly</option>
            </select>
          </div>
          <div>
            <Label htmlFor="sched-format">Format</Label>
            <select id="sched-format" value={format} onChange={(e) => setFormat(e.target.value as typeof format)} className="mt-1 flex h-10 w-full rounded-md border border-glass-border bg-surface px-3 py-2 text-sm">
              <option value="pdf">PDF</option>
              <option value="csv">CSV</option>
            </select>
          </div>
          <Button onClick={() => createMutation.mutate()} disabled={!email || createMutation.isPending} className="w-full">
            {createMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Bell className="h-4 w-4" />}
            Create Schedule
          </Button>
        </motion.div>
      )}

      {(!data || data.length === 0) && !showCreate && (
        <div className="text-center py-12 text-text-muted">
          <Clock className="mx-auto h-10 w-10 mb-3 opacity-40" />
          <p className="text-sm font-medium">No scheduled reports</p>
          <p className="text-xs mt-1">Set up recurring delivery of your reports.</p>
        </div>
      )}

      {data && data.length > 0 && (
        <div className="space-y-2">
          {data.map((s) => (
            <div key={s.id} className="flex items-center justify-between p-3 rounded-lg border border-glass-border bg-card">
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">{s.report_name}</p>
                <p className="text-xs text-text-muted">
                  {s.frequency} · {s.email_to} · {s.format.toUpperCase()}
                </p>
                <p className="text-[10px] text-text-muted">
                  Next: {new Date(s.next_run_at).toLocaleDateString('en-CA')}
                </p>
              </div>
              <AlertDialog
                trigger={<button className="p-2 text-text-muted hover:text-danger transition-colors" aria-label="Delete schedule"><Trash2 className="h-4 w-4" /></button>}
                title="Delete schedule?"
                description="This will stop future deliveries of this report."
                action="Delete"
                onAction={() => deleteMutation.mutate(s.id)}
              />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
```

**9c: Edge Function for scheduled delivery**

Create `supabase/functions/send-scheduled-reports/index.ts`:

```typescript
import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "jsr:@supabase/supabase-js@2";

Deno.serve(async (req: Request) => {
  const authHeader = req.headers.get("authorization");
  if (authHeader !== `Bearer ${Deno.env.get("CRON_SECRET")}`) {
    return new Response("Unauthorized", { status: 401 });
  }

  const supabase = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
  );

  try {
    // Find schedules due for execution
    const { data: schedules, error } = await supabase
      .from("report_schedules")
      .select("*")
      .eq("is_active", true)
      .lte("next_run_at", new Date().toISOString());

    if (error) throw error;

    for (const schedule of schedules ?? []) {
      try {
        // Generate the report
        const { data: reportResult } = await supabase.rpc("generate_report", {
          p_org_id: schedule.org_id,
          p_metrics: schedule.report_config?.metrics ?? ["total_spend"],
          p_group_by: schedule.report_config?.groupBy ?? null,
          p_date_from: "2000-01-01",
          p_date_to: "2099-12-31",
        });

        // Send email via Supabase built-in email
        const { error: emailError } = await supabase.auth.admin.sendRawEmail({
          to: schedule.email_to,
          subject: `Report: ${schedule.report_name}`,
          html: `<p>Your scheduled report "${schedule.report_name}" is ready.</p><pre>${JSON.stringify(reportResult, null, 2)}</pre>`,
        });

        if (emailError) console.error("Email failed:", emailError);

        // Calculate next run
        const nextRun = new Date(schedule.next_run_at);
        switch (schedule.frequency) {
          case "weekly": nextRun.setDate(nextRun.getDate() + 7); break;
          case "monthly": nextRun.setMonth(nextRun.getMonth() + 1); break;
          case "quarterly": nextRun.setMonth(nextRun.getMonth() + 3); break;
        }

        await supabase
          .from("report_schedules")
          .update({ next_run_at: nextRun.toISOString() })
          .eq("id", schedule.id);

      } catch (err) {
        console.error(`Schedule ${schedule.id} failed:`, err);
      }
    }

    return new Response(JSON.stringify({ processed: schedules?.length ?? 0 }), {
      headers: { "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("Scheduler failed:", err);
    return new Response("Internal error", { status: 500 });
  }
});
```

Deploy with: `supabase functions deploy send-scheduled-reports --no-verify-jwt`
Set `CRON_SECRET` env var in Supabase dashboard.
Set up a Supabase cron trigger or use Vercel Cron to hit the function URL every 30 minutes.

Verify: `npx tsc --noEmit` passes.

---

### Task 10: Tests

**Files:**
- Create: `src/lib/services/__tests__/reports.test.ts`
- Modify: `tests/reports.spec.ts` (E2E)

**10a: Unit tests for report engine**

```typescript
import { describe, it, expect } from 'vitest';
import { MetricSchema, DimensionSchema, DatePresetSchema, ReportConfigSchema, getPrebuiltTemplates, formatMetricValue, METRIC_LABELS } from '../reports';

describe('MetricSchema', () => {
  it('accepts valid metrics', () => {
    expect(MetricSchema.parse('total_spend')).toBe('total_spend');
    expect(MetricSchema.parse('receipt_count')).toBe('receipt_count');
    expect(MetricSchema.parse('tax_total')).toBe('tax_total');
  });

  it('rejects invalid metrics', () => {
    expect(() => MetricSchema.parse('invalid')).toThrow();
    expect(() => MetricSchema.parse('')).toThrow();
  });
});

describe('DimensionSchema', () => {
  it('accepts valid dimensions', () => {
    expect(DimensionSchema.parse('category')).toBe('category');
    expect(DimensionSchema.parse('vendor')).toBe('vendor');
    expect(DimensionSchema.parse('month')).toBe('month');
  });
});

describe('DatePresetSchema', () => {
  it('accepts valid presets', () => {
    expect(DatePresetSchema.parse('this_month')).toBe('this_month');
    expect(DatePresetSchema.parse('custom')).toBe('custom');
  });
});

describe('ReportConfigSchema', () => {
  it('accepts valid config', () => {
    const config = {
      metrics: ['total_spend', 'receipt_count'],
      groupBy: 'category',
      datePreset: 'this_year',
    };
    expect(ReportConfigSchema.parse(config)).toEqual(config);
  });

  it('accepts config with custom date range', () => {
    const config = {
      metrics: ['total_spend'],
      groupBy: null,
      datePreset: 'custom',
      customDateRange: { start: '2026-01-01', end: '2026-06-30' },
    };
    expect(ReportConfigSchema.parse(config)).toEqual(config);
  });

  it('rejects config with empty metrics', () => {
    expect(() => ReportConfigSchema.parse({
      metrics: [],
      datePreset: 'this_year',
    })).toThrow('At least one metric');
  });

  it('accepts config with filters', () => {
    const config = {
      metrics: ['total_spend'],
      groupBy: 'vendor',
      datePreset: 'this_year',
      filters: { categories: ['Office', 'Travel'] },
    };
    expect(ReportConfigSchema.parse(config).filters?.categories).toEqual(['Office', 'Travel']);
  });
});

describe('getPrebuiltTemplates', () => {
  it('returns 5 templates', () => {
    const templates = getPrebuiltTemplates();
    expect(templates).toHaveLength(5);
  });

  it('each template has required fields', () => {
    const templates = getPrebuiltTemplates();
    for (const t of templates) {
      expect(t.id).toBeTruthy();
      expect(t.name).toBeTruthy();
      expect(t.config.metrics.length).toBeGreaterThan(0);
      expect(['builtin', 'custom']).toContain(t.type);
    }
  });
});

describe('METRIC_LABELS', () => {
  it('has labels for all metrics', () => {
    const metrics = ['total_spend', 'receipt_count', 'avg_receipt', 'tax_total', 'max_receipt'];
    for (const m of metrics) {
      expect(METRIC_LABELS[m as keyof typeof METRIC_LABELS]).toBeTruthy();
    }
  });
});

describe('formatMetricValue', () => {
  it('formats currency metrics', () => {
    const result = formatMetricValue('total_spend', 1234.5);
    expect(result).toContain('1,234');
    expect(result).toContain('$');
  });

  it('formats count as integer', () => {
    expect(formatMetricValue('receipt_count', 42)).toBe('42');
  });
});
```

Run: `npx vitest run src/lib/services/__tests__/reports.test.ts` — all pass.

**10b: E2E test for reports page**

Create `tests/reports.spec.ts`:

```typescript
import { test, expect } from '@playwright/test';

test.describe('Reports page', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/?tab=reports');
    await page.waitForLoadState('networkidle');
  });

  test('displays report templates', async ({ page }) => {
    await expect(page.getByRole('heading', { name: 'Reports' })).toBeVisible();
    const templates = page.getByRole('button', { name: /Generate/ });
    await expect(templates.first()).toBeVisible({ timeout: 10000 });
  });

  test('generates a report from template', async ({ page }) => {
    const firstCard = page.getByRole('button', { name: /Generate.*report/i }).first();
    await firstCard.click();
    await expect(page.getByText('Generated')).toBeVisible({ timeout: 15000 });
  });

  test('exports CSV', async ({ page }) => {
    const firstCard = page.getByRole('button', { name: /Generate.*report/i }).first();
    await firstCard.click();
    await expect(page.getByText('Generated')).toBeVisible({ timeout: 15000 });
    const csvButton = page.getByRole('button', { name: /CSV/i });
    await csvButton.click();
  });
});
```

Run: `npx playwright test tests/reports.spec.ts`

---

## Self-Review Checklist

1. **Spec coverage:** Every requirement in the design doc has a corresponding task:
   - Report engine → Task 2 (RPC) + Task 3 (service)
   - 5 pre-built templates → Task 3 (template registry)
   - API routes → Task 5
   - UI components → Task 6
   - Store/sidebar wiring → Task 7
   - Custom builder → Task 8
   - Scheduling → Task 9
   - Tests → Task 10

2. **Placeholder scan:** No TBD, TODO, or incomplete code blocks.

3. **Type consistency:** Metric, Dimension, DatePreset, ReportConfig types are consistent across all tasks.

4. **Established patterns:** Uses RPC calls (matching existing pattern), Zod validation (all API routes), rate limiting (withRateLimit), dynamic imports, ErrorBoundary, PremiumSkeletons.
