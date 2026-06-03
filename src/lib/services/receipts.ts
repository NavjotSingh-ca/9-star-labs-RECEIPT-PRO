import { z } from 'zod';
import { supabase, getOrgIdString } from '@/lib/supabase';
import { isMathMismatch } from '@/lib/finance-utils';
import { handleSupabaseError, withRetry } from '@/lib/supabase-error-handler';
import type { ReceiptRow, Project, AccessCode, UserRole } from '@/lib/types';
import { getUserRole } from '@/lib/services/roles';
import { getHistoricalCADRate } from '@/lib/services/fx-rates';
import { updateVendorDefaults } from '@/lib/services/vendor-defaults';
import { logError } from '@/lib/logger';

// ─── Zod Schemas ───

export const lineItemSchema = z.object({
  description: z.string().nullish().transform((val) => val ?? ''),
  quantity: z.number().nullish().transform((val) => val ?? 1),
  unit_price: z.number().nullish().transform((val) => val ?? 0),
  tax_rate: z.number().nullish().transform((val) => val ?? 0),
  tax_amount: z.number().nullish().transform((val) => val ?? 0),
  line_total: z.number().nullish().transform((val) => val ?? 0),
  category: z.string().nullish().transform((val) => val ?? ''),
}).catchall(z.any());

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
  line_items: z.any().transform((val) => {
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
}).catchall(z.any());

// ─── Receipt Queries ───


// Helper to get current organization ID
async function getOrgId(): Promise<{ id: string } | null> {
  const id = await getOrgIdString();
  return id ? { id } : null;
}

export async function getReceipts(role: UserRole, userId?: string, limit = 1000, offset = 0): Promise<ReceiptRow[]> {
  if (!userId) return [];

  try {
    // Get org_id for proper tenant isolation
    const orgData = await getOrgId();
    if (!orgData) return [];
    const orgId = orgData.id;

    const result = await withRetry(
      () => {
        let query = supabase
          .from('receipts')
          .select('*')
          .eq('org_id', orgId)
          .eq('is_deleted', false)
          .range(offset, offset + limit - 1)
          .order('transaction_date', { ascending: false })
          .order('created_at', { ascending: false });

        if (role === 'Employee') {
          query = query.eq('user_id', userId);
        }

        return query;
      },
      { maxRetries: 2, delayMs: 500 }
    );

    const { data, error } = result;
    if (error) throw handleSupabaseError(error);

    return (data || []).map((row) => receiptSchema.parse(row) as ReceiptRow);
  } catch (error) {
    const supabaseError = handleSupabaseError(error);
    logError(supabaseError, { action: 'fetch_receipts' });
    throw supabaseError;
  }
}

