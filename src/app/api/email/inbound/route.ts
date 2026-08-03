import { NextResponse } from 'next/server';
import { supabaseAdmin as supabaseServiceRole } from '@/lib/supabase-admin';
import { env } from '@/lib/env';
import { logError, logInfo } from '@/lib/logger';
import { sanitizeFilename } from '@/lib/sanitization';
import { withRateLimit } from '@/lib/rate-limiter';
import crypto from 'crypto';
import { z } from 'zod';

const MAX_ATTACHMENT_BYTES = 20 * 1024 * 1024;
const MAX_TOTAL_BYTES = 50 * 1024 * 1024;
const attachmentSchema = z.object({
  content_type: z.string(),
  content: z.string(),
  filename: z.string(),
});

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

    // crypto.timingSafeEqual throws RangeError on length mismatch, which would
    // bypass the constant-time comparison for any malformed signature. Compare
    // lengths first so the timing-safe path runs only on equal-length inputs.
    const received = Buffer.from(signatureHash);
    const expected = Buffer.from(expectedSignature);
    if (received.length !== expected.length) return false;
    return crypto.timingSafeEqual(received, expected);
  } catch {
    return false;
  }
}

/**
 * POST /api/email/inbound
 *
 * Receives inbound emails via Resend webhook. Supports the receipts+{slug}@
 * addressing scheme for auto-importing receipts via email.
 *
 * Validates Resend webhook signature, extracts org slug from recipient address,
 * processes image/PDF attachments, uploads to storage, and creates pending receipts.
 *
 * Rate limited: 10 requests per 60s.
 */
async function handler(request: Request) {
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
    
    // Extract org slug from email: e.g., receipts+myorg@inbound.yourdomain.com
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

    // Process attachments with size and type validation
    const attachments = email.attachments || [];
    const validAttachments: z.infer<typeof attachmentSchema>[] = [];
    let totalBytes = 0;
    for (const a of attachments) {
      const parsed = attachmentSchema.safeParse(a);
      if (!parsed.success) continue;
      const { content_type, content, filename } = parsed.data;
      if (!content_type?.startsWith('image/') && content_type !== 'application/pdf') continue;
      const buffer = Buffer.from(content, 'base64');
      if (buffer.byteLength > MAX_ATTACHMENT_BYTES) {
        logInfo('Attachment exceeds size limit', { filename, bytes: buffer.byteLength });
        continue;
      }
      totalBytes += buffer.byteLength;
      if (totalBytes > MAX_TOTAL_BYTES) {
        logInfo('Total attachment payload exceeds limit', { totalBytes });
        break;
      }
      validAttachments.push({ content_type, content, filename });
    }

    if (validAttachments.length === 0) {
      logInfo('No valid attachments found in inbound email', { orgSlug, subject: email.subject });
      return NextResponse.json({ success: true, message: 'No valid attachments' });
    }

    // Store attachments in storage and register pending receipts. Uploads +
    // inserts are I/O-bound, so process them with a small concurrency cap
    // instead of one-at-a-time (bounded so a burst of attachments can't
    // hammer the storage API either).
    const UPLOAD_CONCURRENCY = 3;
    let nextIndex = 0;
    const processAttachment = async () => {
      while (nextIndex < validAttachments.length) {
        const file = validAttachments[nextIndex++];
        if (!file) break;
        const buffer = Buffer.from(file.content, 'base64');
        // Include the attachment ordinal so concurrent identical filenames
        // can't collide on the same storage path.
        const filename = `${org.id}/${Date.now()}-${nextIndex}-${sanitizeFilename(file.filename)}`;

        const { error: uploadError } = await supabaseServiceRole.storage
          .from('receipt-images')
          .upload(filename, buffer, {
            contentType: file.content_type,
            upsert: false,
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
    };

    await Promise.all(
      Array.from(
        { length: Math.min(UPLOAD_CONCURRENCY, validAttachments.length) },
        () => processAttachment(),
      ),
    );

    return NextResponse.json({ success: true });
  } catch (err) {
    logError(err, { action: 'email_inbound_webhook_fail' });
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 422 });
  }
}

export const POST = withRateLimit(handler, { maxTokens: 10, windowMs: 60_000, keyPrefix: 'email:inbound' });
