-- ============================================================
-- Leduc Receipt Pro — Unified Database Setup
-- Run this single file in Supabase SQL Editor.
-- It is idempotent and safe to run on existing databases.
-- ============================================================

CREATE EXTENSION IF NOT EXISTS vector;

-- ─── 1. Core Tables ───

CREATE TABLE IF NOT EXISTS organizations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  org_slug text UNIQUE,
  receipt_email text UNIQUE,
  tax_year_lock integer DEFAULT NULL,
  created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS user_roles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  org_id uuid REFERENCES organizations(id) ON DELETE CASCADE,
  role text NOT NULL DEFAULT 'Employee' CHECK (role IN ('Owner','Employee','Accountant')),
  invited_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at timestamptz DEFAULT now(),
  CONSTRAINT uniq_user_role UNIQUE (user_id)
);

CREATE OR REPLACE FUNCTION get_user_org()
RETURNS uuid
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
  SELECT org_id FROM user_roles WHERE user_id = auth.uid() LIMIT 1;
$$;

CREATE OR REPLACE FUNCTION has_elevated_role()
RETURNS BOOLEAN
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
  SELECT EXISTS (
    SELECT 1 FROM user_roles
    WHERE user_id = auth.uid() AND role IN ('Owner', 'Accountant')
  );
$$;

CREATE TABLE IF NOT EXISTS business_units (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id uuid REFERENCES organizations(id) ON DELETE CASCADE,
  name text NOT NULL,
  created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS projects (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id uuid REFERENCES organizations(id) ON DELETE CASCADE,
  user_id uuid REFERENCES auth.users(id),
  name text NOT NULL,
  code text,
  budget_amount numeric,
  created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS receipts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id uuid REFERENCES organizations(id) ON DELETE CASCADE,
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  
  -- Core Metadata
  vendor_name text,
  vendor_address text,
  business_number text,
  vendor_tax_number text,
  
  -- Financials
  total_amount numeric DEFAULT 0,
  subtotal numeric,
  tax_amount numeric DEFAULT 0,
  pst_amount numeric,
  currency text DEFAULT 'CAD',
  exchange_rate numeric DEFAULT 1.0,
  cad_equivalent numeric,
  
  -- Logistics
  transaction_date text,
  transaction_time text,
  payment_method text,
  payment_reference text,
  card_last_four text,
  category text,
  notes text,
  document_type text,
  business_unit_id uuid REFERENCES business_units(id) ON DELETE SET NULL,
  project_id uuid REFERENCES projects(id) ON DELETE SET NULL,
  
  -- Media & Intelligence
  image_url text,
  source_file_name text,
  source_file_type text,
  confidence_score numeric,
  cra_readiness_score numeric,
  blur_score numeric,
  thermal_warning boolean DEFAULT false,
  capture_source text,
  usage_type text,
  business_use_percent numeric,
  job_code text,
  vehicle_id text,
  
  -- Approval & Reimbursement
  paid_by text,
  reimbursement_status text DEFAULT 'pending',
  needs_reimbursement boolean DEFAULT false,
  approval_status text DEFAULT 'submitted',
  
  -- Audit & Review Fields (missing in original DB but used in TS)
  accountant_status text,
  review_status text,
  needs_review boolean DEFAULT false,
  
  -- Fraud & Duplicates
  integrity_hash text,
  duplicate_hash text,
  duplicate_warning boolean DEFAULT false,
  math_mismatch_warning boolean DEFAULT false,
  missing_bn_warning boolean DEFAULT false,
  high_audit_risk boolean DEFAULT false,
  flagged_for_audit boolean DEFAULT false,
  fraud_suspicion boolean DEFAULT false,
  fraud_reason text,
  
  -- Rich Data
  line_items jsonb DEFAULT '[]'::jsonb,
  semantic_embedding vector(768),
  
  -- System
  is_deleted boolean DEFAULT false,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Note: receipt_line_items table was removed as it's unused (line items use JSONB on receipts)

CREATE TABLE IF NOT EXISTS audit_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id uuid REFERENCES organizations(id) ON DELETE CASCADE,
  receipt_id uuid REFERENCES receipts(id) ON DELETE CASCADE,
  user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  action text NOT NULL,
  details text,
  previous_hash text,
  event_hash text,
  created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS receipt_history (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id uuid REFERENCES organizations(id) ON DELETE CASCADE,
  receipt_id uuid REFERENCES receipts(id) ON DELETE CASCADE,
  user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  vendor_name text,
  vendor_tax_number text,
  business_number text,
  transaction_date text,
  total_amount numeric,
  subtotal numeric,
  tax_amount numeric,
  pst_amount numeric,
  payment_method text,
  category text,
  notes text,
  document_type text,
  project_id uuid,
  exchange_rate numeric,
  cad_equivalent numeric,
  duplicate_hash text,
  integrity_hash text,
  archived_at timestamptz DEFAULT now(),
  archived_by uuid REFERENCES auth.users(id) ON DELETE SET NULL
);

CREATE TABLE IF NOT EXISTS access_codes (
  code text PRIMARY KEY,
  org_id uuid REFERENCES organizations(id) ON DELETE CASCADE,
  role text NOT NULL,
  business_unit_id uuid REFERENCES business_units(id) ON DELETE CASCADE,
  created_by uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at timestamptz DEFAULT now(),
  expires_at timestamptz DEFAULT now() + interval '7 days'
);

CREATE TABLE IF NOT EXISTS subscriptions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id uuid REFERENCES organizations(id) ON DELETE CASCADE,
  stripe_customer_id text,
  stripe_subscription_id text UNIQUE,
  plan text NOT NULL DEFAULT 'free' CHECK (plan = ANY (ARRAY['free','pro','enterprise'])),
  receipt_limit integer DEFAULT 50,
  user_limit integer DEFAULT 1,
  status text CHECK (status = ANY (ARRAY['active','trialing','past_due','canceled'])),
  trial_ends_at timestamptz,
  current_period_end timestamptz,
  cancel_at_period_end boolean DEFAULT false,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  CONSTRAINT uniq_org_sub UNIQUE (org_id)
);

CREATE TABLE IF NOT EXISTS organization_settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id uuid REFERENCES organizations(id) ON DELETE CASCADE,
  business_name text,
  business_number text,
  address text,
  province text DEFAULT 'AB',
  gst_registrant boolean DEFAULT true,
  high_value_threshold numeric DEFAULT 500.00,
  require_approval_above numeric DEFAULT 500.00,
  slack_webhook_url text,
  qbo_auth_state text,
  qbo_auth_nonce text,
  qbo_auth_started_at timestamptz,
  qbo_realm_id text,
  qbo_access_token text,
  qbo_refresh_token text,
  qbo_token_expires_at timestamptz,
  qbo_connected_at timestamptz,
  qbo_sync_enabled boolean DEFAULT false,
  default_sync_account text,
  last_sync_at timestamptz,
  xero_refresh_token text,
  xero_tenant_id text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  CONSTRAINT uniq_org_settings UNIQUE (org_id)
);

