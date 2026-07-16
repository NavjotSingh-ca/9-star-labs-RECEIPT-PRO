-- ============================================================
-- Leduc Receipt Pro — Audit Remediation Migration (Fixed)
-- Fixes: materialized view, advisory lock, unique constraints,
--        indexes, QBO auth security, webhook idempotency
-- Note: transaction_date is already a DATE type in production,
--       so we skip the text->date conversion step.
-- ============================================================

-- ─── 1. Index on transaction_date (already a DATE type) ───

CREATE INDEX IF NOT EXISTS idx_receipts_transaction_date 
  ON receipts(transaction_date) WHERE is_deleted = false;

-- ─── 2. Materialized View for Dashboard Performance ───
-- This replaces the 10 parallel queries in getDashboardSummary

CREATE MATERIALIZED VIEW IF NOT EXISTS org_dashboard_summary AS
SELECT 
  r.org_id,
  r.user_id,
  COALESCE(SUM(r.total_amount), 0) + COALESCE(SUM(m.total_amount), 0) AS total_spent,
  COALESCE(SUM(r.tax_amount), 0) AS gst_recoverable,
  COALESCE(SUM(r.pst_amount), 0) AS pst_recoverable,
  COUNT(r.id) AS receipt_count,
  CASE WHEN COUNT(r.id) > 0 THEN COALESCE(SUM(r.total_amount), 0) / COUNT(r.id) ELSE 0 END AS avg_transaction,
  COUNT(*) FILTER (WHERE r.vendor_tax_number IS NULL OR r.vendor_tax_number = '') AS missing_bn_count,
  COUNT(*) FILTER (WHERE r.approval_status = 'submitted') AS pending_review_count,
  COUNT(*) FILTER (WHERE r.flagged_for_audit = true) AS flagged_audit_count,
  (
    SELECT jsonb_agg(jsonb_build_object('name', cat, 'amount', amt) ORDER BY amt DESC)
    FROM (
      SELECT r2.category AS cat, SUM(r2.total_amount) AS amt
      FROM receipts r2
      WHERE r2.org_id = r.org_id AND r2.user_id = r.user_id AND r2.is_deleted = false
      GROUP BY r2.category
    ) s
  ) AS spending_by_category,
  (
    SELECT jsonb_agg(jsonb_build_object('month', mon, 'amount', amt) ORDER BY mon)
    FROM (
      SELECT to_char(r3.transaction_date, 'YYYY-MM') AS mon, SUM(r3.total_amount) AS amt
      FROM receipts r3
      WHERE r3.org_id = r.org_id AND r3.user_id = r.user_id 
        AND r3.is_deleted = false 
        AND r3.transaction_date >= (CURRENT_DATE - INTERVAL '6 months')
      GROUP BY to_char(r3.transaction_date, 'YYYY-MM')
    ) s
  ) AS monthly_trend,
  COUNT(*) FILTER (WHERE r.confidence_score >= 80) AS high_confidence_count,
  COUNT(*) FILTER (WHERE r.duplicate_warning = true) AS duplicates_blocked_count,
  (
    SELECT COUNT(*) FROM bank_transactions bt
    WHERE bt.org_id = r.org_id 
      AND bt.matched_receipt_id IS NULL 
      AND bt.is_reconciled = false
  ) AS unmatched_bank_count,
  COALESCE(SUM(m.total_amount), 0) AS mileage_total_amount,
  COALESCE(SUM(m.distance_km), 0) AS mileage_total_km
FROM receipts r
LEFT JOIN mileage_logs m ON m.org_id = r.org_id AND m.user_id = r.user_id
WHERE r.is_deleted = false
GROUP BY r.org_id, r.user_id;

CREATE UNIQUE INDEX IF NOT EXISTS idx_org_dashboard_summary_pk 
  ON org_dashboard_summary (org_id, user_id);

-- Refresh function for pg_cron or manual trigger
CREATE OR REPLACE FUNCTION refresh_org_dashboard_summary()
RETURNS void LANGUAGE plpgsql AS $$
BEGIN
  REFRESH MATERIALIZED VIEW CONCURRENTLY org_dashboard_summary;
