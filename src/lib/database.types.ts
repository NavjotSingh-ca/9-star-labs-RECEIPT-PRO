/* ─── Generated from setup.sql — Database type definitions ─── */

export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[]

export type UserRole = 'Owner' | 'Employee' | 'Accountant'
export type PlanTier = 'free' | 'starter' | 'pro' | 'business' | 'enterprise'
export type SubscriptionStatus = 'active' | 'trialing' | 'past_due' | 'canceled'
export type ApprovalStatus = 'submitted' | 'approved' | 'rejected'
export type ReimbursementStatus = 'pending' | 'approved' | 'rejected'
export type PaidBy = 'company_card' | 'employee_cash' | ''
export type CaptureSource = 'camera' | 'upload' | 'email' | 'email_screenshot' | 'bulk-import' | 'accountant-import'
export type SourceFileType = 'image' | 'pdf' | 'heic' | 'png' | 'jpg' | 'jpeg' | ''

/* ─── Tables ─── */

export interface OrganizationsRow {
  id: string
  name: string
  org_slug: string | null
  receipt_email: string | null
  tax_year_lock: number | null
  created_at: string | null
}
export interface OrganizationsInsert {
  id?: string
  name: string
  org_slug?: string | null
  receipt_email?: string | null
  tax_year_lock?: number | null
  created_at?: string | null
}
export interface OrganizationsUpdate {
  id?: string
  name?: string
  org_slug?: string | null
  receipt_email?: string | null
  tax_year_lock?: number | null
  created_at?: string | null
}

export interface UserRolesRow {
  id: string
  user_id: string | null
  org_id: string | null
  role: UserRole
  invited_by: string | null
  created_at: string | null
}
export interface UserRolesInsert {
  id?: string
  user_id?: string | null
  org_id?: string | null
  role: UserRole
  invited_by?: string | null
  created_at?: string | null
}

export interface BusinessUnitsRow {
  id: string
  org_id: string | null
  name: string
  created_at: string | null
}
export interface BusinessUnitsInsert {
  id?: string
  org_id?: string | null
  name: string
  created_at?: string | null
}

export interface ProjectsRow {
  id: string
  org_id: string | null
  user_id: string | null
  name: string
  code: string | null
  budget_amount: number | null
  created_at: string | null
}
export interface ProjectsInsert {
  id?: string
  org_id?: string | null
  user_id?: string | null
  name: string
  code?: string | null
  budget_amount?: number | null
  created_at?: string | null
}

