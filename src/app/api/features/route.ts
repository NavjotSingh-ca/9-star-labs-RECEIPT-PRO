/**
 * Features API — GET (fetch all, role-filtered), PATCH (toggle one), PUT (bulk set).
 * GET returns features filtered by the requesting user's role.
 * Owner always gets all features enabled.
 */
import { NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { env } from '@/lib/env';
import { getOrgFeatures, setOrgFeature, setOrgFeaturesBulk } from '@/lib/services/features';
import { logError } from '@/lib/logger';
import type { FeatureKey } from '@/lib/features/registry';
import type { UserRole } from '@/lib/types';

/**
 * GET /api/features — Fetch features for the current user's org, filtered by role.
 * Owner always gets all features. Other roles are scoped by allowed_roles.
 */
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

    // Get user's org and role from user_roles table
    const { data: roleData } = await supabase
      .from('user_roles')
      .select('org_id, role')
      .eq('user_id', user.id)
      .single();

    if (!roleData || !roleData.org_id) {
      return NextResponse.json({ error: 'No organization found' }, { status: 404 });
    }

    const orgId = roleData.org_id;
    const role = roleData.role as UserRole;

    // Pass role to getOrgFeatures so it filters by allowed_roles
    // Owner bypasses the role filter
    const features = await getOrgFeatures(orgId, role);
    return NextResponse.json({ features, role });
  } catch (err) {
    logError(err, { action: 'features_GET_failed' });
    return NextResponse.json({ error: 'Failed to fetch features' }, { status: 500 });
  }
}

/**
 * PATCH /api/features — Toggle a single feature on/off.
 * Body: { orgId: string, featureKey: FeatureKey, enabled: boolean }
 */
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
    const { orgId: bodyOrgId, featureKey, enabled } = body as {
      orgId: string;
      featureKey: FeatureKey;
      enabled: boolean;
    };

    if (!bodyOrgId || !featureKey || typeof enabled !== 'boolean') {
      return NextResponse.json({ error: 'Invalid request body' }, { status: 400 });
    }

    // Derive orgId from session — never trust client-supplied orgId
    const { data: roleData } = await supabase
      .from('user_roles')
      .select('org_id, role')
      .eq('user_id', user.id)
      .single();

    if (!roleData || roleData.org_id !== bodyOrgId || roleData.role !== 'Owner') {
      return NextResponse.json({ error: 'Only the Owner can change features' }, { status: 403 });
    }
    const orgId = roleData.org_id;

    const result = await setOrgFeature(orgId, featureKey, enabled);
    if (!result.success) {
      return NextResponse.json({ error: result.error ?? 'Failed to update feature' }, { status: 500 });
    }

    return NextResponse.json({ features: result.features });
  } catch (err) {
    logError(err, { action: 'features_PATCH_failed' });
    return NextResponse.json({ error: 'Failed to update feature' }, { status: 500 });
  }
}

/**
 * PUT /api/features — Bulk-set features (used during onboarding).
 * Body: { orgId: string, features: Partial<FeaturesMap> }
 */
export async function PUT(request: Request) {
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
    const { orgId: bodyOrgId, features: updates } = body as {
      orgId: string;
      features: Record<string, boolean>;
    };

    if (!bodyOrgId || !updates || typeof updates !== 'object') {
      return NextResponse.json({ error: 'Invalid request body' }, { status: 400 });
    }

    // Derive orgId from session — never trust client-supplied orgId
    const { data: roleData } = await supabase
      .from('user_roles')
      .select('org_id, role')
      .eq('user_id', user.id)
      .single();

    if (!roleData || roleData.org_id !== bodyOrgId || roleData.role !== 'Owner') {
      return NextResponse.json({ error: 'Only the Owner can change features' }, { status: 403 });
    }
    const orgId = roleData.org_id;

    const result = await setOrgFeaturesBulk(orgId, updates);
    if (!result.success) {
      return NextResponse.json({ error: result.error ?? 'Failed to update features' }, { status: 500 });
    }

    return NextResponse.json({ features: result.features });
  } catch (err) {
    logError(err, { action: 'features_PUT_failed' });
    return NextResponse.json({ error: 'Failed to update features' }, { status: 500 });
  }
}
