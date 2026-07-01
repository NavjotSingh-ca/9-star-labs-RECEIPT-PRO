import { describe, it, expect } from 'vitest';
import {
  toNumber,
  formatCurrency,
  formatDate,
  categoryColor,
  confidenceTone,
  approvalBadge,
  reimbursementBadge,
  shouldGlow,
  computeLiveCRAScore,
} from '@/lib/ui-utils';

describe('toNumber', () => {
  it('converts valid numbers', () => {
    expect(toNumber(42)).toBe(42);
    expect(toNumber('3.14')).toBe(3.14);
  });

  it('returns 0 for non-finite values', () => {
    expect(toNumber(undefined)).toBe(0);
    expect(toNumber(null)).toBe(0);
    expect(toNumber(NaN)).toBe(0);
  });
});

describe('formatCurrency', () => {
  it('formats CAD values', () => {
    const result = formatCurrency(42.5);
    expect(result).toContain('42');
    expect(result).toContain('50');
  });

  it('handles non-finite gracefully', () => {
    expect(formatCurrency(NaN)).toContain('0');
  });
});

describe('formatDate', () => {
  it('formats ISO date', () => {
    expect(formatDate('2026-06-13')).toContain('Jun');
  });

  it('returns placeholder for null-ish', () => {
    expect(formatDate(null)).toBe('No date');
    expect(formatDate(undefined)).toBe('No date');
  });

  it('returns raw value for unparseable strings', () => {
    expect(formatDate('not-a-date')).toBe('not-a-date');
  });
});

describe('categoryColor', () => {
  it('returns chart-1 classes for Job Materials', () => {
    const cls = categoryColor('Job Materials');
    expect(cls).toContain('bg-chart-1');
  });

  it('returns fallback for unknown category', () => {
    const cls = categoryColor('Nonsense');
    expect(cls).toBe('bg-chart-1/15 text-chart-1 border-chart-1/20');
  });

  it('handles null/undefined', () => {
    expect(categoryColor(null)).toContain('bg-chart-1');
    expect(categoryColor(undefined)).toContain('bg-chart-1');
  });
});

describe('confidenceTone', () => {
  it('returns high for score >= 85', () => {
    const t = confidenceTone(90);
    expect(t.label).toBe('High');
    expect(t.pill).toContain('bg-success');
  });

  it('returns medium for score 60-84', () => {
    const t = confidenceTone(72);
    expect(t.label).toBe('Medium');
    expect(t.pill).toContain('bg-warning');
  });

  it('returns low for score < 60', () => {
    const t = confidenceTone(30);
    expect(t.label).toBe('Low');
    expect(t.pill).toContain('bg-danger');
  });
});

describe('approvalBadge', () => {
  it('approved returns success styling', () => {
    expect(approvalBadge('approved').label).toBe('Approved');
    expect(approvalBadge('approved').cls).toContain('bg-success');
  });

  it('rejected returns danger styling', () => {
    expect(approvalBadge('rejected').label).toBe('Rejected');
    expect(approvalBadge('rejected').cls).toContain('bg-danger');
  });

  it('pending returns warning styling', () => {
    expect(approvalBadge('pending').label).toBe('Pending');
    expect(approvalBadge('pending').cls).toContain('bg-warning');
  });

  it('handles null', () => {
    expect(approvalBadge(null).label).toBe('Pending');
  });
});

describe('reimbursementBadge', () => {
  it('approved returns Reimbursed', () => {
    expect(reimbursementBadge('approved').label).toBe('Reimbursed');
  });

  it('rejected returns Denied', () => {
    expect(reimbursementBadge('rejected').label).toBe('Denied');
  });
});

describe('shouldGlow', () => {
  it('returns true for score between 1 and 79', () => {
    expect(shouldGlow(50)).toBe(true);
  });

  it('returns false for score 0', () => {
    expect(shouldGlow(0)).toBe(false);
  });

  it('returns false for score >= 80', () => {
    expect(shouldGlow(85)).toBe(false);
  });
});

describe('computeLiveCRAScore', () => {
  it('returns 7 for empty form (only tax_amount >= 0 adds points)', () => {
    const score = computeLiveCRAScore({
      vendor_name: '',
      total_amount: 0,
      subtotal: 0,
      tax_amount: 0,
      pst_amount: 0,
    });
    expect(score).toBe(7);
  });

  it('scores high when all fields present', () => {
    const score = computeLiveCRAScore({
      vendor_name: 'Walmart',
      vendor_address: '123 Main St',
      business_number: '123456789RT0001',
      transaction_date: '2026-06-01',
      total_amount: 100,
      subtotal: 90,
      tax_amount: 10,
      pst_amount: 0,
      payment_method: 'Credit Card',
      notes: 'a b c d e f g h i j k l',
      line_items: [{ description: 'item', amount: 90 }],
    });
    expect(score).toBeGreaterThanOrEqual(80);
  });

  it('penalises math mismatch', () => {
    const score = computeLiveCRAScore({
      vendor_name: 'Walmart',
      total_amount: 100,
      subtotal: 100,
      tax_amount: 0,
      pst_amount: 0,
    });
    const badScore = computeLiveCRAScore({
      vendor_name: 'Walmart',
      total_amount: 100,
      subtotal: 50,
      tax_amount: 10,
      pst_amount: 0,
    });
    expect(badScore).toBeLessThan(score);
  });
});
