import { z } from 'zod';
import { supabase, getOrgIdString } from '@/lib/supabase';
import { isMathMismatch } from '@/lib/finance-utils';
import { handleSupabaseError, withRetry } from '@/lib/supabase-error-handler';
import type { ReceiptRow, Project, AccessCode, UserRole } from '@/lib/types';
import type {
  GetDashboardStatsReturns,
  RedeemAccessCodeReturns,
} from '@/lib/database.types';
import { getUserRole } from '@/lib/services/roles';
import { getHistoricalCADRate } from '@/lib/services/fx-rates';
import { updateVendorDefaults } from '@/lib/services/vendor-defaults';
import { logError, logWarn } from '@/lib/logger';
import { notifyUser } from '@/lib/notifications/notify';

// Browser-safe hash function using SubtleCrypto with fallback
async function computeAuditHash(
  action: string,
  details: string,
  previousHash: string | null,
  createdAt: string
): Promise<string> {
  const data = `${action}|${details || ''}|${previousHash || ''}|${createdAt}`;
  const encoder = new TextEncoder();
  const dataBuffer = encoder.encode(data);

  try {
    const hashBuffer = await crypto.subtle.digest('SHA-256', dataBuffer);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  } catch {
    // Fallback for environments without SubtleCrypto
    let hash = 0;
    for (let i = 0; i < data.length; i++) {
      const char = data.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash;
    }
    return Math.abs(hash).toString(16).padStart(64, '0');
  }
}

// ─── Constants ───

const CRA_RETENTION_YEARS = 7;
const MAX_RETRY_ATTEMPTS = 2;
const RETRY_DELAY_MS = 500;
const DEFAULT_PAGE_SIZE = 25;
const MAX_RECEIPT_FETCH_LIMIT = 1000;

// ─── Zod Schemas ───

export const lineItemSchema = z.object({
  description: z.string().nullish().transform((val) => val ?? ''),
  quantity: z.number().nullish().transform((val) => val ?? 1),
  unit_price: z.number().nullish().transform((val) => val ?? 0),
  tax_rate: z.number().nullish().transform((val) => val ?? 0),
  tax_amount: z.number().nullish().transform((val) => val ?? 0),
  line_total: z.number().nullish().transform((val) => val ?? 0),
  category: z.string().nullish().transform((val) => val ?? ''),
});

export const receiptSchema = z.object({
  id: z.string().nullish().transform((val) => val ?? ''),
  user_id: z.string().nullish().transform((val) => val ?? ''),
  business_unit_id: z.string().nullish().transform((val) => val ?? null),
  project_id: z.string().nullish().transform((val) => val ?? null),
  vendor_name: z.string().nullish().transform((val) => val ?? ''),
  vendor_address: z.string().nullish().transform((val) => val ?? ''),
  vendor_tax_number: z.string().nullish().transform((val) => val ?? ''),
  business_number: z.string().nullish().transform((val) => val ?? ''),
  transaction_date: z.string().nullish().transform((val) => val ?? ''),
  transaction_time: z.string().nullish().transform((val) => val ?? ''),
  subtotal: z.number().nullish().transform((val) => val ?? 0),
  tax_amount: z.number().nullish().transform((val) => val ?? 0),
  pst_amount: z.number().nullish().transform((val) => val ?? 0),
  total_amount: z.number().nullish().transform((val) => val ?? 0),
  currency: z.string().nullish().transform((val) => val ?? 'CAD'),
  exchange_rate: z.number().nullish().transform((val) => val ?? 1.0),
  cad_equivalent: z.number().nullish().transform((val) => val ?? null),
  blur_score: z.number().nullish().transform((val) => val ?? null),
  payment_method: z.string().nullish().transform((val) => val ?? ''),
  card_last_four: z.string().nullish().transform((val) => val ?? ''),
  category: z.string().nullish().transform((val) => val ?? ''),
  notes: z.string().nullish().transform((val) => val ?? ''),
  job_code: z.string().nullish().transform((val) => val ?? ''),
  vehicle_id: z.string().nullish().transform((val) => val ?? ''),
  usage_type: z.enum(['business', 'personal', 'mixed']).nullish().transform((val) => val ?? 'business'),
  business_use_percent: z.number().nullish().transform((val) => val ?? 0),
  line_items: z.unknown().transform((val) => {
    if (!val) return null;
    if (typeof val === 'string') {
      try { return JSON.parse(val); } catch { return null; }
    }
    return val;
  }),
  integrity_hash: z.string().nullish().transform((val) => val ?? ''),
  confidence_score: z.number().nullish().transform((val) => val ?? 0),
  cra_readiness_score: z.number().nullish().transform((val) => val ?? 0),
  thermal_warning: z.boolean().nullish().transform((val) => val ?? false),
  capture_source: z.string().nullish().transform((val) => val ?? ''),
  document_type: z.string().nullish().transform((val) => val ?? 'receipt'),
  image_url: z.string().nullish().transform((val) => val ?? null),
  is_deleted: z.boolean().nullish().transform((val) => val ?? false),
  created_at: z.string().nullish().transform((val) => val ?? ''),
  updated_at: z.string().nullish().transform((val) => val ?? ''),
  paid_by: z.string().nullish().transform((val) => val ?? null),
  reimbursement_status: z.string().nullish().transform((val) => val ?? null),
  needs_reimbursement: z.boolean().nullish().transform((val) => val ?? false),
  approval_status: z.string().nullish().transform((val) => val ?? null),
  duplicate_hash: z.string().nullish().transform((val) => val ?? ''),
  math_mismatch_warning: z.boolean().nullish().transform((val) => val ?? false),
  duplicate_warning: z.boolean().optional(),
  missing_bn_warning: z.boolean().optional(),
  flagged_for_audit: z.boolean().optional(),
  high_audit_risk: z.boolean().optional(),
  fraud_suspicion: z.boolean().optional(),
  fraud_reason: z.string().nullish().transform((val) => val ?? ''),
});

// ─── Receipt Queries ───

/**
 * Parse an array of raw DB rows through the receipt schema.
 */
function parseReceiptRows(rows: unknown[]): ReceiptRow[] {
  return (rows || []).map((row) => receiptSchema.parse(row) as ReceiptRow);
}

/**
 * Fetch receipts for the current user's organization.
 * Every org member sees org-wide data (role scoping removed).
 *
 * @param userId - UUID of the caller.
 * @param limit - Max results (default 1000).
 * @param offset - Pagination offset (default 0).
 * @returns Array of parsed ReceiptRow objects.
 * @throws {SupabaseError} If the DB query fails.
 */
export async function getReceipts(userId?: string, limit: number = MAX_RECEIPT_FETCH_LIMIT, offset: number = 0): Promise<ReceiptRow[]> {
  if (!userId) return [];
  if (limit < 1 || offset < 0) return [];

  const orgId = await getOrgIdString();
  if (!orgId) return [];

  try {
    const result = await withRetry(
      () => {
        return supabase
          .from('receipts')
          .select('*')
          .eq('org_id', orgId)
          .eq('is_deleted', false)
          .range(offset, offset + limit - 1)
          .order('transaction_date', { ascending: false })
          .order('created_at', { ascending: false });
      },
      { maxRetries: MAX_RETRY_ATTEMPTS, delayMs: RETRY_DELAY_MS }
    );

    const { data, error } = result;
    if (error) throw handleSupabaseError(error);

    return parseReceiptRows(data || []);
  } catch (error) {
    const supabaseError = handleSupabaseError(error);
    logError(supabaseError, { action: 'fetch_receipts' });
    throw supabaseError;
  }
}

