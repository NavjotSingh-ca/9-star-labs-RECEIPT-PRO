import { supabase } from '@/lib/supabase';
import { getOrgIdString } from '@/lib/supabase';
import { logError } from '@/lib/logger';
import { z } from 'zod';

// ─── Zod schemas ───

export const MetricSchema = z.enum([
  'total_spend', 'receipt_count', 'avg_receipt', 'tax_total', 'max_receipt', 'distance_km',
]);
export type Metric = z.infer<typeof MetricSchema>;

export const DimensionSchema = z.enum([
  'category', 'vendor', 'project', 'business_unit', 'month', 'approval_status', 'vehicle',
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
  /** Data source used to generate the report (mirrors ReportTemplate.source). */
  source?: 'receipts' | 'mileage';
}

export interface ReportTemplate {
  id: string;
  name: string;
  description: string;
  icon: string;
  type: 'builtin' | 'custom';
  config: ReportConfig;
  defaultExport: 'csv' | 'pdf';
  /** Data source for generation. 'mileage' uses a client-side generator instead of the receipt RPC. */
  source?: 'receipts' | 'mileage';
}

export class ReportError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'ReportError';
  }
}

// ─── Date resolution ───

/**
 * Resolve a date preset to concrete start/end date strings.
 *
 * @param preset - The date preset enum value.
 * @param customRange - Custom range required when preset is 'custom'.
 * @returns Start and end date strings in YYYY-MM-DD format.
 */
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

/**
 * Generate a report using the configured metrics, dimensions, date range, and filters.
 *
 * @param config - The report configuration (validated via Zod).
 * @returns The generated report with rows, totals, and metadata.
 * @throws {ReportError} If the DB RPC call fails or config is invalid.
 */
export async function generateReport(config: ReportConfig): Promise<ReportResult> {
  const parsed = ReportConfigSchema.parse(config);
  const orgId = await getOrgIdString();
  if (!orgId) throw new ReportError('Organization not found');

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
    throw new ReportError('Failed to generate report. Please try again.');
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
  {
    id: 'tax-summary',
    name: 'Tax Summary (YTD)',
    description: 'Tax paid and spend by category for the current year',
    icon: 'FileText',
    type: 'builtin',
    defaultExport: 'pdf',
    config: { metrics: ['tax_total', 'total_spend', 'receipt_count'], groupBy: 'category', datePreset: 'this_year' },
  },
  {
    id: 'mileage-by-vehicle',
    name: 'Mileage by Vehicle',
    description: 'Total distance driven per registered vehicle',
    icon: 'Car',
    type: 'builtin',
    source: 'mileage',
    defaultExport: 'csv',
    config: { metrics: ['distance_km'], groupBy: 'vehicle', datePreset: 'this_year' },
  },
];

/**
 * Get all pre-built (builtin) report templates.
 *
 * @returns Array of built-in template definitions.
 */
export function getPrebuiltTemplates(): ReportTemplate[] {
  return BUILT_IN_TEMPLATES;
}

// ─── Mileage report (client-side aggregation) ───

/**
 * Generate a "Mileage by Vehicle" report by aggregating distance per vehicle.
 * Uses a client-side query (mileage_logs are not part of the receipt report RPC).
 *
 * @param orgIdOverride - Organization ID; falls back to the current org context.
 * @returns ReportResult keyed by vehicle nickname with total distance.
 * @throws {ReportError} If the query fails or the org is unresolved.
 */
export async function generateMileageByVehicleReport(orgIdOverride?: string): Promise<ReportResult> {
  const orgId = orgIdOverride ?? (await getOrgIdString());
  if (!orgId) throw new ReportError('Organization not found');

  const { data, error } = await supabase
    .from('mileage_logs')
    .select('distance_km, vehicle_id, vehicles(nickname)')
    .eq('org_id', orgId);

  if (error) throw new ReportError(error.message);

  const byVehicle = new Map<string, number>();
  const rows = (data as Array<{ distance_km: number; vehicles?: { nickname?: string } | null }>) ?? [];
  for (const row of rows) {
    const key = row.vehicles?.nickname || 'Unassigned';
    byVehicle.set(key, (byVehicle.get(key) ?? 0) + (Number(row.distance_km) || 0));
  }

  const reportRows = Array.from(byVehicle.entries()).map(([vehicle, distance]) => ({
    vehicle,
    distance_km: Math.round(distance * 10) / 10,
  }));

  const totals: Record<string, number> = {
    distance_km: reportRows.reduce((sum, r) => sum + Number(r.distance_km), 0),
  };

  return {
    config: { metrics: ['distance_km'], groupBy: 'vehicle', datePreset: 'this_year' },
    rows: reportRows,
    totals,
    generatedAt: new Date().toISOString(),
    source: 'mileage',
  };
}

