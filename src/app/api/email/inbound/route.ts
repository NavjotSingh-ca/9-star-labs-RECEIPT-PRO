import { NextResponse } from 'next/server';
import { supabaseAdmin as supabaseServiceRole } from '@/lib/supabase-admin';
import { env } from '@/lib/env';
import { logError, logInfo } from '@/lib/logger';
import { sanitizeFilename } from '@/lib/sanitization';
import crypto from 'crypto';

// Resend webhook signature verification
function verifySignature(payload: string, signature: string, secret: string) {
  try {
    const parts = signature.split(',');
    const timestamp = parts.find(p => p.startsWith('t='))?.split('=')[1];
    const signatureHash = parts.find(p => p.startsWith('v1='))?.split('=')[1];
    if (!timestamp || !signatureHash) return false;

    const signedPayload = `${timestamp}.${payload}`;
    const hmac = crypto.createHmac('sha256', secret);
    const expectedSignature = hmac.update(signedPayload).digest('hex');

    return crypto.timingSafeEqual(Buffer.from(signatureHash), Buffer.from(expectedSignature));
  } catch {
    return false;
  }
}

export async function POST(request: Request) {
  try {
    const rawBody = await request.text();
    // M3: Resend uses 'resend-signature' header, not 'svix-signature'
    const signature = request.headers.get('resend-signature') || request.headers.get('svix-signature');
    const secret = env.RESEND_WEBHOOK_SECRET;

    if (!signature || !secret || !verifySignature(rawBody, signature, secret)) {
      logError(new Error('Invalid webhook signature'), { action: 'email_inbound' });
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const payload = JSON.parse(rawBody);
    
    // We only care about email.received events
    if (payload.type !== 'email.received') {
      return NextResponse.json({ success: true }); // Acknowledge other events
    }

    const email = payload.data;
    const toAddress = email.to[0]?.toLowerCase();
    
    // Extract org slug from email: e.g., receipts+myorg@inbound.9starlabs.ca
    const match = toAddress?.match(/^receipts\+([^@]+)@/);
    if (!match || !match[1]) {
      return NextResponse.json({ error: 'Invalid destination address' }, { status: 400 });
    }
    
    const orgSlug = match[1];

    // Find organization by slug
    const { data: org, error: orgError } = await supabaseServiceRole
      .from('organizations')
      .select('id')
      .eq('org_slug', orgSlug)
      .single();

    if (orgError || !org) {
      logError(new Error(`Org slug not found: ${orgSlug}`), { action: 'email_inbound' });
      return NextResponse.json({ error: 'Organization not found' }, { status: 404 });
    }

    // Resolve sender email to user_id for referential integrity
    const fromStr = email.from || email.fromEmail || '';
    const senderMatch = fromStr.match(/<?([a-zA-Z0-9._%+\-]+@[a-zA-Z0-9.\-]+\.[a-zA-Z]{2,})>?/);
    const senderEmail = senderMatch ? senderMatch[1].toLowerCase() : '';
    let userId: string | null = null;
    if (senderEmail) {
      const { data: authUser } = await supabaseServiceRole
        .schema('auth')
        .from('users')
        .select('id')
        .eq('email', senderEmail)
        .maybeSingle();
      if (authUser) userId = authUser.id;
    }

    // Process attachments
    const attachments = email.attachments || [];
    const validAttachments = attachments.filter((a: any) => 
      a.content_type?.startsWith('image/') || a.content_type === 'application/pdf'
    );

    if (validAttachments.length === 0) {
      logInfo('No valid attachments found in inbound email', { orgSlug, subject: email.subject });
      return NextResponse.json({ success: true, message: 'No valid attachments' });
    }

    // Store attachments in storage and queue them for processing
    for (const file of validAttachments) {
      const buffer = Buffer.from(file.content, 'base64');
      const filename = `${org.id}/${Date.now()}-${sanitizeFilename(file.filename)}`;
      
      const { error: uploadError } = await supabaseServiceRole.storage
        .from('receipt-images')
        .upload(filename, buffer, {
          contentType: file.content_type,
          upsert: false
        });
        
      if (uploadError) {
        logError(uploadError, { action: 'email_attachment_upload', filename });
        continue;
      }

      // Create a pending receipt record
      await supabaseServiceRole.from('receipts').insert({
        org_id: org.id,
        user_id: userId,
        image_url: filename,
        vendor_name: email.subject || 'Email Receipt',
        approval_status: 'submitted',
        notes: `Received via email from ${email.from}`,
      });
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    logError(err, { action: 'email_inbound_webhook_fail' });
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 422 });
  }
}