CREATE TABLE IF NOT EXISTS processed_webhook_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id text NOT NULL UNIQUE,
  event_type text NOT NULL,
  created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS bank_transactions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id uuid REFERENCES organizations(id) ON DELETE CASCADE,
  account_id text NOT NULL,
  date date NOT NULL,
  amount numeric NOT NULL,
  payee_name text,
  description text,
  reference_number text,
  category text,
  matched_receipt_id uuid REFERENCES receipts(id) ON DELETE SET NULL,
  match_confidence numeric,
  match_method text,
  is_reconciled boolean DEFAULT false,
  transaction_date text NOT NULL DEFAULT '',
  uploaded_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  statement_date date,
  source_file_name text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  CONSTRAINT uniq_tx_ref UNIQUE (org_id, account_id, reference_number),
  CONSTRAINT uniq_tx_content UNIQUE (org_id, transaction_date, amount, description)
);

CREATE TABLE IF NOT EXISTS vehicles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id uuid REFERENCES organizations(id) ON DELETE CASCADE,
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  make text,
  model text,
  year integer,
  license_plate text,
  nickname text NOT NULL,
  default_rate_per_km numeric DEFAULT 0.68,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS mileage_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id uuid REFERENCES organizations(id) ON DELETE CASCADE,
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  vehicle_id uuid REFERENCES vehicles(id) ON DELETE SET NULL,
  trip_date date NOT NULL,
  purpose text NOT NULL,
  start_location text,
  end_location text,
  distance_km numeric NOT NULL CHECK (distance_km > 0),
  rate_per_km numeric NOT NULL,
  total_amount numeric NOT NULL,
  is_reimbursed boolean DEFAULT false,
  project_id uuid REFERENCES projects(id) ON DELETE SET NULL,
  notes text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS fx_rate_cache (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  date date NOT NULL,
  currency text NOT NULL,
  rate_to_cad numeric NOT NULL,
  fetched_at timestamptz DEFAULT now(),
  CONSTRAINT uniq_fx_date_currency UNIQUE (date, currency)
);

