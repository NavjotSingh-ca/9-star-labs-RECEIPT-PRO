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

export const METRIC_LABELS: Record<string, string> = {
  total_spend: 'Total Spend',
  receipt_count: 'Receipt Count',
  avg_receipt: 'Average Receipt',
  tax_total: 'Tax Total',
  max_receipt: 'Max Receipt',
};

export function formatMetricValue(metric: Metric, value: number): string {
  if (metric === 'receipt_count') return String(Math.round(value));
  const fmt = new Intl.NumberFormat('en-CA', { style: 'currency', currency: 'CAD', maximumFractionDigits: 2 });
  return fmt.format(value);
}
