import { describe, it, expect, beforeEach } from 'vitest';
import { checkRateLimit } from '@/lib/rate-limiter';

describe('checkRateLimit (in-memory fallback)', () => {
  beforeEach(() => {
    // Each test gets a unique key so buckets don't leak between tests
  });

  it('allows the first request', () => {
    const result = checkRateLimit('test-initial:1', 5, 60_000);
    expect(result.allowed).toBe(true);
    expect(result.remaining).toBe(4);
    expect(result.limit).toBe(5);
    expect(result.resetMs).toBeGreaterThan(0);
  });

  it('enforces the token bucket limit', () => {
    const key = `test-bucket:${Date.now()}`;
    // First 5 requests should be allowed (3 tokens)
    for (let i = 0; i < 3; i++) {
      const result = checkRateLimit(key, 3, 60_000);
      expect(result.allowed).toBe(true);
    }
    // 4th request should be denied (all 3 tokens consumed)
    const denied = checkRateLimit(key, 3, 60_000);
    expect(denied.allowed).toBe(false);
    expect(denied.remaining).toBe(0);
  });

  it('resets after window expires', () => {
    const key = `test-reset:${Date.now()}`;
    // Consume all tokens
    for (let i = 0; i < 2; i++) {
      checkRateLimit(key, 2, 50); // 50ms window
    }
    expect(checkRateLimit(key, 2, 50).allowed).toBe(false);
    // Wait for window to expire, then should be allowed again
    return new Promise<void>((resolve) => {
      setTimeout(() => {
        const result = checkRateLimit(key, 2, 50);
        expect(result.allowed).toBe(true);
        expect(result.remaining).toBe(1);
        resolve();
      }, 60);
    });
  });

  it('uses a new bucket for different keys', () => {
    const key1 = `test-key1:${Date.now()}`;
    const key2 = `test-key2:${Date.now()}`;

    // Block key1
    for (let i = 0; i < 2; i++) {
      checkRateLimit(key1, 2, 60_000);
    }
    expect(checkRateLimit(key1, 2, 60_000).allowed).toBe(false);

    // key2 should still be allowed (independent bucket)
    expect(checkRateLimit(key2, 2, 60_000).allowed).toBe(true);
  });
});
