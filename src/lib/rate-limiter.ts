/**
 * Rate limiter with Upstash Redis (primary) + in-memory fallback.
 *
 * Upstash Redis provides distributed rate limiting via HTTP (no connection pooling).
 * When Redis is not configured, an in-memory token bucket is used instead.
 * The in-memory fallback is per-process — adequate for local dev but not for
 * multi-instance deployments (Vercel, Lambda). In production, configure
 * UPSTASH_REDIS_URL and UPSTASH_REDIS_TOKEN for proper distributed limiting.
 */

import { Ratelimit } from '@upstash/ratelimit';
import { Redis } from '@upstash/redis';
import { env } from './env';

interface RateLimitResult {
  allowed: boolean;
  limit: number;
  remaining: number;
  resetMs: number;
}

const RATE_LIMIT_LIMIT = 'X-RateLimit-Limit';
const RATE_LIMIT_REMAINING = 'X-RateLimit-Remaining';
const RATE_LIMIT_RESET = 'X-RateLimit-Reset';

let ratelimit: Ratelimit | null = null;

// In-memory token bucket fallback (per-process)
const memoryBuckets = new Map<string, { tokens: number; resetAt: number }>();

function getMemoryBucket(key: string, maxTokens: number, windowMs: number): {
  tokens: number;
  resetAt: number;
} {
  const now = Date.now();
  const existing = memoryBuckets.get(key);
  if (existing && existing.resetAt > now) {
    return existing;
  }
  // Reset bucket
  const bucket = { tokens: maxTokens, resetAt: now + windowMs };
  memoryBuckets.set(key, bucket);
  return bucket;
}

function getRatelimiter(): Ratelimit | null {
  if (ratelimit) return ratelimit;

  const url = env.UPSTASH_REDIS_URL;
  const token = env.UPSTASH_REDIS_TOKEN;

  if (!url || !token) {
    return null;
  }

  try {
    const redis = new Redis({ url, token });
    ratelimit = new Ratelimit({
      redis,
      limiter: Ratelimit.slidingWindow(10, '60 s'),
      analytics: true,
      prefix: 'rl:',
    });
    return ratelimit;
  } catch (error) {
    console.error('[RateLimit] Failed to initialize Upstash Redis:', error);
    return null;
  }
}

/**
 * Synchronous rate limit check using in-memory token bucket.
 * Used as fallback when Upstash Redis is not configured.
 */
function checkRateLimitInMemory(
  key: string,
  maxTokens: number,
  windowMs: number
): RateLimitResult {
  const bucket = getMemoryBucket(key, maxTokens, windowMs);
  const now = Date.now();

  if (bucket.tokens > 0) {
    bucket.tokens -= 1;
    return {
      allowed: true,
      limit: maxTokens,
      remaining: bucket.tokens,
      resetMs: bucket.resetAt - now,
    };
  }

  return {
    allowed: false,
    limit: maxTokens,
    remaining: 0,
    resetMs: bucket.resetAt - now,
  };
}

/**
 * Checks whether the given key has remaining request budget.
 * Uses in-memory token bucket (synchronous, no Redis needed).
 *
 * For distributed rate limiting, use {@link checkRateLimitAsync} instead.
 *
 * @param key - Unique identifier for the client (e.g., `route:userId` or `route:ip`).
 * @param maxTokens - Maximum burst capacity (default 10).
 * @param windowMs - Time window in milliseconds before refill (default 60s).
 * @returns The rate limit decision with remaining tokens and reset time.
 */
export function checkRateLimit(
  key: string,
  maxTokens = 10,
  windowMs = 60_000
): RateLimitResult {
  try {
    return checkRateLimitInMemory(key, maxTokens, windowMs);
  } catch (error) {
    console.error('[RateLimit] Check failed:', error);
    // Fail open to avoid blocking legitimate traffic
    return { allowed: true, limit: maxTokens, remaining: maxTokens - 1, resetMs: windowMs };
  }
}

/**
 * Async rate limit check using Upstash Redis (distributed).
 * Falls back to in-memory token bucket when Redis is not configured.
 *
 * Use this in API routes for proper distributed rate limiting.
 */
export async function checkRateLimitAsync(
  key: string,
  maxTokens = 10,
  windowMs = 60_000
): Promise<RateLimitResult> {
  const limiter = getRatelimiter();

  // Fallback to in-memory when Redis not configured
  if (!limiter) {
    return checkRateLimitInMemory(key, maxTokens, windowMs);
  }

  try {
    const result = await limiter.limit(key);
    return {
      allowed: result.success,
      limit: result.limit,
      remaining: result.remaining,
      resetMs: result.reset - Date.now(),
    };
  } catch (error) {
    console.error('[RateLimit] Async check failed:', error);
    return { allowed: true, limit: maxTokens, remaining: maxTokens - 1, resetMs: windowMs };
  }
}

/**
 * Adds standard rate-limit headers to a Headers object.
 */
export function addRateLimitHeaders(headers: Headers, result: RateLimitResult): void {
  headers.set(RATE_LIMIT_LIMIT, String(result.limit));
  headers.set(RATE_LIMIT_REMAINING, String(result.remaining));
  headers.set(RATE_LIMIT_RESET, String(Math.ceil(result.resetMs / 1000)));
}

type ApiHandler = (request: Request, ...args: unknown[]) => Promise<Response> | Response;

/**
 * Wraps an API handler with distributed rate limiting.
 * Returns a 429 response with Retry-After header when the limit is exceeded.
 *
 * @param handler - The request handler to wrap.
 * @param options - Rate limit configuration.
 * @returns A wrapped handler that enforces the rate limit.
 */
export function withRateLimit(
  handler: ApiHandler,
  options: { maxTokens?: number; windowMs?: number; keyPrefix?: string } = {}
): ApiHandler {
  return async (request: Request, ...args: unknown[]): Promise<Response> => {
    const url = new URL(request.url);
    // Use userId from middleware header, fallback to IP
    const userId = request.headers.get('x-user-id');
    const ip = request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown';
    const key = `${options.keyPrefix || url.pathname}:${userId || ip}`;

    const result = await checkRateLimitAsync(key, options.maxTokens, options.windowMs);

    if (!result.allowed) {
      const headers = new Headers();
      addRateLimitHeaders(headers, result);
      headers.set('Retry-After', String(Math.ceil(result.resetMs / 1000)));
      return new Response(JSON.stringify({ error: 'Too many requests' }), {
        status: 429,
        headers: { ...Object.fromEntries(headers), 'Content-Type': 'application/json' },
      });
    }

    const response = await handler(request, ...args);
    const responseHeaders = new Headers(response.headers);
    addRateLimitHeaders(responseHeaders, result);

    return new Response(response.body, {
      status: response.status,
      statusText: response.statusText,
      headers: responseHeaders,
    });
  };
}
