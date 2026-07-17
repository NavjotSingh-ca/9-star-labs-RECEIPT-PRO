import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('@/lib/supabase', () => ({
  supabase: {
    rpc: vi.fn(),
    from: vi.fn(() => ({
      select: vi.fn(() => ({
        eq: vi.fn(() => ({
          order: vi.fn().mockResolvedValue({ data: [], error: null }),
        })),
      })),
      insert: vi.fn().mockResolvedValue({ error: null }),
      delete: vi.fn(() => ({
        eq: vi.fn().mockResolvedValue({ error: null }),
      })),
    })),
  },
  getOrgIdString: vi.fn().mockResolvedValue('test-org-id'),
}));

vi.mock('@/lib/logger', () => ({
  logError: vi.fn(),
}));

import {
  getPrebuiltTemplates,
  getCustomTemplates,
  saveCustomTemplate,
  deleteCustomTemplate,
  generateReport,
  formatMetricValue,
  METRIC_LABELS,
  ReportError,
} from '@/lib/services/reports';
import type { ReportConfig } from '@/lib/services/reports';

describe('getPrebuiltTemplates', () => {
  it('returns 7 built-in templates', () => {
    const templates = getPrebuiltTemplates();
    expect(templates).toHaveLength(7);
  });

  it('includes Tax Summary and Mileage by Vehicle templates', () => {
    const templates = getPrebuiltTemplates();
    const ids = templates.map((t) => t.id);
    expect(ids).toContain('tax-summary');
    expect(ids).toContain('mileage-by-vehicle');

    const tax = templates.find((t) => t.id === 'tax-summary');
    expect(tax?.config.metrics).toContain('tax_total');
    expect(tax?.config.datePreset).toBe('this_year');

    const mileage = templates.find((t) => t.id === 'mileage-by-vehicle');
    expect(mileage?.source).toBe('mileage');
    expect(mileage?.config.groupBy).toBe('vehicle');
    expect(mileage?.config.metrics).toContain('distance_km');
  });

  it('each template has required fields', () => {
    const templates = getPrebuiltTemplates();
    for (const t of templates) {
      expect(t.id).toBeTruthy();
      expect(t.name).toBeTruthy();
      expect(t.description).toBeTruthy();
      expect(t.icon).toBeTruthy();
      expect(t.type).toBe('builtin');
      expect(t.config).toBeDefined();
      expect(t.config.metrics).toBeDefined();
      expect(t.config.metrics.length).toBeGreaterThan(0);
      expect(t.config.datePreset).toBeTruthy();
      expect(t.defaultExport).toBeTruthy();
    }
  });

  it('GST/HST Claim template has tax_total metric', () => {
    const templates = getPrebuiltTemplates();
    const gst = templates.find((t) => t.id === 'gst-hst-summary');
    expect(gst).toBeDefined();
    expect(gst?.config.metrics).toContain('tax_total');
  });

  it('Vendor Spend template groups by vendor', () => {
    const templates = getPrebuiltTemplates();
    const vendor = templates.find((t) => t.id === 'vendor-spend');
    expect(vendor).toBeDefined();
    expect(vendor?.config.groupBy).toBe('vendor');
  });

  it('Category Breakdown template groups by category', () => {
    const templates = getPrebuiltTemplates();
    const cat = templates.find((t) => t.id === 'category-breakdown');
    expect(cat).toBeDefined();
    expect(cat?.config.groupBy).toBe('category');
  });

  it('Monthly Spend Trends template groups by month', () => {
    const templates = getPrebuiltTemplates();
    const monthly = templates.find((t) => t.id === 'monthly-trends');
    expect(monthly).toBeDefined();
    expect(monthly?.config.groupBy).toBe('month');
  });

  it('Annual Comparison template groups by month with custom date range', () => {
    const templates = getPrebuiltTemplates();
    const annual = templates.find((t) => t.id === 'annual-comparison');
    expect(annual).toBeDefined();
    expect(annual?.config.groupBy).toBe('month');
    expect(annual?.config.datePreset).toBe('custom');
    expect(annual?.config.customDateRange).toBeDefined();
    expect(annual?.config.customDateRange?.start).toBeTruthy();
    expect(annual?.config.customDateRange?.end).toBeTruthy();
  });
});

