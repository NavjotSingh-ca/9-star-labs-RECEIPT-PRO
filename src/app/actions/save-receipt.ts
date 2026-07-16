'use server';

import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { env } from '@/lib/env';
import { isMathMismatch } from '@/lib/finance-utils';
import { getHistoricalCADRate } from '@/lib/services/fx-rates';
import { updateVendorDefaults } from '@/lib/services/vendor-defaults';
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

/**
 * Persists a scanned receipt to the database via atomic PG function.
 * Uses user-scoped client (never service role) with proper RLS enforcement.
 * 
 * @param payload - Sanitized receipt fields (only ALLOWED_RECEIPT_COLUMNS are persisted).
 * @param integrityHash - SHA-256 hash of the raw scan result for audit chain.
 * @returns { ok: true; id: string } or { ok: false; error: string }
 */
export async function saveReceiptAction(
  payload: Record<string, unknown>,
  integrityHash: string
): Promise<{ ok: true; id: string } | { ok: false; error: string }> {
  try {
    const cookieStore = await cookies();
    const supabase = createServerClient(
      env.NEXT_PUBLIC_SUPABASE_URL!,
      env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll: () => cookieStore.getAll(),
          setAll: () => {}, // Server actions don't set cookies
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
      Number(payload.total_amount ?? 0)
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

    // Compute duplicate hash
    const normalizedVendor = String(payload.vendor_name ?? '').toLowerCase().trim();
    const normalizedDate = transactionDate;
    const duplicateHash = `${normalizedVendor}|${normalizedDate}|${totalAmount.toFixed(2)}|${Number(payload.tax_amount ?? 0).toFixed(2)}`;

    // Build sanitized payload
    const sanitizedPayload: Record<string, unknown> = {};
    for (const key of ALLOWED_RECEIPT_COLUMNS) {
      if (key in payload) {
        sanitizedPayload[key] = payload[key];
      }
    }

    // Force server-controlled values
    sanitizedPayload.user_id = userId;
    sanitizedPayload.integrity_hash = integrityHash;
    sanitizedPayload.math_mismatch_warning = isMismatch;
    sanitizedPayload.cad_equivalent = cadEquivalent;
    sanitizedPayload.exchange_rate = exchangeRate;
    sanitizedPayload.duplicate_hash = duplicateHash;

    // Strip empty strings
    for (const key of Object.keys(sanitizedPayload)) {
      if (sanitizedPayload[key] === '') {
        sanitizedPayload[key] = null;
      }
    }

    // Call atomic PG function (handles advisory lock, Merkle chain, insert, audit log)
    const { data: newReceiptId, error: rpcError } = await supabase.rpc('save_receipt_atomic', {
      p_payload: sanitizedPayload,
      p_user_id: userId,
    });

    if (rpcError) {
      return { ok: false, error: rpcError.message };
    }

    const receiptId = newReceiptId as string;

    // Fire-and-forget: update vendor recognition defaults
    try {
      const { data: roleData } = await supabase
        .from('user_roles')
        .select('org_id')
        .eq('user_id', userId)
        .single();

      const orgId = roleData?.org_id;
      if (orgId) {
        updateVendorDefaults(orgId, {
          vendor_name: String(payload.vendor_name ?? ''),
          category: payload.category ? String(payload.category) : null,
          job_code: payload.job_code ? String(payload.job_code) : null,
          business_use_percent: payload.business_use_percent != null ? Number(payload.business_use_percent) : null,
        }).catch((err) => logError(err, { action: 'vendor_defaults_update_action' }));

        // Notify org admins about new receipt submission
        try {
          const { data: admins } = await supabase
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

            await supabase.from('notifications').insert(notificationPayload);
          }
        } catch (adminErr) {
          logWarn('Failed to query org admins for notification', { userId, orgId, error: adminErr instanceof Error ? adminErr.message : 'Unknown' });
        }
      }
    } catch (err) {
      logWarn('vendor_defaults_update_action failed', { userId, error: err instanceof Error ? err.message : 'Unknown' });
    }

    return { ok: true, id: receiptId };
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : 'Unknown error saving receipt' };
  }
}