export interface ReceiptsRow {
  id: string
  org_id: string | null
  user_id: string | null
  vendor_name: string | null
  vendor_address: string | null
  business_number: string | null
  vendor_tax_number: string | null
  total_amount: number | null
  subtotal: number | null
  tax_amount: number | null
  pst_amount: number | null
  currency: string | null
  exchange_rate: number | null
  cad_equivalent: number | null
  transaction_date: string | null
  transaction_time: string | null
  payment_method: string | null
  payment_reference: string | null
  card_last_four: string | null
  category: string | null
  notes: string | null
  document_type: string | null
  business_unit_id: string | null
  project_id: string | null
  image_url: string | null
  source_file_name: string | null
  source_file_type: SourceFileType | string | null
  confidence_score: number | null
  cra_readiness_score: number | null
  blur_score: number | null
  thermal_warning: boolean | null
  capture_source: CaptureSource | string | null
  usage_type: string | null
  business_use_percent: number | null
  job_code: string | null
  vehicle_id: string | null
  paid_by: PaidBy | string | null
  reimbursement_status: ReimbursementStatus | string | null
  needs_reimbursement: boolean | null
  approval_status: ApprovalStatus | string | null
  accountant_status: string | null
  review_status: string | null
  needs_review: boolean | null
  integrity_hash: string | null
  duplicate_hash: string | null
  duplicate_warning: boolean | null
  math_mismatch_warning: boolean | null
  missing_bn_warning: boolean | null
  high_audit_risk: boolean | null
  flagged_for_audit: boolean | null
  fraud_suspicion: boolean | null
  fraud_reason: string | null
  line_items: Json | null
  semantic_embedding: string | null
  is_deleted: boolean | null
  created_at: string | null
  updated_at: string | null
}
export interface ReceiptsInsert {
  id?: string
  org_id?: string | null
  user_id?: string | null
  vendor_name?: string | null
  vendor_address?: string | null
  business_number?: string | null
  vendor_tax_number?: string | null
  total_amount?: number | null
  subtotal?: number | null
  tax_amount?: number | null
  pst_amount?: number | null
  currency?: string | null
  exchange_rate?: number | null
  cad_equivalent?: number | null
  transaction_date?: string | null
  transaction_time?: string | null
  payment_method?: string | null
  payment_reference?: string | null
  card_last_four?: string | null
  category?: string | null
  notes?: string | null
  document_type?: string | null
  business_unit_id?: string | null
  project_id?: string | null
  image_url?: string | null
  source_file_name?: string | null
  source_file_type?: SourceFileType | string | null
  confidence_score?: number | null
  cra_readiness_score?: number | null
  blur_score?: number | null
  thermal_warning?: boolean | null
  capture_source?: CaptureSource | string | null
  usage_type?: string | null
  business_use_percent?: number | null
  job_code?: string | null
  vehicle_id?: string | null
  paid_by?: PaidBy | string | null
  reimbursement_status?: ReimbursementStatus | string | null
  needs_reimbursement?: boolean | null
  approval_status?: ApprovalStatus | string | null
  accountant_status?: string | null
  review_status?: string | null
  needs_review?: boolean | null
  integrity_hash?: string | null
  duplicate_hash?: string | null
  duplicate_warning?: boolean | null
  math_mismatch_warning?: boolean | null
  missing_bn_warning?: boolean | null
  high_audit_risk?: boolean | null
  flagged_for_audit?: boolean | null
  fraud_suspicion?: boolean | null
  fraud_reason?: string | null
  line_items?: Json | null
  semantic_embedding?: string | null
  is_deleted?: boolean | null
  created_at?: string | null
  updated_at?: string | null
}
export type ReceiptsUpdate = Partial<ReceiptsInsert>

export interface AuditLogsRow {
  id: string
  org_id: string | null
  receipt_id: string | null
  user_id: string | null
  action: string
  details: string | null
  previous_hash: string | null
  event_hash: string | null
  created_at: string | null
}

export interface ReceiptHistoryRow {
  id: string
  org_id: string | null
  receipt_id: string | null
  user_id: string | null
  vendor_name: string | null
  vendor_tax_number: string | null
  business_number: string | null
  transaction_date: string | null
  total_amount: number | null
  subtotal: number | null
  tax_amount: number | null
  pst_amount: number | null
  payment_method: string | null
  category: string | null
  notes: string | null
  document_type: string | null
  project_id: string | null
  exchange_rate: number | null
  cad_equivalent: number | null
  duplicate_hash: string | null
  integrity_hash: string | null
  archived_at: string | null
  archived_by: string | null
}

export interface AccessCodesRow {
  code: string
  org_id: string | null
  role: string
  business_unit_id: string | null
  created_by: string | null
  created_at: string | null
  expires_at: string | null
}

export interface SubscriptionsRow {
  id: string
  org_id: string | null
  stripe_customer_id: string | null
  stripe_subscription_id: string | null
  plan: string
  receipt_limit: number | null
  user_limit: number | null
  status: string | null
  trial_ends_at: string | null
  current_period_end: string | null
  cancel_at_period_end: boolean | null
  created_at: string | null
  updated_at: string | null
}

export interface OrganizationSettingsRow {
  id: string
  org_id: string | null
  business_name: string | null
  business_number: string | null
  address: string | null
  province: string | null
  gst_registrant: boolean | null
  high_value_threshold: number | null
  require_approval_above: number | null
  slack_webhook_url: string | null
  qbo_auth_state: string | null
  qbo_auth_nonce: string | null
  qbo_auth_started_at: string | null
  qbo_realm_id: string | null
  qbo_access_token: string | null
  qbo_refresh_token: string | null
  qbo_token_expires_at: string | null
  qbo_connected_at: string | null
  qbo_sync_enabled: boolean | null
  default_sync_account: string | null
  last_sync_at: string | null
  xero_refresh_token: string | null
  xero_tenant_id: string | null
  created_at: string | null
  updated_at: string | null
}