/**
 * Fetch receipts with pagination, filters, and semantic search via RPC.
 * Every org member sees org-wide data (role scoping removed).
 *
 * @param params - Query parameters including user ID, pagination, filters.
 * @returns Paginated receipt rows and total count.
 * @throws {SupabaseError} If the DB query fails.
 */
export async function getReceiptsPaginated(params: {
  userId?: string;
  limit?: number;
  offset?: number;
  category?: string;
  fromDate?: string;
  toDate?: string;
  approvalStatus?: string;
  search?: string;
  semanticIds?: string[];
  specialFilter?: 'missing-bn' | 'flagged-audit' | 'reimbursement';
}): Promise<{ receipts: ReceiptRow[]; totalCount: number }> {
  if (!params.userId) return { receipts: [], totalCount: 0 };

  const orgId = await getOrgIdString();
  if (!orgId) return { receipts: [], totalCount: 0 };

  const pageLimit = params.limit || DEFAULT_PAGE_SIZE;
  const pageOffset = params.offset || 0;

  // Special filters not supported by the RPC — use direct query
  if (params.specialFilter) {
    let query = supabase
      .from('receipts')
      .select('*', { count: 'exact', head: false })
      .eq('org_id', orgId)
      .eq('is_deleted', false);

    switch (params.specialFilter) {
      case 'missing-bn':
        query = query.or('vendor_tax_number.is.null,vendor_name.is.null,transaction_date.is.null,total_amount.lte.0');
        break;
      case 'flagged-audit':
        query = query.or('flagged_for_audit.eq.true,math_mismatch_warning.eq.true,duplicate_warning.eq.true,thermal_warning.eq.true,and(cra_readiness_score.gt.0,cra_readiness_score.lt.70)');
        break;
      case 'reimbursement':
        query = query.eq('paid_by', 'employee_cash');
        break;
    }

    const { data, error, count } = await query
      .order('transaction_date', { ascending: false })
      .order('created_at', { ascending: false })
      .range(pageOffset, pageOffset + pageLimit - 1);

    if (error) {
      const supabaseError = handleSupabaseError(error);
      logError(supabaseError, { action: 'fetch_receipts_paginated_special' });
      throw supabaseError;
    }

    return { receipts: parseReceiptRows(data || []), totalCount: count || 0 };
  }

  const { data, error } = await supabase.rpc('get_receipts_paginated', {
    p_org_id: orgId,
    p_user_id: params.userId,
    // Every org member gets org-wide data; the RPC's role filter is bypassed
    // with 'Owner' so employees see the full org ledger too.
    p_role: 'Owner',
    p_limit: pageLimit,
    p_offset: pageOffset,
    p_order_by: 'created_at',
    p_order_dir: 'desc',
    p_category: params.category || null,
    p_from_date: params.fromDate || null,
    p_to_date: params.toDate || null,
    p_approval_status: params.approvalStatus || null,
    p_search: params.search || null,
    p_semantic_ids: params.semanticIds || null,
  });

  if (error) {
    const supabaseError = handleSupabaseError(error);
    logError(supabaseError, { action: 'fetch_receipts_paginated' });
    throw supabaseError;
  }

  const rows = (data || []) as { receipt: unknown; total_count: number }[];
  if (rows.length === 0) return { receipts: [], totalCount: 0 };

  const totalCount = Number(rows[0].total_count);
  const receipts = rows.map(r => receiptSchema.parse(r.receipt) as ReceiptRow);

  return { receipts, totalCount };
}

/**
 * Fetch receipts pending approval (approval_status = 'submitted') for the current org.
 *
 * @returns Array of pending receipt rows.
 * @throws {SupabaseError} If the DB query fails.
 */
export const getReceiptsPendingApproval = async (): Promise<ReceiptRow[]> => {
  const orgId = await getOrgIdString();
  if (!orgId) return [];

  try {
    const { data, error } = await withRetry(
      () => supabase
        .from('receipts')
        .select('*')
        .eq('org_id', orgId)
        .eq('is_deleted', false)
        .eq('approval_status', 'submitted')
        .order('created_at', { ascending: false }),
      { maxRetries: MAX_RETRY_ATTEMPTS, delayMs: RETRY_DELAY_MS }
    );

    if (error) throw handleSupabaseError(error);
    return parseReceiptRows(data || []);
  } catch (error) {
    const supabaseError = handleSupabaseError(error);
    logError(supabaseError, { action: 'fetch_pending_receipts' });
    throw supabaseError;
  }
};

export interface DashboardSummary {
  totalSpent: number;
  gstRecoverable: number;
  pstRecoverable: number;
  receiptCount: number;
  avgTransaction: number;
  missingBNCount: number;
  pendingReviewCount: number;
  flaggedAuditCount: number;
  spendingByCategory: { name: string; amount: number }[];
  monthlyTrend: { month: string; amount: number }[];
  reimbursementQueue: ReceiptRow[];
  highConfidenceCount: number;
  duplicatesBlockedCount: number;
  unmatchedBankCount: number;
  mileageTotalAmount: number;
  mileageTotalKm: number;
}

// Fallback function when materialized view is unavailable.
// Every org member sees org-wide data — the RPC's role filter is bypassed
// with 'Owner' (the RPC still enforces org membership via auth.uid()).
async function fallbackDashboardStats(orgId: string, userId: string): Promise<GetDashboardStatsReturns> {
  const { data: stats, error: statsError } = await supabase.rpc('get_dashboard_stats', {
    p_org_id: orgId,
    p_user_id: userId,
    p_role: 'Owner',
  });
  if (statsError) throw statsError;
  return (stats?.[0] || {}) as GetDashboardStatsReturns;
}

/**
 * Get the full dashboard summary for the current org and user.
 * Uses materialized view for core stats (sub-50ms for 5000+ row queries)
 * and fetches remaining data in parallel.
 *
 * @param userId - UUID of the caller.
 * @returns Complete dashboard summary with all metrics.
 * @throws {Error} If the org cannot be resolved.
 */