CREATE TABLE IF NOT EXISTS vendor_defaults (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id uuid REFERENCES organizations(id) ON DELETE CASCADE,
  vendor_name_normalized text NOT NULL,
  category text,
  job_code text,
  business_use_percent numeric DEFAULT 100,
  appearance_count integer DEFAULT 1,
  last_seen_at timestamptz DEFAULT now(),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  CONSTRAINT uniq_vendor_org UNIQUE (org_id, vendor_name_normalized)
);

CREATE TABLE IF NOT EXISTS receipt_comments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  receipt_id uuid REFERENCES receipts(id) ON DELETE CASCADE,
  org_id uuid REFERENCES organizations(id) ON DELETE CASCADE,
  user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  comment text NOT NULL,
  created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS scan_attempts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  org_id uuid REFERENCES organizations(id) ON DELETE CASCADE,
  attempted_at timestamptz DEFAULT now()
);


-- ─── 2. Row Level Security (RLS) ───

ALTER TABLE organizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE business_units ENABLE ROW LEVEL SECURITY;
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE receipts ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE receipt_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE access_codes ENABLE ROW LEVEL SECURITY;
ALTER TABLE subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE organization_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE bank_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE vehicles ENABLE ROW LEVEL SECURITY;
ALTER TABLE mileage_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE vendor_defaults ENABLE ROW LEVEL SECURITY;
ALTER TABLE receipt_comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE scan_attempts ENABLE ROW LEVEL SECURITY;
ALTER TABLE fx_rate_cache ENABLE ROW LEVEL SECURITY;
ALTER TABLE processed_webhook_events ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  CREATE POLICY "Select_Org" ON organizations FOR SELECT USING (id = get_user_org());
  CREATE POLICY "Select_Roles" ON user_roles FOR SELECT USING (org_id = get_user_org());
  CREATE POLICY "Select_BU" ON business_units FOR SELECT USING (org_id = get_user_org());
  CREATE POLICY "Insert_BU" ON business_units FOR ALL USING (org_id = get_user_org());
  CREATE POLICY "Select_Proj" ON projects FOR SELECT USING (org_id = get_user_org());
  CREATE POLICY "Insert_Proj" ON projects FOR INSERT WITH CHECK (org_id = get_user_org());
  CREATE POLICY "Update_Proj" ON projects FOR UPDATE USING (org_id = get_user_org()) WITH CHECK (org_id = get_user_org());
  CREATE POLICY "Delete_Proj" ON projects FOR DELETE USING (org_id = get_user_org());
  
  CREATE POLICY "Select_Receipts" ON receipts FOR SELECT USING (org_id = get_user_org() AND is_deleted = false AND (user_id = auth.uid() OR has_elevated_role()));
  CREATE POLICY "Insert_Receipts" ON receipts FOR INSERT WITH CHECK (org_id = get_user_org() AND user_id = auth.uid());
  CREATE POLICY "Update_Receipts" ON receipts FOR UPDATE USING (org_id = get_user_org() AND (user_id = auth.uid() OR has_elevated_role()));
  CREATE POLICY "Delete_Receipts" ON receipts FOR DELETE USING (
    org_id = get_user_org()
    AND (user_id = auth.uid() OR has_elevated_role())
  );

  CREATE POLICY "Select_Audit" ON audit_logs FOR SELECT USING (org_id = get_user_org() AND (user_id = auth.uid() OR has_elevated_role()));
  CREATE POLICY "Insert_Audit" ON audit_logs FOR INSERT WITH CHECK (org_id = get_user_org() AND user_id = auth.uid());
  CREATE POLICY "Delete_Audit" ON audit_logs FOR DELETE USING (org_id = get_user_org() AND created_at < (now() - interval '10 years'));
  
  CREATE POLICY "Select_Hist" ON receipt_history FOR SELECT USING (org_id = get_user_org());
  CREATE POLICY "Insert_Hist" ON receipt_history FOR INSERT WITH CHECK (org_id = get_user_org());

  CREATE POLICY "No_Direct_Insert_Roles" ON user_roles FOR INSERT WITH CHECK (false);
  CREATE POLICY "No_Direct_Update_Roles" ON user_roles FOR UPDATE USING (false);
  CREATE POLICY "No_Direct_Delete_Roles" ON user_roles FOR DELETE USING (false);
  
  CREATE POLICY "Select_Invites" ON access_codes FOR SELECT USING (org_id = get_user_org());
  
  CREATE POLICY "sub_tenant" ON subscriptions FOR ALL USING (org_id = get_user_org());
  CREATE POLICY "settings_tenant" ON organization_settings FOR ALL USING (org_id = get_user_org());
  CREATE POLICY "bank_tx_tenant" ON bank_transactions FOR ALL USING (org_id = get_user_org());
  CREATE POLICY "vehicles_tenant" ON vehicles FOR ALL USING (org_id = get_user_org());
  CREATE POLICY "mileage_tenant" ON mileage_logs FOR ALL USING (org_id = get_user_org());
  CREATE POLICY "vendor_defaults_tenant" ON vendor_defaults FOR ALL USING (org_id = get_user_org());
  CREATE POLICY "comments_tenant" ON receipt_comments FOR ALL USING (org_id = get_user_org());

  CREATE POLICY "fx_read" ON fx_rate_cache FOR SELECT USING (auth.role() = 'authenticated');
  CREATE POLICY "fx_write" ON fx_rate_cache FOR ALL USING (false) WITH CHECK (false);
  CREATE POLICY "webhook_only" ON processed_webhook_events FOR ALL USING (false) WITH CHECK (false);

  CREATE POLICY "scan_own" ON scan_attempts FOR ALL USING (user_id = auth.uid());
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- H-14: DB-level duplicate enforcement (remove duplicates first)
DROP TRIGGER IF EXISTS before_receipt_delete ON receipts;
DELETE FROM receipts WHERE id IN (
  SELECT id FROM (
    SELECT id, ROW_NUMBER() OVER (
      PARTITION BY org_id, duplicate_hash ORDER BY created_at ASC
    ) AS rn FROM receipts WHERE duplicate_hash IS NOT NULL AND duplicate_hash <> ''
  ) dupe WHERE dupe.rn > 1
);
ALTER TABLE receipts DROP CONSTRAINT IF EXISTS uniq_org_duplicate_hash;
ALTER TABLE receipts ADD CONSTRAINT uniq_org_duplicate_hash UNIQUE (org_id, duplicate_hash);

