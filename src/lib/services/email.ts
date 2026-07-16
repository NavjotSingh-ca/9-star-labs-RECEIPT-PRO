import { Resend } from 'resend';
import { env } from '@/lib/env';
import { escapeHtml } from '@/lib/html-escape';
import { logError, logWarn } from '@/lib/logger';

const resend = env.RESEND_API_KEY ? new Resend(env.RESEND_API_KEY) : null;
const FROM_EMAIL = env.RESEND_FROM_EMAIL;

const MAX_RECIPIENT_LENGTH = 320;
const EMAIL_LOCAL_PART_MAX = 64;

export interface SendEmailResult {
  id: string | null;
  error: Error | null;
}

export interface SendEmailParams {
  to: string;
  subject: string;
  html: string;
  text?: string;
}

export interface ApprovalReceiptDetails {
  vendor: string;
  amount: string;
  date: string;
  employee: string;
}

export interface ReimbursementReceiptDetails {
  vendor: string;
  amount: string;
  date: string;
  method: string;
  reference: string;
}

export interface MonthlySummaryDetails {
  month: string;
  total: string;
  receiptCount: number;
  topCategory: string;
  topAmount: string;
}

/**
 * Basic email format validation — checks structure, not deliverability.
 * Accepts standard RFC 5322-ish emails like "user@domain.tld".
 */
function isValidEmail(email: string): boolean {
  if (!email || email.length > MAX_RECIPIENT_LENGTH) return false;
  const atIdx = email.lastIndexOf('@');
  if (atIdx < 1 || atIdx >= email.length - 4) return false;
  const local = email.slice(0, atIdx);
  const domain = email.slice(atIdx + 1);
  if (local.length > EMAIL_LOCAL_PART_MAX) return false;
  if (!domain.includes('.')) return false;
  return true;
}

/**
 * Strips HTML tags for plain-text fallback.
 */
function htmlToPlainText(html: string): string {
  return html.replace(/<[^>]*>/g, '');
}

/**
 * Send an email via Resend.
 * Gracefully degrades if Resend API key or FROM_EMAIL is not configured.
 *
 * @param params - Email parameters (to, subject, html, optional text).
 * @param params.to - Recipient email address.
 * @param params.subject - Email subject line.
 * @param params.html - HTML body content.
 * @param params.text - Optional plain text fallback. Auto-generated from HTML if omitted.
 * @returns Object with `id` (message ID or 'skipped') and `error` (null on success).
 */
export async function sendEmail(params: SendEmailParams): Promise<SendEmailResult> {
  if (!params.to || !isValidEmail(params.to)) {
    logWarn('[Email] Invalid or missing recipient email. Skipping: ' + params.subject);
    return { id: 'skipped', error: null };
  }

  if (!resend || !FROM_EMAIL) {
    if (!FROM_EMAIL) logWarn('[Email] RESEND_FROM_EMAIL not configured. Skipping: ' + params.subject);
    return { id: 'skipped', error: null };
  }

  try {
    const { data, error } = await resend.emails.send({
      from: FROM_EMAIL,
      to: params.to,
      subject: params.subject,
      html: params.html,
      text: params.text || htmlToPlainText(params.html),
    });

    if (error) {
      logError(error, { action: 'send_email_resend' });
      return { id: null, error };
    }

    return { id: data?.id || 'sent', error: null };
  } catch (err: unknown) {
    logError(err, { action: 'send_email_unexpected' });
    return { id: null, error: err instanceof Error ? err : new Error(String(err)) };
  }
}

/**
 * Send an approval request email to an approver for a pending receipt.
 *
 * @param to - Approver's email address.
 * @param receiptDetails - Receipt details for the email body.
 * @returns Result of the email send operation.
 */
export async function sendApprovalRequestEmail(to: string, receiptDetails: ApprovalReceiptDetails) {
  return sendEmail({
    to,
    subject: `Approval Request: ${escapeHtml(receiptDetails.vendor)} — ${escapeHtml(receiptDetails.amount)}`,
    html: `<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><title>Approval Request</title></head>
<body style="font-family: system-ui, sans-serif; background: #f8f9fa; padding: 24px;">
  <div style="max-width: 480px; margin: 0 auto; background: #fff; border-radius: 16px; padding: 32px; box-shadow: 0 1px 3px rgba(0,0,0,0.1);">
    <h2 style="margin-top: 0;">New Receipt Awaiting Approval</h2>
    <table style="width: 100%; margin: 16px 0; border-collapse: collapse;">
      <tr><td style="padding: 8px 0; color: #666;">Vendor</td><td style="padding: 8px 0; font-weight: 600;">${escapeHtml(receiptDetails.vendor)}</td></tr>
      <tr><td style="padding: 8px 0; color: #666;">Amount</td><td style="padding: 8px 0; font-weight: 600;">${escapeHtml(receiptDetails.amount)}</td></tr>
      <tr><td style="padding: 8px 0; color: #666;">Date</td><td style="padding: 8px 0; font-weight: 600;">${escapeHtml(receiptDetails.date)}</td></tr>
      <tr><td style="padding: 8px 0; color: #666;">Employee</td><td style="padding: 8px 0; font-weight: 600;">${escapeHtml(receiptDetails.employee)}</td></tr>
    </table>
    <p style="color: #666; font-size: 14px;">Log in to Receipt Pro to review and approve this expense.</p>
    <div style="margin-top: 24px;">
      <a href="${escapeHtml(env.NEXT_PUBLIC_SITE_URL)}" style="display: inline-block; background: #0f766e; color: #fff; padding: 12px 24px; border-radius: 9999px; text-decoration: none; font-weight: 600;">Review in App</a>
    </div>
  </div>
</body>
</html>`,
  });
}