export const getDashboardSummary = async (userId: string): Promise<DashboardSummary> => {
  const orgId = await getOrgIdString();
  if (!orgId) throw new Error('No organization found');

  // 1. Fetch Core Stats via materialized view (fast - pre-aggregated)
  const { data: mvStats } = await supabase
    .from('org_dashboard_summary')
    .select('*')
    .eq('org_id', orgId)
    .eq('user_id', userId)
    .single();

  // Fallback to RPC if materialized view is stale/empty
  const mainStats = mvStats || (await fallbackDashboardStats(orgId, userId));

  // 2. Fetch remaining dashboard data in parallel — but ONLY for fields the
  //    materialized view (or RPC fallback) did not return. Gating on missing
  //    fields eliminates ~9 redundant round trips and full-table scans per
  //    dashboard load when the MV is fresh.
  const statsRecord = (mainStats || {}) as Record<string, unknown>;
  const needsField = (key: string): boolean => {
    const value = statsRecord[key];
    return value === undefined || value === null;
  };
  const needsCategory = needsField('spending_by_category');
  const needsMissingBN = needsField('missing_bn_count');
  const needsPendingReview = needsField('pending_review_count');
  const needsFlaggedAudit = needsField('flagged_audit_count');
  const needsReimbursements = needsField('reimbursement_queue');
  const needsTrend = needsField('monthly_trend');
  const needsConfidence = needsField('high_confidence_count') || needsField('duplicates_blocked_count');
  const needsBank = needsField('unmatched_bank_count');
  // Mileage totals are not part of the materialized view — always computed below.

  const [categoryResult, missingBNResult, pendingReviewResult, flaggedAuditResult,
    reimbursementsResult, trendResult, confidenceResult, bankResult, mileageResult] = await Promise.all([
    // 2. Category Breakdown
    needsCategory ? (async () => {
      const { data } = await supabase.from('receipts').select('category, total_amount').eq('org_id', orgId).eq('is_deleted', false);
      const map = new Map<string, number>();
      (data || []).forEach(r => {
        const cat = r.category || 'Uncategorized';
        map.set(cat, (map.get(cat) ?? 0) + Number(r.total_amount || 0));
      });
      return Array.from(map.entries()).map(([name, amount]) => ({ name, amount })).sort((a, b) => b.amount - a.amount);
    })() : Promise.resolve(undefined),

    // 3. Missing BN count
    needsMissingBN ? (async () => {
      try {
        const { count } = await supabase.from('receipts').select('*', { count: 'exact', head: true }).eq('org_id', orgId).eq('is_deleted', false).or('vendor_tax_number.is.null,vendor_tax_number.eq.');
        return count || 0;
      } catch (e) { logError(e, { action: 'dashboard_missing_bn_count' }); return 0; }
    })() : Promise.resolve(undefined),

    // 4. Pending review count
    needsPendingReview ? (async () => {
      try {
        const { count } = await supabase.from('receipts').select('*', { count: 'exact', head: true }).eq('org_id', orgId).eq('is_deleted', false).eq('approval_status', 'submitted');
        return count || 0;
      } catch (e) { logError(e, { action: 'dashboard_pending_review_count' }); return 0; }
    })() : Promise.resolve(undefined),

    // 5. Flagged audit count
    needsFlaggedAudit ? (async () => {
      try {
        const { count } = await supabase.from('receipts').select('*', { count: 'exact', head: true }).eq('org_id', orgId).eq('is_deleted', false).eq('flagged_for_audit', true);
        return count || 0;
      } catch (e) { logError(e, { action: 'dashboard_flagged_audit_count' }); return 0; }
    })() : Promise.resolve(undefined),

    // 6. Reimbursement Queue
    needsReimbursements ? (async () => {
      const { data } = await supabase.from('receipts').select('*').eq('org_id', orgId).eq('is_deleted', false).eq('paid_by', 'employee_cash').eq('reimbursement_status', 'pending').limit(5);
      return data || [];
    })() : Promise.resolve(undefined),

    // 7. Monthly Trend (last 6 months)
    needsTrend ? (async () => {
      try {
        const sixMonthsAgo = new Date(); sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);
        const { data } = await supabase.from('receipts').select('transaction_date, total_amount').eq('org_id', orgId).eq('is_deleted', false).gte('created_at', sixMonthsAgo.toISOString());
        const map = new Map<string, number>();
        (data || []).forEach(r => {
          const d = String(r.transaction_date || '').slice(0, 7);
          if (d) map.set(d, (map.get(d) ?? 0) + Number(r.total_amount || 0));
        });
        return Array.from(map.entries()).map(([month, amount]) => ({ month, amount: Math.round(amount * 100) / 100 })).sort((a, b) => a.month.localeCompare(b.month)).slice(-6);
      } catch (e) { logError(e, { action: 'dashboard_monthly_trend' }); return []; }
    })() : Promise.resolve(undefined),

    // 8. High confidence + duplicate counts
    needsConfidence ? (async () => {
      try {
        const [hc, db] = await Promise.all([
          supabase.from('receipts').select('*', { count: 'exact', head: true }).eq('org_id', orgId).eq('is_deleted', false).gte('confidence_score', 80),
          supabase.from('receipts').select('*', { count: 'exact', head: true }).eq('org_id', orgId).eq('is_deleted', false).eq('duplicate_warning', true),
        ]);
        return { highConfidenceCount: hc.count || 0, duplicatesBlockedCount: db.count || 0 };
      } catch (e) { logError(e, { action: 'dashboard_confidence_counts' }); return { highConfidenceCount: 0, duplicatesBlockedCount: 0 }; }
    })() : Promise.resolve(undefined),

    // 9. Unmatched bank count
    needsBank ? (async () => {
      try {
        const { count } = await supabase.from('bank_transactions').select('*', { count: 'exact', head: true }).eq('org_id', orgId).is('matched_receipt_id', null).eq('is_reconciled', false);
        return count || 0;
      } catch (e) { logError(e, { action: 'dashboard_unmatched_bank' }); return 0; }
    })() : Promise.resolve(undefined),

    // 10. Mileage totals
    (async () => {
      try {
        const { data } = await supabase.from('mileage_logs').select('distance_km, total_amount').eq('org_id', orgId);
        return {
          mileageTotalAmount: (data || []).reduce((s, r) => s + Number(r.total_amount), 0),
          mileageTotalKm: (data || []).reduce((s, r) => s + Number(r.distance_km), 0),
        };
      } catch (e) { logError(e, { action: 'dashboard_mileage' }); return { mileageTotalAmount: 0, mileageTotalKm: 0 }; }
    })(),
  ]);

  const confidence =
    confidenceResult ?? { highConfidenceCount: 0, duplicatesBlockedCount: 0 };

  return {
    totalSpent: Number(mainStats?.total_spent || 0) + (mileageResult?.mileageTotalAmount || 0),
    gstRecoverable: Number(mainStats?.gst_recoverable || 0),
    pstRecoverable: Number(mainStats?.pst_recoverable || 0),
    receiptCount: Number(mainStats?.receipt_count || 0),
    avgTransaction: Number(mainStats?.avg_transaction || 0),
    missingBNCount: (mainStats as { missing_bn_count?: number })?.missing_bn_count ?? (missingBNResult || 0),
    pendingReviewCount: (mainStats as { pending_review_count?: number })?.pending_review_count ?? (pendingReviewResult || 0),
    flaggedAuditCount: (mainStats as { flagged_audit_count?: number })?.flagged_audit_count ?? (flaggedAuditResult || 0),
    spendingByCategory: (mainStats as { spending_by_category?: { name: string; amount: number }[] })?.spending_by_category ?? categoryResult ?? [],
    monthlyTrend: (mainStats as { monthly_trend?: { month: string; amount: number }[] })?.monthly_trend ?? trendResult ?? [],
    reimbursementQueue: parseReceiptRows((mainStats as { reimbursement_queue?: ReceiptRow[] })?.reimbursement_queue || reimbursementsResult || []),
    highConfidenceCount: (mainStats as { high_confidence_count?: number })?.high_confidence_count ?? confidence.highConfidenceCount,
    duplicatesBlockedCount: (mainStats as { duplicates_blocked_count?: number })?.duplicates_blocked_count ?? confidence.duplicatesBlockedCount,
    unmatchedBankCount: (mainStats as { unmatched_bank_count?: number })?.unmatched_bank_count ?? (bankResult || 0),
    mileageTotalAmount: Math.round((mileageResult?.mileageTotalAmount || 0) * 100) / 100,
    mileageTotalKm: Math.round((mileageResult?.mileageTotalKm || 0) * 10) / 10,
  };
};

/**
 * Get daily spend totals for the last N days.
 *
 * @param days - Number of days to look back (default 30).
 * @returns Array of { date, amount } for each day in the range, zero-filled.
 */
