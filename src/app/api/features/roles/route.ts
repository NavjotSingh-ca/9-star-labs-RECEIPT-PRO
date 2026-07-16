/**
 * PATCH /api/features/roles — Update allowed_roles for a feature.
 * Owner-only operation. Controls which roles can see/use a feature.
 */
import { NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { env } from '@/lib/env';
import { setFeatureRoles } from '@/lib/services/features';
import { logError } from '@/lib/logger';
import type { FeatureKey } from '@/lib/features/registry';
import type { UserRole } from '@/lib/types';

export async function PATCH(request: Request) {
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

    const body = await request.json();
    const { orgId: bodyOrgId, featureKey, allowedRoles } = body as {
      orgId: string;
      featureKey: FeatureKey;
      allowedRoles: UserRole[];
    };

    if (!bodyOrgId || !featureKey || !Array.isArray(allowedRoles)) {
      return NextResponse.json({ error: 'Invalid request body. Required: orgId, featureKey, allowedRoles[]' }, { status: 400 });
    }

    // Derive orgId from session — never trust client-supplied orgId
    const { data: roleData } = await supabase
      .from('user_roles')
      .select('org_id, role')
      .eq('user_id', user.id)
      .single();

    if (!roleData || roleData.org_id !== bodyOrgId || roleData.role !== 'Owner') {
      return NextResponse.json({ error: 'Only the Owner can manage role permissions' }, { status: 403 });
    }

    const result = await setFeatureRoles(roleData.org_id, featureKey, allowedRoles);
    if (!result.success) {
      return NextResponse.json({ error: result.error ?? 'Failed to update feature roles' }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    logError(err, { action: 'features_roles_PATCH_failed' });
    return NextResponse.json({ error: 'Failed to update feature roles' }, { status: 500 });
  }
}
