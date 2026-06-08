import { describe, it, expect } from 'vitest';
import { isMathMismatch } from '@/lib/finance-utils';

describe('isMathMismatch', () => {
  it('returns false when subtotal + GST + PST === total', () => {
    expect(isMathMismatch(100, 5, 7, 112)).toBe(false);
  });

  it('returns true when subtotal + GST + PST !== total', () => {
    expect(isMathMismatch(100, 5, 7, 120)).toBe(true);
  });

  it('handles zero values', () => {
    expect(isMathMismatch(0, 0, 0, 0)).toBe(false);
  });

  it('handles floating point edge cases', () => {
    expect(isMathMismatch(1.05, 0.05, 0.08, 1.18)).toBe(false);
  });

  it('detects off-by-one-cent mismatches', () => {
    expect(isMathMismatch(100, 5, 7, 113)).toBe(true);
  });
});
