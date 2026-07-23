/**
 * Shared auth helpers for API routes.
 *
 * Consolidates the most common authentication patterns used across
 * 24 API route files into reusable functions.
 *
 * ## Bearer Token Pattern (4 routes)
 * ```ts
 * const auth = await requireAuth(request);
 * if (!auth) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
 * // auth.user, auth.token available
 * ```
 *
 * ## Cookie Session Pattern (4 report routes)
 * ```ts
 * const orgId = await requireOrg();
 * if (!orgId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
 * ```
 */

import { NextResponse } from 'next/server';
import type { User } from '@supabase/supabase-js';
import { supabaseAdmin } from '@/lib/supabase-admin';
import { getOrgIdString } from '@/lib/supabase';

/**
 * Result of a successful Bearer token authentication.
 */
export interface AuthSession {
  /** The authenticated Supabase user. */
  user: User;
  /** The raw Bearer JWT token (for downstream RPC calls). */
  token: string;
}

/**
 * Extracts and verifies a Bearer token from the Authorization header
 * using the Supabase admin client.
 *
 * @param request - The incoming HTTP request.
 * @returns AuthSession on success, or null (caller returns 401).
 */
export async function requireAuth(request: Request): Promise<AuthSession | null> {
  const authHeader = request.headers.get('authorization') || '';
  if (!authHeader.startsWith('Bearer ')) {
    return null;
  }
  const token = authHeader.slice(7);
  if (!token) {
    return null;
  }

  const { data: { user }, error: authError } = await supabaseAdmin.auth.getUser(token);
  if (authError || !user) {
    return null;
  }

  return { user, token };
}

/**
 * Resolves the current user's organization ID from the session cookie.
 * Returns null if the user is not authenticated or has no org.
 *
 * @returns The org UUID string, or null.
 */
export async function requireOrg(): Promise<string | null> {
  const orgId = await getOrgIdString();
  if (!orgId) return null;
  return orgId;
}

/**
 * Convenience: requires both auth AND org in a single call.
 *
 * @returns `{ user, token, orgId }` on success, or null.
 */
export async function requireAuthAndOrg(
  request: Request
): Promise<{ user: User; token: string; orgId: string } | null> {
  const auth = await requireAuth(request);
  if (!auth) return null;

  // Use the admin client to get org membership for this user
  const { data: membership } = await supabaseAdmin
    .from('user_roles')
    .select('org_id')
    .eq('user_id', auth.user.id)
    .single();

  if (!membership?.org_id) return null;

  return { user: auth.user, token: auth.token, orgId: membership.org_id as string };
}
