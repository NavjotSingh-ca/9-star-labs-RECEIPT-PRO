import { supabase } from '@/lib/supabase';
import { logError } from '@/lib/logger';

export interface VendorDefaults {
  category: string | null;
  job_code: string | null;
  business_use_percent: number;
  appearance_count: number;
}

/**
 * Normalize vendor name for fuzzy dedup matching.
 * "PETRO-CANADA #45" → "petrocanada"
 * "Tim Hortons (Main St)" → "timhortons"
 */
export function normalizeVendorName(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]/g, '')   // Remove all non-alphanumeric
    .replace(/\d{2,}$/g, '')      // Strip trailing location numbers
    .trim()
    .slice(0, 60);                // Cap at 60 chars
}

/**
 * Look up pre-fill defaults for a vendor.
 * Returns defaults only if appearance_count >= 3 (signal threshold).
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
    if (data.appearance_count < 3) return null;
    
    return {
      category: data.category,
      job_code: data.job_code,
      business_use_percent: Number(data.business_use_percent ?? 100),
      appearance_count: data.appearance_count,
    };
  } catch {
    return null;
  }
}

/**
 * Called after a receipt is saved. Upserts vendor_defaults,
 * incrementing the appearance count and refreshing fields.
 * Fire-and-forget — never throws.
 */
export async function updateVendorDefaults(
  orgId: string,
  receipt: {
    vendor_name: string;
    category?: string | null;
    job_code?: string | null;
    business_use_percent?: number | null;
  }
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
      // Update: increment count, refresh fields from latest receipt
      const newCount = (existing.appearance_count || 0) + 1;
      await supabase.from('vendor_defaults').update({
        appearance_count: newCount,
        last_seen_at: new Date().toISOString(),
        // Only update category/job_code/business_use_percent if they have values
        ...(receipt.category ? { category: receipt.category } : {}),
        ...(receipt.job_code ? { job_code: receipt.job_code } : {}),
        ...(receipt.business_use_percent != null ? { business_use_percent: receipt.business_use_percent } : {}),
      }).eq('id', existing.id);
    } else {
      // Insert new record
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
    // Never rethrow — this must never block a save
  }
}