export const getDailySpend = async (days: number = 30): Promise<{ date: string; amount: number }[]> => {
  if (days < 1 || days > 365) return [];

  const orgId = await getOrgIdString();
  if (!orgId) return [];

  const fromDate = new Date();
  fromDate.setDate(fromDate.getDate() - days);
  const from = fromDate.toISOString().split('T')[0];

  const { data, error } = await supabase
    .from('receipts')
    .select('transaction_date, total_amount')
    .eq('org_id', orgId)
    .eq('is_deleted', false)
    .gte('transaction_date', from)
    .order('transaction_date', { ascending: true });

  if (error) {
    logError(error, { action: 'get_daily_spend' });
    return [];
  }

  const dayMap = new Map<string, number>();
  const now = new Date();
  for (let i = days - 1; i >= 0; i--) {
    const d = new Date(now);
    d.setDate(d.getDate() - i);
    dayMap.set(d.toISOString().split('T')[0], 0);
  }

  (data || []).forEach((r) => {
    const d = r.transaction_date;
    if (d && dayMap.has(d)) {
      dayMap.set(d, dayMap.get(d)! + Number(r.total_amount || 0));
    }
  });

  return Array.from(dayMap.entries()).map(([date, amount]) => ({ date, amount }));
};

/**
 * Fetch receipts pending reimbursement.
 *
 * @returns Array of receipts needing reimbursement.
 */
export const getReimbursementsPending = async (): Promise<ReceiptRow[]> => {
  try {
    const orgId = await getOrgIdString();
    if (!orgId) return [];

    const { data, error } = await supabase
      .from('receipts')
      .select('*')
      .eq('org_id', orgId)
      .eq('is_deleted', false)
      .eq('needs_reimbursement', true)
      .or('reimbursement_status.eq.pending,reimbursement_status.is.null')
      .order('created_at', { ascending: false });

    if (error) throw error;
    return parseReceiptRows(data || []);
  } catch (error) {
    logError(error, { action: 'fetch_pending_reimbursements' });
    return [];
  }
};

/**
 * Fetch business units (no org filter needed — global reference data).
 *
 * @returns Array of business units with id and name.
 * @throws {SupabaseError} If the DB query fails.
 */
export const getBusinessUnits = async (): Promise<{ id: string; name: string }[]> => {
  try {
    const { data, error } = await withRetry(
      () => supabase.from('business_units').select('id, name'),
      { maxRetries: MAX_RETRY_ATTEMPTS, delayMs: RETRY_DELAY_MS }
    );
    if (error) throw handleSupabaseError(error);
    return data || [];
  } catch (error) {
    const supabaseError = handleSupabaseError(error);
    logError(supabaseError, { action: 'fetch_business_units' });
    throw supabaseError;
  }
};

/**
 * Create an audit log entry with tamper-evident hash chain.
 * Audit log failures are non-blocking — logged and swallowed.
 *
 * @param userId - UUID of the user performing the action.
 * @param action - Action identifier (e.g., 'receipt_deleted').
 * @param details - Human-readable description of the action.
 */
export const createAuditLog = async (userId: string, action: string, details: string): Promise<void> => {
  try {
    const orgId = await getOrgIdString();
    const createdAt = new Date().toISOString();

    // Get the previous hash to chain from
    const { data: lastLog } = await supabase
      .from('audit_logs')
      .select('event_hash')
      .eq('org_id', orgId)
      .order('created_at', { ascending: false })
      .limit(1)
      .single();

    const previousHash = lastLog?.event_hash ?? null;
    const eventHash = computeAuditHash(action, details, previousHash, createdAt);

    await withRetry(
      () => supabase.from('audit_logs').insert({
        user_id: userId,
        org_id: orgId,
        action,
        details,
        created_at: createdAt,
        event_hash: eventHash,
        previous_hash: previousHash,
      }),
      { maxRetries: MAX_RETRY_ATTEMPTS, delayMs: RETRY_DELAY_MS }
    );
  } catch (error) {
    const supabaseError = handleSupabaseError(error);
    logError(supabaseError, { action: 'create_audit_log' });
  }
};

/**
 * Soft-delete a receipt (mark as deleted) with CRA retention check.
 * Approved receipts within the 7-year CRA window cannot be deleted.
 *
 * @param receiptId - UUID of the receipt to delete.
 * @param userId - UUID of the user performing the deletion.
 * @throws {Error} If the receipt is protected by retention policy, or DB operation fails.
 */
export const deleteReceipt = async (receiptId: string, userId: string): Promise<void> => {
  if (!receiptId) throw new Error('Receipt ID is required');
  if (!userId) throw new Error('User ID is required');

  const orgId = await getOrgIdString();
  if (!orgId) throw new Error('No organization found');

  // Check retention: prevent deletion of approved receipts within CRA window
  const { data: receipt } = await supabase
    .from('receipts')
    .select('approval_status, transaction_date')
    .eq('id', receiptId)
    .eq('org_id', orgId)
    .single();

  if (receipt?.approval_status === 'approved' && receipt.transaction_date) {
    const txDate = new Date(receipt.transaction_date);
    const retentionCutoff = new Date();
    retentionCutoff.setFullYear(retentionCutoff.getFullYear() - CRA_RETENTION_YEARS);
    if (txDate >= retentionCutoff) {
      throw new Error(`Cannot delete approved receipts within the ${CRA_RETENTION_YEARS}-year CRA retention period. Contact support if you have CRA authorization for early destruction.`);
    }
  }

  try {
    const { error } = await supabase
      .from('receipts')
      .update({ is_deleted: true, updated_at: new Date().toISOString() })
      .eq('id', receiptId)
      .eq('org_id', orgId);

    if (error) throw error;

    await createAuditLog(userId, 'receipt_deleted', `Receipt marked as deleted: ${receiptId}`);
  } catch (err) {
    if (err instanceof Error && err.message.includes('CRA retention')) throw err;
    logError(err, { action: 'delete_receipt' });
    throw err;
  }
};

/**
 * Soft-delete multiple receipts in bulk.
 * Note: individual CRA retention checks are simplified — failure on any protected receipt may fail the batch.
 *
 * @param receiptIds - Array of receipt UUIDs to delete.
 * @param userId - UUID of the user performing the operation.
 * @throws {Error} If the DB operation fails.
 */
export const bulkDeleteReceipts = async (receiptIds: string[], userId: string): Promise<void> => {
  if (!receiptIds.length) throw new Error('At least one receipt ID is required');
  if (!userId) throw new Error('User ID is required');

  const orgId = await getOrgIdString();
  if (!orgId) throw new Error('No organization found');

  try {
    const { error } = await supabase
      .from('receipts')
      .update({ is_deleted: true, updated_at: new Date().toISOString() })
      .in('id', receiptIds)
      .eq('org_id', orgId);

    if (error) throw error;

    await createAuditLog(userId, 'bulk_receipt_deleted', `Bulk delete: ${receiptIds.length} receipts by ${userId}`);
  } catch (err) {
    logError(err, { action: 'bulk_delete_receipts' });
    throw err;
  }
};

/**
 * Restore previously soft-deleted receipts (undo for bulk delete).
 * Only receipts the caller is allowed to touch (org-scoped; employees additionally
 * scoped to their own user) are restored.
 *
 * @param receiptIds - Array of receipt UUIDs to restore.
 * @throws {Error} If the DB operation fails.
 */
export const undeleteReceipts = async (receiptIds: string[]): Promise<void> => {
  if (!receiptIds.length) throw new Error('At least one receipt ID is required');

  const orgId = await getOrgIdString();
  if (!orgId) throw new Error('No organization found');

  const userId = (await supabase.auth.getUser()).data.user?.id;
  if (!userId) throw new Error('Not authenticated');

  try {
    const { error } = await supabase
      .from('receipts')
      .update({ is_deleted: false, updated_at: new Date().toISOString() })
      .in('id', receiptIds)
      .eq('org_id', orgId);

    if (error) throw error;

    await createAuditLog(userId, 'bulk_receipt_restored', `Bulk restore: ${receiptIds.length} receipts by ${userId}`);
  } catch (err) {
    logError(err, { action: 'bulk_undelete_receipts' });
    throw err;
  }
};