/**
 * Send a reimbursement confirmation email to the employee.
 *
 * @param to - Employee's email address.
 * @param receiptDetails - Receipt and reimbursement details.
 * @returns Result of the email send operation.
 */
export async function sendReimbursementConfirmation(to: string, receiptDetails: ReimbursementReceiptDetails) {
  return sendEmail({
    to,
    subject: `Reimbursed: ${escapeHtml(receiptDetails.vendor)} — ${escapeHtml(receiptDetails.amount)}`,
    html: `<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><title>Reimbursement Confirmed</title></head>
<body style="font-family: system-ui, sans-serif; background: #f8f9fa; padding: 24px;">
  <div style="max-width: 480px; margin: 0 auto; background: #fff; border-radius: 16px; padding: 32px; box-shadow: 0 1px 3px rgba(0,0,0,0.1);">
    <h2 style="margin-top: 0;">Reimbursement Processed</h2>
    <p>Your expense has been reimbursed.</p>
    <table style="width: 100%; margin: 16px 0; border-collapse: collapse;">
      <tr><td style="padding: 8px 0; color: #666;">Vendor</td><td style="padding: 8px 0; font-weight: 600;">${escapeHtml(receiptDetails.vendor)}</td></tr>
      <tr><td style="padding: 8px 0; color: #666;">Amount</td><td style="padding: 8px 0; font-weight: 600;">${escapeHtml(receiptDetails.amount)}</td></tr>
      <tr><td style="padding: 8px 0; color: #666;">Date</td><td style="padding: 8px 0; font-weight: 600;">${escapeHtml(receiptDetails.date)}</td></tr>
      <tr><td style="padding: 8px 0; color: #666;">Method</td><td style="padding: 8px 0; font-weight: 600;">${escapeHtml(receiptDetails.method)}</td></tr>
      <tr><td style="padding: 8px 0; color: #666;">Reference</td><td style="padding: 8px 0; font-weight: 600;">${escapeHtml(receiptDetails.reference)}</td></tr>
    </table>
  </div>
</body>
</html>`,
  });
}

/**
 * Send a monthly spending summary email.
 *
 * @param to - Recipient email address.
 * @param summary - Monthly summary data for the email body.
 * @returns Result of the email send operation.
 */
export async function sendMonthlySummary(to: string, summary: MonthlySummaryDetails) {
  return sendEmail({
    to,
    subject: `Monthly Summary — ${escapeHtml(summary.month)}`,
    html: `<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><title>Monthly Summary</title></head>
<body style="font-family: system-ui, sans-serif; background: #f8f9fa; padding: 24px;">
  <div style="max-width: 480px; margin: 0 auto; background: #fff; border-radius: 16px; padding: 32px; box-shadow: 0 1px 3px rgba(0,0,0,0.1);">
    <h2 style="margin-top: 0;">${escapeHtml(summary.month)} Spending Summary</h2>
    <p style="font-size: 32px; font-weight: 700; margin: 8px 0; color: #0f766e;">${escapeHtml(summary.total)}</p>
    <p style="color: #666;">${summary.receiptCount} receipts scanned</p>
    <hr style="border: none; border-top: 1px solid #eee; margin: 24px 0;">
    <p style="color: #666; font-size: 14px;">Top category: <strong>${escapeHtml(summary.topCategory)}</strong> (${escapeHtml(summary.topAmount)})</p>
    <div style="margin-top: 24px;">
      <a href="${escapeHtml(env.NEXT_PUBLIC_SITE_URL)}" style="display: inline-block; background: #0f766e; color: #fff; padding: 12px 24px; border-radius: 9999px; text-decoration: none; font-weight: 600;">View Full Report</a>
    </div>
  </div>
</body>
</html>`,
  });
}