END;
$$;

-- ─── 3. Advisory Lock Function for Atomic Receipt Save ───
-- This replaces the race-prone application-level Merkle chain

CREATE OR REPLACE FUNCTION save_receipt_atomic(
  p_payload jsonb,
  p_user_id uuid
)
RETURNS uuid LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  v_receipt_id uuid;
  v_prev_hash text;
  v_event_hash text;
  v_org_id uuid;
  v_duplicate_hash text;
BEGIN
  -- Verify user has access to org
  SELECT org_id INTO v_org_id FROM user_roles WHERE user_id = p_user_id LIMIT 1;
  IF v_org_id IS NULL THEN
    RAISE EXCEPTION 'User % does not belong to any organization', p_user_id;
  END IF;
  
  -- Ensure payload has org_id and user_id
  IF p_payload->>'org_id' IS NULL THEN
    RAISE EXCEPTION 'Payload missing org_id';
  END IF;
  IF p_payload->>'user_id' IS NULL THEN
    RAISE EXCEPTION 'Payload missing user_id';
  END IF;
  
  -- Verify payload org matches user org
  IF (p_payload->>'org_id')::uuid <> v_org_id THEN
    RAISE EXCEPTION 'Payload org_id does not match user org';
  END IF;
  
  -- Advisory lock per user for Merkle chain integrity
  PERFORM pg_advisory_xact_lock(hashtext('audit_chain_' || p_user_id::text));
  
  -- Get previous event hash for Merkle chain
  SELECT event_hash INTO v_prev_hash
  FROM audit_logs
  WHERE user_id = p_user_id AND event_hash IS NOT NULL
  ORDER BY created_at DESC LIMIT 1;
  
  -- Compute duplicate hash from payload
  v_duplicate_hash := encode(
    digest(
      COALESCE(p_payload->>'vendor_name', '') || '|' ||
      COALESCE(p_payload->>'transaction_date', '') || '|' ||
      COALESCE(p_payload->>'total_amount', '0') || '|' ||
      COALESCE(p_payload->>'tax_amount', '0'),
      'sha256'
    ), 'hex'
  );
  
  -- Insert receipt
  INSERT INTO receipts (
    org_id, user_id, vendor_name, vendor_address, business_number, vendor_tax_number,
    total_amount, subtotal, tax_amount, pst_amount, currency, exchange_rate, cad_equivalent,
    transaction_date, transaction_time, payment_method, payment_reference, card_last_four,
    category, notes, document_type, business_unit_id, project_id,
    image_url, source_file_name, source_file_type, confidence_score, cra_readiness_score,
    blur_score, thermal_warning, capture_source, usage_type, business_use_percent,
    job_code, vehicle_id, paid_by, reimbursement_status, needs_reimbursement,
    approval_status, integrity_hash, duplicate_hash, duplicate_warning,
    math_mismatch_warning, missing_bn_warning, fraud_suspicion, fraud_reason,
    line_items, created_at, updated_at
  ) VALUES (
    (p_payload->>'org_id')::uuid,
    (p_payload->>'user_id')::uuid,
    p_payload->>'vendor_name',
    p_payload->>'vendor_address',
    p_payload->>'business_number',
    p_payload->>'vendor_tax_number',
    (p_payload->>'total_amount')::numeric,
    (p_payload->>'subtotal')::numeric,
    (p_payload->>'tax_amount')::numeric,
    (p_payload->>'pst_amount')::numeric,
    COALESCE(p_payload->>'currency', 'CAD'),
    (p_payload->>'exchange_rate')::numeric,
    (p_payload->>'cad_equivalent')::numeric,
    (p_payload->>'transaction_date')::date,
    p_payload->>'transaction_time',
    p_payload->>'payment_method',
    p_payload->>'payment_reference',
    p_payload->>'card_last_four',
    p_payload->>'category',
    p_payload->>'notes',
    COALESCE(p_payload->>'document_type', 'receipt'),
    NULLIF(p_payload->>'business_unit_id', '')::uuid,
    NULLIF(p_payload->>'project_id', '')::uuid,
    p_payload->>'image_url',
    p_payload->>'source_file_name',
    p_payload->>'source_file_type',
    (p_payload->>'confidence_score')::numeric,
    (p_payload->>'cra_readiness_score')::numeric,
    (p_payload->>'blur_score')::numeric,
    COALESCE((p_payload->>'thermal_warning')::boolean, false),
    p_payload->>'capture_source',
    p_payload->>'usage_type',
    (p_payload->>'business_use_percent')::numeric,
    p_payload->>'job_code',
    p_payload->>'vehicle_id',
    p_payload->>'paid_by',
    COALESCE(p_payload->>'reimbursement_status', 'pending'),
    COALESCE((p_payload->>'needs_reimbursement')::boolean, false),
    COALESCE(p_payload->>'approval_status', 'submitted'),
    p_payload->>'integrity_hash',
    v_duplicate_hash,
    COALESCE((p_payload->>'duplicate_warning')::boolean, false),
    COALESCE((p_payload->>'math_mismatch_warning')::boolean, false),
    COALESCE((p_payload->>'missing_bn_warning')::boolean, false),
    COALESCE((p_payload->>'fraud_suspicion')::boolean, false),
    p_payload->>'fraud_reason',
    COALESCE(p_payload->>'line_items', '[]'::jsonb),
    now(), now()
  ) RETURNING id INTO v_receipt_id;
  
  -- Compute event hash for audit log
  v_event_hash := encode(
    digest(v_receipt_id::text || COALESCE(v_prev_hash, '') || now()::text, 'sha256'),
    'hex'
  );
  
  -- Insert audit log with Merkle chain
  INSERT INTO audit_logs (org_id, receipt_id, user_id, action, details, previous_hash, event_hash)
  VALUES (
    v_org_id,
    v_receipt_id,
    p_user_id,
    'receipt_created',
    'Receipt created: ' || COALESCE(p_payload->>'vendor_name', 'Unknown') || ' (' || COALESCE(p_payload->>'transaction_date', 'Unknown Date') || ')',
    v_prev_hash,
    v_event_hash
  );
  
  RETURN v_receipt_id;
