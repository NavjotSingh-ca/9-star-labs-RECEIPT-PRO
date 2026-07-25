import { describe, it, expect, vi, beforeEach } from 'vitest';

const mockSupabase = {
  from: vi.fn(),
};

vi.mock('@/lib/supabase', () => ({
  supabase: mockSupabase,
}));

vi.mock('@/lib/logger', () => ({
  logError: vi.fn(),
}));

const { normalizeVendorName, getVendorDefaults, updateVendorDefaults } = await import('@/lib/services/vendor-defaults');

describe('normalizeVendorName', () => {
  it('returns empty string for empty input', () => {
    expect(normalizeVendorName('')).toBe('');
    // eslint-disable-next-line @typescript-eslint/no-explicit-any -- intentional edge case
    expect(normalizeVendorName(null as any)).toBe('');
    // eslint-disable-next-line @typescript-eslint/no-explicit-any -- intentional edge case
    expect(normalizeVendorName(undefined as any)).toBe('');
  });

  it('lowercases and strips non-alphanumeric characters', () => {
    expect(normalizeVendorName('PETRO-CANADA #45')).toBe('petrocanada');
  });

  it('strips trailing location numbers (2+ digits)', () => {
    expect(normalizeVendorName('Tim Hortons 12345')).toBe('timhortons');
    expect(normalizeVendorName('Walmart 45')).toBe('walmart');
  });

  it('keeps single trailing digit', () => {
    expect(normalizeVendorName('Store 1')).toBe('store1');
  });

  it('strips parenthetical suffixes', () => {
    expect(normalizeVendorName('Tim Hortons (Main St)')).toBe('timhortonsmainst');
  });

  it('truncates to 60 characters', () => {
    const long = 'A'.repeat(100);
    expect(normalizeVendorName(long)).toBe('a'.repeat(60));
  });
});

describe('getVendorDefaults', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('returns null for missing orgId or vendorName', async () => {
    expect(await getVendorDefaults('', 'Vendor')).toBeNull();
    expect(await getVendorDefaults('org-1', '')).toBeNull();
  });

  it('returns null when query errors', async () => {
    mockSupabase.from.mockReturnValue({
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      single: vi.fn().mockResolvedValue({ data: null, error: { message: 'error' } }),
    });
    expect(await getVendorDefaults('org-1', 'Vendor')).toBeNull();
  });

  it('returns null when appearance_count < 3', async () => {
    mockSupabase.from.mockReturnValue({
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      single: vi.fn().mockResolvedValue({
        data: { category: 'Fuel', job_code: null, business_use_percent: 80, appearance_count: 2 },
        error: null,
      }),
    });
    expect(await getVendorDefaults('org-1', 'Vendor')).toBeNull();
  });

  it('returns defaults when appearance_count >= 3', async () => {
    mockSupabase.from.mockReturnValue({
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      single: vi.fn().mockResolvedValue({
        data: { category: 'Fuel', job_code: 'J001', business_use_percent: 80, appearance_count: 5 },
        error: null,
      }),
    });
    const result = await getVendorDefaults('org-1', 'Vendor');
    expect(result).toEqual({
      category: 'Fuel',
      job_code: 'J001',
      business_use_percent: 80,
      appearance_count: 5,
    });
  });

  it('defaults business_use_percent to 100 when null', async () => {
    mockSupabase.from.mockReturnValue({
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      single: vi.fn().mockResolvedValue({
        data: { category: null, job_code: null, business_use_percent: null, appearance_count: 3 },
        error: null,
      }),
    });
    const result = await getVendorDefaults('org-1', 'Vendor');
    expect(result?.business_use_percent).toBe(100);
  });
});

describe('updateVendorDefaults', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('returns early if orgId or vendor_name missing', async () => {
    await updateVendorDefaults('', { vendor_name: 'Test' });
    await updateVendorDefaults('org-1', { vendor_name: '' });
    expect(mockSupabase.from).not.toHaveBeenCalled();
  });

  it('updates existing vendor record', async () => {
    const updateFn = vi.fn().mockResolvedValue({ error: null });
    mockSupabase.from.mockReturnValue({
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      single: vi.fn().mockResolvedValue({
        data: { id: 'v-1', appearance_count: 4 },
        error: null,
      }),
      update: updateFn,
    });

    await updateVendorDefaults('org-1', {
      vendor_name: 'Test Vendor',
      category: 'Supplies',
      job_code: 'J002',
      business_use_percent: 75,
    });

    expect(updateFn).toHaveBeenCalled();
    const updateCall = updateFn.mock.calls[0][0];
    expect(updateCall.appearance_count).toBe(5);
    expect(updateCall.category).toBe('Supplies');
    expect(updateCall.job_code).toBe('J002');
    expect(updateCall.business_use_percent).toBe(75);
  });

  it('inserts new vendor record when none exists', async () => {
    const insertFn = vi.fn().mockResolvedValue({ error: null });
    mockSupabase.from.mockReturnValue({
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      single: vi.fn().mockResolvedValue({ data: null, error: { code: 'PGRST116' } }),
      insert: insertFn,
    });

    await updateVendorDefaults('org-1', {
      vendor_name: 'New Vendor',
      category: 'Fuel',
    });

    expect(insertFn).toHaveBeenCalled();
    const insertCall = insertFn.mock.calls[0][0];
    expect(insertCall.org_id).toBe('org-1');
    expect(insertCall.appearance_count).toBe(1);
    expect(insertCall.business_use_percent).toBe(100);
  });

  it('handles database error gracefully', async () => {
    mockSupabase.from.mockImplementation(() => {
      throw new Error('DB error');
    });

    await expect(updateVendorDefaults('org-1', { vendor_name: 'Test' })).resolves.toBeUndefined();
  });
});
