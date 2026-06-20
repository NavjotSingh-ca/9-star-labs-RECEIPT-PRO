import { NextResponse } from 'next/server';
import { withRateLimit } from '@/lib/rate-limiter';
import { supabase } from '@/lib/supabase';
import { getOrgIdString } from '@/lib/supabase';
import { logError } from '@/lib/logger';

const SCHEDULE_FREQUENCIES = ['daily', 'weekly', 'monthly', 'quarterly'] as const;

function computeNextRunAt(
  frequency: string,
  dayOfWeek: number | null,
  dayOfMonth: number | null,
  timeOfDay: string,
): string {
  const now = new Date();
  const [hours, minutes] = timeOfDay.split(':').map(Number);
  const candidate = new Date(now);
  candidate.setHours(hours, minutes, 0, 0);

  if (frequency === 'daily') {
    if (candidate <= now) candidate.setDate(candidate.getDate() + 1);
    return candidate.toISOString();
  }

  if (frequency === 'weekly') {
    const targetDay = dayOfWeek ?? 1;
    const currentDay = candidate.getDay();
    let diff = targetDay - currentDay;
    if (diff <= 0) diff += 7;
    candidate.setDate(candidate.getDate() + diff);
    if (candidate <= now) candidate.setDate(candidate.getDate() + 7);
    return candidate.toISOString();
  }

  if (frequency === 'monthly' || frequency === 'quarterly') {
    const targetDay = dayOfMonth ?? 1;
    let monthsToAdd = 0;
    if (frequency === 'quarterly') monthsToAdd = 3;
    candidate.setMonth(candidate.getMonth() + monthsToAdd);
    candidate.setDate(Math.min(targetDay, new Date(candidate.getFullYear(), candidate.getMonth() + 1, 0).getDate()));
    if (candidate <= now) {
      candidate.setMonth(candidate.getMonth() + (frequency === 'quarterly' ? 3 : 1));
      candidate.setDate(Math.min(targetDay, new Date(candidate.getFullYear(), candidate.getMonth() + 1, 0).getDate()));
    }
    return candidate.toISOString();
  }

  return candidate.toISOString();
}