/**
 * Fetch audit logs for the current user's organization.
 *
 * @param limit - Max number of logs to return (default 50).
 * @returns Array of audit log entries.
 * @throws {SupabaseError} If the DB query fails.
 */
export const getAuditLogs = async (limit: number = 50) => {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return [];

    const orgId = await getOrgIdString();
    if (!orgId) return [];

    const { data, error } = await withRetry(
      () => supabase
        .from('audit_logs')
        .select('*')
        .eq('org_id', orgId)
        .order('created_at', { ascending: false })
        .limit(limit),
      { maxRetries: MAX_RETRY_ATTEMPTS, delayMs: RETRY_DELAY_MS }
    );
    if (error) throw handleSupabaseError(error);
    return data || [];
  } catch (error) {
    const supabaseError = handleSupabaseError(error);
    logError(supabaseError, { action: 'fetch_audit_logs' });
    throw supabaseError;
  }
};

// ─── Project Services ───

/**
 * Fetch all projects for the current user's organization.
 *
 * @returns Array of projects, sorted by name.
 */
export const getProjects = async (): Promise<Project[]> => {
  try {
    const orgId = await getOrgIdString();
    if (!orgId) return [];

    const { data, error } = await supabase
      .from('projects')
      .select('*')
      .eq('org_id', orgId)
      .order('name', { ascending: true });

    if (error) throw error;
    return (data || []) as Project[];
  } catch (error) {
    logError(error, { action: 'fetch_projects' });
    return [];
  }
};

/**
 * Create a new project.
 *
 * @param name - Project name (required).
 * @param code - Optional project code.
 * @param budgetAmount - Optional budget amount.
 * @returns The created project.
 * @throws {Error} If authentication or org context is missing, or DB write fails.
 */
export const createProject = async (name: string, code?: string, budgetAmount?: number): Promise<Project> => {
  if (!name || name.trim().length === 0) throw new Error('Project name is required');

  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Not authenticated');

    const orgId = await getOrgIdString();
    if (!orgId) throw new Error('Organization not found');

    const { data, error } = await withRetry(
      () => supabase
        .from('projects')
        .insert({ name: name.trim(), code: code ?? null, user_id: user.id, org_id: orgId, budget_amount: budgetAmount ?? null, status: 'active' })
        .select()
        .single(),
      { maxRetries: MAX_RETRY_ATTEMPTS, delayMs: RETRY_DELAY_MS }
    );
    if (error) throw handleSupabaseError(error);
    return data as Project;
  } catch (error) {
    const supabaseError = handleSupabaseError(error);
    logError(supabaseError, { action: 'create_project' });
    throw supabaseError;
  }
};

/**
 * Update a project's status.
 *
 * @param projectId - UUID of the project.
 * @param status - New status value.
 * @throws {SupabaseError} If org context is missing or DB update fails.
 */
export const updateProjectStatus = async (projectId: string, status: Project['status']): Promise<void> => {
  if (!projectId) throw new Error('Project ID is required');

  try {
    const orgId = await getOrgIdString();
    if (!orgId) throw new Error('No organization found');

    const { error } = await withRetry(
      () => supabase
        .from('projects')
        .update({ status })
        .eq('id', projectId)
        .eq('org_id', orgId),
      { maxRetries: MAX_RETRY_ATTEMPTS, delayMs: RETRY_DELAY_MS }
    );
    if (error) throw handleSupabaseError(error);
  } catch (error) {
    const supabaseError = handleSupabaseError(error);
    logError(supabaseError, { action: 'update_project_status' });
    throw supabaseError;
  }
};

/**
 * Update a project's budget amount.
 *
 * @param projectId - UUID of the project.
 * @param budgetAmount - New budget amount.
 * @throws {Error} If DB update fails.
 */
export const updateProjectBudget = async (projectId: string, budgetAmount: number): Promise<void> => {
  if (!projectId) throw new Error('Project ID is required');
  if (budgetAmount < 0) throw new Error('Budget amount cannot be negative');

  try {
    const orgId = await getOrgIdString();
    if (!orgId) throw new Error('No organization found');

    const { error } = await supabase
      .from('projects')
      .update({ budget_amount: budgetAmount })
      .eq('id', projectId)
      .eq('org_id', orgId);

    if (error) throw error;
  } catch (err) {
    logError(err, { action: 'update_project_budget' });
    throw err;
  }
};

/**
 * Delete a project, scoped to the current user's organization.
 *
 * @param projectId - UUID of the project to delete.
 * @throws {SupabaseError} If org context is missing or DB delete fails.
 */
export const deleteProject = async (projectId: string): Promise<void> => {
  if (!projectId) throw new Error('Project ID is required');

  try {
    const orgId = await getOrgIdString();
    if (!orgId) throw new Error('Organization not found');

    const { error } = await withRetry(
      () => supabase.from('projects').delete().eq('id', projectId).eq('org_id', orgId),
      { maxRetries: MAX_RETRY_ATTEMPTS, delayMs: RETRY_DELAY_MS }
    );
    if (error) throw handleSupabaseError(error);
  } catch (error) {
    const supabaseError = handleSupabaseError(error);
    logError(supabaseError, { action: 'delete_project' });
    throw supabaseError;
  }
};

// ─── Access Code Services ───

/**
 * Generate an access code for inviting users to the organization.
 *
 * @param role - Role to assign (default 'Employee').
 * @param businessUnitId - Optional business unit to assign.
 * @returns The generated access code string.
 * @throws {Error} If not authenticated or RPC call fails.
 */
export const generateAccessCode = async (role: UserRole = 'Employee', businessUnitId?: string): Promise<string> => {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');

  const { data, error } = await supabase.rpc('generate_access_code', {
    p_created_by: user.id,
    p_role: role,
    p_bu_id: businessUnitId ?? null,
  });
  if (error) throw error;
  return data as string;
};

/**
 * Redeem an access code, joining the user to the associated organization.
 *
 * @param code - The access code string.
 * @param userId - UUID of the user redeeming the code.
 * @returns Result with success flag and optional role/error.
 */
export const redeemAccessCode = async (code: string, userId: string): Promise<{ success: boolean; role?: string; error?: string }> => {
  if (!code) return { success: false, error: 'Access code is required' };
  if (!userId) return { success: false, error: 'User ID is required' };

  try {
    const { data, error } = await withRetry(
      () => supabase.rpc('redeem_access_code', {
        p_code: code,
        p_user_id: userId,
      }),
      { maxRetries: MAX_RETRY_ATTEMPTS, delayMs: RETRY_DELAY_MS }
    );
    if (error) throw handleSupabaseError(error);
    return data as unknown as RedeemAccessCodeReturns;
  } catch (error) {
    const supabaseError = handleSupabaseError(error);
    logError(supabaseError, { action: 'redeem_access_code' });
    return { success: false, error: supabaseError.userMessage };
  }
};

/**
 * Fetch access codes created by the current user.
 *
 * @returns Array of access codes created by the user.
 * @throws {SupabaseError} If the DB query fails.
 */
export const getMyAccessCodes = async (): Promise<AccessCode[]> => {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return [];

    const { data, error } = await withRetry(
      () => supabase
        .from('access_codes')
        .select('*')
        .eq('created_by', user.id)
        .order('created_at', { ascending: false })
        .limit(10),
      { maxRetries: MAX_RETRY_ATTEMPTS, delayMs: RETRY_DELAY_MS }
    );
    if (error) throw handleSupabaseError(error);
    return (data || []) as AccessCode[];
  } catch (error) {
    const supabaseError = handleSupabaseError(error);
    logError(supabaseError, { action: 'fetch_access_codes' });
    throw supabaseError;
  }
};

