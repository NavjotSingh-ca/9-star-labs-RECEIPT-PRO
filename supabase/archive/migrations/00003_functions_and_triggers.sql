-- Migration 00003: Functions, triggers, and RPCs
-- Run after 00002_rls_policies.sql

-- ============================================================
-- TRIGGER FUNCTIONS
-- ============================================================

-- Protect approved receipts from hard-delete within CRA 6-year window
CREATE OR REPLACE FUNCTION protect_approved_receipt()
RETURNS TRIGGER AS $$
BEGIN
  IF OLD.approval_status = 'approved'
    AND OLD.transaction_date::date >= (CURRENT_DATE - INTERVAL '6 years')::date THEN
    RAISE EXCEPTION 'Cannot delete approved receipt within CRA 6-year retention period';
  END IF;
  RETURN OLD;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS protect_approved_receipt_trigger ON receipts;
CREATE TRIGGER protect_approved_receipt_trigger
  BEFORE DELETE ON receipts
  FOR EACH ROW EXECUTE FUNCTION protect_approved_receipt();

-- Auto-assign org on receipt insert
CREATE OR REPLACE FUNCTION set_user_org_on_insert()
RETURNS TRIGGER AS $$
BEGIN
  NEW.org_id := (SELECT org_id FROM profiles WHERE id = auth.uid());
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS set_org_on_receipt_insert ON receipts;
CREATE TRIGGER set_org_on_receipt_insert
  BEFORE INSERT ON receipts
  FOR EACH ROW EXECUTE FUNCTION set_user_org_on_insert();

-- Auto-update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply to tables with updated_at
CREATE OR REPLACE FUNCTION apply_updated_at_triggers() RETURNS void AS $$
DECLARE
  tbl text;
BEGIN
  FOR tbl IN
    SELECT unnest(ARRAY['organizations', 'profiles', 'receipts', 'projects',
                        'bank_connections', 'organization_settings', 'subscriptions'])
  LOOP
    EXECUTE format(
      'DROP TRIGGER IF EXISTS update_%I_updated_at ON %I; CREATE TRIGGER update_%I_updated_at BEFORE UPDATE ON %I FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();',
      tbl, tbl, tbl, tbl
    );
  END LOOP;
END;
$$ LANGUAGE plpgsql;

SELECT apply_updated_at_triggers();

-- ============================================================
-- RPC FUNCTIONS
-- ============================================================

-- Get current user's org_id
CREATE OR REPLACE FUNCTION get_user_org()
RETURNS uuid
LANGUAGE sql STABLE
AS $$
  SELECT org_id FROM profiles WHERE id = auth.uid();
$$;

-- Bootstrap first user's org
CREATE OR REPLACE FUNCTION bootstrap_first_user_org(
  p_user_id uuid,
  p_org_name text DEFAULT 'My Organization'
)
RETURNS uuid
LANGUAGE plpgsql
AS $$
DECLARE
  v_org_id uuid;
BEGIN
  -- Check if user already has an org
  SELECT org_id INTO v_org_id FROM profiles WHERE id = p_user_id;
  IF v_org_id IS NOT NULL THEN
    RETURN v_org_id;
  END IF;

  -- Create org
  INSERT INTO organizations (name)
  VALUES (p_org_name)
  RETURNING id INTO v_org_id;

  -- Create org settings
  INSERT INTO organization_settings (org_id) VALUES (v_org_id);

  -- Create free subscription
  INSERT INTO subscriptions (org_id, plan_tier, status)
  VALUES (v_org_id, 'free', 'active');

  -- Update profile
  UPDATE profiles
  SET org_id = v_org_id, role = 'Owner'
  WHERE id = p_user_id;

  RETURN v_org_id;
END;
$$;

-- Dashboard stats (tenant-isolated)
CREATE OR REPLACE FUNCTION get_dashboard_stats(p_org_id uuid)
RETURNS jsonb
LANGUAGE plpgsql STABLE
AS $$
DECLARE
  v_result jsonb;
BEGIN
  -- Verify membership
  IF NOT EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND org_id = p_org_id) THEN
    RAISE EXCEPTION 'Not a member of this organization';
  END IF;

  SELECT jsonb_build_object(
    'total_receipts', (SELECT COUNT(*) FROM receipts WHERE org_id = p_org_id AND is_deleted = false),
    'total_spend', (SELECT COALESCE(SUM(total_amount), 0) FROM receipts WHERE org_id = p_org_id AND is_deleted = false),
    'pending_count', (SELECT COUNT(*) FROM receipts WHERE org_id = p_org_id AND approval_status = 'pending' AND is_deleted = false),
    'flagged_count', (SELECT COUNT(*) FROM receipts WHERE org_id = p_org_id AND is_flagged = true AND is_deleted = false),
    'month_spend', (SELECT COALESCE(SUM(total_amount), 0) FROM receipts WHERE org_id = p_org_id AND is_deleted = false AND transaction_date::date >= date_trunc('month', CURRENT_DATE)::date),
    'last_month_spend', (SELECT COALESCE(SUM(total_amount), 0) FROM receipts WHERE org_id = p_org_id AND is_deleted = false AND transaction_date::date >= date_trunc('month', CURRENT_DATE - INTERVAL '1 month')::date AND transaction_date::date < date_trunc('month', CURRENT_DATE)::date)
  ) INTO v_result;

  RETURN v_result;
END;
$$;

