import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-admin';
import { env } from '@/lib/env';
import { logError, logInfo } from '@/lib/logger';

/**
 * Missing Receipt Email Digest
 * 
 * This endpoint queries for unmatched bank transactions older than 7 days
 * and sends a summary email to all Owners in the organization.
 * 
 * Trigger this via a cron job (e.g., weekly on Mondays at 9am).
 * Requires: SUPABASE_SERVICE_ROLE_KEY, RESEND_API_KEY
 */
export async function POST(request: Request) {
  // Verify cron secret or internal auth
  const authHeader = request.headers.get('authorization');
  const cronSecret = env.CRON_SECRET;
  if (!cronSecret || authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    // Get all organizations that have unmatched bank transactions
    const sevenDaysAgo = new Date(Date.now() - 7 * 86400000).toISOString();

    const { data: unmatchedGroups, error: groupErr } = await supabaseAdmin
      .from('bank_transactions')
      .select('org_id, id, transaction_date, description, amount')
      .is('matched_receipt_id', null)
      .eq('is_reconciled', false)
      .lte('created_at', sevenDaysAgo);

    if (groupErr) {
      logError(groupErr, { action: 'missing_receipt_digest_query' });
      return NextResponse.json({ error: 'Query failed' }, { status: 500 });
    }

    if (!unmatchedGroups || unmatchedGroups.length === 0) {
      return NextResponse.json({ message: 'No unmatched transactions to report.' });
    }

    // Group by org_id
    const byOrg = new Map<string, typeof unmatchedGroups>();
    for (const tx of unmatchedGroups) {
      const list = byOrg.get(tx.org_id) || [];
      list.push(tx);
      byOrg.set(tx.org_id, list);
    }

    let emailsSent = 0;

    for (const [orgId, transactions] of byOrg.entries()) {
      // Find all Owners for this org
      const { data: owners } = await supabaseAdmin
        .from('user_roles')
        .select('user_id')
        .eq('org_id', orgId)
        .eq('role', 'Owner');

      if (!owners || owners.length === 0) continue;

      // Get owner email addresses from auth.users (batched query)
      const ownerIds = owners.map(o => o.user_id);
      const emails: string[] = [];
      const { data: authUsers } = await supabaseAdmin
        .schema('auth')
        .from('users')
        .select('id, email')
        .in('id', ownerIds);
      if (authUsers) {
        for (const u of authUsers) {
          if (u.email) emails.push(u.email);
        }
      }

      if (emails.length === 0) continue;

      // Build the email body
      const totalAmount = transactions.reduce((s, t) => s + Number(t.amount), 0);
      const transactionList = transactions
        .slice(0, 20) // Cap at 20 in the email
        .map(t => `• ${t.transaction_date} — ${escapeHtml(t.description)} — $${Number(t.amount).toFixed(2)}`)
        .join('\n');

      const emailBody = `
<div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 600px; margin: 0 auto; padding: 24px;">
  <div style="background: #1a1a1a; border-radius: 16px; padding: 32px; color: #e5e5e5;">
    <h1 style="color: #bea98e; font-size: 20px; margin: 0 0 8px;">Missing Receipt Alert</h1>
    <p style="color: #999; font-size: 14px; margin: 0 0 24px;">Weekly digest from 9 Star Labs</p>
    
    <div style="background: #2a2a2a; border-radius: 12px; padding: 16px; margin-bottom: 24px;">
      <p style="color: #f59e0b; font-size: 13px; font-weight: bold; text-transform: uppercase; letter-spacing: 0.1em; margin: 0 0 8px;">Unmatched Transactions</p>
      <p style="color: #fff; font-size: 28px; font-weight: bold; margin: 0;">${transactions.length} transaction${transactions.length === 1 ? '' : 's'}</p>
      <p style="color: #999; font-size: 14px; margin: 4px 0 0;">Totaling $${totalAmount.toFixed(2)} CAD</p>
    </div>

    <pre style="background: #222; border-radius: 8px; padding: 12px; font-size: 12px; color: #ccc; white-space: pre-wrap; overflow-x: auto;">${transactionList}${transactions.length > 20 ? `\n\n... and ${transactions.length - 20} more` : ''}</pre>

    <p style="color: #999; font-size: 13px; margin-top: 24px;">
      These bank transactions have been in your account for over 7 days with no matching receipt. 
      Upload the corresponding receipts in the Bank Reconciliation tab to maintain CRA compliance.
    </p>
  </div>
</div>`;

      // Send via Resend
      if (env.RESEND_API_KEY) {
        try {
          const res = await fetch('https://api.resend.com/emails', {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${env.RESEND_API_KEY}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              from: env.RESEND_FROM_EMAIL || 'alerts@9starlabs.ca',
              to: emails,
              subject: `⚠️ ${transactions.length} bank transaction${transactions.length === 1 ? '' : 's'} missing receipts`,
              html: emailBody,
            }),
          });

          if (res.ok) {
            emailsSent += emails.length;
            logInfo(`Missing receipt digest sent to ${emails.length} owner(s) for org ${orgId}`);
          } else {
            logError(await res.text(), { action: 'resend_missing_receipt_email', orgId });
          }
        } catch (err) {
          logError(err, { action: 'send_missing_receipt_email', orgId });
        }
      }
    }

    return NextResponse.json({ 
      message: `Digest sent to ${emailsSent} recipient(s) across ${byOrg.size} organization(s).`,
      emailsSent,
      organizationsProcessed: byOrg.size,
    });
  } catch (err) {
    logError(err, { action: 'missing_receipt_digest' });
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}
