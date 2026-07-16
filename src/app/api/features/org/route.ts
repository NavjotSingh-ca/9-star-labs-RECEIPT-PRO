/**
 * GET /api/features/org — Get the current user's organization ID.
 */
import { NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { env } from '@/lib/env';
import { logError } from '@/lib/logger';

export async function GET() {
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

    const { data: orgId } = await supabase.rpc('get_user_org');
    if (!orgId || typeof orgId !== 'string') {
      return NextResponse.json({ error: 'No organization found' }, { status: 404 });
    }

    return NextResponse.json({ orgId });
  } catch (err) {
    logError(err, { action: 'features_org_GET_failed' });
    return NextResponse.json({ error: 'Failed to get organization' }, { status: 500 });
  }
}
