import { NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { z } from 'zod';
import { logError } from '@/lib/logger';
import { env } from '@/lib/env';
import { Resend } from 'resend';

const supabaseUrl = env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

const resend = env.RESEND_API_KEY ? new Resend(env.RESEND_API_KEY) : null;

const commentInputSchema = z.object({
  receiptId: z.string().uuid(),
  comment: z.string().min(1).max(5000),
});

export async function POST(request: Request) {
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
    const orgId = orgData as unknown as string;
    if (!orgId) return NextResponse.json({ error: 'No org found' }, { status: 403 });

    // Insert comment
    const { data, error } = await supabase
      .from('receipt_comments')
      .insert({
        receipt_id: receiptId,
        org_id: orgId,
        user_id: user.id,
        comment: comment
      })
      .select()
      .single();

    if (error) throw error;

    // Fetch the receipt to notify the uploader
    const { data: receipt } = await supabase
      .from('receipts')
      .select('user_id, vendor_name, total_amount, currency')
      .eq('id', receiptId)
      .single();

    if (receipt?.user_id && receipt.user_id !== user.id) {
      const { data: uploader } = await supabase.rpc('get_user_email', { p_user_id: receipt.user_id });
      const uploaderEmail = (uploader as any)?.[0]?.email;
      
      if (uploaderEmail && resend) {
        await resend.emails.send({
          from: 'Leduc Receipt Pro <noreply@9starlabs.ca>',
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

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const receiptId = searchParams.get('receiptId');
    if (!receiptId) return NextResponse.json({ error: 'Missing receiptId' }, { status: 400 });

    const cookieStore = await cookies();
    const supabase = createServerClient(supabaseUrl, supabaseAnonKey, {
      cookies: { getAll: () => cookieStore.getAll(), setAll: () => {} },
    });
    
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

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
