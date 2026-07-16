import { NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { z } from 'zod';
import { logError } from '@/lib/logger';
import { env } from '@/lib/env';
import { withRateLimit } from '@/lib/rate-limiter';
import { Resend } from 'resend';

const supabaseUrl = env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

const resend = env.RESEND_API_KEY ? new Resend(env.RESEND_API_KEY) : null;

const commentInputSchema = z.object({
  receiptId: z.string().uuid(),
  comment: z.string().min(1).max(5000),
});

const receiptIdParamSchema = z.object({
  receiptId: z.string().uuid(),
});

/**
 * POST /api/receipts/comments
 *
 * Adds a comment to a receipt. The comment is org-scoped via the session.
 * If the commenter is not the receipt uploader, sends an email notification via Resend.
 *
 * Body: { receiptId: string (uuid), comment: string (1-5000 chars) }
 * Rate limited: 20 requests per 60s.
 */
async function postHandler(request: Request) {
  try {
    const body = await request.json();
    const parsed = commentInputSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.issues[0].message }, { status: 400 });
    }
    const { receiptId, comment } = parsed.data;

    const cookieStore = await cookies();
    const supabase = createServerClient(supabaseUrl, supabaseAnonKey, {
      cookies: { getAll: () => cookieStore.getAll(), setAll: () => {} },
    });
    
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { data: orgData } = await supabase.rpc('get_user_org');
    const orgId = typeof orgData === 'string' ? orgData : null;
    if (!orgId) return NextResponse.json({ error: 'No org found' }, { status: 403 });

    const { data, error } = await supabase
      .from('receipt_comments')
      .insert({
        receipt_id: receiptId,
        org_id: orgId,
        user_id: user.id,
        comment: comment,
      })
      .select()
      .single();

    if (error) throw error;

    const { data: receipt } = await supabase
      .from('receipts')
      .select('user_id, vendor_name, total_amount, currency')
      .eq('id', receiptId)
      .single();

    if (receipt?.user_id && receipt.user_id !== user.id) {
      const { data: uploader } = await supabase.rpc('get_user_email', { p_user_id: receipt.user_id });
      const uploaderEmail = Array.isArray(uploader) ? (uploader as { email: string }[])[0]?.email : null;

      if (uploaderEmail && resend) {
        const from = env.RESEND_FROM_EMAIL;
        if (!from) throw new Error('RESEND_FROM_EMAIL not configured');
        await resend.emails.send({
          from,
          to: uploaderEmail,
          subject: `Clarification needed: ${receipt.vendor_name} receipt`,
          text: `Your accountant has requested clarification on a receipt.\n\nVendor: ${receipt.vendor_name}\nAmount: ${receipt.total_amount} ${receipt.currency}\n\nComment:\n"${comment}"\n\nPlease log in to Leduc Receipt Pro to provide details.`,
        });
      }
    }

    return NextResponse.json({ success: true, data });
  } catch (err) {
    logError(err, { action: 'post_receipt_comment' });
    return NextResponse.json({ error: 'Failed to post comment' }, { status: 500 });
  }
}

/**
 * GET /api/receipts/comments?receiptId=<uuid>
 *
 * Retrieves all comments for a given receipt, ordered by creation date ascending.
 * Enforces org-scoped access — only users in the same org as the receipt can view.
 *
 * Query params: receiptId (uuid, required)
 * Rate limited: 30 requests per 60s.
 */
async function getHandler(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const rawId = searchParams.get('receiptId');
    const parsed = receiptIdParamSchema.safeParse({ receiptId: rawId });
    if (!parsed.success) return NextResponse.json({ error: 'Invalid receiptId' }, { status: 400 });
    const { receiptId } = parsed.data;

    const cookieStore = await cookies();
    const supabase = createServerClient(supabaseUrl, supabaseAnonKey, {
      cookies: { getAll: () => cookieStore.getAll(), setAll: () => {} },
    });
    
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { data: orgData } = await supabase.rpc('get_user_org');
    const orgId = typeof orgData === 'string' ? orgData : null;
    if (!orgId) return NextResponse.json({ error: 'No org found' }, { status: 403 });

    const { data: receipt } = await supabase
      .from('receipts')
      .select('org_id')
      .eq('id', receiptId)
      .single();
    if (!receipt) return NextResponse.json({ error: 'Receipt not found' }, { status: 404 });
    if (receipt.org_id !== orgId) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

    const { data, error } = await supabase
      .from('receipt_comments')
      .select('*, user:user_id(email)')
      .eq('receipt_id', receiptId)
      .order('created_at', { ascending: true });

    if (error) throw error;
    
    return NextResponse.json({ data });
  } catch (err) {
    logError(err, { action: 'get_receipt_comments' });
    return NextResponse.json({ error: 'Failed to get comments' }, { status: 500 });
  }
}

export const GET = withRateLimit(getHandler, { maxTokens: 30, windowMs: 60_000, keyPrefix: 'comments:get' });
export const POST = withRateLimit(postHandler, { maxTokens: 20, windowMs: 60_000, keyPrefix: 'comments:post' });
