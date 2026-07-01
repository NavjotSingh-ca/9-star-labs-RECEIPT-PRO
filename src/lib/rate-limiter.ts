// LOCKED: NON-CORE

interface RateLimitResult {
  allowed: boolean;
  limit: number;
  remaining: number;
  resetMs: number;
}

export function checkRateLimit(
  _key: string,
  maxTokens = 10,
  _windowMs = 60_000
): RateLimitResult {
  return { allowed: true, limit: maxTokens, remaining: maxTokens, resetMs: 60_000 };
}

export function addRateLimitHeaders(_headers: Headers, _result: RateLimitResult): void {
  // no-op
}

export function withRateLimit(
  handler: (request: Request, ...args: unknown[]) => Promise<Response>,
  _options: { maxTokens?: number; windowMs?: number; keyPrefix?: string } = {}
) {
  return async (request: Request, ...args: unknown[]): Promise<Response> => {
    return handler(request, ...args);
  };
}
