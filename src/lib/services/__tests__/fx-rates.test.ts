import { describe, it, expect, vi, beforeEach } from 'vitest';

const mockSupabase = {
  from: vi.fn(),
};

vi.mock('@/lib/supabase', () => ({
  supabase: mockSupabase,
}));

vi.mock('@/lib/logger', () => ({
  logError: vi.fn(),
  logInfo: vi.fn(),
  logWarn: vi.fn(),
}));

vi.stubGlobal('fetch', vi.fn());

const { getHistoricalCADRate } = await import('@/lib/services/fx-rates');

function mockCachedRate(rate: number | null) {
  mockSupabase.from.mockReturnValue({
    select: vi.fn().mockReturnThis(),
    eq: vi.fn().mockReturnThis(),
    single: vi.fn().mockResolvedValue({
      data: rate ? { rate_to_cad: rate } : null,
      error: rate ? null : { code: 'PGRST116' },
    }),
    upsert: vi.fn().mockResolvedValue({ error: null }),
  });
}

describe('getHistoricalCADRate', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('returns 1.0 for invalid currency', async () => {
    expect(await getHistoricalCADRate('', '2024-01-15')).toBe(1.0);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any -- intentional edge case
    expect(await getHistoricalCADRate(null as any, '2024-01-15')).toBe(1.0);
  });

  it('returns 1.0 for invalid date', async () => {
    expect(await getHistoricalCADRate('USD', '')).toBe(1.0);
    expect(await getHistoricalCADRate('USD', 'not-a-date')).toBe(1.0);
    expect(await getHistoricalCADRate('USD', '2024-13-45')).toBe(1.0);
  });

  it('returns 1.0 for CAD currency', async () => {
    expect(await getHistoricalCADRate('CAD', '2024-01-15')).toBe(1.0);
    expect(await getHistoricalCADRate('cad', '2024-01-15')).toBe(1.0);
  });

  it('returns 1.0 for unsupported currency', async () => {
    expect(await getHistoricalCADRate('BTC', '2024-01-15')).toBe(1.0);
    expect(await getHistoricalCADRate('XYZ', '2024-01-15')).toBe(1.0);
  });

  it('returns cached rate from DB', async () => {
    mockCachedRate(1.35);
    expect(await getHistoricalCADRate('USD', '2024-01-15')).toBe(1.35);
  });

  it('returns 1.0 when cache miss and API fails', async () => {
    vi.mocked(fetch).mockRejectedValue(new Error('Network error'));
    mockSupabase.from.mockReturnValue({
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      single: vi.fn().mockResolvedValue({
        data: null,
        error: { code: 'PGRST116' },
      }),
      upsert: vi.fn().mockResolvedValue({ error: null }),
    });

    const rate = await getHistoricalCADRate('USD', '2024-01-15');
    expect(rate).toBe(1.0);
  });

  it('handles date validation edge cases', async () => {
    // Invalid date returns 1.0
    expect(await getHistoricalCADRate('USD', 'not-a-date')).toBe(1.0);
    expect(await getHistoricalCADRate('USD', '2024-13-45')).toBe(1.0);
  });

  it('normalizes currency to uppercase', async () => {
    mockCachedRate(1.35);
    expect(await getHistoricalCADRate('usd', '2024-01-15')).toBe(1.35);
  });
});