-- ─── Trigger: Protect approved receipts within 7 years ───
CREATE OR REPLACE FUNCTION protect_approved_receipt()
RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  IF OLD.approval_status = 'approved' AND OLD.transaction_date IS NOT NULL THEN
    IF OLD.transaction_date::date >= (now() - interval '7 years')::date THEN
      RAISE EXCEPTION 'Cannot delete approved receipts from the last 7 years';
    END IF;
  END IF;
  RETURN OLD;
END;
$$;

DROP TRIGGER IF EXISTS before_receipt_delete ON receipts;
CREATE TRIGGER before_receipt_delete
  BEFORE DELETE ON receipts
  FOR EACH ROW EXECUTE FUNCTION protect_approved_receipt();

-- ─── 3. Helper RPC Functions ───

CREATE OR REPLACE FUNCTION generate_access_code(p_created_by uuid, p_role text, p_bu_id uuid DEFAULT NULL)
RETURNS text LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  v_code text; v_org_id uuid;
BEGIN
  SELECT org_id INTO v_org_id FROM user_roles WHERE user_id = p_created_by;
  IF v_org_id IS NULL THEN RAISE EXCEPTION 'Inviter does not belong to an organization.'; END IF;
  v_code := substr(md5(gen_random_uuid()::text), 1, 8);
  INSERT INTO access_codes (code, org_id, role, business_unit_id, created_by)
  VALUES (v_code, v_org_id, p_role, p_bu_id, p_created_by);
  RETURN v_code;
END;
$$;

CREATE OR REPLACE FUNCTION redeem_access_code(p_code text, p_user_id uuid)
RETURNS json LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  v_role text; v_bu_id uuid; v_created_by uuid; v_org_id uuid;
BEGIN
  SELECT role, business_unit_id, created_by, org_id INTO v_role, v_bu_id, v_created_by, v_org_id
  FROM access_codes WHERE code = p_code AND expires_at > now();
  IF NOT FOUND THEN RETURN json_build_object('success', false, 'error', 'Invalid/expired code'); END IF;
  INSERT INTO user_roles (user_id, org_id, role, invited_by)
  VALUES (p_user_id, v_org_id, v_role, v_created_by)
  ON CONFLICT (user_id) DO UPDATE SET role = EXCLUDED.role, org_id = EXCLUDED.org_id, invited_by = EXCLUDED.invited_by;
  DELETE FROM access_codes WHERE code = p_code;
  RETURN json_build_object('success', true, 'role', v_role);
END;
$$;

