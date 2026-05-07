import { Resend } from 'resend';
import { env } from '@/lib/env';

const resend = env.RESEND_API_KEY ? new Resend(env.RESEND_API_KEY) : null;

const FROM_EMAIL = 'Receipt Pro <receipts@9starlabs.ca>'; // Update after domain verification in Resend

interface SendEmailParams {
  to: string;
  subject: string;
  html: string;
  text?: string;
}

export async function sendEmail(params: SendEmailParams) {
  if (!resend) {
    console.warn('[Email] Resend not configured. Skipping email:', params.subject);
    return { id: 'skipped', error: null };
  }

  try {
    const { data, error } = await resend.emails.send({
      from: FROM_EMAIL,
      to: params.to,
      subject: params.subject,
      html: params.html,
      text: params.text || params.html.replace(/<[^>]*>/g, ''),
    });

    if (error) {
      console.error('[Email] Resend error:', error);
      return { id: null, error };
    }

    return { id: data?.id || 'sent', error: null };
  } catch (err: unknown) {
    console.error('[Email] Unexpected error:', err);
    return { id: null, error: err instanceof Error ? err : new Error(String(err)) };
  }
}

export async function sendApprovalRequestEmail(to: string, receiptDetails: { vendor: string; amount: string; date: string; employee: string }) {
  return sendEmail({
    to,
    subject: `Approval Request: ${receiptDetails.vendor} — ${receiptDetails.amount}`,
    html: `<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><title>Approval Request</title></head>
<body style="font-family: system-ui, sans-serif; background: #f8f9fa; padding: 24px;">
  <div style="max-width: 480px; margin: 0 auto; background: #fff; border-radius: 16px; padding: 32px; box-shadow: 0 1px 3px rgba(0,0,0,0.1);">
    <h2 style="margin-top: 0;">New Receipt Awaiting Approval</h2>
    <table style="width: 100%; margin: 16px 0; border-collapse: collapse;">
      <tr><td style="padding: 8px 0; color: #666;">Vendor</td><td style="padding: 8px 0; font-weight: 600;">${receiptDetails.vendor}</td></tr>
      <tr><td style="padding: 8px 0; color: #666;">Amount</td><td style="padding: 8px 0; font-weight: 600;">${receiptDetails.amount}</td></tr>
      <tr><td style="padding: 8px 0; color: #666;">Date</td><td style="padding: 8px 0; font-weight: 600;">${receiptDetails.date}</td></tr>
      <tr><td style="padding: 8px 0; color: #666;">Employee</td><td style="padding: 8px 0; font-weight: 600;">${receiptDetails.employee}</td></tr>
    </table>
    <p style="color: #666; font-size: 14px;">Log in to Receipt Pro to review and approve this expense.</p>
    <div style="margin-top: 24px;">
      <a href="${env.NEXT_PUBLIC_SITE_URL}" style="display: inline-block; background: #0f766e; color: #fff; padding: 12px 24px; border-radius: 9999px; text-decoration: none; font-weight: 600;">Review in App</a>
    </div>
  </div>
</body>
</html>`,
  });
}

export async function sendReimbursementConfirmation(to: string, receiptDetails: { vendor: string; amount: string; date: string; method: string; reference: string }) {
  return sendEmail({
    to,
    subject: `Reimbursed: ${receiptDetails.vendor} — ${receiptDetails.amount}`,
    html: `<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><title>Reimbursement Confirmed</title></head>
<body style="font-family: system-ui, sans-serif; background: #f8f9fa; padding: 24px;">
  <div style="max-width: 480px; margin: 0 auto; background: #fff; border-radius: 16px; padding: 32px; box-shadow: 0 1px 3px rgba(0,0,0,0.1);">
    <h2 style="margin-top: 0;">Reimbursement Processed</h2>
    <p>Your expense has been reimbursed.</p>
    <table style="width: 100%; margin: 16px 0; border-collapse: collapse;">
      <tr><td style="padding: 8px 0; color: #666;">Vendor</td><td style="padding: 8px 0; font-weight: 600;">${receiptDetails.vendor}</td></tr>
      <tr><td style="padding: 8px 0; color: #666;">Amount</td><td style="padding: 8px 0; font-weight: 600;">${receiptDetails.amount}</td></tr>
      <tr><td style="padding: 8px 0; color: #666;">Date</td><td style="padding: 8px 0; font-weight: 600;">${receiptDetails.date}</td></tr>
      <tr><td style="padding: 8px 0; color: #666;">Method</td><td style="padding: 8px 0; font-weight: 600;">${receiptDetails.method}</td></tr>
      <tr><td style="padding: 8px 0; color: #666;">Reference</td><td style="padding: 8px 0; font-weight: 600;">${receiptDetails.reference}</td></tr>
    </table>
  </div>
</body>
</html>`,
  });
}

export async function sendMonthlySummary(to: string, summary: { month: string; total: string; receiptCount: number; topCategory: string; topAmount: string }) {
  return sendEmail({
    to,
    subject: `Monthly Summary — ${summary.month}`,
    html: `<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><title>Monthly Summary</title></head>
<body style="font-family: system-ui, sans-serif; background: #f8f9fa; padding: 24px;">
  <div style="max-width: 480px; margin: 0 auto; background: #fff; border-radius: 16px; padding: 32px; box-shadow: 0 1px 3px rgba(0,0,0,0.1);">
    <h2 style="margin-top: 0;">${summary.month} Spending Summary</h2>
    <p style="font-size: 32px; font-weight: 700; margin: 8px 0; color: #0f766e;">${summary.total}</p>
    <p style="color: #666;">${summary.receiptCount} receipts scanned</p>
    <hr style="border: none; border-top: 1px solid #eee; margin: 24px 0;">
    <p style="color: #666; font-size: 14px;">Top category: <strong>${summary.topCategory}</strong> (${summary.topAmount})</p>
    <div style="margin-top: 24px;">
      <a href="${env.NEXT_PUBLIC_SITE_URL}" style="display: inline-block; background: #0f766e; color: #fff; padding: 12px 24px; border-radius: 9999px; text-decoration: none; font-weight: 600;">View Full Report</a>
    </div>
  </div>
</body>
</html>`,
  });
}
