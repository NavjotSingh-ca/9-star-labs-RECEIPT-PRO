import { describe, it, expect, vi, beforeEach } from 'vitest';

const mockSupabase = {
  from: vi.fn(),
  rpc: vi.fn(),
};

vi.mock('@/lib/supabase', () => ({
  supabase: mockSupabase,
  getOrgIdString: vi.fn(),
}));

vi.mock('@/lib/logger', () => ({
  logError: vi.fn(),
}));

const { getUserRole, setUserRole } = await import('@/lib/services/roles');
const { getOrgIdString } = await import('@/lib/supabase');

function mockSelect(data: unknown, error: unknown = null) {
  const chain = {
    select: vi.fn().mockReturnThis(),
    eq: vi.fn().mockReturnThis(),
    single: vi.fn().mockResolvedValue({ data, error }),
  };
  mockSupabase.from.mockReturnValue(chain);
  return chain;
}

describe('getUserRole', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('returns Employee for empty userId', async () => {
    expect(await getUserRole('')).toBe('Employee');
  });

  it('returns the role from supabase when valid', async () => {
    mockSelect({ role: 'Owner' });
    expect(await getUserRole('user-1')).toBe('Owner');
  });

  it('returns Employee when error is returned', async () => {
    mockSelect(null, { message: 'Not found' });
    expect(await getUserRole('user-1')).toBe('Employee');
  });

  it('returns Employee when data has no role', async () => {
    mockSelect({});
    expect(await getUserRole('user-1')).toBe('Employee');
  });

  it('returns Employee when role is invalid', async () => {
    mockSelect({ role: 'Admin' });
    expect(await getUserRole('user-1')).toBe('Employee');
  });

  it('returns Employee on database exception', async () => {
    const chain = {
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      single: vi.fn().mockRejectedValue(new Error('DB down')),
    };
    mockSupabase.from.mockReturnValue(chain);
    expect(await getUserRole('user-1')).toBe('Employee');
  });
});

describe('setUserRole', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('throws if targetUserId is empty', async () => {
    await expect(setUserRole('', 'Owner', 'caller-1')).rejects.toThrow('Target user ID is required');
  });

  it('throws if callerUserId is empty', async () => {
    await expect(setUserRole('target-1', 'Owner', '')).rejects.toThrow('Caller user ID is required');
  });

  it('throws if role is invalid', async () => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any -- intentional edge case
    await expect(setUserRole('target-1', 'Admin' as any, 'caller-1')).rejects.toThrow('Invalid role');
  });

  it('throws if caller is not Owner', async () => {
    mockSelect({ role: 'Employee' });
    await expect(setUserRole('target-1', 'Accountant', 'caller-1')).rejects.toThrow('Unauthorized');
  });

  it('throws if orgId is null', async () => {
    mockSelect({ role: 'Owner' });
    vi.mocked(getOrgIdString).mockResolvedValue(null);
    await expect(setUserRole('target-1', 'Accountant', 'caller-1')).rejects.toThrow('No organization found');
  });

  it('throws if target is in different org', async () => {
    vi.mocked(getOrgIdString).mockResolvedValue('org-1');
    mockSupabase.from
      .mockImplementationOnce(() => ({
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({ data: { role: 'Owner' }, error: null }),
      }))
      .mockImplementationOnce(() => ({
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({ data: { org_id: 'org-2' }, error: null }),
      }));
    await expect(setUserRole('target-1', 'Accountant', 'caller-1')).rejects.toThrow('Cannot modify roles');
  });

  it('calls upsert_user_role RPC on success', async () => {
    mockSelect({ role: 'Owner' });
    vi.mocked(getOrgIdString).mockResolvedValue('org-1');
    // First call = caller role check, second call = target org check
    mockSupabase.from
      .mockImplementationOnce(() => ({
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({ data: { role: 'Owner' }, error: null }),
      }))
      .mockImplementationOnce(() => ({
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({ data: { org_id: 'org-1' }, error: null }),
      }));
    mockSupabase.rpc.mockResolvedValue({ error: null });

    await setUserRole('target-1', 'Accountant', 'caller-1');

    expect(mockSupabase.rpc).toHaveBeenCalledWith('upsert_user_role', {
      p_target_user_id: 'target-1',
      p_role: 'Accountant',
      p_org_id: 'org-1',
    });
  });

  it('throws on RPC error', async () => {
    mockSelect({ role: 'Owner' });
    vi.mocked(getOrgIdString).mockResolvedValue('org-1');
    mockSupabase.from
      .mockImplementationOnce(() => ({
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({ data: { role: 'Owner' }, error: null }),
      }))
      .mockImplementationOnce(() => ({
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({ data: { org_id: 'org-1' }, error: null }),
      }));
    mockSupabase.rpc.mockResolvedValue({ error: new Error('RPC failed') });

    await expect(setUserRole('target-1', 'Accountant', 'caller-1')).rejects.toThrow('Failed to update user role');
  });
});
