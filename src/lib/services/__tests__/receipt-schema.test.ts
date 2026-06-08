import { describe, it, expect, vi } from 'vitest';

vi.mock('@/lib/supabase', () => ({
  supabase: {},
  getOrgIdString: vi.fn(),
}));

const { receiptSchema } = await import('@/lib/services/receipts');

describe('receiptSchema', () => {
  it('parses a valid receipt row with default transforms', () => {
    const result = receiptSchema.safeParse({
      id: 'abc-123',
      user_id: 'user-1',
      vendor_name: 'Office Depot',
      total_amount: 150.50,
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.vendor_name).toBe('Office Depot');
      expect(result.data.total_amount).toBe(150.50);
      expect(result.data.currency).toBe('CAD'); // default
    }
  });

  it('fills defaults for missing fields', () => {
    const result = receiptSchema.safeParse({});
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.id).toBe('');
      expect(result.data.vendor_name).toBe('');
      expect(result.data.total_amount).toBe(0);
      expect(result.data.currency).toBe('CAD');
      expect(result.data.is_deleted).toBe(false);
    }
  });

  it('coerces string line_items to parsed JSON', () => {
    const result = receiptSchema.safeParse({
      line_items: JSON.stringify([{ description: 'item 1', amount: 10 }]),
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(Array.isArray(result.data.line_items)).toBe(true);
      expect(result.data.line_items[0].description).toBe('item 1');
    }
  });
});
