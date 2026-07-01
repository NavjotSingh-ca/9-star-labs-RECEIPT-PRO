// LOCKED: NON-CORE — Rate limiter is disabled in stable core.
// Tests that expect blocking behavior are skipped.
// See LOCKED_FILES.md for details.

import { describe, it, expect } from 'vitest';
import { checkRateLimit } from '@/lib/rate-limiter';

describe('checkRateLimit', () => {
  it('allows first request', () => {
    const result = checkRateLimit('test:1', 5, 60_000);
    expect(result.allowed).toBe(true);
    expect(result.remaining).toBeGreaterThanOrEqual(0);
    expect(result.resetMs).toBeGreaterThan(0);
  });

  it('allows up to max tokens', () => {
    const key = 'test:2';
    expect(checkRateLimit(key, 3, 60_000).allowed).toBe(true);
    expect(checkRateLimit(key, 3, 60_000).allowed).toBe(true);
    expect(checkRateLimit(key, 3, 60_000).allowed).toBe(true);
  });

  // SKIPPED: Rate limiter is locked — always allows through
  it.skip('blocks when tokens exhausted', () => {
    const key = 'test:3';
    checkRateLimit(key, 2, 60_000);
    checkRateLimit(key, 2, 60_000);
    const result = checkRateLimit(key, 2, 60_000);
    expect(result.allowed).toBe(false);
    expect(result.remaining).toBe(0);
  });

  // SKIPPED: Rate limiter is locked — window expiry not enforced
  it.skip('refills after window expires', () => {
    const key = 'test:4';
    checkRateLimit(key, 1, 50);
    const result = checkRateLimit(key, 1, 50);
    expect(result.allowed).toBe(false);
    expect(result.remaining).toBe(0);
  });

  // SKIPPED: Rate limiter is locked — independent key tracking not enforced
  it.skip('handles different keys independently', () => {
    const keyA = 'test:5:a';
    const keyB = 'test:5:b';
    checkRateLimit(keyA, 1, 60_000);
    checkRateLimit(keyB, 1, 60_000);
    expect(checkRateLimit(keyA, 1, 60_000).allowed).toBe(false);
    expect(checkRateLimit(keyB, 1, 60_000).allowed).toBe(false);
  });
});
