import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-admin';
import { z } from 'zod';

export async function GET(request: Request) {
  try {
    const authHeader = request.headers.get('authorization') || '';
    const token = authHeader.replace('Bearer ', '');
    if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { data: { user }, error: authError } = await supabaseAdmin.auth.getUser(token);
    if (authError || !user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { data: callerRole } = await supabaseAdmin
      .from('user_roles')
      .select('org_id, role')
      .eq('user_id', user.id)
      .single();

    const orgId = callerRole?.org_id as string | undefined;
    if (!orgId || !callerRole) return NextResponse.json({ error: 'No organization' }, { status: 400 });

    const { data: members } = await supabaseAdmin
      .from('user_roles')
      .select('user_id, role, created_at, invited_by')
      .eq('org_id', orgId);

    if (!members || members.length === 0) {
      return NextResponse.json({ members: [] });
    }

    const { data: authUsers } = await supabaseAdmin
      .schema('auth')
      .from('users')
      .select('id, email, raw_user_meta_data')
      .in('id', members.map(m => m.user_id));

    const emailMap = new Map(authUsers?.map(u => [u.id, { email: u.email, displayName: u.raw_user_meta_data?.full_name || u.raw_user_meta_data?.name || '' }]) ?? []);

    const result = members.map(m => ({
      userId: m.user_id,
      role: m.role,
      email: emailMap.get(m.user_id)?.email ?? '',
      displayName: emailMap.get(m.user_id)?.displayName ?? '',
      createdAt: m.created_at,
    }));

    return NextResponse.json({ members: result, callerRole: callerRole?.role ?? '' });
  } catch (err: unknown) {
    console.error('[Team API]', err);
    return NextResponse.json({ error: 'Failed to load team' }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    const authHeader = request.headers.get('authorization') || '';
    const token = authHeader.replace('Bearer ', '');
    if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { data: { user }, error: authError } = await supabaseAdmin.auth.getUser(token);
    if (authError || !user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { data: callerRole } = await supabaseAdmin
      .from('user_roles')
      .select('org_id, role')
      .eq('user_id', user.id)
      .single();

    const orgId = callerRole?.org_id as string | undefined;
    if (!orgId || !callerRole) return NextResponse.json({ error: 'No organization' }, { status: 400 });
    if (callerRole.role !== 'Owner') return NextResponse.json({ error: 'Only Owners can remove members' }, { status: 403 });

    const body = await request.json();
    const parsed = z.object({ userId: z.string().uuid() }).safeParse(body);
    if (!parsed.success) return NextResponse.json({ error: 'Invalid userId format' }, { status: 400 });
    const { userId } = parsed.data;
    if (userId === user.id) return NextResponse.json({ error: 'Cannot remove yourself' }, { status: 400 });

    const { data: target } = await supabaseAdmin
      .from('user_roles')
      .select('role')
      .eq('user_id', userId)
      .eq('org_id', orgId)
      .single();

    if (!target) return NextResponse.json({ error: 'User not found in org' }, { status: 404 });
    if (target.role === 'Owner') return NextResponse.json({ error: 'Cannot remove an Owner' }, { status: 400 });

    const { error: deleteError } = await supabaseAdmin
      .from('user_roles')
      .delete()
      .eq('user_id', userId)
      .eq('org_id', orgId);

    if (deleteError) throw deleteError;

    return NextResponse.json({ success: true });
  } catch (err: unknown) {
    console.error('[Team API DELETE]', err);
    return NextResponse.json({ error: 'Failed to remove member' }, { status: 500 });
  }
}