describe('formatMetricValue', () => {
  it('formats total_spend with CAD currency', () => {
    expect(formatMetricValue('total_spend', 1234.56)).toBe('$1,234.56');
  });

  it('formats tax_total with CAD currency', () => {
    expect(formatMetricValue('tax_total', 99.99)).toBe('$99.99');
  });

  it('formats avg_receipt with CAD currency', () => {
    expect(formatMetricValue('avg_receipt', 75.25)).toBe('$75.25');
  });

  it('formats max_receipt with CAD currency', () => {
    expect(formatMetricValue('max_receipt', 2500.00)).toBe('$2,500.00');
  });

  it('formats receipt_count as plain number', () => {
    expect(formatMetricValue('receipt_count', 42)).toBe('42');
  });

  it('handles zero values', () => {
    expect(formatMetricValue('total_spend', 0)).toBe('$0.00');
    expect(formatMetricValue('receipt_count', 0)).toBe('0');
  });

  it('handles large numbers', () => {
    expect(formatMetricValue('total_spend', 1234567.89)).toBe('$1,234,567.89');
  });

  it('formats decimal receipt_count by rounding', () => {
    expect(formatMetricValue('receipt_count', 42.7)).toBe('43');
  });
});

describe('METRIC_LABELS', () => {
  it('contains labels for all valid metric keys', () => {
    const validMetrics = ['total_spend', 'receipt_count', 'avg_receipt', 'tax_total', 'max_receipt', 'distance_km'];
    for (const m of validMetrics) {
      expect(METRIC_LABELS[m]).toBeTruthy();
    }
  });

  it('returns descriptive labels', () => {
    expect(METRIC_LABELS.total_spend).toBe('Total Spend');
    expect(METRIC_LABELS.receipt_count).toBe('Receipt Count');
    expect(METRIC_LABELS.avg_receipt).toBe('Average Receipt');
    expect(METRIC_LABELS.tax_total).toBe('Tax Total');
    expect(METRIC_LABELS.max_receipt).toBe('Max Receipt');
  });
});

describe('generateReport', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('rejects config with empty metrics', async () => {
    const badConfig = { datePreset: 'this_year' as const, metrics: [], groupBy: null };
    await expect(generateReport(badConfig)).rejects.toThrow();
  });

  it('rejects config with invalid metric values', async () => {
    const badConfig = { datePreset: 'this_year' as const, metrics: ['invalid_metric'] };
    await expect(generateReport(badConfig as unknown as ReportConfig)).rejects.toThrow();
  });

  it('rejects config with invalid datePreset', async () => {
    const badConfig = { datePreset: 'next_decade' as unknown as string, metrics: ['total_spend'] };
    await expect(generateReport(badConfig as unknown as ReportConfig)).rejects.toThrow();
  });

  it('calls supabase.rpc with correct params on valid config', async () => {
    const { supabase } = await import('@/lib/supabase');
    const mockRpc = supabase.rpc as ReturnType<typeof vi.fn>;
    mockRpc.mockResolvedValue({ data: [{ total_spend: 100 }], error: null });

    const config: ReportConfig = { datePreset: 'this_year', metrics: ['total_spend'], groupBy: null };
    const result = await generateReport(config);

    expect(mockRpc).toHaveBeenCalledWith('generate_report', expect.objectContaining({
      p_org_id: 'test-org-id',
      p_metrics: ['total_spend'],
      p_group_by: null,
    }));
    expect(result.rows).toHaveLength(1);
    expect(result.totals.total_spend).toBe(100);
    expect(result.config.metrics).toEqual(['total_spend']);
  });

  it('computes totals across multiple rows', async () => {
    const { supabase } = await import('@/lib/supabase');
    const mockRpc = supabase.rpc as ReturnType<typeof vi.fn>;
    mockRpc.mockResolvedValue({
      data: [
        { total_spend: 100, receipt_count: 2 },
        { total_spend: 200, receipt_count: 3 },
        { total_spend: 50, receipt_count: 1 },
      ],
      error: null,
    });

    const config: ReportConfig = { datePreset: 'this_year', metrics: ['total_spend', 'receipt_count'], groupBy: null };
    const result = await generateReport(config);

    expect(result.totals.total_spend).toBe(350);
    expect(result.totals.receipt_count).toBe(6);
  });

  it('handles empty results from RPC', async () => {
    const { supabase } = await import('@/lib/supabase');
    const mockRpc = supabase.rpc as ReturnType<typeof vi.fn>;
    mockRpc.mockResolvedValue({ data: [], error: null });

    const config: ReportConfig = { datePreset: 'this_year', metrics: ['total_spend'], groupBy: null };
    const result = await generateReport(config);

    expect(result.rows).toEqual([]);
    expect(result.totals.total_spend).toBe(0);
  });

  it('wraps RPC errors in ReportError', async () => {
    const { supabase } = await import('@/lib/supabase');
    const mockRpc = supabase.rpc as ReturnType<typeof vi.fn>;
    mockRpc.mockResolvedValue({ data: null, error: { message: 'DB error' } });

    const config: ReportConfig = { datePreset: 'this_year', metrics: ['total_spend'], groupBy: null };
    await expect(generateReport(config)).rejects.toThrow(ReportError);
  });

  it('sets generatedAt timestamp', async () => {
    const { supabase } = await import('@/lib/supabase');
    const mockRpc = supabase.rpc as ReturnType<typeof vi.fn>;
    mockRpc.mockResolvedValue({ data: [], error: null });

    const config: ReportConfig = { datePreset: 'this_year', metrics: ['total_spend'], groupBy: null };
    const result = await generateReport(config);

    expect(result.generatedAt).toBeTruthy();
    expect(() => new Date(result.generatedAt)).not.toThrow();
  });
});

