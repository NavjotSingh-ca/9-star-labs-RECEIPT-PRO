/**
 * Time Entry Service — Server-side operations for clock in/out.
 * Simple and minimal: clock in, clock out, get active entry, get today's entries.
 */
import { getSupabase } from '@/lib/supabase';
import { logError } from '@/lib/logger';

export interface TimeEntry {
  id: string;
  org_id: string;
  user_id: string;
  clock_in_time: string;
  clock_out_time: string | null;
  notes: string | null;
  status: 'active' | 'completed';
  created_at: string;
  updated_at: string;
}

export interface TimeEntryResult<T = TimeEntry | TimeEntry[] | null> {
  data?: T;
  error?: string;
}

// ─── Clock In ───────────────────────────────────────────────────

export async function clockIn(orgId: string, notes?: string): Promise<TimeEntryResult<TimeEntry>> {
  try {
    const supabase = await getSupabase();
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) return { error: 'Not authenticated' };

    // Check not already clocked in
    const { data: active } = await supabase
      .from('time_entries')
      .select('id')
      .eq('user_id', user.id)
      .eq('org_id', orgId)
      .eq('status', 'active')
      .maybeSingle();

    if (active) return { error: 'Already clocked in' };

    const { data, error } = await supabase
      .from('time_entries')
      .insert({
        org_id: orgId,
        user_id: user.id,
        clock_in_time: new Date().toISOString(),
        notes: notes || null,
        status: 'active',
      })
      .select()
      .single();

    if (error) return { error: `Failed to clock in: ${error.message}` };
    return { data: data as TimeEntry };
  } catch (err) {
    logError(err, { action: 'clockIn_failed' });
    return { error: err instanceof Error ? err.message : 'Failed to clock in' };
  }
}

// ─── Clock Out ──────────────────────────────────────────────────

export async function clockOut(orgId: string, entryId: string, notes?: string): Promise<TimeEntryResult<TimeEntry>> {
  try {
    const supabase = await getSupabase();
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) return { error: 'Not authenticated' };

    const clockOutTime = new Date().toISOString();

    const { data, error } = await supabase
      .from('time_entries')
      .update({
        clock_out_time: clockOutTime,
        status: 'completed',
        notes: notes || undefined,
      })
      .eq('id', entryId)
      .eq('user_id', user.id)
      .eq('org_id', orgId)
      .eq('status', 'active')
      .select()
      .single();

    if (error) return { error: `Failed to clock out: ${error.message}` };
    if (!data) return { error: 'No active time entry found' };
    return { data: data as TimeEntry };
  } catch (err) {
    logError(err, { action: 'clockOut_failed' });
    return { error: err instanceof Error ? err.message : 'Failed to clock out' };
  }
}

// ─── Get Active Entry ───────────────────────────────────────────

export async function getActiveEntry(orgId: string): Promise<TimeEntryResult<TimeEntry | null>> {
  try {
    const supabase = await getSupabase();
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) return { error: 'Not authenticated' };

    const { data, error } = await supabase
      .from('time_entries')
      .select('*')
      .eq('user_id', user.id)
      .eq('org_id', orgId)
      .eq('status', 'active')
      .order('clock_in_time', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (error) return { error: error.message };
    return { data: data ? (data as TimeEntry) : null };
  } catch (err) {
    logError(err, { action: 'getActiveEntry_failed' });
    return { error: err instanceof Error ? err.message : 'Failed to get active entry' };
  }
}

// ─── Get Today's Entries ────────────────────────────────────────

export async function getTodayEntries(orgId: string): Promise<TimeEntryResult<TimeEntry[]>> {
  try {
    const supabase = await getSupabase();
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) return { error: 'Not authenticated' };

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const { data, error } = await supabase
      .from('time_entries')
      .select('*')
      .eq('user_id', user.id)
      .eq('org_id', orgId)
      .gte('clock_in_time', today.toISOString())
      .order('clock_in_time', { ascending: false });

    if (error) return { error: error.message };
    return { data: (data ?? []) as TimeEntry[] };
  } catch (err) {
    logError(err, { action: 'getTodayEntries_failed' });
    return { error: err instanceof Error ? err.message : 'Failed to fetch today entries' };
  }
}

// ─── Get History (paginated) ────────────────────────────────────

export async function getTimeEntryHistory(
  orgId: string,
  limit = 20,
  offset = 0,
): Promise<TimeEntryResult<TimeEntry[]>> {
  try {
    const supabase = await getSupabase();
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) return { error: 'Not authenticated' };

    const { data, error } = await supabase
      .from('time_entries')
      .select('*')
      .eq('user_id', user.id)
      .eq('org_id', orgId)
      .order('clock_in_time', { ascending: false })
      .range(offset, offset + limit - 1);

    if (error) return { error: error.message };
    return { data: (data ?? []) as TimeEntry[] };
  } catch (err) {
    logError(err, { action: 'getTimeEntryHistory_failed' });
    return { error: err instanceof Error ? err.message : 'Failed to fetch history' };
  }
}