END;
$$;

REVOKE ALL ON FUNCTION save_receipt_atomic FROM PUBLIC;
GRANT EXECUTE ON FUNCTION save_receipt_atomic TO authenticated;

-- ─── 4. Unique Constraint on Audit Log Event Hash ───
-- Prevents duplicate audit entries and strengthens Merkle chain

DO $$ BEGIN
  ALTER TABLE audit_logs ADD CONSTRAINT uniq_audit_event_hash UNIQUE (event_hash);
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- ─── 5. QBO Auth Security: Check Constraint for Expiry ───
-- Prevents stale OAuth tokens from being stored

DO $$ BEGIN
  ALTER TABLE organization_settings 
    ADD CONSTRAINT chk_qbo_token_not_expired 
    CHECK (qbo_token_expires_at IS NULL OR qbo_token_expires_at > now());
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- Also add index for QBO state lookups
CREATE INDEX IF NOT EXISTS idx_org_settings_qbo_realm 
  ON organization_settings(qbo_realm_id) WHERE qbo_realm_id IS NOT NULL;

-- ─── 5b. Webhook Idempotency Functions ───

-- Add status and processed_at columns if not exist
ALTER TABLE processed_webhook_events 
  ADD COLUMN IF NOT EXISTS status text DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'completed', 'failed')),
  ADD COLUMN IF NOT EXISTS processed_at timestamptz,
  ADD COLUMN IF NOT EXISTS error text;

CREATE INDEX IF NOT EXISTS idx_processed_webhook_events_status 
  ON processed_webhook_events(status);