CREATE OR REPLACE FUNCTION bootstrap_first_user_org(p_user_id uuid, p_org_name text)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE v_org_id uuid;
BEGIN
  IF EXISTS (SELECT 1 FROM user_roles WHERE user_id = p_user_id) THEN RETURN; END IF;
  INSERT INTO organizations (name) VALUES (p_org_name) RETURNING id INTO v_org_id;
  INSERT INTO user_roles (user_id, org_id, role) VALUES (p_user_id, v_org_id, 'Owner');
END;
$$;

CREATE OR REPLACE FUNCTION match_receipts (
  query_embedding vector(768), match_threshold float, match_count int, p_user_id uuid, p_org_id uuid DEFAULT NULL
) RETURNS TABLE (id uuid, similarity float) LANGUAGE plpgsql AS $$
BEGIN
  RETURN QUERY
  SELECT receipts.id, 1 - (receipts.semantic_embedding <=> query_embedding) AS similarity
  FROM receipts
  WHERE receipts.org_id = COALESCE(p_org_id, get_user_org()) AND receipts.semantic_embedding IS NOT NULL AND receipts.is_deleted = false
    AND (p_user_id IS NULL OR receipts.user_id = p_user_id OR has_elevated_role())
    AND 1 - (receipts.semantic_embedding <=> query_embedding) > match_threshold
  ORDER BY receipts.semantic_embedding <=> query_embedding LIMIT match_count;
END;
$$;

DROP FUNCTION IF EXISTS get_dashboard_stats(uuid,uuid,text);
CREATE FUNCTION get_dashboard_stats(p_org_id uuid, p_user_id uuid, p_role text)
RETURNS json LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE v_stats json; v_caller_org uuid;
BEGIN
  SELECT org_id INTO v_caller_org FROM user_roles WHERE user_id = auth.uid();
  IF v_caller_org IS NULL OR v_caller_org <> p_org_id THEN
    RAISE EXCEPTION 'permission denied';
  END IF;
  SELECT json_build_object(
    'total_spent', COALESCE(SUM(total_amount), 0),
    'gst_recoverable', COALESCE(SUM(tax_amount), 0),
    'pst_recoverable', COALESCE(SUM(pst_amount), 0),
    'receipt_count', COUNT(*),
    'avg_transaction', COALESCE(AVG(total_amount), 0)
  ) INTO v_stats
  FROM receipts
  WHERE org_id = p_org_id AND is_deleted = false AND (p_role IN ('Owner', 'Accountant') OR user_id = p_user_id);
  RETURN v_stats;
END;
$$;

CREATE OR REPLACE FUNCTION get_receipts_paginated(
  p_org_id uuid, p_user_id uuid, p_role text,
  p_limit int, p_offset int, p_order_by text DEFAULT 'created_at', p_order_dir text DEFAULT 'desc',
  p_category text DEFAULT NULL, p_from_date text DEFAULT NULL, p_to_date text DEFAULT NULL,
  p_approval_status text DEFAULT NULL, p_search text DEFAULT NULL, p_semantic_ids uuid[] DEFAULT NULL
) RETURNS TABLE (receipt json, total_count bigint) LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  v_total bigint;
  v_data json;
  v_is_elevated boolean;
  v_caller_org uuid;
BEGIN
  SELECT org_id INTO v_caller_org FROM user_roles WHERE user_id = auth.uid();
  IF v_caller_org IS NULL OR v_caller_org <> p_org_id THEN
    RAISE EXCEPTION 'permission denied';
  END IF;
  SELECT (p_role IN ('Owner', 'Accountant')) INTO v_is_elevated;

  SELECT COUNT(*) INTO v_total
  FROM receipts
  WHERE org_id = p_org_id AND is_deleted = false
    AND (v_is_elevated OR user_id = p_user_id)
    AND (p_category IS NULL OR category = p_category)
    AND (p_from_date IS NULL OR transaction_date::date >= p_from_date::date)
    AND (p_to_date IS NULL OR transaction_date::date <= p_to_date::date)
    AND (p_approval_status IS NULL OR approval_status = p_approval_status)
    AND (p_search IS NULL OR vendor_name ILIKE '%' || p_search || '%' OR notes ILIKE '%' || p_search || '%')
    AND (p_semantic_ids IS NULL OR id = ANY(p_semantic_ids));

  SELECT COALESCE(json_agg(row_to_json(t)), '[]'::json) INTO v_data
  FROM (
    SELECT * FROM receipts
    WHERE org_id = p_org_id AND is_deleted = false
      AND (v_is_elevated OR user_id = p_user_id)
      AND (p_category IS NULL OR category = p_category)
      AND (p_from_date IS NULL OR transaction_date::date >= p_from_date::date)
      AND (p_to_date IS NULL OR transaction_date::date <= p_to_date::date)
      AND (p_approval_status IS NULL OR approval_status = p_approval_status)
      AND (p_search IS NULL OR vendor_name ILIKE '%' || p_search || '%' OR notes ILIKE '%' || p_search || '%')
      AND (p_semantic_ids IS NULL OR id = ANY(p_semantic_ids))
    ORDER BY
      CASE WHEN p_order_dir = 'asc' AND p_order_by = 'transaction_date' THEN transaction_date END ASC,
      CASE WHEN p_order_dir = 'desc' AND p_order_by = 'transaction_date' THEN transaction_date END DESC,
      CASE WHEN p_order_dir = 'asc' AND p_order_by = 'total_amount' THEN total_amount END ASC,
      CASE WHEN p_order_dir = 'desc' AND p_order_by = 'total_amount' THEN total_amount END DESC,
      created_at DESC
    LIMIT p_limit OFFSET p_offset
  ) t;

  RETURN QUERY SELECT v_data, v_total;
