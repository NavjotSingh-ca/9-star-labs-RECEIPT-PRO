import { supabase } from '@/lib/supabase';
import { logError } from '@/lib/logger';

const MIN_APPEARANCE_THRESHOLD = 3;
const MAX_NORMALIZED_LENGTH = 60;

export interface VendorDefaults {
  category: string | null;
  job_code: string | null;
  business_use_percent: number;
  appearance_count: number;
}

export interface VendorReceiptInfo {
  vendor_name: string;
  category?: string | null;
  job_code?: string | null;
  business_use_percent?: number | null;
}

/**
 * Normalize vendor name for fuzzy dedup matching.
 *
 * Examples:
 * - "PETRO-CANADA #45" → "petrocanada"
 * - "Tim Hortons (Main St)" → "timhortons"
 *
 * @param name - Raw vendor name.
 * @returns Lowercase alphanumeric string, stripped of trailing location numbers, max 60 chars.
 */
export function normalizeVendorName(name: string): string {
  if (!name || typeof name !== 'string') {
    return '';
  }

  return name
    .toLowerCase()
    .replace(/[^a-z0-9]/g, '')
    .replace(/\d{2,}$/g, '')
    .trim()
    .slice(0, MAX_NORMALIZED_LENGTH);
}

/**
 * Look up pre-fill defaults for a vendor.
 * Returns defaults only if appearance_count >= 3 (signal threshold).
 *
 * @param orgId - Organization UUID for tenant isolation.
 * @param vendorName - Raw vendor name to look up.
 * @returns Vendor defaults or null if not enough data.
 */
export async function getVendorDefaults(orgId: string, vendorName: string): Promise<VendorDefaults | null> {
  if (!orgId || !vendorName) return null;

  const normalized = normalizeVendorName(vendorName);
  if (!normalized) return null;

  try {
    const { data, error } = await supabase
      .from('vendor_defaults')
      .select('category, job_code, business_use_percent, appearance_count')
      .eq('org_id', orgId)
      .eq('vendor_name_normalized', normalized)
      .single();

    if (error || !data) return null;

    // Only return defaults if vendor has 3+ prior receipts
    if (data.appearance_count < MIN_APPEARANCE_THRESHOLD) return null;

    return {
      category: data.category,
      job_code: data.job_code,
      business_use_percent: Number(data.business_use_percent ?? 100),
      appearance_count: data.appearance_count,
    };
  } catch (err) {
    logError(err, { action: 'get_vendor_defaults', orgId, normalizedVendor: normalized });
    return null;
  }
}

/**
 * Update or insert vendor defaults after a receipt is saved.
 * Increments the appearance count and refreshes fields from the latest receipt.
 * Fire-and-forget — never throws, never blocks a save.
 *
 * @param orgId - Organization UUID for tenant isolation.
 * @param receipt - Receipt data to derive defaults from.
 */
export async function updateVendorDefaults(
  orgId: string,
  receipt: VendorReceiptInfo
): Promise<void> {
  if (!orgId || !receipt.vendor_name) return;

  const normalized = normalizeVendorName(receipt.vendor_name);
  if (!normalized) return;

  try {
    const { data: existing } = await supabase
      .from('vendor_defaults')
      .select('id, appearance_count')
      .eq('org_id', orgId)
      .eq('vendor_name_normalized', normalized)
      .single();

    if (existing) {
      const newCount = (existing.appearance_count || 0) + 1;
      await supabase.from('vendor_defaults').update({
        appearance_count: newCount,
        last_seen_at: new Date().toISOString(),
        ...(receipt.category ? { category: receipt.category } : {}),
        ...(receipt.job_code ? { job_code: receipt.job_code } : {}),
        ...(receipt.business_use_percent != null ? { business_use_percent: receipt.business_use_percent } : {}),
      }).eq('id', existing.id);
    } else {
      await supabase.from('vendor_defaults').insert({
        org_id: orgId,
        vendor_name_normalized: normalized,
        category: receipt.category || null,
        job_code: receipt.job_code || null,
        business_use_percent: receipt.business_use_percent ?? 100,
        appearance_count: 1,
        last_seen_at: new Date().toISOString(),
      });
    }
  } catch (err) {
    logError(err, { action: 'update_vendor_defaults', orgId, vendor: normalized });
  }
}