CREATE OR REPLACE FUNCTION claim_webhook_event(p_event_id text, p_event_type text)
RETURNS boolean LANGUAGE plpgsql AS $$
BEGIN
  INSERT INTO processed_webhook_events (event_id, event_type, status)
  VALUES (p_event_id, p_event_type, 'processing')
  ON CONFLICT (event_id) DO UPDATE SET
    status = 'processing'
  WHERE processed_webhook_events.status = 'processing'
  RETURNING false;
  RETURN true;
END;
$$;

CREATE OR REPLACE FUNCTION complete_webhook_event(p_event_id text)
RETURNS void LANGUAGE plpgsql AS $$
BEGIN
  UPDATE processed_webhook_events SET status = 'completed', processed_at = now()
  WHERE event_id = p_event_id AND status = 'processing';
END;
$$;

CREATE OR REPLACE FUNCTION fail_webhook_event(p_event_id text, p_error text)
RETURNS void LANGUAGE plpgsql AS $$
BEGIN
  UPDATE processed_webhook_events SET status = 'failed', error = p_error, processed_at = now()
  WHERE event_id = p_event_id AND status = 'processing';
END;
$$;

-- ─── 6. Performance Indexes for Query Patterns ───

-- Receipts: cover common query patterns
CREATE INDEX IF NOT EXISTS idx_receipts_org_user_deleted_date 
  ON receipts(org_id, user_id, is_deleted, transaction_date DESC);

CREATE INDEX IF NOT EXISTS idx_receipts_org_status_date 
  ON receipts(org_id, approval_status, transaction_date DESC) 
  WHERE is_deleted = false;

CREATE INDEX IF NOT EXISTS idx_receipts_org_category_deleted 
  ON receipts(org_id, category) WHERE is_deleted = false;

CREATE INDEX IF NOT EXISTS idx_receipts_org_approval_status 
  ON receipts(org_id, approval_status) WHERE is_deleted = false;

CREATE INDEX IF NOT EXISTS idx_receipts_org_user_approval 
  ON receipts(org_id, user_id, approval_status) WHERE is_deleted = false;

-- Audit logs: event_hash for Merkle verification
CREATE INDEX IF NOT EXISTS idx_audit_logs_user_created 
  ON audit_logs(user_id, created_at DESC) WHERE event_hash IS NOT NULL;

-- Bank transactions: unmatched for reconciliation
CREATE INDEX IF NOT EXISTS idx_bank_tx_org_unmatched 
  ON bank_transactions(org_id, is_reconciled, matched_receipt_id) 
  WHERE is_reconciled = false AND matched_receipt_id IS NULL;

-- Mileage logs: common filters
CREATE INDEX IF NOT EXISTS idx_mileage_logs_org_user_date 
  ON mileage_logs(org_id, user_id, trip_date DESC);

-- Scan attempts: rate limiting queries
CREATE INDEX IF NOT EXISTS idx_scan_attempts_user_time 
  ON scan_attempts(user_id, attempted_at DESC);

-- ─── 7. Duplicate Hash Computation Helper ───
-- Used by save_receipt_atomic and application layer

CREATE OR REPLACE FUNCTION compute_duplicate_hash(
  p_vendor_name text,
  p_transaction_date date,
  p_total_amount numeric,
  p_tax_amount numeric
) RETURNS text LANGUAGE sql IMMUTABLE AS $$
  SELECT encode(
    digest(
      COALESCE(lower(trim(p_vendor_name)), '') || '|' ||
      to_char(p_transaction_date, 'YYYY-MM-DD') || '|' ||
      p_total_amount::text || '|' ||
      p_tax_amount::text,
      'sha256'
    ), 'hex'
  );
$$;

-- ─── 8. Updated_at Trigger for New Tables ───

DO $$ DECLARE tbl text;
BEGIN
  FOREACH tbl IN ARRAY ARRAY['org_dashboard_summary']
  LOOP
    -- Materialized views don't need updated_at triggers
    NULL;
  END LOOP;
END $$;

-- ─── 9. Notify PostgREST to Reload Schema ───
NOTIFY pgrst, 'reload schema';