-- Receipts paginated (tenant-isolated)
CREATE OR REPLACE FUNCTION get_receipts_paginated(
  p_org_id uuid,
  p_page int DEFAULT 1,
  p_limit int DEFAULT 50,
  p_status text DEFAULT NULL,
  p_search text DEFAULT NULL,
  p_category text DEFAULT NULL,
  p_date_from text DEFAULT NULL,
  p_date_to text DEFAULT NULL,
  p_sort_by text DEFAULT 'created_at',
  p_sort_dir text DEFAULT 'desc',
  p_semantic_ids text[] DEFAULT NULL,
  p_special_filter text DEFAULT NULL
)
RETURNS jsonb
LANGUAGE plpgsql STABLE
AS $$
DECLARE
  v_offset int;
  v_total int;
  v_results jsonb;
  v_query text;
BEGIN
  -- Verify membership
  IF NOT EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND org_id = p_org_id) THEN
    RAISE EXCEPTION 'Not a member of this organization';
  END IF;

  v_offset := (p_page - 1) * p_limit;

  -- Count total matching
  SELECT COUNT(*) INTO v_total
  FROM receipts
  WHERE org_id = p_org_id
    AND is_deleted = false
    AND (p_status IS NULL OR approval_status = p_status)
    AND (p_search IS NULL OR vendor_name ILIKE '%' || p_search || '%')
    AND (p_category IS NULL OR category = p_category)
    AND (p_date_from IS NULL OR transaction_date::date >= p_date_from::date)
    AND (p_date_to IS NULL OR transaction_date::date <= p_date_to::date)
    AND (p_semantic_ids IS NULL OR id = ANY (p_semantic_ids::uuid[]))
    AND (p_special_filter IS NULL OR
      (p_special_filter = 'missing-bn' AND (business_number IS NULL OR business_number = '')) OR
      (p_special_filter = 'flagged-audit' AND is_flagged = true) OR
      (p_special_filter = 'reimbursement' AND reimbursement_status = 'pending')
    );

  -- Build query dynamically
  v_query := format(
    'SELECT jsonb_agg(sub ORDER BY %I %s) FROM (SELECT * FROM receipts WHERE org_id = %L AND is_deleted = false %s ORDER BY %I %s LIMIT %L OFFSET %L) sub',
    p_sort_by, p_sort_dir, p_org_id,
    CASE WHEN p_status IS NOT NULL THEN format(' AND approval_status = %L', p_status) ELSE '' END ||
    CASE WHEN p_search IS NOT NULL THEN format(' AND vendor_name ILIKE %L', '%' || p_search || '%') ELSE '' END ||
    CASE WHEN p_category IS NOT NULL THEN format(' AND category = %L', p_category) ELSE '' END ||
    CASE WHEN p_date_from IS NOT NULL THEN format(' AND transaction_date::date >= %L::date', p_date_from) ELSE '' END ||
    CASE WHEN p_date_to IS NOT NULL THEN format(' AND transaction_date::date <= %L::date', p_date_to) ELSE '' END ||
    CASE WHEN p_semantic_ids IS NOT NULL THEN format(' AND id = ANY(%L::uuid[])', p_semantic_ids) ELSE '' END,
    p_sort_by, p_sort_dir, p_limit, v_offset
  );

  EXECUTE v_query INTO v_results;

  RETURN jsonb_build_object(
    'data', COALESCE(v_results, '[]'::jsonb),
    'total', v_total,
    'page', p_page,
    'limit', p_limit,
    'total_pages', GREATEST(1, ceil(v_total::numeric / p_limit))
  );
END;
$$;

-- Spend anomalies (tenant-isolated)
CREATE OR REPLACE FUNCTION get_spend_anomalies(p_org_id uuid)
RETURNS jsonb
LANGUAGE plpgsql STABLE
AS $$
DECLARE
  v_result jsonb;
BEGIN
  IF NOT EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND org_id = p_org_id) THEN
    RAISE EXCEPTION 'Not a member of this organization';
  END IF;

  SELECT jsonb_build_object(
    'fraud_suspicions', (SELECT COUNT(*) FROM receipts WHERE org_id = p_org_id AND is_flagged = true AND flag_reason ILIKE '%fraud%'),
    'math_errors', (SELECT COUNT(*) FROM receipts WHERE org_id = p_org_id AND ABS(COALESCE(subtotal,0) + COALESCE(tax_amount,0) + COALESCE(pst_amount,0) - COALESCE(total_amount,0)) > 0.02),
    'missing_bn', (SELECT COUNT(*) FROM receipts WHERE org_id = p_org_id AND (business_number IS NULL OR business_number = '')),
    'duplicates', (SELECT COUNT(*) FROM (SELECT duplicate_hash FROM receipts WHERE org_id = p_org_id AND duplicate_hash IS NOT NULL AND is_deleted = false GROUP BY duplicate_hash HAVING COUNT(*) > 1) dup),
    'total_anomalies', (SELECT COUNT(*) FROM receipts WHERE org_id = p_org_id AND is_flagged = true)
  ) INTO v_result;

  RETURN v_result;
END;
$$;

-- Project actuals (tenant-isolated)
CREATE OR REPLACE FUNCTION get_project_actuals(p_org_id uuid, p_project_id uuid)
RETURNS jsonb
LANGUAGE plpgsql STABLE
AS $$
DECLARE
  v_result jsonb;
BEGIN
  IF NOT EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND org_id = p_org_id) THEN
    RAISE EXCEPTION 'Not a member of this organization';
  END IF;

  SELECT jsonb_build_object(
    'total_spent', COALESCE(SUM(r.total_amount), 0),
    'receipt_count', COUNT(r.id)
  ) INTO v_result
  FROM receipts r
  WHERE r.org_id = p_org_id AND r.project_id = p_project_id AND r.is_deleted = false;

  RETURN v_result;
END;
$$;