export interface ProcessedWebhookEventsRow {
  id: string
  event_id: string
  event_type: string
  created_at: string | null
}

export interface BankTransactionsRow {
  id: string
  org_id: string | null
  account_id: string
  date: string | null
  amount: number
  payee_name: string | null
  description: string | null
  reference_number: string | null
  category: string | null
  matched_receipt_id: string | null
  match_confidence: number | null
  match_method: string | null
  is_reconciled: boolean | null
  transaction_date: string
  uploaded_by: string | null
  statement_date: string | null
  source_file_name: string | null
  created_at: string | null
  updated_at: string | null
}

export interface VehiclesRow {
  id: string
  org_id: string | null
  user_id: string | null
  make: string | null
  model: string | null
  year: number | null
  license_plate: string | null
  nickname: string
  default_rate_per_km: number | null
  created_at: string | null
  updated_at: string | null
}

export interface MileageLogsRow {
  id: string
  org_id: string | null
  user_id: string | null
  vehicle_id: string | null
  trip_date: string
  purpose: string
  start_location: string | null
  end_location: string | null
  distance_km: number
  rate_per_km: number
  total_amount: number
  is_reimbursed: boolean | null
  project_id: string | null
  notes: string | null
  created_at: string | null
  updated_at: string | null
}

export interface FxRateCacheRow {
  id: string
  date: string
  currency: string
  rate_to_cad: number
  fetched_at: string | null
}

export interface VendorDefaultsRow {
  id: string
  org_id: string | null
  vendor_name_normalized: string
  category: string | null
  job_code: string | null
  business_use_percent: number | null
  appearance_count: number | null
  last_seen_at: string | null
  created_at: string | null
  updated_at: string | null
}

export interface ReceiptCommentsRow {
  id: string
  receipt_id: string | null
  org_id: string | null
  user_id: string | null
  comment: string
  created_at: string | null
}

export interface ScanAttemptsRow {
  id: string
  user_id: string
  org_id: string | null
  attempted_at: string | null
}

/* ─── RPC Functions ─── */

export interface GetDashboardStatsArgs {
  p_org_id: string
  p_user_id: string
  p_role: string
}
export type GetDashboardStatsReturns = {
  total_spent: number
  gst_recoverable: number
  pst_recoverable: number
  receipt_count: number
  avg_transaction: number
}

export interface GetReceiptsPaginatedArgs {
  p_org_id: string
  p_user_id: string
  p_role: string
  p_limit: number
  p_offset: number
  p_order_by?: string
  p_order_dir?: string
  p_category?: string | null
  p_from_date?: string | null
  p_to_date?: string | null
  p_approval_status?: string | null
  p_search?: string | null
  p_semantic_ids?: string[] | null
}
export type GetReceiptsPaginatedReturns = {
  receipt: ReceiptsRow
  total_count: number
}

export interface GetSpendAnomaliesArgs {
  p_org_id: string
}
export type GetSpendAnomaliesReturns = {
  vendor_name: string | null
  latest_amount: number | null
  avg_amount: number | null
  ratio: number | null
  receipt_id: string | null
  transaction_date: string | null
}

export interface GetProjectActualsArgs {
  p_org_id: string
}
export type GetProjectActualsReturns = {
  project_id: string | null
  project_name: string | null
  project_code: string | null
  budget_amount: number | null
  total_spent: number | null
  receipt_count: number | null
  top_categories: Json | null
}

export interface GenerateAccessCodeArgs {
  p_created_by: string
  p_role: string
  p_bu_id?: string | null
}

export interface RedeemAccessCodeArgs {
  p_code: string
  p_user_id: string
}
export type RedeemAccessCodeReturns = {
  success: boolean
  role?: string
  error?: string
}

export interface UpsertUserRoleArgs {
  p_target_user_id: string
  p_role: string
  p_org_id: string
}

export interface BootstrapFirstUserOrgArgs {
  p_user_id: string
  p_org_name?: string
}

export interface MatchReceiptsArgs {
  query_embedding: string
  match_threshold: number
  match_count: number
  p_user_id: string
  p_org_id?: string | null
}
export type MatchReceiptsReturns = {
  id: string
  similarity: number
}