END;
$$;

DROP FUNCTION IF EXISTS get_spend_anomalies(uuid);
CREATE FUNCTION get_spend_anomalies(p_org_id uuid)
RETURNS TABLE (vendor_name text, latest_amount numeric, avg_amount numeric, ratio numeric, receipt_id uuid, transaction_date text)
LANGUAGE plpgsql SECURITY DEFINER STABLE AS $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM user_roles WHERE user_id = auth.uid() AND org_id = p_org_id) THEN
    RAISE EXCEPTION 'permission denied';
  END IF;
  RETURN QUERY
    SELECT v.vendor_name, v.total_amount AS latest_amount, v.avg_amount, v.ratio, v.receipt_id, v.transaction_date
    FROM (
      SELECT vendor_name, total_amount, id AS receipt_id, transaction_date,
        AVG(total_amount) OVER (PARTITION BY vendor_name) AS avg_amount,
        total_amount / NULLIF(AVG(total_amount) OVER (PARTITION BY vendor_name), 0) AS ratio,
        ROW_NUMBER() OVER (PARTITION BY vendor_name ORDER BY created_at DESC) AS rn
      FROM receipts
      WHERE org_id = p_org_id AND is_deleted = false AND total_amount > 0
    ) v WHERE v.ratio > 2.0 AND v.rn = 1 ORDER BY v.ratio DESC LIMIT 20;
END;
$$;

DROP FUNCTION IF EXISTS get_project_actuals(uuid);
CREATE FUNCTION get_project_actuals(p_org_id uuid)
RETURNS TABLE (project_id uuid, project_name text, project_code text, budget_amount numeric, total_spent numeric, receipt_count bigint, top_categories jsonb)
LANGUAGE plpgsql SECURITY DEFINER STABLE AS $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM user_roles WHERE user_id = auth.uid() AND org_id = p_org_id) THEN
    RAISE EXCEPTION 'permission denied';
  END IF;
  RETURN QUERY
    SELECT p.id AS project_id, p.name AS project_name, p.code AS project_code, p.budget_amount,
      COALESCE(SUM(COALESCE(r.cad_equivalent, r.total_amount)), 0) AS total_spent,
      COUNT(r.id) AS receipt_count,
      COALESCE(jsonb_agg(DISTINCT jsonb_build_object('category', r.category, 'total', sub.cat_total) ORDER BY (jsonb_build_object('category', r.category, 'total', sub.cat_total)) DESC) FILTER (WHERE r.category IS NOT NULL), '[]'::jsonb) AS top_categories
    FROM projects p
    LEFT JOIN receipts r ON r.project_id = p.id AND r.org_id = p_org_id AND r.is_deleted = false
    LEFT JOIN LATERAL (SELECT category, SUM(COALESCE(cad_equivalent, total_amount)) AS cat_total FROM receipts WHERE project_id = p.id AND org_id = p_org_id AND is_deleted = false GROUP BY category ORDER BY cat_total DESC LIMIT 3) sub ON sub.category = r.category
    WHERE p.org_id = p_org_id GROUP BY p.id, p.name, p.code, p.budget_amount ORDER BY total_spent DESC;
END;
$$;

CREATE OR REPLACE FUNCTION get_user_email(p_user_id uuid)
RETURNS TABLE (email varchar) LANGUAGE sql SECURITY DEFINER STABLE AS $$
  SELECT email::varchar FROM auth.users WHERE id = p_user_id;
