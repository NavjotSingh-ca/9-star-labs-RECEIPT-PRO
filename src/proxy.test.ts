// Set required env vars before any module imports that depend on @/lib/env
process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://test.supabase.co';
process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = 'test-anon-key';

import { describe, it, expect, vi, beforeEach } from 'vitest';
import type { NextRequest } from 'next/server';

let mockGetUser = vi.fn<() => Promise<{ data: { user: { id: string } | null }; error: unknown }>>();

vi.mock('@supabase/ssr', () => ({
  createServerClient: () => ({
    auth: { getUser: mockGetUser },
  }),
}));

vi.mock('next/server', () => ({
  NextResponse: {
    next: vi.fn(() => ({
      cookies: { set: vi.fn() },
      headers: new Map<string, string>() as unknown as Headers,
    })),
    redirect: vi.fn(() => ({
      status: 307,
      headers: new Map() as unknown as Headers,
    })),
    json: vi.fn(() => ({
      status: 401,
      headers: new Map() as unknown as Headers,
    })),
  },
}));

const { proxy } = await import('./proxy');

interface MockNextRequest {
  nextUrl: URL & { clone: () => URL };
  cookies: { getAll: () => { name: string; value: string }[]; get: ReturnType<typeof vi.fn>; set: ReturnType<typeof vi.fn> };
  headers: Headers;
  method: string;
}

function mockRequest(url: string, options: { method?: string; cookies?: Record<string, string> } = {}): MockNextRequest {
  const u = new URL(url);
  const cookieStore = options.cookies || {};
  return {
    nextUrl: Object.assign(u, { clone: () => new URL(u.href) }),
    cookies: {
      getAll: () => Object.entries(cookieStore).map(([name, value]) => ({ name, value })),
      get: vi.fn((name: string) => cookieStore[name]),
      set: vi.fn(),
    },
    headers: new Headers(),
    method: options.method || 'GET',
  };
}

beforeEach(() => {
  vi.clearAllMocks();
  mockGetUser = vi.fn<() => Promise<{ data: { user: { id: string } | null }; error: unknown }>>();
});

describe('proxy', () => {
  it('redirects unauthenticated users from protected routes to /', async () => {
    mockGetUser.mockResolvedValue({ data: { user: null }, error: null });

    const result = await proxy(mockRequest('http://localhost/settings/billing') as unknown as NextRequest);

    expect(result.status).toBe(307);
  });

  it('allows unauthenticated users on public paths', async () => {
    mockGetUser.mockResolvedValue({ data: { user: null }, error: null });

    const paths = ['/', '/privacy', '/terms', '/auth/callback'];
    for (const path of paths) {
      const result = await proxy(mockRequest(`http://localhost${path}`) as unknown as NextRequest);
      expect(result.status).toBe(undefined);
    }
  });

  it('allows unauthenticated access to /_next/* and /api/*', async () => {
    mockGetUser.mockResolvedValue({ data: { user: null }, error: null });

    const result1 = await proxy(mockRequest('http://localhost/_next/static/chunks/app.js') as unknown as NextRequest);
    expect(result1.status).toBe(undefined);

    const result2 = await proxy(mockRequest('http://localhost/api/health') as unknown as NextRequest);
    expect(result2.status).toBe(undefined);
  });

  it('allows authenticated users on protected routes', async () => {
    mockGetUser.mockResolvedValue({ data: { user: { id: 'u1' } }, error: null });

    const result = await proxy(mockRequest('http://localhost/settings/security') as unknown as NextRequest);
    expect(result.status).toBe(undefined);
  });
});
