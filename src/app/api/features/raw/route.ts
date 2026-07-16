/**
 * GET /api/features/raw?orgId=... — Returns raw feature data including allowed_roles.
 * Owner-only access since this exposes internal configuration.
 */
import { NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { env } from '@/lib/env';
import { getOrgFeaturesRaw } from '@/lib/services/features';
import { logError } from '@/lib/logger';
import type { NextRequest } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    const cookieStore = await cookies();
    const supabase = createServerClient(
      env.NEXT_PUBLIC_SUPABASE_URL,
      env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
      {
        cookies: {
          getAll() {
            return cookieStore.getAll();
          },
        },
      },
    );

    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const bodyOrgId = searchParams.get('orgId');
    if (!bodyOrgId) {
      return NextResponse.json({ error: 'orgId query param required' }, { status: 400 });
    }

    // Derive orgId from session — never trust client-supplied orgId
    const { data: roleData } = await supabase
      .from('user_roles')
      .select('org_id, role')
      .eq('user_id', user.id)
      .single();

    if (!roleData || roleData.org_id !== bodyOrgId || roleData.role !== 'Owner') {
      return NextResponse.json({ error: 'Only Owner can view raw feature config' }, { status: 403 });
    }

    const features = await getOrgFeaturesRaw(roleData.org_id);
    return NextResponse.json({ features });
  } catch (err) {
    logError(err, { action: 'features_raw_GET_failed' });
    return NextResponse.json({ error: 'Failed to fetch raw features' }, { status: 500 });
  }
}
