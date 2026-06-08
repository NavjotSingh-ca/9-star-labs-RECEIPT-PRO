import { describe, it, expect, vi, beforeEach } from 'vitest';

let mockGetUser = vi.fn();

vi.mock('@supabase/ssr', () => ({
  createServerClient: () => ({
    auth: { getUser: mockGetUser },
  }),
}));

vi.mock('next/server', () => ({
  NextResponse: {
    next: vi.fn(() => ({ cookies: { set: vi.fn() }, status: undefined })),
    redirect: vi.fn(() => ({ status: 307, headers: new Map() })),
  },
}));

const { proxy } = await import('./proxy');

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function mockRequest(url: string): any {
  const u = new URL(url);
  return {
    nextUrl: Object.assign(u, { clone: () => new URL(u.href) }),
    cookies: { getAll: () => [], set: vi.fn() },
  };
}

beforeEach(() => {
  vi.clearAllMocks();
  mockGetUser = vi.fn();
  process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://test.supabase.co';
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = 'test-anon-key';
});

describe('proxy middleware', () => {
  it('redirects unauthenticated users from protected routes to /', async () => {
    mockGetUser.mockResolvedValue({ data: { user: null }, error: null });

    const result = await proxy(mockRequest('http://localhost/settings/billing'));

    expect(result.status).toBe(307);
  });

  it('allows unauthenticated users on public paths', async () => {
    mockGetUser.mockResolvedValue({ data: { user: null }, error: null });

    const paths = ['/', '/privacy', '/terms', '/auth/callback'];
    for (const path of paths) {
      const result = await proxy(mockRequest(`http://localhost${path}`));
      expect(result.status).toBe(undefined);
    }
  });

  it('allows unauthenticated access to /_next/* and /api/*', async () => {
    mockGetUser.mockResolvedValue({ data: { user: null }, error: null });

    const result1 = await proxy(mockRequest('http://localhost/_next/static/chunks/app.js'));
    expect(result1.status).toBe(undefined);

    const result2 = await proxy(mockRequest('http://localhost/api/health'));
    expect(result2.status).toBe(undefined);
  });

  it('allows authenticated users on protected routes', async () => {
    mockGetUser.mockResolvedValue({ data: { user: { id: 'u1' } }, error: null });

    const result = await proxy(mockRequest('http://localhost/settings/security'));
    expect(result.status).toBe(undefined);
  });
});