// ─── Approval Services ───

interface ApprovalUpdatePayload {
  approval_status: 'approved' | 'rejected';
  updated_at: string;
  reimbursement_status?: 'pending' | 'rejected';
}

/**
 * Update a receipt's approval status with server-side role verification.
 * Notifies the receipt uploader on status change.
 *
 * @param receiptId - UUID of the receipt.
 * @param status - 'approved' or 'rejected'.
 * @param userId - UUID of the user performing the action.
 * @param needsReimburse - Whether this receipt needs reimbursement.
 * @param vendorName - Vendor name for audit log.
 * @param transactionDate - Transaction date for audit log.
 * @throws {Error} If unauthorized, org not found, or DB update fails.
 */
export const updateReceiptApproval = async (
  receiptId: string,
  status: 'approved' | 'rejected',
  userId: string,
  needsReimburse: boolean,
  vendorName: string,
  transactionDate: string
) => {
  // Server-side role verification
  const verifiedRole = await getUserRole(userId);
  if (!['Owner', 'Accountant'].includes(verifiedRole)) {
    throw new Error('Unauthorized: only Owners and Accountants can approve receipts');
  }

  const orgId = await getOrgIdString();
  if (!orgId) throw new Error('No organization found');

  const updatePayload: ApprovalUpdatePayload = {
    approval_status: status,
    updated_at: new Date().toISOString(),
  };

  if (needsReimburse) {
    updatePayload.reimbursement_status = status === 'approved' ? 'pending' : 'rejected';
  }

  const { error } = await supabase
    .from('receipts')
    .update(updatePayload)
    .eq('id', receiptId)
    .eq('org_id', orgId);

  if (error) throw new Error(`Failed to update receipt: ${error.message}`);

  // Audit log with org_id and hash chain
  await createAuditLog(userId, `receipt_${status}`, `Receipt ${status}: ${vendorName} (${transactionDate}) by ${verifiedRole}`);

  // Notify the receipt uploader
  try {
    const { data: receiptData } = await supabase
      .from('receipts')
      .select('user_id')
      .eq('id', receiptId)
      .eq('org_id', orgId)
      .single();

    if (receiptData?.user_id && receiptData.user_id !== userId) {
      await notifyUser({
        type: status === 'approved' ? 'receipt_approved' : 'receipt_rejected',
        title: status === 'approved' ? 'Receipt Approved ✓' : 'Receipt Rejected ✗',
        message: `Your receipt from ${vendorName} (${transactionDate}) was ${status} by ${verifiedRole}.`,
        link: `/?tab=receipts`,
        userId: receiptData.user_id,
        orgId,
      });
    }
  } catch (err) {
    logError(err, { action: 'approval_notification', receiptId, status });
  }
};

/**
 * Mark a receipt's reimbursement as paid.
 *
 * @param receiptId - UUID of the receipt.
 * @param userId - UUID of the user marking it as paid.
 * @param vendorName - Vendor name for audit log.
 * @param transactionDate - Transaction date for audit log.
 * @throws {Error} If unauthorized, org not found, or DB update fails.
 */
export const markReimbursementPaid = async (
  receiptId: string,
  userId: string,
  vendorName: string,
  transactionDate: string
) => {
  const verifiedRole = await getUserRole(userId);
  if (!['Owner', 'Accountant'].includes(verifiedRole)) {
    throw new Error('Unauthorized: only Owners and Accountants can mark reimbursements as paid');
  }

  const orgId = await getOrgIdString();
  if (!orgId) throw new Error('No organization found');

  const { error } = await supabase
    .from('receipts')
    .update({
      reimbursement_status: 'approved',
      updated_at: new Date().toISOString(),
    })
    .eq('id', receiptId)
    .eq('org_id', orgId);

  if (error) throw new Error(`Failed to mark reimbursement paid: ${error.message}`);

  await createAuditLog(userId, 'reimbursement_paid', `Reimbursement paid: ${vendorName} (${transactionDate}) by ${verifiedRole}`);

  // Notify the receipt uploader
  try {
    const { data: receiptData } = await supabase
      .from('receipts')
      .select('user_id')
      .eq('id', receiptId)
      .eq('org_id', orgId)
      .single();

    if (receiptData?.user_id && receiptData.user_id !== userId) {
      await notifyUser({
        type: 'reimbursement_paid',
        title: 'Reimbursement Paid 💰',
        message: `Your reimbursement of ${vendorName} (${transactionDate}) has been marked as paid.`,
        link: `/?tab=receipts`,
        userId: receiptData.user_id,
        orgId,
      });
    }
  } catch (err) {
    logError(err, { action: 'reimbursement_notification', receiptId });
  }
};

/**
 * Bulk update approval status for multiple receipts via atomic RPC.
 * Avoids N+1 queries by using a single atomic database operation.
 *
 * @param receiptIds - Array of receipt UUIDs to update.
 * @param status - New approval status ('approved' | 'rejected').
 * @param userId - UUID of the caller.
 * @throws {SupabaseError} If unauthorized, org not found, or DB update fails.
 */
export const bulkUpdateApproval = async (
  receiptIds: string[],
  status: 'approved' | 'rejected',
  userId: string
) => {
  if (!receiptIds.length) throw new Error('At least one receipt ID is required');

  try {
    const verifiedRole = await getUserRole(userId);
    if (!['Owner', 'Accountant'].includes(verifiedRole)) {
      throw new Error('Unauthorized: only Owners and Accountants can approve receipts');
    }

    const orgId = await getOrgIdString();
    if (!orgId) throw new Error('No organization found');

    const { data: updated, error: updateError } = await supabase
      .from('receipts')
      .update({ approval_status: status, updated_at: new Date().toISOString() })
      .in('id', receiptIds)
      .eq('org_id', orgId)
      .eq('is_deleted', false)
      .select('id');

    if (updateError) throw handleSupabaseError(updateError);

    const updatedCount = updated?.length ?? 0;

    supabase.from('audit_logs').insert({
      user_id: userId,
      org_id: orgId,
      action: `bulk_${status}`,
      details: `Bulk ${status}: ${updatedCount} receipts`,
    }).then(null, (err) => logError(err, { action: 'bulk_approval_audit_log' }));

    return updatedCount;
  } catch (error) {
    const supabaseError = handleSupabaseError(error);
    logError(supabaseError, { action: 'bulk_update_approval' });
    throw supabaseError;
  }
};

// ─── Edit Services (Immutable Archive-Before-Update) ───

/**
 * Update a receipt with archive-before-update immutability.
 * Archives the full current snapshot to receipt_history first,
 * then applies the update. If the update fails, the archive is rolled back.
 *
 * @param receiptId - UUID of the receipt to update.
 * @param updatedData - Partial fields to update.
 * @param userId - UUID of the editor.
 * @param originalReceipt - The full current receipt snapshot to archive.
 * @throws {Error} If org not found, history archive fails, or update fails.
 */