async function GET() {
  try {
    const orgId = await getOrgIdString();
    if (!orgId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    const { data, error } = await supabase
      .from('report_schedules')
      .select('*')
      .eq('org_id', orgId)
      .order('created_at', { ascending: false });
    if (error) throw error;
    return NextResponse.json({ schedules: data });
  } catch (err) {
    logError(err, { action: 'get_schedules' });
    return NextResponse.json({ error: 'Failed to load schedules' }, { status: 500 });
  }
}

async function POST(request: Request) {
  try {
    const orgId = await getOrgIdString();
    if (!orgId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await request.json();
    const { report_name, frequency, email_to, format, report_config, day_of_week, day_of_month, time_of_day } = body;

    if (!report_name || !frequency || !email_to) {
      return NextResponse.json({ error: 'Missing required fields: report_name, frequency, email_to' }, { status: 400 });
    }
    if (!SCHEDULE_FREQUENCIES.includes(frequency)) {
      return NextResponse.json({ error: 'Invalid frequency. Use daily, weekly, monthly, or quarterly.' }, { status: 400 });
    }
    if (typeof email_to !== 'string' || !email_to.includes('@')) {
      return NextResponse.json({ error: 'Valid recipient email is required' }, { status: 400 });
    }

    const validFormats = ['pdf', 'csv'];
    const reportFormat = validFormats.includes(format) ? format : 'pdf';

    const nextRunAt = computeNextRunAt(
      frequency,
      frequency === 'weekly' ? (day_of_week ?? 1) : null,
      frequency === 'monthly' || frequency === 'quarterly' ? (day_of_month ?? 1) : null,
      time_of_day || '08:00',
    );

    const { data, error } = await supabase
      .from('report_schedules')
      .insert({
        org_id: orgId,
        created_by: user.id,
        report_name,
        frequency,
        email_to,
        format: reportFormat,
        report_config: report_config || {},
        day_of_week: frequency === 'weekly' ? (day_of_week ?? 1) : null,
        day_of_month: frequency === 'monthly' || frequency === 'quarterly' ? (day_of_month ?? 1) : null,
        time_of_day: time_of_day || '08:00',
        next_run_at: nextRunAt,
        is_active: true,
      })
      .select()
      .single();

    if (error) throw error;
    return NextResponse.json({ schedule: data }, { status: 201 });
  } catch (err) {
    logError(err, { action: 'create_schedule' });
    return NextResponse.json({ error: 'Failed to create schedule' }, { status: 500 });
  }
}

async function PATCH(request: Request) {
  try {
    const orgId = await getOrgIdString();
    if (!orgId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    if (!id) return NextResponse.json({ error: 'Schedule ID required' }, { status: 400 });

    const body = await request.json();
    const updates: Record<string, unknown> = {};

    if (typeof body.is_active === 'boolean') updates.is_active = body.is_active;
    if (body.frequency && SCHEDULE_FREQUENCIES.includes(body.frequency)) {
      updates.frequency = body.frequency;
    }
    if (body.email_to && typeof body.email_to === 'string') updates.email_to = body.email_to;
    if (body.report_name) updates.report_name = body.report_name;
    if (body.format && ['pdf', 'csv'].includes(body.format)) updates.format = body.format;
    if (body.report_config) updates.report_config = body.report_config;
    if (body.time_of_day) updates.time_of_day = body.time_of_day;

    if (body.day_of_week !== undefined) updates.day_of_week = body.day_of_week;
    if (body.day_of_month !== undefined) updates.day_of_month = body.day_of_month;

    if (body.frequency || body.time_of_day || body.day_of_week !== undefined || body.day_of_month !== undefined) {
      const freq = body.frequency || (await supabase.from('report_schedules').select('frequency').eq('id', id).eq('org_id', orgId).single()).data?.frequency;
      updates.next_run_at = computeNextRunAt(
        freq || 'weekly',
        body.day_of_week ?? null,
        body.day_of_month ?? null,
        body.time_of_day || '08:00',
      );
    }

    const { data, error } = await supabase
      .from('report_schedules')
      .update(updates)
      .eq('id', id)
      .eq('org_id', orgId)
      .select()
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return NextResponse.json({ error: 'Schedule not found' }, { status: 404 });
      }
      throw error;
    }
    return NextResponse.json({ schedule: data });
  } catch (err) {
    logError(err, { action: 'update_schedule' });
    return NextResponse.json({ error: 'Failed to update schedule' }, { status: 500 });
  }
}

async function DELETE(request: Request) {
  try {
    const orgId = await getOrgIdString();
    if (!orgId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    if (!id) return NextResponse.json({ error: 'Schedule ID required' }, { status: 400 });

    const { error } = await supabase
      .from('report_schedules')
      .delete()
      .eq('id', id)
      .eq('org_id', orgId);

    if (error) throw error;
    return NextResponse.json({ success: true });
  } catch (err) {
    logError(err, { action: 'delete_schedule' });
    return NextResponse.json({ error: 'Failed to delete schedule' }, { status: 500 });
  }
}

export const getSchedules = withRateLimit(GET, { maxTokens: 30, keyPrefix: 'schedules:list' });
export const createSchedule = withRateLimit(POST, { maxTokens: 20, keyPrefix: 'schedules:create' });
export const updateSchedule = withRateLimit(PATCH, { maxTokens: 20, keyPrefix: 'schedules:update' });
export const deleteSchedule = withRateLimit(DELETE, { maxTokens: 20, keyPrefix: 'schedules:delete' });

export { getSchedules as GET, createSchedule as POST, updateSchedule as PATCH, deleteSchedule as DELETE };