$$;

-- ─── 3.5 Role management (bypasses RLS via SECURITY DEFINER) ───

CREATE OR REPLACE FUNCTION upsert_user_role(p_target_user_id uuid, p_role text, p_org_id uuid)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM user_roles WHERE user_id = auth.uid() AND org_id = p_org_id AND role = 'Owner') THEN
    RAISE EXCEPTION 'permission denied: only Owners can change roles';
  END IF;
  INSERT INTO user_roles (user_id, org_id, role)
  VALUES (p_target_user_id, p_org_id, p_role)
  ON CONFLICT (user_id) DO UPDATE SET role = p_role;
END;
$$;
REVOKE ALL ON FUNCTION upsert_user_role FROM PUBLIC;
GRANT EXECUTE ON FUNCTION upsert_user_role TO authenticated;

-- ─── 4. Triggers ───

CREATE OR REPLACE FUNCTION set_updated_at() RETURNS TRIGGER AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END; $$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION set_org_id_from_user() RETURNS TRIGGER AS $$
BEGIN
  IF NEW.org_id IS NULL THEN NEW.org_id := (SELECT org_id FROM user_roles WHERE user_id = NEW.user_id LIMIT 1); END IF;
  RETURN NEW;
END; $$ LANGUAGE plpgsql SECURITY DEFINER;

DO $$ DECLARE tbl text;
BEGIN
  FOREACH tbl IN ARRAY ARRAY['receipts', 'audit_logs', 'receipt_history']
  LOOP
    EXECUTE format('DROP TRIGGER IF EXISTS trg_set_org_id ON %I', tbl);
    EXECUTE format('CREATE TRIGGER trg_set_org_id BEFORE INSERT ON %I FOR EACH ROW EXECUTE FUNCTION set_org_id_from_user()', tbl);
  END LOOP;
  
  FOREACH tbl IN ARRAY ARRAY['receipts', 'subscriptions', 'organization_settings', 'bank_transactions', 'vehicles', 'mileage_logs', 'vendor_defaults']
  LOOP
    EXECUTE format('DROP TRIGGER IF EXISTS trg_set_updated_at ON %I', tbl);
    EXECUTE format('CREATE TRIGGER trg_set_updated_at BEFORE UPDATE ON %I FOR EACH ROW EXECUTE FUNCTION set_updated_at()', tbl);
  END LOOP;
END $$;

-- ─── 5. Indexes ───