export const updateReceipt = async (
  receiptId: string,
  updatedData: Partial<ReceiptRow>,
  userId: string,
  originalReceipt: ReceiptRow
) => {
  if (!receiptId) throw new Error('Receipt ID is required');
  if (!userId) throw new Error('User ID is required');

  const orgId = await getOrgIdString();
  if (!orgId) throw new Error('No organization found');

  // Archive full snapshot to receipt_history FIRST (compensation if next step fails)
  const archivePayload = {
    org_id: orgId,
    receipt_id: originalReceipt.id,
    user_id: originalReceipt.user_id,
    vendor_name: originalReceipt.vendor_name,
    vendor_tax_number: originalReceipt.vendor_tax_number ?? originalReceipt.business_number ?? null,
    business_number: originalReceipt.business_number ?? null,
    transaction_date: originalReceipt.transaction_date,
    total_amount: originalReceipt.total_amount,
    subtotal: originalReceipt.subtotal ?? null,
    tax_amount: originalReceipt.tax_amount,
    pst_amount: originalReceipt.pst_amount ?? null,
    payment_method: originalReceipt.payment_method,
    category: originalReceipt.category,
    notes: originalReceipt.notes,
    document_type: originalReceipt.document_type ?? 'receipt',
    project_id: originalReceipt.project_id ?? null,
    exchange_rate: originalReceipt.exchange_rate ?? null,
    cad_equivalent: originalReceipt.cad_equivalent ?? null,
    duplicate_hash: originalReceipt.duplicate_hash,
    integrity_hash: originalReceipt.integrity_hash,
    archived_at: new Date().toISOString(),
    archived_by: userId,
  };

  const { data: archiveRecord, error: archiveError } = await supabase
    .from('receipt_history')
    .insert(archivePayload)
    .select('id')
    .single();

  if (archiveError) throw new Error(`History archive failed: ${archiveError.message}`);

  const updatePayload = {
    ...updatedData,
    updated_at: new Date().toISOString(),
  };

  const { error: updateError } = await supabase
    .from('receipts')
    .update(updatePayload)
    .eq('id', receiptId)
    .eq('org_id', orgId);

  // Compensation — if update fails, delete the orphaned history record
  if (updateError) {
    await supabase.from('receipt_history').delete().eq('id', archiveRecord.id);
    throw new Error(updateError.message);
  }

  await createAuditLog(userId, 'receipt_edited', `Receipt updated: ${Object.keys(updatedData).join(', ')} modified for ${originalReceipt.vendor_name}. Previous version archived.`);
};

/**
 * Update only the notes field of a receipt (convenience wrapper around updateReceipt).
 *
 * @param receiptId - UUID of the receipt.
 * @param notesValue - New notes content.
 * @param userId - UUID of the editor.
 * @param receipt - The current receipt snapshot.
 */
export const updateReceiptNotes = async (
  receiptId: string,
  notesValue: string,
  userId: string,
  receipt: ReceiptRow
) => {
  return updateReceipt(receiptId, { notes: notesValue }, userId, receipt);
}

// ─── Save Receipt (with Merkle chain) ───

const ALLOWED_RECEIPT_COLUMNS: readonly string[] = [
  'vendor_name', 'vendor_address', 'vendor_tax_number', 'business_number',
  'total_amount', 'subtotal', 'tax_amount', 'pst_amount', 'currency',
  'transaction_date', 'transaction_time', 'payment_method', 'card_last_four',
  'category', 'notes', 'document_type', 'business_unit_id', 'project_id',
  'image_url', 'confidence_score', 'cra_readiness_score', 'thermal_warning',
  'paid_by', 'needs_reimbursement', 'reimbursement_status',
  'duplicate_hash', 'duplicate_warning', 'math_mismatch_warning',
  'fraud_suspicion', 'fraud_reason', 'line_items', 'capture_source',
  'job_code', 'vehicle_id', 'usage_type', 'business_use_percent',
  'payment_reference', 'blur_score',
];

/**
 * Save a new receipt with:
 * - Exchange rate auto-fetch for non-CAD currencies
 * - Merkle chain linking via integrity hash
 * - Whitelist-based column sanitization (prevents mass assignment)
 * - Vendor defaults update (fire-and-forget)
 * - Compensation on audit log failure (soft-deletes the orphaned receipt)
 * - Admin notifications on new receipt
 *
 * @param payload - Raw receipt data (whitelist-filtered before insert).
 * @param integrityHash - SHA-256 or similar hash for the Merkle chain.
 * @param userId - UUID of the user creating the receipt.
 * @returns The inserted receipt's id.
 * @throws {Error} If the DB insert fails.
 */
export const saveReceipt = async (
  payload: Record<string, unknown>,
  integrityHash: string,
  userId: string
) => {
  if (!userId) throw new Error('User ID is required');

  const isMismatch = isMathMismatch(
    Number(payload.subtotal ?? 0),
    Number(payload.tax_amount ?? 0),
    Number(payload.pst_amount ?? 0),
    Number(payload.total_amount ?? 0)
  );

  // Auto-fetch authoritative exchange rate from Bank of Canada
  const currency = String(payload.currency ?? 'CAD');
  const totalAmount = Number(payload.total_amount ?? 0);
  const transactionDate = String(payload.transaction_date ?? new Date().toISOString().split('T')[0]);

  let exchangeRate = Number(payload.exchange_rate ?? 1.0);
  if (currency !== 'CAD' && transactionDate) {
    try {
      exchangeRate = await getHistoricalCADRate(currency, transactionDate);
    } catch (err) {
      logError(err, { action: 'fx_rate_in_save', currency, transactionDate });
    }
  }
  const cadEquivalent = currency !== 'CAD' ? Math.round(totalAmount * exchangeRate * 100) / 100 : null;

  // Whitelist-based column sanitization — prevent mass assignment
  const sanitizedPayload: Record<string, unknown> = {};
  for (const key of ALLOWED_RECEIPT_COLUMNS) {
    if (key in payload) {
      sanitizedPayload[key] = payload[key];
    }
  }

  const orgId = await getOrgIdString();

  // Force server-controlled values
  sanitizedPayload.user_id = userId;
  sanitizedPayload.org_id = orgId || undefined;
  sanitizedPayload.business_unit_id = payload.business_unit_id === '' ? null : payload.business_unit_id;
  sanitizedPayload.project_id = payload.project_id === '' ? null : payload.project_id;
  sanitizedPayload.integrity_hash = integrityHash;
  sanitizedPayload.math_mismatch_warning = isMismatch;
  sanitizedPayload.cad_equivalent = cadEquivalent;
  sanitizedPayload.exchange_rate = exchangeRate;

  // Strip empty strings to prevent database pollution
  for (const key of Object.keys(sanitizedPayload)) {
    if (sanitizedPayload[key] === '') {
      sanitizedPayload[key] = null;
    }
  }

  // Use the atomic PG function for race-free Merkle chain
  const { data, error } = await supabase.rpc('save_receipt_atomic', {
    p_payload: sanitizedPayload,
    p_user_id: userId,
  });

  if (error) throw error;

  const newReceiptId = data as string;

  // Fire-and-forget: update vendor recognition defaults (never blocks save)
  if (orgId) {
    updateVendorDefaults(orgId, {
      vendor_name: String(payload.vendor_name ?? ''),
      category: payload.category ? String(payload.category) : null,
      job_code: payload.job_code ? String(payload.job_code) : null,
      business_use_percent: payload.business_use_percent != null ? Number(payload.business_use_percent) : null,
    }).catch((err) => logError(err, { action: 'vendor_defaults_update' }));

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

        try {
          await supabase.from('notifications').insert(notificationPayload);
        } catch (notifErr) {
          logWarn('Failed to send receipt notification', { userId, orgId, error: notifErr instanceof Error ? notifErr.message : 'Unknown' });
        }
      }
    } catch (adminErr) {
      logWarn('Failed to query org admins for notification', { userId, orgId, error: adminErr instanceof Error ? adminErr.message : 'Unknown' });
    }
}
 
  return newReceiptId;
};

