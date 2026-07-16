/**
 * Token-bucket rate limiter.
 *
 * IMPORTANT: state lives in a module-level `Map`, so this is **per-process**.
 * On serverless platforms (Vercel Functions, Lambda) each instance gets its
 * own bucket map, so an attacker distributing requests across instances gets
 * effectively N × maxTokens budget. Use this for coarse abuse reduction and
 * user-facing feedback, not as a hard security control. For enforced limits,
 * back the bucket with shared storage (Upstash Redis, Edge KV).
 */

interface Bucket {
  tokens: number;
  lastRefill: number;
}

const buckets = new Map<string, Bucket>();

const RATE_LIMIT_REMAINING = 'X-RateLimit-Remaining';
const RATE_LIMIT_LIMIT = 'X-RateLimit-Limit';
const RATE_LIMIT_RESET = 'X-RateLimit-Reset';

export interface RateLimitResult {
  allowed: boolean;
  /** Configured bucket capacity (the limit reported to clients). */
  limit: number;
  remaining: number;
  resetMs: number;
}

export interface RateLimitOptions {
  maxTokens?: number;
  windowMs?: number;
  keyPrefix?: string;
}

/**
 * Checks whether the given key (e.g. IP:route) has remaining request budget.
 *
 * @param key - Unique identifier for the client (e.g. `route:ip` or `route:userId`).
 * @param maxTokens - Maximum burst capacity (default 10).
 * @param windowMs - Time window in milliseconds before refill (default 60s).
 * @returns The rate limit decision with remaining tokens and reset time.
 */
export function checkRateLimit(
  key: string,
  maxTokens = 10,
  windowMs = 60_000
): RateLimitResult {
  const now = Date.now();
  const bucket = buckets.get(key);

  if (!bucket || now - bucket.lastRefill > windowMs) {
    buckets.set(key, { tokens: maxTokens - 1, lastRefill: now });
    return { allowed: true, limit: maxTokens, remaining: maxTokens - 1, resetMs: windowMs };
  }

  if (bucket.tokens > 0) {
    bucket.tokens--;
    return { allowed: true, limit: maxTokens, remaining: bucket.tokens, resetMs: windowMs - (now - bucket.lastRefill) };
  }

  return { allowed: false, limit: maxTokens, remaining: 0, resetMs: windowMs - (now - bucket.lastRefill) };
}

/**
 * Adds standard rate-limit headers to a Headers object.
 *
 * @param headers - The response headers to modify.
 * @param result - The rate limit result from {@link checkRateLimit}.
 */
export function addRateLimitHeaders(headers: Headers, result: RateLimitResult): void {
  headers.set(RATE_LIMIT_LIMIT, String(result.limit));
  headers.set(RATE_LIMIT_REMAINING, String(result.remaining));
  headers.set(RATE_LIMIT_RESET, String(Math.ceil(result.resetMs / 1000)));
}

type ApiHandler = (request: Request, ...args: unknown[]) => Promise<Response> | Response;

/**
 * Wraps an API handler with token-bucket rate limiting.
 * Returns a 429 response with `Retry-After` header when the limit is exceeded.
 *
 * @param handler - The request handler to wrap.
 * @param options - Rate limit configuration.
 * @returns A wrapped handler that enforces the rate limit.
 */
export function withRateLimit(
  handler: ApiHandler,
  options: RateLimitOptions = {}
): ApiHandler {
  return async (request: Request, ...args: unknown[]): Promise<Response> => {
    const url = new URL(request.url);
    // Use userId from x-user-id header (set by middleware when authenticated), fallback to IP
    const userId = request.headers.get('x-user-id');
    const ip = request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown';
    const key = `${options.keyPrefix || url.pathname}:${userId || ip}`;

    const result = checkRateLimit(key, options.maxTokens, options.windowMs);

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

// Periodic prune of stale buckets (runs once at module load on server).
if (typeof setInterval !== 'undefined') {
  setInterval(() => {
    const now = Date.now();
    for (const [key, bucket] of buckets) {
      if (now - bucket.lastRefill > 120_000) {
        buckets.delete(key);
      }
    }
  }, 300_000);
}