export async function getReceiptsPaginated(params: {
  role: UserRole;
  userId?: string;
  limit?: number;
  offset?: number;
  category?: string;
  fromDate?: string;
  toDate?: string;
  approvalStatus?: string;
  search?: string;
  semanticIds?: string[];
}): Promise<{ receipts: ReceiptRow[]; totalCount: number }> {
  if (!params.userId) return { receipts: [], totalCount: 0 };

  const orgId = await getOrgId();
  if (!orgId) return { receipts: [], totalCount: 0 };

  const { data, error } = await supabase.rpc('get_receipts_paginated', {
    p_org_id: orgId.id,
    p_user_id: params.userId,
    p_role: params.role,
    p_limit: params.limit || 25,
    p_offset: params.offset || 0,
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

  // The RPC returns an array of rows: { receipt: JSON, total_count: bigint }
  const rows = data as { receipt: unknown; total_count: number | string }[];
  if (!rows || rows.length === 0) return { receipts: [], totalCount: 0 };

  const totalCount = Number(rows[0].total_count);
  const receipts = rows.map(r => receiptSchema.parse(r.receipt) as ReceiptRow);

  return { receipts, totalCount };
}

export const getReceiptsPendingApproval = async (): Promise<ReceiptRow[]> => {
  try {
    // Get org_id for proper tenant isolation
    const orgId = await getOrgId();
    if (!orgId) return [];

    const { data, error } = await withRetry(
      () => supabase
        .from('receipts')
        .select('*')
        .eq('org_id', orgId.id)
        .eq('is_deleted', false)
        .eq('approval_status', 'submitted')
        .order('created_at', { ascending: false }),
      { maxRetries: 2, delayMs: 500 }
    );

    if (error) throw handleSupabaseError(error);

    return (data || []).map((row) => receiptSchema.parse(row) as ReceiptRow);
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

export const getDashboardSummary = async (role: UserRole, userId: string): Promise<DashboardSummary> => {
  const orgData = await getOrgId();
  if (!orgData) throw new Error('No organization found');
  const orgId = orgData.id;

  // 1. Fetch Core Stats via RPC
  const { data: stats, error: statsError } = await supabase.rpc('get_dashboard_stats', { 
    p_org_id: orgId,
    p_user_id: userId,
    p_role: role
  });
  if (statsError) throw statsError;
  const mainStats = stats[0] || {};

  // 2. Fetch Category Breakdown
  let categoryQuery = supabase
    .from('receipts')
    .select('category, total_amount')
    .eq('org_id', orgId)
    .eq('is_deleted', false);
  
  if (role === 'Employee') categoryQuery = categoryQuery.eq('user_id', userId);
  
  const { data: categoryData } = await categoryQuery;
  const categoryMap = new Map<string, number>();
  (categoryData || []).forEach(r => {
    const cat = r.category || 'Uncategorized';
    categoryMap.set(cat, (categoryMap.get(cat) ?? 0) + Number(r.total_amount || 0));
  });

  const spendingByCategory = Array.from(categoryMap.entries())
    .map(([name, amount]) => ({ name, amount }))
    .sort((a, b) => b.amount - a.amount);

  // 3. Fetch Alert Counts with error handling
  let missingBN = 0;
  let pendingReview = 0;
  let flaggedAudit = 0;

  try {
    const result = await supabase.from('receipts').select('*', { count: 'exact', head: true }).eq('org_id', orgId).eq('is_deleted', false).or('vendor_tax_number.is.null,vendor_tax_number.eq.');
    missingBN = result.count || 0;
  } catch (e) {
    logError(e, { action: 'dashboard_missing_bn_count' });
  }

  try {
    const result = await supabase.from('receipts').select('*', { count: 'exact', head: true }).eq('org_id', orgId).eq('is_deleted', false).eq('approval_status', 'submitted');
    pendingReview = result.count || 0;
  } catch (e) {
    logError(e, { action: 'dashboard_pending_review_count' });
  }

  try {
    const result = await supabase.from('receipts').select('*', { count: 'exact', head: true }).eq('org_id', orgId).eq('is_deleted', false).eq('flagged_for_audit', true);
    flaggedAudit = result.count || 0;
  } catch (e) {
    logError(e, { action: 'dashboard_flagged_audit_count' });
  }

  // 4. Fetch Reimbursement Queue
  const { data: reimbursements } = await supabase
    .from('receipts')
    .select('*')
    .eq('org_id', orgId)
    .eq('is_deleted', false)
    .eq('paid_by', 'employee_cash')
    .eq('reimbursement_status', 'pending')
    .limit(5);

  // MED-4: Fetch real monthly trend data (last 6 months)
  let monthlyTrend: { month: string; amount: number }[] = [];
  try {
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);
    let trendQuery = supabase
      .from('receipts')
      .select('transaction_date, total_amount')
      .eq('org_id', orgId)
      .eq('is_deleted', false)
      .gte('created_at', sixMonthsAgo.toISOString());
    if (role === 'Employee') trendQuery = trendQuery.eq('user_id', userId);
    const { data: trendData } = await trendQuery;
    const monthMap = new Map<string, number>();
    (trendData || []).forEach(r => {
      const d = String(r.transaction_date || '').slice(0, 7); // YYYY-MM
      if (d) monthMap.set(d, (monthMap.get(d) ?? 0) + Number(r.total_amount || 0));
    });
    monthlyTrend = Array.from(monthMap.entries())
      .map(([month, amount]) => ({ month, amount: Math.round(amount * 100) / 100 }))
      .sort((a, b) => a.month.localeCompare(b.month))
      .slice(-6);
  } catch (e) { logError(e, { action: 'dashboard_monthly_trend' }); }
  
  // MED-4: Fetch real high-confidence and duplicate-blocked counts
  let highConfidenceCount = 0;
  let duplicatesBlockedCount = 0;
  try {
    const [hcResult, dbResult] = await Promise.all([
      supabase.from('receipts').select('*', { count: 'exact', head: true })
        .eq('org_id', orgId).eq('is_deleted', false).gte('confidence_score', 80),
      supabase.from('receipts').select('*', { count: 'exact', head: true })
        .eq('org_id', orgId).eq('is_deleted', false).eq('duplicate_warning', true),
    ]);
    highConfidenceCount = hcResult.count || 0;
    duplicatesBlockedCount = dbResult.count || 0;
  } catch (e) { logError(e, { action: 'dashboard_confidence_counts' }); }

  // Fetch unmatched bank transaction count
  let unmatchedBankCount = 0;
  try {
    const { count } = await supabase
      .from('bank_transactions')
      .select('*', { count: 'exact', head: true })
      .eq('org_id', orgId)
      .is('matched_receipt_id', null)
      .eq('is_reconciled', false);
    unmatchedBankCount = count || 0;
  } catch (e) { logError(e, { action: 'dashboard_unmatched_bank' }); }

  // Fetch mileage totals
  let mileageTotalAmount = 0;
  let mileageTotalKm = 0;
  try {
    const { data: mileageData } = await supabase
      .from('mileage_logs')
      .select('distance_km, total_amount')
      .eq('org_id', orgId);
    mileageTotalAmount = (mileageData || []).reduce((s, r) => s + Number(r.total_amount), 0);
    mileageTotalKm = (mileageData || []).reduce((s, r) => s + Number(r.distance_km), 0);
  } catch (e) { logError(e, { action: 'dashboard_mileage' }); }

  return {
    totalSpent: Number(mainStats.total_spent || 0) + mileageTotalAmount,
    gstRecoverable: Number(mainStats.gst_recoverable || 0),
    pstRecoverable: Number(mainStats.pst_recoverable || 0),
    receiptCount: Number(mainStats.receipt_count || 0),
    avgTransaction: Number(mainStats.avg_transaction || 0),
    missingBNCount: missingBN || 0,
    pendingReviewCount: pendingReview || 0,
    flaggedAuditCount: flaggedAudit || 0,
    spendingByCategory,
    monthlyTrend,
    reimbursementQueue: (reimbursements || []).map(r => receiptSchema.parse(r) as ReceiptRow),
    highConfidenceCount,
    duplicatesBlockedCount,
    unmatchedBankCount,
    mileageTotalAmount: Math.round(mileageTotalAmount * 100) / 100,
    mileageTotalKm: Math.round(mileageTotalKm * 10) / 10,
  };
};

export const getDailySpend = async (days = 30): Promise<{ date: string; amount: number }[]> => {
  const orgId = await getOrgId();
  if (!orgId) return [];

  const fromDate = new Date();
  fromDate.setDate(fromDate.getDate() - days);
  const from = fromDate.toISOString().split('T')[0];

  const { data, error } = await supabase
    .from('receipts')
    .select('transaction_date, total_amount')
    .eq('org_id', orgId.id)
    .eq('is_deleted', false)
    .gte('transaction_date', from)
    .order('transaction_date', { ascending: true });

  if (error) return [];

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

export const getReimbursementsPending = async (userId: string): Promise<ReceiptRow[]> => {
  try {
    // Get the user's organization for proper tenant isolation
    const orgId = await getOrgId();
    if (!orgId) return [];

    const { data, error } = await supabase
      .from('receipts')
      .select('*')
      .eq('org_id', orgId.id)
      .eq('is_deleted', false)
      .eq('needs_reimbursement', true)
      .or('reimbursement_status.eq.pending,reimbursement_status.is.null')
      .order('created_at', { ascending: false });

    if (error) throw error;
    return (data || []).map((row) => receiptSchema.parse(row) as ReceiptRow);
  } catch (error) {
    logError(error, { action: 'fetch_pending_reimbursements' });
    return [];
  }
};

export const getBusinessUnits = async () => {
  try {
    const { data, error } = await withRetry(
      () => supabase.from('business_units').select('id, name'),
      { maxRetries: 2, delayMs: 500 }
    );
    if (error) throw handleSupabaseError(error);
    return data || [];
  } catch (error) {
    const supabaseError = handleSupabaseError(error);
    logError(supabaseError, { action: 'fetch_business_units' });
    throw supabaseError;
  }
};

export const createAuditLog = async (userId: string, action: string, details: string) => {
  try {
    const { data: orgData } = await withRetry(
      () => supabase.rpc('get_user_org'),
      { maxRetries: 2, delayMs: 500 }
    );
    const orgId = orgData as unknown as string;

    await withRetry(
      () => supabase.from('audit_logs').insert({
        user_id: userId,
        org_id: orgId || null,
        action,
        details,
        created_at: new Date().toISOString()
      }),
      { maxRetries: 2, delayMs: 500 }
    );
  } catch (error) {
    const supabaseError = handleSupabaseError(error);
    logError(supabaseError, { action: 'create_audit_log' });
    // Audit log failures should not block the main operation
  }
};

export const deleteReceipt = async (receiptId: string, userId: string): Promise<void> => {
  const orgId = await getOrgId();
  const role = await getUserRole(userId);

  // Check retention: prevent deletion of approved receipts within 6-year CRA window
  const { data: receipt } = await supabase
    .from('receipts')
    .select('approval_status, transaction_date')
    .eq('id', receiptId)
    .eq('org_id', orgId?.id || '')
    .single();

  if (receipt?.approval_status === 'approved' && receipt.transaction_date) {
    const txDate = new Date(receipt.transaction_date);
    const sevenYearsAgo = new Date();
    sevenYearsAgo.setFullYear(sevenYearsAgo.getFullYear() - 7);
    if (txDate >= sevenYearsAgo) {
      throw new Error('Cannot delete approved receipts within the 7-year CRA retention period. Contact support if you have CRA authorization for early destruction.');
    }
  }

  let query = supabase
    .from('receipts')
    .update({ is_deleted: true, updated_at: new Date().toISOString() })
    .eq('id', receiptId)
    .eq('org_id', orgId?.id || '');

  if (role === 'Employee') {
    query = query.eq('user_id', userId);
  }

  const { error } = await query;
  if (error) throw error;

  await createAuditLog(userId, 'receiptdeleted', `Receipt marked as deleted: ${receiptId}`);
};

export const getAuditLogs = async (limit = 50) => {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return [];

    // Get user's org
    const { data: orgData } = await withRetry(
      () => supabase.rpc('get_user_org'),
      { maxRetries: 2, delayMs: 500 }
    );
    const orgId = orgData as unknown as string;
    if (!orgId) return [];

    const { data, error } = await withRetry(
      () => supabase
        .from('audit_logs')
        .select('*')
        .eq('org_id', orgId)
        .order('created_at', { ascending: false })
        .limit(limit),
      { maxRetries: 2, delayMs: 500 }
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

export const getProjects = async (): Promise<Project[]> => {
  try {
    const orgId = await getOrgId();
    if (!orgId) return [];
    const { data, error } = await supabase
      .from('projects')
      .select('*')
      .eq('org_id', orgId.id)
      .order('name', { ascending: true });
    if (error) throw error;
    return (data || []) as Project[];
  } catch (error) {
    logError(error, { action: 'fetch_projects' });
    return [];
  }
};

export const createProject = async (name: string, code?: string, budgetAmount?: number): Promise<Project> => {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Not authenticated');

    const { data, error } = await withRetry(
      () => supabase
        .from('projects')
        .insert({ name, code: code ?? null, user_id: user.id, budget_amount: budgetAmount ?? null })
        .select()
        .single(),
      { maxRetries: 2, delayMs: 500 }
    );
    if (error) throw handleSupabaseError(error);
    return data as Project;
  } catch (error) {
    const supabaseError = handleSupabaseError(error);
    logError(supabaseError, { action: 'create_project' });
    throw supabaseError;
  }
};

export const updateProjectBudget = async (projectId: string, budgetAmount: number): Promise<void> => {
  const { error } = await supabase
    .from('projects')
    .update({ budget_amount: budgetAmount })
    .eq('id', projectId);
  if (error) throw error;
};

export const deleteProject = async (projectId: string): Promise<void> => {
  try {
    const { error } = await withRetry(
      () => supabase.from('projects').delete().eq('id', projectId),
      { maxRetries: 2, delayMs: 500 }
    );
    if (error) throw handleSupabaseError(error);
  } catch (error) {
    const supabaseError = handleSupabaseError(error);
    logError(supabaseError, { action: 'delete_project' });
    throw supabaseError;
  }
};

// ─── Access Code Services ───

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

export const redeemAccessCode = async (code: string, userId: string): Promise<{ success: boolean; role?: string; error?: string }> => {
  try {
    const { data, error } = await withRetry(
      () => supabase.rpc('redeem_access_code', {
        p_code: code,
        p_user_id: userId,
      }),
      { maxRetries: 2, delayMs: 500 }
    );
    if (error) throw handleSupabaseError(error);
    const result = data as { success: boolean; role?: string; error?: string };
    return result;
  } catch (error) {
    const supabaseError = handleSupabaseError(error);
    logError(supabaseError, { action: 'redeem_access_code' });
    return { success: false, error: supabaseError.userMessage };
  }
};

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
      { maxRetries: 2, delayMs: 500 }
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

export const updateReceiptApproval = async (
  receiptId: string,
  status: 'approved' | 'rejected',
  userId: string,
  needsReimburse: boolean,
  vendorName: string,
  transactionDate: string
) => {
  // HIGH-1: Server-side role verification — don't trust caller-supplied role
  const verifiedRole = await getUserRole(userId);
  if (!['Owner', 'Accountant'].includes(verifiedRole)) {
    throw new Error('Unauthorized: only Owners and Accountants can approve receipts');
  }

  // Get org_id for scoping and audit log
  const orgData = await getOrgId();
  const orgId = orgData ? orgData.id : null;

  const updatePayload: Record<string, unknown> = {
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
    .eq('org_id', orgId || ''); // Defense-in-depth

  if (error) throw new Error(`Failed to update receipt: ${error.message}`);

  // HIGH-3: Always include org_id in audit logs
  await supabase.from('audit_logs').insert({
    user_id: userId,
    org_id: orgId || null,
    action: `receipt${status}`,
    details: `Receipt ${status}: ${vendorName} (${transactionDate}) by ${verifiedRole}`,
  });
};

export const bulkUpdateApproval = async (
  receiptIds: string[],
  status: 'approved' | 'rejected',
  userId: string
) => {
  try {
    // HIGH-1: Server-side role check
    const verifiedRole = await getUserRole(userId);
    if (!['Owner', 'Accountant'].includes(verifiedRole)) {
      throw new Error('Unauthorized: only Owners and Accountants can approve receipts');
    }

    // HIGH-2: Scope by org_id for defense-in-depth
    const orgData = await getOrgId();
    const orgId = orgData?.id ?? null;

    const { error } = await withRetry(
      () => supabase
        .from('receipts')
        .update({ approval_status: status, updated_at: new Date().toISOString() })
        .in('id', receiptIds)
        .eq('org_id', orgId || ''), // HIGH-2: explicit org scoping
      { maxRetries: 2, delayMs: 500 }
    );
    if (error) throw handleSupabaseError(error);

    // HIGH-3: Include org_id in audit log
    await supabase.from('audit_logs').insert({
      user_id: userId,
      org_id: orgId || null,
      action: `bulk_${status}`,
      details: `Bulk ${status}: ${receiptIds.length} receipts by ${userId}`,
    });
  } catch (error) {
    const supabaseError = handleSupabaseError(error);
    logError(supabaseError, { action: 'bulk_update_approval' });
    throw supabaseError;
  }
};

// ─── Edit Services (Immutable Archive-Before-Update) ───

export const updateReceipt = async (
  receiptId: string,
  updatedData: Partial<ReceiptRow>,
  userId: string,
  originalReceipt: ReceiptRow
) => {
  // Get org_id for history record
  const orgData = await getOrgId();
  const orgId = orgData?.id ?? null;

  // C10: Archive full snapshot to receipt_history FIRST (compensation if next step fails)
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
    .eq('org_id', orgId || '');

  // C10: Compensation — if update fails, delete the orphaned history record
  if (updateError) {
    await supabase.from('receipt_history').delete().eq('id', archiveRecord.id);
    throw new Error(updateError.message);
  }

  await supabase.from('audit_logs').insert({
    user_id: userId,
    org_id: orgId || null,
    action: 'receiptedited',
    details: `Receipt updated: ${Object.keys(updatedData).join(', ')} modified for ${originalReceipt.vendor_name}. Previous version archived.`,
  });
};

export const updateReceiptNotes = async (
  receiptId: string,
  notesValue: string,
  userId: string,
  receipt: ReceiptRow
) => {
  return updateReceipt(receiptId, { notes: notesValue }, userId, receipt);
};

// ─── Save Receipt (with Merkle chain) ───

// HIGH-6: Whitelist of allowed columns for receipt creation
const ALLOWED_RECEIPT_COLUMNS = [
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
] as const;

export const saveReceipt = async (
  payload: Record<string, unknown>,
  integrityHash: string,
  userId: string
) => {
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
      // Keep user-supplied rate as fallback
    }
  }
  const cadEquivalent = currency !== 'CAD' ? Math.round(totalAmount * exchangeRate * 100) / 100 : null;

  // Merkle chain: get last event_hash from audit_logs
  let previousHash: string | null = null;
  try {
    const { data: lastLog } = await supabase
      .from('audit_logs')
      .select('event_hash')
      .eq('user_id', userId)
      .not('event_hash', 'is', null)
      .order('created_at', { ascending: false })
      .limit(1)
      .single();
    previousHash = lastLog?.event_hash ?? null;
  } catch {
    previousHash = null;
  }

  // HIGH-6: Only allow whitelisted columns — prevent mass assignment
  const sanitizedPayload: Record<string, unknown> = {};
  for (const key of ALLOWED_RECEIPT_COLUMNS) {
    if (key in payload) {
      sanitizedPayload[key] = payload[key];
    }
  }

  // Fetch org_id for explicit tenant isolation (C6: don't rely on DB trigger)
  const orgData = await getOrgId();
  const orgId = orgData ? orgData.id : null;

  // Always force server-controlled values
  sanitizedPayload.user_id = userId;
  sanitizedPayload.org_id = orgId || undefined;
  sanitizedPayload.business_unit_id = payload.business_unit_id === '' ? null : payload.business_unit_id;
  sanitizedPayload.project_id = payload.project_id === '' ? null : payload.project_id;
  sanitizedPayload.integrity_hash = integrityHash;
  sanitizedPayload.math_mismatch_warning = isMismatch;
  sanitizedPayload.cad_equivalent = cadEquivalent;
  sanitizedPayload.exchange_rate = exchangeRate;

  // Strip empty strings to prevent database pollution
  Object.keys(sanitizedPayload).forEach(key => {
    if (sanitizedPayload[key] === '') {
      sanitizedPayload[key] = null;
    }
  });

  const { data, error } = await supabase
    .from('receipts')
    .insert([sanitizedPayload])
    .select('id')
    .single();

  if (error) throw error;

  const newReceiptId = data?.id;

  // HIGH-3: Include org_id in audit log
  // Write audit log with Merkle chain (C10: compensate on failure — delete orphaned receipt)
  const { error: auditError } = await supabase.from('audit_logs').insert({
    user_id: userId,
    org_id: orgId || null,
    action: 'receiptcreated',
    details: `Receipt created: ${payload.vendor_name || 'Unknown'} (${payload.transaction_date || 'Unknown Date'}) currency=${currency}`,
    event_hash: integrityHash,
    previous_hash: previousHash,
  });

  if (auditError && newReceiptId) {
    await supabase.from('receipts').update({ is_deleted: true }).eq('id', newReceiptId);
    throw auditError;
  }

  // Fire-and-forget: update vendor recognition defaults (never blocks save)
  const orgIdForVendor = orgId;
  if (orgIdForVendor) {
    updateVendorDefaults(orgIdForVendor, {
      vendor_name: String(payload.vendor_name ?? ''),
      category: payload.category ? String(payload.category) : null,
      job_code: payload.job_code ? String(payload.job_code) : null,
      business_use_percent: payload.business_use_percent != null ? Number(payload.business_use_percent) : null,
    }).catch((err) => logError(err, { action: 'vendor_defaults_update' }));
  }

  return data;
};

// ─── Bank Reconciliation ───

export const getBankTransactions = async () => {
  const orgId = await getOrgId();
  if (!orgId) return [];

  const { data, error } = await supabase
    .from('bank_transactions')
    .select('*')
    .eq('org_id', orgId.id)
    .order('date', { ascending: false });
    
  if (error) throw handleSupabaseError(error);
  return data;
};

export const getUnmatchedBankCount = async (): Promise<number> => {
  const orgId = await getOrgId();
  if (!orgId) return 0;

  const { count, error } = await supabase
    .from('bank_transactions')
    .select('*', { count: 'exact', head: true })
    .eq('org_id', orgId.id)
    .is('matched_receipt_id', null)
    .eq('is_reconciled', false);
    
  if (error) return 0;
  return count || 0;
};

export const confirmBankMatch = async (
  bankTransactionId: string,
  receiptId: string,
  method: 'manual' | 'confirmed_fuzzy',
  confidence?: number,
  orgId?: string
) => {
  if (!orgId) {
    const orgData = await getOrgId();
    if (!orgData) throw new Error('Could not determine organization ID');
    orgId = orgData.id;
  }
  const { error } = await supabase
    .from('bank_transactions')
    .update({ 
      matched_receipt_id: receiptId, 
      match_method: method,
      match_confidence: confidence ?? null,
      is_reconciled: true 
    })
    .eq('id', bankTransactionId)
    .eq('org_id', orgId);
    
  if (error) throw handleSupabaseError(error);
};

// ─── CRA Form Pre-Fill Data ───

export interface CRAExpenseCategory {
  category: string;
  total: number;
  gst: number;
  pst: number;
  receiptCount: number;
}

export interface CRATopVendor {
  vendor_name: string;
  business_number: string | null;
  total: number;
  receiptCount: number;
}

export interface CRAMileageByVehicle {
  vehicleNickname: string;
  km: number;
  amount: number;
}

export interface CRAFormData {
  taxYear: number;
  totalBusinessExpenses: number;
  totalGSTPaid: number;
  totalPSTLikePaid: number;
  expensesByCategory: CRAExpenseCategory[];
  mileageTotalKm: number;
  mileageTotalDeduction: number;
  mileageByVehicle: CRAMileageByVehicle[];
  topVendors: CRATopVendor[];
  generatedAt: string;
  receiptCount: number;
  dateRange: { from: string; to: string };
}

export async function getCRAFormData(taxYear: number): Promise<CRAFormData> {
  const orgId = await getOrgId();
  if (!orgId) throw new Error('No organization found');

  const fromDate = `${taxYear}-01-01`;
  const toDate = `${taxYear}-12-31`;

  // Fetch all receipts for the tax year
  const { data: receipts, error: rxErr } = await supabase
    .from('receipts')
    .select('total_amount, cad_equivalent, tax_amount, pst_amount, category, vendor_name, business_number, currency')
    .eq('org_id', orgId.id)
    .eq('is_deleted', false)
    .gte('transaction_date', fromDate)
    .lte('transaction_date', toDate);

  if (rxErr) throw rxErr;

  const rows = receipts || [];

  // Aggregate totals (use cad_equivalent for non-CAD receipts)
  let totalBusinessExpenses = 0;
  let totalGSTPaid = 0;
  let totalPSTLikePaid = 0;
  const categoryMap = new Map<string, CRAExpenseCategory>();
  const vendorMap = new Map<string, CRATopVendor>();

  for (const r of rows) {
    const amount = Number(r.cad_equivalent ?? r.total_amount ?? 0);
    const gst = Number(r.tax_amount ?? 0);
    const pst = Number(r.pst_amount ?? 0);
    const cat = r.category || 'Uncategorized';

    totalBusinessExpenses += amount;
    totalGSTPaid += gst;
    totalPSTLikePaid += pst;

    const existing = categoryMap.get(cat) || { category: cat, total: 0, gst: 0, pst: 0, receiptCount: 0 };
    categoryMap.set(cat, { ...existing, total: existing.total + amount, gst: existing.gst + gst, pst: existing.pst + pst, receiptCount: existing.receiptCount + 1 });

    const vendorKey = r.vendor_name || 'Unknown';
    const ev = vendorMap.get(vendorKey) || { vendor_name: vendorKey, business_number: r.business_number || null, total: 0, receiptCount: 0 };
    vendorMap.set(vendorKey, { ...ev, total: ev.total + amount, receiptCount: ev.receiptCount + 1 });
  }

  // Mileage totals
  const { data: mileageLogs } = await supabase
    .from('mileage_logs')
    .select('distance_km, total_amount, vehicle_id')
    .eq('org_id', orgId.id)
    .gte('trip_date', fromDate)
    .lte('trip_date', toDate);

  const vehicleMap = new Map<string, { km: number; amount: number }>();
  let mileageTotalKm = 0;
  let mileageTotalDeduction = 0;

  for (const m of mileageLogs || []) {
    const km = Number(m.distance_km);
    const amt = Number(m.total_amount);
    mileageTotalKm += km;
    mileageTotalDeduction += amt;
    const vid = m.vehicle_id || 'unknown';
    const v = vehicleMap.get(vid) || { km: 0, amount: 0 };
    vehicleMap.set(vid, { km: v.km + km, amount: v.amount + amt });
  }

  // Fetch vehicle nicknames
  const vehicleIds = Array.from(vehicleMap.keys()).filter(v => v !== 'unknown');
  const vehicleNames: Record<string, string> = {};
  if (vehicleIds.length > 0) {
    const { data: vehicles } = await supabase.from('vehicles').select('id, nickname').in('id', vehicleIds);
    for (const v of vehicles || []) vehicleNames[v.id] = v.nickname || v.id;
  }

  const mileageByVehicle: CRAMileageByVehicle[] = Array.from(vehicleMap.entries()).map(([vid, data]) => ({
    vehicleNickname: vehicleNames[vid] || 'Unknown Vehicle',
    km: Math.round(data.km * 10) / 10,
    amount: Math.round(data.amount * 100) / 100,
  }));

  return {
    taxYear,
    totalBusinessExpenses: Math.round(totalBusinessExpenses * 100) / 100,
    totalGSTPaid: Math.round(totalGSTPaid * 100) / 100,
    totalPSTLikePaid: Math.round(totalPSTLikePaid * 100) / 100,
    expensesByCategory: Array.from(categoryMap.values()).sort((a, b) => b.total - a.total),
    mileageTotalKm: Math.round(mileageTotalKm * 10) / 10,
    mileageTotalDeduction: Math.round(mileageTotalDeduction * 100) / 100,
    mileageByVehicle,
    topVendors: Array.from(vendorMap.values()).sort((a, b) => b.total - a.total).slice(0, 20),
    generatedAt: new Date().toISOString(),
    receiptCount: rows.length,
    dateRange: { from: fromDate, to: toDate },
  };
}