/**
 * Get custom report templates saved by the organization.
 *
 * @param orgId - Organization UUID for tenant isolation.
 * @returns Array of custom templates (empty array on error).
 */
export async function getCustomTemplates(orgId: string): Promise<ReportTemplate[]> {
  if (!orgId) return [];

  try {
    const { data, error } = await supabase
      .from('report_templates')
      .select('id, name, config, created_at')
      .eq('org_id', orgId)
      .order('created_at', { ascending: false });

    if (error) {
      logError(error, { action: 'get_custom_templates' });
      return [];
    }

    return (data || []).map((t) => ({
      id: t.id,
      name: t.name,
      description: 'Custom report',
      icon: 'FileSpreadsheet',
      type: 'custom' as const,
      defaultExport: 'csv' as const,
      config: t.config as ReportConfig,
    }));
  } catch (err) {
    logError(err, { action: 'get_custom_templates' });
    return [];
  }
}

/**
 * Save a custom report template for the organization.
 *
 * @param orgId - Organization UUID.
 * @param userId - UUID of the user creating the template.
 * @param name - Human-readable template name.
 * @param config - The report configuration to save.
 * @throws {ReportError} If the template name is empty or DB write fails.
 */
export async function saveCustomTemplate(orgId: string, userId: string, name: string, config: ReportConfig): Promise<void> {
  if (!name || name.trim().length === 0) {
    throw new ReportError('Template name is required');
  }
  if (name.length > 200) {
    throw new ReportError('Template name must be 200 characters or fewer');
  }
  if (!orgId) throw new ReportError('Organization not found');
  if (!userId) throw new ReportError('User not authenticated');

  try {
    const { error } = await supabase.from('report_templates').insert({
      org_id: orgId,
      name: name.trim(),
      config,
      created_by: userId,
    });

    if (error) {
      logError(error, { action: 'save_custom_template' });
      throw new ReportError('Failed to save template');
    }
  } catch (err) {
    if (err instanceof ReportError) throw err;
    logError(err, { action: 'save_custom_template' });
    throw new ReportError('Failed to save template. Please try again.');
  }
}

/**
 * Delete a custom report template.
 * Scoped by org_id for tenant isolation.
 *
 * @param templateId - UUID of the template to delete.
 * @throws {ReportError} If the template ID is missing or DB operation fails.
 */
export async function deleteCustomTemplate(templateId: string): Promise<void> {
  if (!templateId) throw new ReportError('Template ID is required');

  try {
    const orgId = await getOrgIdString();
    if (!orgId) throw new ReportError('Organization not found');

    const { error } = await supabase
      .from('report_templates')
      .delete()
      .eq('id', templateId)
      .eq('org_id', orgId);

    if (error) {
      logError(error, { action: 'delete_custom_template' });
      throw new ReportError('Failed to delete template');
    }
  } catch (err) {
    if (err instanceof ReportError) throw err;
    logError(err, { action: 'delete_custom_template' });
    throw new ReportError('Failed to delete template. Please try again.');
  }
}

// ─── Helpers ───

export const METRIC_LABELS: Record<string, string> = {
  total_spend: 'Total Spend',
  receipt_count: 'Receipt Count',
  avg_receipt: 'Average Receipt',
  tax_total: 'Tax Total',
  max_receipt: 'Max Receipt',
  distance_km: 'Distance (km)',
  vehicle: 'Vehicle',
};

/**
 * Format a metric value for display.
 * Count metrics are shown as integers; currency metrics use en-CA formatting.
 *
 * @param metric - The metric type.
 * @param value - The numeric value to format.
 * @returns Formatted string (e.g., "42" for counts, "$1,234.56" for currency).
 */
export function formatMetricValue(metric: Metric, value: number): string {
  if (metric === 'receipt_count') return String(Math.round(value));
  if (metric === 'distance_km') return `${Math.round(value * 10) / 10} km`;
  const fmt = new Intl.NumberFormat('en-CA', { style: 'currency', currency: 'CAD', maximumFractionDigits: 2 });
  return fmt.format(value);
}
