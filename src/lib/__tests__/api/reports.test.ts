process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://test.supabase.co';
process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = 'test-anon-key';

import { describe, it, expect, vi } from 'vitest';

vi.mock('@/lib/supabase', () => ({
  supabase: {
    from: vi.fn(() => ({
      select: vi.fn(() => ({
        eq: vi.fn(() => ({
          order: vi.fn().mockResolvedValue({ data: [], error: null }),
        })),
      })),
      insert: vi.fn().mockResolvedValue({ error: null }),
      delete: vi.fn(() => ({ eq: vi.fn().mockResolvedValue({ error: null }) })),
    })),
    rpc: vi.fn().mockResolvedValue({ data: [], error: null }),
    auth: {
      getUser: vi.fn().mockResolvedValue({ data: { user: null }, error: null }),
    },
  },
  getOrgIdString: vi.fn().mockResolvedValue(null),
}));

vi.mock('@/lib/logger', () => ({
  logError: vi.fn(),
}));

describe('Reports API routes', () => {
  it('templates route exports GET and POST handlers', async () => {
    const mod = await import('@/app/api/reports/templates/route');
    expect(typeof mod.GET).toBe('function');
    expect(typeof mod.POST).toBe('function');
  });

  it('generate route exports POST handler', async () => {
    const mod = await import('@/app/api/reports/generate/route');
    expect(typeof mod.POST).toBe('function');
  });

  it('export route exports POST handler', async () => {
    const mod = await import('@/app/api/reports/export/route');
    expect(typeof mod.POST).toBe('function');
  });

  it('templates GET returns 401 when unauthenticated', async () => {
    const mod = await import('@/app/api/reports/templates/route');
    const req = new Request('http://localhost:3000/api/reports/templates');
    const res = await mod.GET(req);
    expect(res.status).toBe(401);
  });

  it('generate POST returns 401 when unauthenticated', async () => {
    // Auth gate runs before body parsing, so an unauthenticated caller gets
    // 401 regardless of body validity. getOrgIdString is mocked to resolve null.
    const mod = await import('@/app/api/reports/generate/route');
    const req = new Request('http://localhost:3000/api/reports/generate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({}),
    });
    const res = await mod.POST(req);
    expect(res.status).toBe(401);
  });

  it('export POST returns 401 when unauthenticated', async () => {
    // Auth gate runs before body parsing, so an unauthenticated caller gets
    // 401 regardless of body validity. getOrgIdString is mocked to resolve null.
    const mod = await import('@/app/api/reports/export/route');
    const req = new Request('http://localhost:3000/api/reports/export', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({}),
    });
    const res = await mod.POST(req);
    expect(res.status).toBe(401);
  });
});