CREATE INDEX IF NOT EXISTS idx_receipts_org_deleted ON receipts(org_id, is_deleted);
CREATE INDEX IF NOT EXISTS idx_receipts_user_id ON receipts(user_id);
CREATE INDEX IF NOT EXISTS idx_receipts_transaction_date ON receipts(transaction_date);
CREATE INDEX IF NOT EXISTS idx_receipts_created_at ON receipts(created_at);
CREATE INDEX IF NOT EXISTS idx_receipts_org_status ON receipts(org_id, approval_status);
CREATE INDEX IF NOT EXISTS idx_receipts_duplicate_hash ON receipts(duplicate_hash);
CREATE INDEX IF NOT EXISTS idx_receipts_project_id ON receipts(project_id);
CREATE INDEX IF NOT EXISTS idx_user_roles_user_id ON user_roles(user_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_org_created ON audit_logs(org_id, created_at);
ALTER TABLE bank_transactions ADD COLUMN IF NOT EXISTS date date;
ALTER TABLE bank_transactions ADD COLUMN IF NOT EXISTS transaction_date text NOT NULL DEFAULT '';
ALTER TABLE bank_transactions ADD COLUMN IF NOT EXISTS uploaded_by uuid REFERENCES auth.users(id) ON DELETE SET NULL;
ALTER TABLE bank_transactions ADD COLUMN IF NOT EXISTS statement_date date;
ALTER TABLE bank_transactions ADD COLUMN IF NOT EXISTS source_file_name text;
CREATE INDEX IF NOT EXISTS idx_bank_tx_org ON bank_transactions(org_id, matched_receipt_id);
CREATE INDEX IF NOT EXISTS idx_bank_tx_date ON bank_transactions(org_id, date);
CREATE INDEX IF NOT EXISTS idx_receipt_comments_receipt ON receipt_comments(receipt_id);
CREATE INDEX IF NOT EXISTS idx_scan_attempts_user_time ON scan_attempts(user_id, attempted_at);

-- ─── 6. Post-migration safety constraints ───

-- H-5: Allow org UPDATE (org settings page)
DROP POLICY IF EXISTS "Update_Org" ON organizations;
CREATE POLICY "Update_Org" ON organizations FOR UPDATE USING (id = get_user_org());

-- H-4: Receipt FKs should not be nullable; backfill NULLs first
UPDATE receipts SET org_id = COALESCE(
  (SELECT org_id FROM user_roles WHERE user_id = receipts.user_id LIMIT 1),
  (SELECT org_id FROM user_roles LIMIT 1)
) WHERE org_id IS NULL;
UPDATE receipts SET user_id = COALESCE(
  (SELECT user_id FROM user_roles WHERE org_id = receipts.org_id LIMIT 1),
  auth.uid()
) WHERE user_id IS NULL;
DO $$ BEGIN
  ALTER TABLE receipts ALTER COLUMN org_id SET NOT NULL;
EXCEPTION WHEN others THEN NULL; END $$;
DO $$ BEGIN
  ALTER TABLE receipts ALTER COLUMN user_id SET NOT NULL;
EXCEPTION WHEN others THEN NULL; END $$;

-- H-8: Ensure project user deletion cascades
DO $$ BEGIN
  ALTER TABLE projects DROP CONSTRAINT IF EXISTS projects_user_id_fkey;
  ALTER TABLE projects ADD CONSTRAINT projects_user_id_fkey
    FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;
EXCEPTION WHEN others THEN NULL; END $$;

-- H-6: Missing FK and filtered-column indexes
CREATE INDEX IF NOT EXISTS idx_user_roles_org_id ON user_roles(org_id);
CREATE INDEX IF NOT EXISTS idx_projects_org_id ON projects(org_id);
CREATE INDEX IF NOT EXISTS idx_projects_user_id ON projects(user_id);
CREATE INDEX IF NOT EXISTS idx_business_units_org_id ON business_units(org_id);
CREATE INDEX IF NOT EXISTS idx_mileage_logs_org_id ON mileage_logs(org_id);
CREATE INDEX IF NOT EXISTS idx_mileage_logs_user_id ON mileage_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_mileage_logs_vehicle_id ON mileage_logs(vehicle_id);
CREATE INDEX IF NOT EXISTS idx_mileage_logs_trip_date ON mileage_logs(trip_date);
CREATE INDEX IF NOT EXISTS idx_receipt_history_receipt_id ON receipt_history(receipt_id);
CREATE INDEX IF NOT EXISTS idx_receipt_history_org_id ON receipt_history(org_id);
CREATE INDEX IF NOT EXISTS idx_receipt_comments_org_id ON receipt_comments(org_id);
CREATE INDEX IF NOT EXISTS idx_receipt_comments_user_id ON receipt_comments(user_id);
CREATE INDEX IF NOT EXISTS idx_vehicles_org_id ON vehicles(org_id);
CREATE INDEX IF NOT EXISTS idx_vehicles_user_id ON vehicles(user_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_user_id ON audit_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_receipt_id ON audit_logs(receipt_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_event_hash ON audit_logs(event_hash);
CREATE INDEX IF NOT EXISTS idx_org_settings_qbo_state ON organization_settings(qbo_auth_state);
CREATE INDEX IF NOT EXISTS idx_receipts_category ON receipts(org_id, category) WHERE is_deleted = false;
CREATE INDEX IF NOT EXISTS idx_receipts_fraud ON receipts(org_id) WHERE fraud_suspicion = true AND is_deleted = false;
CREATE INDEX IF NOT EXISTS idx_receipts_math_mismatch ON receipts(org_id) WHERE math_mismatch_warning = true AND is_deleted = false;
CREATE INDEX IF NOT EXISTS idx_receipts_duplicate_warning ON receipts(org_id) WHERE duplicate_warning = true AND is_deleted = false;
CREATE INDEX IF NOT EXISTS idx_receipts_high_confidence ON receipts(org_id) WHERE confidence_score >= 80 AND is_deleted = false;
CREATE INDEX IF NOT EXISTS idx_receipts_missing_bn ON receipts(org_id) WHERE vendor_tax_number IS NULL AND is_deleted = false;
CREATE INDEX IF NOT EXISTS idx_receipts_reimbursement ON receipts(org_id) WHERE paid_by = 'employee_cash' AND needs_reimbursement = true AND is_deleted = false;
CREATE INDEX IF NOT EXISTS idx_receipts_vendor_fts ON receipts USING gin(to_tsvector('english', coalesce(vendor_name, '')));
NOTIFY pgrst, 'reload schema';