// ─── Bank Reconciliation ───

/**
 * Fetch bank transactions for the current org.
 *
 * @returns Array of bank transactions.
 * @throws {SupabaseError} If the DB query fails.
 */
export const getBankTransactions = async () => {
  const orgId = await getOrgIdString();
  if (!orgId) return [];

  try {
    const { data, error } = await supabase
      .from('bank_transactions')
      .select('*')
      .eq('org_id', orgId)
      .order('date', { ascending: false });

    if (error) throw handleSupabaseError(error);
    return data;
  } catch (err) {
    const supabaseError = handleSupabaseError(err);
    logError(supabaseError, { action: 'get_bank_transactions' });
    throw supabaseError;
  }
};

/**
 * Get the count of unmatched bank transactions.
 *
 * @returns Count of unmatched transactions, or 0 on error.
 */
export const getUnmatchedBankCount = async (): Promise<number> => {
  const orgId = await getOrgIdString();
  if (!orgId) return 0;

  try {
    const { count, error } = await supabase
      .from('bank_transactions')
      .select('*', { count: 'exact', head: true })
      .eq('org_id', orgId)
      .is('matched_receipt_id', null)
      .eq('is_reconciled', false);

    if (error) {
      logError(error, { action: 'get_unmatched_bank_count' });
      return 0;
    }
    return count || 0;
  } catch (err) {
    logError(err, { action: 'get_unmatched_bank_count' });
    return 0;
  }
};

/**
 * Confirm a bank-to-receipt match, marking the transaction as reconciled.
 *
 * @param bankTransactionId - UUID of the bank transaction.
 * @param receiptId - UUID of the matched receipt.
 * @param method - Match method ('manual' or 'confirmed_fuzzy').
 * @param confidence - Optional confidence score for fuzzy matches.
 * @param orgId - Optional org UUID. Auto-resolved from session if omitted.
 * @throws {SupabaseError} If org cannot be resolved or DB update fails.
 */
export const confirmBankMatch = async (
  bankTransactionId: string,
  receiptId: string,
  method: 'manual' | 'confirmed_fuzzy',
  confidence?: number,
  overrideOrgId?: string
) => {
  const resolvedOrgId = overrideOrgId || await getOrgIdString();
  if (!resolvedOrgId) throw new Error('Could not determine organization ID');

  try {
    const { error } = await supabase
      .from('bank_transactions')
      .update({
        matched_receipt_id: receiptId,
        match_method: method,
        match_confidence: confidence ?? null,
        is_reconciled: true,
      })
      .eq('id', bankTransactionId)
      .eq('org_id', resolvedOrgId);

    if (error) throw handleSupabaseError(error);
  } catch (err) {
    const supabaseError = handleSupabaseError(err);
    logError(supabaseError, { action: 'confirm_bank_match' });
    throw supabaseError;
  }
};

/**
 * Get formatted data for CRA tax form generation.
 * Returns receipts formatted for T2125/T777 tax forms.
 */
export const getCRAFormData = async (
  year: number, 
  dateRange?: { from: string; to: string }
): Promise<{
  receiptCount: number;
  dateRange: { from: string; to: string };
  totalBusinessExpenses: number;
  totalGSTPaid: number;
  mileageTotalDeduction: number;
  mileageTotalKm: number;
  expensesByCategory: Array<{ category: string; total: number; gst: number; receiptCount: number }>;
  mileageByVehicle: Array<{ vehicleNickname: string; km: number; amount: number }>;
  topVendors: Array<{ vendor_name: string; business_number: string; total: number; receiptCount: number }>;
  receipts: ReceiptRow[];
  categories: Array<{ name: string; total: number; count: number; items: ReceiptRow[] }>;
  totalMileageKm: number;
  totalMileageAmount: number;
  mileageLogs: Array<{ distance_km: number; total_amount: number; trip_date: string; purpose: string }>;
  year: number;
}> => {
  const orgId = await getOrgIdString();
  if (!orgId) throw new Error('No organization found');

  const startDate = dateRange?.from || `${year}-01-01`;
  const endDate = dateRange?.to || `${year}-12-31`;

  const { data, error } = await supabase
    .from('receipts')
    .select('*')
    .eq('org_id', orgId)
    .eq('is_deleted', false)
    .gte('transaction_date', startDate)
    .lte('transaction_date', endDate)
    .order('transaction_date', { ascending: true });

  if (error) throw handleSupabaseError(error);

  const receipts = parseReceiptRows(data || []);
  
  // Group by category for T2125
  const categoryMap = new Map<string, { total: number; count: number; items: ReceiptRow[] }>();
  for (const r of receipts) {
    const cat = r.category || 'Uncategorized';
    const existing = categoryMap.get(cat) || { total: 0, count: 0, items: [] };
    existing.total += Number(r.total_amount || 0);
    existing.count += 1;
    existing.items.push(r);
    categoryMap.set(cat, existing);
  }

  // Get mileage data
  const { data: mileageData } = await supabase
    .from('mileage_logs')
    .select('*')
    .eq('org_id', orgId)
    .gte('trip_date', startDate)
    .lte('trip_date', endDate);

  const mileageLogs = (mileageData || []) as { distance_km: number; total_amount: number; trip_date: string; purpose: string }[];
  const totalMileageKm = mileageLogs.reduce((sum, m) => sum + Number(m.distance_km), 0);
  const totalMileageAmount = mileageLogs.reduce((sum, m) => sum + Number(m.total_amount), 0);

  return {
    receiptCount: receipts.length,
    dateRange: { from: startDate, to: endDate },
    totalBusinessExpenses: receipts.reduce((sum, r) => sum + Number(r.total_amount || 0), 0),
    totalGSTPaid: receipts.reduce((sum, r) => sum + Number(r.tax_amount || 0), 0),
    mileageTotalDeduction: totalMileageAmount,
    mileageTotalKm: totalMileageKm,
    expensesByCategory: Array.from(categoryMap.entries()).map(([category, data]) => ({
      category,
      total: data.total,
      gst: data.items.reduce((sum, r) => sum + Number(r.tax_amount || 0), 0),
      receiptCount: data.count,
    })),
    mileageByVehicle: Object.entries(
      mileageLogs.reduce((acc: Record<string, { km: number; amount: number }>, m) => {
        const key = m.purpose || 'Unknown';
        if (!acc[key]) acc[key] = { km: 0, amount: 0 };
        acc[key].km += Number(m.distance_km);
        acc[key].amount += Number(m.total_amount);
        return acc;
      }, {})
    ).map(([vehicleNickname, v]) => ({ vehicleNickname, km: v.km, amount: v.amount })),
    topVendors: Object.entries(
      receipts.reduce((acc: Record<string, { amount: number; count: number; businessNumber: string }>, r) => {
        const vendor = r.vendor_name || 'Unknown';
        if (!acc[vendor]) acc[vendor] = { amount: 0, count: 0, businessNumber: r.business_number || r.vendor_tax_number || '' };
        acc[vendor].amount += Number(r.total_amount || 0);
        acc[vendor].count += 1;
        return acc;
      }, {})
    )
      .map(([vendor, v]) => ({ vendor_name: vendor, business_number: v.businessNumber, total: v.amount, receiptCount: v.count }))
      .sort((a, b) => b.total - a.total)
      .slice(0, 10),
    receipts,
    categories: Array.from(categoryMap.entries()).map(([name, data]) => ({ name, ...data })),
    totalMileageKm,
    totalMileageAmount,
    mileageLogs,
    year,
  };
};