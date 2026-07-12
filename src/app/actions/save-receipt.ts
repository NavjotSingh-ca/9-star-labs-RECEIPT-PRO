'use server';

import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { env } from '@/lib/env';
import { isMathMismatch } from '@/lib/finance-utils';
import { getHistoricalCADRate } from '@/lib/services/fx-rates';
import { updateVendorDefaults } from '@/lib/services/vendor-defaults';
import { supabaseAdmin } from '@/lib/supabase-admin';
import { logError, logWarn } from '@/lib/logger';

const ALLOWED_RECEIPT_COLUMNS = [
  'vendor_name', 'vendor_address', 'vendor_tax_number', 'business_number',
  'transaction_date', 'transaction_time', 'subtotal', 'tax_amount',
  'pst_amount', 'total_amount', 'currency', 'exchange_rate', 'cad_equivalent',
  'payment_method', 'card_last_four', 'category', 'notes',
  'image_url', 'document_type', 'paid_by', 'needs_reimbursement',
  'business_unit_id', 'project_id', 'approval_status',
  'duplicate_hash', 'duplicate_warning', 'math_mismatch_warning',
  'fraud_suspicion', 'fraud_reason', 'line_items', 'capture_source',
  'job_code', 'vehicle_id', 'usage_type', 'business_use_percent',
  'payment_reference', 'blur_score',
] as const;

export async function saveReceiptAction(
  payload: Record<string, unknown>,
  integrityHash: string,
): Promise<{ ok: true; id: string } | { ok: false; error: string }> {
  try {
    const cookieStore = await cookies();
    const supabase = createServerClient(
      env.NEXT_PUBLIC_SUPABASE_URL!,
      env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll: () => cookieStore.getAll(),
          setAll: () => {},
        },
      },
    );

    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return { ok: false, error: 'Not authenticated' };
    }

    const userId = user.id;

    const isMismatch = isMathMismatch(
      Number(payload.subtotal ?? 0),
      Number(payload.tax_amount ?? 0),
      Number(payload.pst_amount ?? 0),
      Number(payload.total_amount ?? 0),
    );

    const currency = String(payload.currency ?? 'CAD');
    const totalAmount = Number(payload.total_amount ?? 0);
    const transactionDate = String(payload.transaction_date ?? new Date().toISOString().split('T')[0]);

    let exchangeRate = Number(payload.exchange_rate ?? 1.0);
    if (currency !== 'CAD' && transactionDate) {
      try {
        exchangeRate = await getHistoricalCADRate(currency, transactionDate);
      } catch (err) {
        logError(err, { action: 'fx_rate_in_save_action', currency, transactionDate });
      }
    }
    const cadEquivalent = currency !== 'CAD' ? Math.round(totalAmount * exchangeRate * 100) / 100 : null;

    let previousHash: string | null = null;
    try {
      const { data: lastLog } = await supabaseAdmin
        .from('audit_logs')
        .select('event_hash')
        .eq('user_id', userId)
        .not('event_hash', 'is', null)
        .order('created_at', { ascending: false })
        .limit(1)
        .single();
      previousHash = (lastLog as { event_hash?: string } | null)?.event_hash ?? null;
    } catch {
      logWarn('Previous hash lookup failed — starting fresh Merkle chain (server action)');
      previousHash = null;
    }

    const sanitizedPayload: Record<string, unknown> = {};
    for (const key of ALLOWED_RECEIPT_COLUMNS) {
      if (key in payload) {
        sanitizedPayload[key] = payload[key];
      }
    }

    const { data: orgData } = await supabaseAdmin.rpc('get_user_org');
    const orgId: string | null = orgData ? String(orgData) : null;

    sanitizedPayload.user_id = userId;
    sanitizedPayload.org_id = orgId || undefined;
    sanitizedPayload.business_unit_id = payload.business_unit_id === '' ? null : payload.business_unit_id;
    sanitizedPayload.project_id = payload.project_id === '' ? null : payload.project_id;
    sanitizedPayload.integrity_hash = integrityHash;
    sanitizedPayload.math_mismatch_warning = isMismatch;
    sanitizedPayload.cad_equivalent = cadEquivalent;
    sanitizedPayload.exchange_rate = exchangeRate;

    Object.keys(sanitizedPayload).forEach(key => {
      if (sanitizedPayload[key] === '') {
        sanitizedPayload[key] = null;
      }
    });

    const { data, error: insertError } = await supabaseAdmin
      .from('receipts')
      .insert([sanitizedPayload])
      .select('id')
      .single();

    if (insertError) return { ok: false, error: insertError.message };
    const newReceiptId = (data as { id: string } | undefined)?.id;
    if (!newReceiptId) return { ok: false, error: 'No receipt ID returned' };

    const { error: auditError } = await supabaseAdmin.from('audit_logs').insert({
      user_id: userId,
      org_id: orgId || null,
      action: 'receiptcreated',
      details: `Receipt created: ${payload.vendor_name || 'Unknown'} (${payload.transaction_date || 'Unknown Date'}) currency=${currency}`,
      event_hash: integrityHash,
      previous_hash: previousHash,
    });

    if (auditError) {
      await supabaseAdmin.from('receipts').update({ is_deleted: true }).eq('id', newReceiptId);
      return { ok: false, error: auditError.message };
    }

    if (orgId) {
      updateVendorDefaults(orgId, {
        vendor_name: String(payload.vendor_name ?? ''),
        category: payload.category ? String(payload.category) : null,
        job_code: payload.job_code ? String(payload.job_code) : null,
        business_use_percent: payload.business_use_percent != null ? Number(payload.business_use_percent) : null,
      }).catch((err) => logError(err, { action: 'vendor_defaults_update_action' }));

      // Notify org admins about new receipt submission
      try {
        const { data: admins } = await supabaseAdmin
          .from('user_roles')
          .select('user_id')
          .eq('org_id', orgId)
          .in('role', ['Owner', 'Accountant']);

        const adminIds = (admins || [])
          .map((r: { user_id: string }) => r.user_id)
          .filter((id: string) => id !== userId);

        if (adminIds.length > 0) {
          const title = `New receipt from ${payload.vendor_name || 'Unknown Vendor'}`;
          const message = `$${Number(payload.total_amount || 0).toFixed(2)} · ${new Date().toLocaleDateString('en-CA', { month: 'short', day: 'numeric', year: 'numeric' })}`;
          const notificationPayload = adminIds.map((adminId: string) => ({
            org_id: orgId,
            user_id: adminId,
            type: 'receipt_submitted' as const,
            title,
            message,
            link: '/?tab=receipts',
            is_read: false,
          }));

          try {
            await supabaseAdmin.from('notifications').insert(notificationPayload);
          } catch {
            // Non-blocking
          }
        }
      } catch {
        // Non-blocking — notification failure should never block the receipt save
      }
    }

    return { ok: true, id: newReceiptId };
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : 'Unknown error saving receipt' };
  }
}
