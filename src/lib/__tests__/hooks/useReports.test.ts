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
  },
  getOrgIdString: vi.fn().mockResolvedValue('test-org-id'),
}));

import {
  useReportTemplates,
  useReportGenerate,
  useSaveTemplate,
  useDeleteTemplate,
} from '@/hooks/useReports';

describe('useReports hook exports', () => {
  it('useReportTemplates is a function', () => {
    expect(typeof useReportTemplates).toBe('function');
  });

  it('useReportGenerate is a function', () => {
    expect(typeof useReportGenerate).toBe('function');
  });

  it('useSaveTemplate is a function', () => {
    expect(typeof useSaveTemplate).toBe('function');
  });

  it('useDeleteTemplate is a function', () => {
    expect(typeof useDeleteTemplate).toBe('function');
  });
});