describe('getCustomTemplates', () => {
  it('returns empty array when no custom templates exist', async () => {
    const templates = await getCustomTemplates('test-org-id');
    expect(templates).toEqual([]);
  });

  it('returns formatted custom templates', async () => {
    const { supabase } = await import('@/lib/supabase');
    // Re-mock for this test
    const mockFrom = supabase.from as ReturnType<typeof vi.fn>;
    mockFrom.mockReturnValue({
      select: vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({
          order: vi.fn().mockResolvedValue({
            data: [
              { id: '1', name: 'My Report', config: { metrics: ['total_spend'], datePreset: 'this_month' }, created_at: '2025-01-01' },
            ],
            error: null,
          }),
        }),
      }),
      insert: vi.fn().mockResolvedValue({ error: null }),
      delete: vi.fn(() => ({ eq: vi.fn().mockResolvedValue({ error: null }) })),
    });

    const templates = await getCustomTemplates('test-org-id');
    expect(templates).toHaveLength(1);
    expect(templates[0].name).toBe('My Report');
    expect(templates[0].type).toBe('custom');
    expect(templates[0].defaultExport).toBe('csv');
  });
});

describe('saveCustomTemplate', () => {
  it('inserts a template row', async () => {
    const { supabase } = await import('@/lib/supabase');
    const insertSpy = vi.fn().mockResolvedValue({ error: null });
    (supabase.from as ReturnType<typeof vi.fn>).mockReturnValue({
      select: vi.fn(() => ({
        eq: vi.fn(() => ({
          order: vi.fn().mockResolvedValue({ data: [], error: null }),
        })),
      })),
      insert: insertSpy,
      delete: vi.fn(() => ({ eq: vi.fn().mockResolvedValue({ error: null }) })),
    });

    const config: ReportConfig = { datePreset: 'this_year', metrics: ['total_spend'], groupBy: null };
    await saveCustomTemplate('org-1', 'user-1', 'Test Template', config);

    expect(supabase.from).toHaveBeenCalledWith('report_templates');
    expect(insertSpy).toHaveBeenCalledWith({
      org_id: 'org-1',
      name: 'Test Template',
      config,
      created_by: 'user-1',
    });
  });

  it('throws ReportError on insert failure', async () => {
    const { supabase } = await import('@/lib/supabase');
    (supabase.from as ReturnType<typeof vi.fn>).mockReturnValue({
      select: vi.fn(() => ({
        eq: vi.fn(() => ({
          order: vi.fn().mockResolvedValue({ data: [], error: null }),
        })),
      })),
      insert: vi.fn().mockResolvedValue({ error: { message: 'Insert failed' } }),
      delete: vi.fn(() => ({ eq: vi.fn().mockResolvedValue({ error: null }) })),
    });

    const config: ReportConfig = { datePreset: 'this_year', metrics: ['total_spend'], groupBy: null };
    await expect(saveCustomTemplate('org-1', 'user-1', 'Fail', config)).rejects.toThrow(ReportError);
  });
});

describe('deleteCustomTemplate', () => {
  it('calls delete with template id and org scoping', async () => {
    const { supabase } = await import('@/lib/supabase');
    const eqOrgSpy = vi.fn().mockResolvedValue({ error: null });
    const eqIdSpy = vi.fn(() => ({ eq: eqOrgSpy }));
    const deleteSpy = vi.fn(() => ({ eq: eqIdSpy }));
    (supabase.from as ReturnType<typeof vi.fn>).mockReturnValue({
      select: vi.fn(() => ({
        eq: vi.fn(() => ({
          order: vi.fn().mockResolvedValue({ data: [], error: null }),
        })),
      })),
      insert: vi.fn().mockResolvedValue({ error: null }),
      delete: deleteSpy,
    });

    await deleteCustomTemplate('template-1');
    expect(supabase.from).toHaveBeenCalledWith('report_templates');
    expect(deleteSpy).toHaveBeenCalled();
    expect(eqIdSpy).toHaveBeenCalledWith('id', 'template-1');
    expect(eqOrgSpy).toHaveBeenCalledWith('org_id', 'test-org-id');
  });
});
