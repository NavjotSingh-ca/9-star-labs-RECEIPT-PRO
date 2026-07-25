import { describe, it, expect } from 'vitest';
import { calculateCompletenessScore } from '@/lib/receipt-scoring';

describe('calculateCompletenessScore', () => {
  it('returns 100 for a perfect receipt', () => {
    const receipt = {
      business_number: '123456789RT0001',
      line_items: [{ description: 'Item 1', amount: 100, tax_rate: 0.13 }],
      tax_breakdown: { rates: [{ rate: 0.13, amount: 13 }] },
      transaction_date: '2024-01-15',
      image_quality_score: 0.85,
      subtotal: 100,
      tax_amount: 13,
      total_amount: 113,
    };
    const result = calculateCompletenessScore(receipt);
    expect(result.score).toBe(100);
  });

  it('returns 15 for an empty receipt (math_balance passes with 0s)', () => {
    const result = calculateCompletenessScore({});
    // Empty receipt: only math_balance passes (0+0-0=0 <= 0.02) → 15pts
    expect(result.score).toBe(15);
    expect(result.breakdown.math_balance.passed).toBe(true);
    expect(result.breakdown.business_number.passed).toBe(false);
  });

  it('scores business_number (20pts) + math_balance (15pts) = 35', () => {
    const withBn = calculateCompletenessScore({ business_number: '123456789RT0001' });
    expect(withBn.score).toBe(35);
  });

  it('scores line_items (20pts)', () => {
    const withItems = calculateCompletenessScore({ line_items: [{ amount: 50 }] });
    expect(withItems.breakdown.line_items.passed).toBe(true);

    const emptyItems = calculateCompletenessScore({ line_items: [] });
    expect(emptyItems.breakdown.line_items.passed).toBe(false);

    const nullItems = calculateCompletenessScore({ line_items: null });
    expect(nullItems.breakdown.line_items.passed).toBe(false);
  });

  it('scores tax_breakdown via object with rates array (20pts)', () => {
    const withRates = calculateCompletenessScore({
      tax_breakdown: { rates: [{ rate: 0.13, amount: 13 }] },
    });
    expect(withRates.breakdown.tax_breakdown.passed).toBe(true);
  });

  it('scores tax_breakdown via array tax_breakdown', () => {
    const withArray = calculateCompletenessScore({
      tax_breakdown: [{ rate: 0.13, amount: 13 }],
    });
    expect(withArray.breakdown.tax_breakdown.passed).toBe(true);
  });

  it('scores tax_breakdown via line_items with tax_rate > 0', () => {
    const viaLineItems = calculateCompletenessScore({
      line_items: [{ tax_rate: 0.13 }],
    });
    expect(viaLineItems.breakdown.tax_breakdown.passed).toBe(true);
  });

  it('fails tax_breakdown when no tax info exists', () => {
    const noTax = calculateCompletenessScore({});
    expect(noTax.breakdown.tax_breakdown.passed).toBe(false);
  });

  it('scores receipt_date (10pts) with valid YYYY-MM-DD', () => {
    const valid = calculateCompletenessScore({ transaction_date: '2024-01-15' });
    expect(valid.breakdown.receipt_date.passed).toBe(true);
  });

  it('fails receipt_date for invalid format', () => {
    const invalid = calculateCompletenessScore({ transaction_date: '01/15/2024' });
    expect(invalid.breakdown.receipt_date.passed).toBe(false);
  });

  it('fails receipt_date for null/missing', () => {
    const missing = calculateCompletenessScore({ transaction_date: null });
    expect(missing.breakdown.receipt_date.passed).toBe(false);
  });

  it('scores image_quality (15pts) via 0-1 scale', () => {
    const good = calculateCompletenessScore({ image_quality_score: 0.7 });
    expect(good.breakdown.image_quality.passed).toBe(true);

    const bad = calculateCompletenessScore({ image_quality_score: 0.3 });
    expect(bad.breakdown.image_quality.passed).toBe(false);
  });

  it('scores image_quality via 0-100 scale', () => {
    const good = calculateCompletenessScore({ image_quality_score: 60 });
    expect(good.breakdown.image_quality.passed).toBe(true);

    const bad = calculateCompletenessScore({ image_quality_score: 30 });
    expect(bad.breakdown.image_quality.passed).toBe(false);
  });

  it('handles imageQualityScore fallback field', () => {
    const withFallback = calculateCompletenessScore({ imageQualityScore: 0.75 });
    expect(withFallback.breakdown.image_quality.passed).toBe(true);
  });

  it('scores math_balance (15pts) within 0.02 tolerance', () => {
    const balanced = calculateCompletenessScore({
      subtotal: 100, tax_amount: 13, total_amount: 113,
    });
    expect(balanced.breakdown.math_balance.passed).toBe(true);
  });

  it('fails math_balance when difference exceeds 0.02', () => {
    const imbalanced = calculateCompletenessScore({
      subtotal: 100, tax_amount: 13, total_amount: 120,
    });
    expect(imbalanced.breakdown.math_balance.passed).toBe(false);
  });

  it('passes math_balance at exactly 0.02 difference', () => {
    const atLimit = calculateCompletenessScore({
      subtotal: 100, tax_amount: 13, total_amount: 113.02,
    });
    expect(atLimit.breakdown.math_balance.passed).toBe(true);
  });

  it('handles null amounts in math_balance', () => {
    const nulls = calculateCompletenessScore({
      subtotal: null, tax_amount: null, total_amount: null,
    });
    expect(nulls.breakdown.math_balance.passed).toBe(true);
  });

  it('handles pst_amount in math_balance', () => {
    const withPst = calculateCompletenessScore({
      subtotal: 100, tax_amount: 5, pst_amount: 8, total_amount: 113,
    });
    expect(withPst.breakdown.math_balance.passed).toBe(true);
  });

  it('computes correct partial scores with business_number only = 35', () => {
    const result = calculateCompletenessScore({ business_number: 'BN123' });
    // business_number (20) + math_balance (15, zero values add up) = 35
    expect(result.score).toBe(35);
  });

  it('handles empty object gracefully', () => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any -- intentional edge case
    const result = calculateCompletenessScore({} as any);
    expect(result.score).toBe(15); // math_balance passes with all zeros
  });

  it('handles business_number with only whitespace', () => {
    const blank = calculateCompletenessScore({ business_number: '   ' });
    expect(blank.breakdown.business_number.passed).toBe(false);
  });

  it('handles negative values in math_balance', () => {
    const negative = calculateCompletenessScore({
      subtotal: -50, tax_amount: 5, total_amount: -45,
    });
    expect(negative.breakdown.math_balance.passed).toBe(true);
  });
});
