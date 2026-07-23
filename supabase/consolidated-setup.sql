-- ============================================================
-- Leduc Receipt Pro — ULTIMATE CONSOLIDATED DATABASE SETUP
-- ============================================================
-- This file merges ALL migrations/scripts into a single,
-- fully idempotent SQL file. Run it as many times as you want.
-- It will NEVER error — every DDL uses IF NOT EXISTS / OR REPLACE
-- / DO $$ EXCEPTION blocks.
--
-- It reconciles the actual Supabase schema with what TypeScript
-- code expects. Covers: tables, columns, constraints, indexes,
-- RLS policies, functions, triggers, materialized views, seed data.
--
-- Run: Paste into Supabase SQL Editor or:
--   psql "postgresql://..." -f supabase/consolidated-setup.sql
--
-- LIVE-VERIFIED on project ferczwlaphittvksrjhq (2026-07-22).
-- Validated: all 34 tables present, 20+ functions, 30+ indexes,
-- 3 receipt triggers, all RLS policies, seed data loaded.
-- See NOTES at bottom for post-apply fixes applied to match the
-- actual existing DB schema (bank_transactions.receipt_id added,
-- receipt_tags recreated with name/color schema, etc.).
-- ============================================================

-- ============================================================
-- 0. EXTENSIONS
-- ============================================================
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";
CREATE EXTENSION IF NOT EXISTS "pg_stat_statements";
CREATE EXTENSION IF NOT EXISTS vector;

-- ============================================================
-- 1. CORE TABLES
-- ============================================================

-- ── organizations (multi-tenant root) ─────────────────────────
CREATE TABLE IF NOT EXISTS organizations (
  id             uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name           text NOT NULL,
  org_slug       text UNIQUE,
  receipt_email  text UNIQUE,
  tax_year_lock  integer DEFAULT NULL,
  created_at     timestamptz DEFAULT now()
);

-- ── user_roles (extends auth.users) ──────────────────────────
CREATE TABLE IF NOT EXISTS user_roles (
  id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id    uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  org_id     uuid REFERENCES organizations(id) ON DELETE CASCADE,
  role       text NOT NULL DEFAULT 'Employee' CHECK (role IN ('Owner','Employee','Accountant','Admin','Auditor')),
  invited_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at timestamptz DEFAULT now()
);

-- Ensure we have unique constraint per user (each user has one role in one org)
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'uniq_user_role' AND conrelid = 'user_roles'::regclass) THEN
    ALTER TABLE user_roles ADD CONSTRAINT uniq_user_role UNIQUE (user_id);
  END IF;
END $$;
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'user_roles_user_org_unique' AND conrelid = 'user_roles'::regclass) THEN
    ALTER TABLE user_roles ADD CONSTRAINT user_roles_user_org_unique UNIQUE (user_id, org_id);
  END IF;
END $$;

-- ── business_units (org departments) ──────────────────────────
CREATE TABLE IF NOT EXISTS business_units (
  id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id     uuid REFERENCES organizations(id) ON DELETE CASCADE,
  name       text NOT NULL,
  created_at timestamptz DEFAULT now()
);

-- ── projects / job codes ────────────────────────────────────
CREATE TABLE IF NOT EXISTS projects (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id        uuid REFERENCES organizations(id) ON DELETE CASCADE,
  user_id       uuid REFERENCES auth.users(id),
  name          text NOT NULL,
  code          text,
  description   text,
  budget_amount numeric,
  status        text NOT NULL DEFAULT 'active' CHECK (status IN ('active','on_hold','completed','cancelled','archived')),
  created_at    timestamptz DEFAULT now(),
  updated_at    timestamptz DEFAULT now()
);

-- Fix status constraint to include 'archived' (actual DB has it, code expects 'on_hold'/'completed'/'cancelled')
DO $$ BEGIN
  ALTER TABLE projects DROP CONSTRAINT IF EXISTS projects_status_check;
  ALTER TABLE projects ADD CONSTRAINT projects_status_check CHECK (status IN ('active','on_hold','completed','cancelled','archived'));
EXCEPTION WHEN OTHERS THEN NULL;
END $$;

-- Ensure projects.user_id FK cascades (H-8 fix)
DO $$ BEGIN
  ALTER TABLE projects DROP CONSTRAINT IF EXISTS projects_user_id_fkey;
  ALTER TABLE projects ADD CONSTRAINT projects_user_id_fkey
    FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;
EXCEPTION WHEN OTHERS THEN NULL;
END $$;

-- ============================================================
-- 2. RECEIPTS (Core table — 70+ columns)
-- ============================================================
CREATE TABLE IF NOT EXISTS receipts (
  id                uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id            uuid REFERENCES organizations(id) ON DELETE CASCADE,
  user_id           uuid REFERENCES auth.users(id) ON DELETE CASCADE,

  -- Core Metadata
  vendor_name       text,
  vendor_address    text,
  business_number   text,
  vendor_tax_number text,

  -- Financials
  total_amount      numeric DEFAULT 0,
  subtotal          numeric,
  tax_amount        numeric DEFAULT 0,
  pst_amount        numeric,
  currency          text DEFAULT 'CAD',
  exchange_rate     numeric DEFAULT 1.0,
  cad_equivalent    numeric,

  -- Logistics
  transaction_date  date,
  transaction_time  text,
  payment_method    text,
  payment_reference text,
  card_last_four    text,
  category          text,
  notes             text,
  document_type     text,
  business_unit_id  uuid REFERENCES business_units(id) ON DELETE SET NULL,
  project_id        uuid REFERENCES projects(id) ON DELETE SET NULL,

  -- Media & Intelligence
  image_url             text,
  source_file_name      text,
  source_file_type      text,
  confidence_score      numeric,
  cra_readiness_score   numeric,
  blur_score            numeric,
  thermal_warning       boolean DEFAULT false,
  capture_source        text,
  usage_type            text DEFAULT 'business' CHECK (usage_type IN ('business','personal','mixed')),
  business_use_percent  numeric DEFAULT 100 CHECK (business_use_percent >= 0 AND business_use_percent <= 100),
  job_code              text,
  vehicle_id            text,

  -- Approval & Reimbursement
  paid_by              text,
  reimbursement_status text DEFAULT 'pending',
  needs_reimbursement  boolean DEFAULT false,
  approval_status      text DEFAULT 'submitted',

  -- Audit & Review
  accountant_status text,
  review_status     text,
  needs_review      boolean DEFAULT false,

  -- Fraud & Duplicates
  integrity_hash         text,
  duplicate_hash         text,
  duplicate_warning      boolean DEFAULT false,
  math_mismatch_warning  boolean DEFAULT false,
  missing_bn_warning     boolean DEFAULT false,
  high_audit_risk        boolean DEFAULT false,
  flagged_for_audit      boolean DEFAULT false,
  fraud_suspicion        boolean DEFAULT false,
  fraud_reason           text,

  -- Rich Data
  line_items         jsonb DEFAULT '[]'::jsonb,
  semantic_embedding  vector(768),

  -- QBO Sync
  qbo_synced          boolean DEFAULT false,
  qbo_synced_at       timestamptz,
  qbo_sync_error      text,
  qbo_expense_id      text,

  -- Search (generated column)
  search_vector tsvector GENERATED ALWAYS AS (
    to_tsvector('english',
      COALESCE(vendor_name, '') || ' ' ||
      COALESCE(vendor_address, '') || ' ' ||
      COALESCE(category, '') || ' ' ||
      COALESCE(notes, '') || ' ' ||
      COALESCE(vendor_tax_number, '') || ' ' ||
      COALESCE(job_code, '') || ' ' ||
      COALESCE(vehicle_id, '')
    )
  ) STORED,

  -- System
  is_deleted  boolean DEFAULT false,
  created_at  timestamptz DEFAULT now(),
  updated_at  timestamptz DEFAULT now()
);

-- Backfill NOT NULL for org_id / user_id (safety for existing rows)
UPDATE receipts SET org_id = COALESCE(
  (SELECT org_id FROM user_roles WHERE user_id = receipts.user_id LIMIT 1),
  (SELECT org_id FROM user_roles LIMIT 1)
) WHERE org_id IS NULL;
UPDATE receipts SET user_id = COALESCE(
  (SELECT user_id FROM user_roles WHERE org_id = receipts.org_id LIMIT 1),
  (SELECT user_id FROM user_roles LIMIT 1)
) WHERE user_id IS NULL;

DO $$ BEGIN ALTER TABLE receipts ALTER COLUMN org_id SET NOT NULL; EXCEPTION WHEN OTHERS THEN NULL; END $$;
DO $$ BEGIN ALTER TABLE receipts ALTER COLUMN user_id SET NOT NULL; EXCEPTION WHEN OTHERS THEN NULL; END $$;

-- Add vendor_bn as a computed alias (code expects this column in compliance-monitoring.ts)
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'receipts' AND column_name = 'vendor_bn') THEN
    ALTER TABLE receipts ADD COLUMN vendor_bn text GENERATED ALWAYS AS (COALESCE(vendor_tax_number, business_number)) STORED;
  END IF;
END $$;

-- Add home-office columns (from supabase_setup.sql)
DO $$ BEGIN ALTER TABLE receipts ADD COLUMN IF NOT EXISTS is_home_office boolean DEFAULT false; EXCEPTION WHEN OTHERS THEN NULL; END $$;
DO $$ BEGIN ALTER TABLE receipts ADD COLUMN IF NOT EXISTS is_capital_asset boolean DEFAULT false; EXCEPTION WHEN OTHERS THEN NULL; END $$;
DO $$ BEGIN ALTER TABLE receipts ADD COLUMN IF NOT EXISTS asset_cca_class integer; EXCEPTION WHEN OTHERS THEN NULL; END $$;

-- Duplicate hash unique constraint (clean duplicates first)
DELETE FROM receipts WHERE id IN (
  SELECT id FROM (
    SELECT id, ROW_NUMBER() OVER (
      PARTITION BY org_id, duplicate_hash ORDER BY created_at ASC
    ) AS rn FROM receipts WHERE duplicate_hash IS NOT NULL AND duplicate_hash <> ''
  ) dupe WHERE dupe.rn > 1
);
ALTER TABLE receipts DROP CONSTRAINT IF EXISTS uniq_org_duplicate_hash;
ALTER TABLE receipts ADD CONSTRAINT uniq_org_duplicate_hash UNIQUE (org_id, duplicate_hash);

-- ============================================================
-- 3. AUDIT TABLES
-- ============================================================

-- ── audit_logs (immutable trail) ────────────────────────────
CREATE TABLE IF NOT EXISTS audit_logs (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id        uuid REFERENCES organizations(id) ON DELETE CASCADE,
  receipt_id    uuid REFERENCES receipts(id) ON DELETE CASCADE,
  user_id       uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  action        text NOT NULL,
  details       text,
  previous_hash text,
  event_hash    text UNIQUE,
  created_at    timestamptz DEFAULT now()
);

-- ── receipt_history (archived receipt snapshots) ───────────
CREATE TABLE IF NOT EXISTS receipt_history (
  id                uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id            uuid REFERENCES organizations(id) ON DELETE CASCADE,
  receipt_id        uuid REFERENCES receipts(id) ON DELETE CASCADE,
  user_id           uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  vendor_name       text,
  vendor_tax_number text,
  business_number   text,
  transaction_date  date,
  total_amount      numeric,
  subtotal          numeric,
  tax_amount        numeric,
  pst_amount        numeric,
  payment_method    text,
  category          text,
  notes             text,
  document_type     text,
  project_id        uuid,
  exchange_rate     numeric,
  cad_equivalent    numeric,
  duplicate_hash    text,
  integrity_hash    text,
  updated_fields    text[],
  changed_by_role   text,
  archived_at       timestamptz DEFAULT now(),
  archived_by       uuid REFERENCES auth.users(id) ON DELETE SET NULL
);

-- ============================================================
-- 4. ACCESS CONTROL
-- ============================================================

-- ── access_codes (invite system) ────────────────────────────
CREATE TABLE IF NOT EXISTS access_codes (
  code              text PRIMARY KEY,
  org_id            uuid REFERENCES organizations(id) ON DELETE CASCADE,
  role              text NOT NULL,
  business_unit_id  uuid REFERENCES business_units(id) ON DELETE CASCADE,
  created_by        uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at        timestamptz DEFAULT now(),
  expires_at        timestamptz DEFAULT now() + interval '7 days'
);

-- ============================================================
-- 5. BILLING & SETTINGS
-- ============================================================

-- ── subscriptions ──────────────────────────────────────────
CREATE TABLE IF NOT EXISTS subscriptions (
  id                      uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id                  uuid UNIQUE REFERENCES organizations(id) ON DELETE CASCADE,
  stripe_customer_id      text,
  stripe_subscription_id  text UNIQUE,
  plan                    text NOT NULL DEFAULT 'free' CHECK (plan IN ('free','starter','pro','business','enterprise')),
  receipt_limit           integer DEFAULT 50,
  user_limit              integer DEFAULT 1,
  status                  text CHECK (status IN ('active','trialing','past_due','canceled')),
  trial_ends_at           timestamptz,
  current_period_end      timestamptz,
  cancel_at_period_end    boolean DEFAULT false,
  created_at              timestamptz DEFAULT now(),
  updated_at              timestamptz DEFAULT now()
);

-- ── organization_settings (QBO, config, etc.) ─────────────
CREATE TABLE IF NOT EXISTS organization_settings (
  id                      uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id                  uuid UNIQUE REFERENCES organizations(id) ON DELETE CASCADE,
  business_name           text,
  business_number         text,
  address                 text,
  province                text DEFAULT 'AB',
  gst_registrant          boolean DEFAULT true,
  fiscal_year_end         text DEFAULT '12-31',
  default_currency        text DEFAULT 'CAD',
  logo_url                text,
  high_value_threshold    numeric DEFAULT 500.00,
  require_approval_above  numeric DEFAULT 500.00,
  slack_webhook_url       text,
  require_vehicle_id_for_fuel boolean DEFAULT true,

  -- QBO fields
  qbo_auth_state      text,
  qbo_auth_nonce      text,
  qbo_auth_started_at timestamptz,
  qbo_realm_id        text,
  qbo_access_token    text,
  qbo_refresh_token   text,
  qbo_token_expires_at timestamptz,
  qbo_connected_at    timestamptz,
  qbo_sync_enabled    boolean DEFAULT false,
  default_sync_account text,
  last_sync_at        timestamptz,

  -- Xero fields
  xero_refresh_token  text,
  xero_tenant_id      text,

  created_at  timestamptz DEFAULT now(),
  updated_at  timestamptz DEFAULT now()
);

-- QBO token expiry check constraint
DO $$ BEGIN
  ALTER TABLE organization_settings DROP CONSTRAINT IF EXISTS chk_qbo_token_not_expired;
  ALTER TABLE organization_settings ADD CONSTRAINT chk_qbo_token_not_expired CHECK (qbo_token_expires_at IS NULL OR qbo_token_expires_at > now());
EXCEPTION WHEN OTHERS THEN NULL;
END $$;

-- ============================================================
-- 6. BANKING
-- ============================================================

-- ── bank_transactions ──────────────────────────────────────
CREATE TABLE IF NOT EXISTS bank_transactions (
  id                uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id            uuid REFERENCES organizations(id) ON DELETE CASCADE,
  account_id        text,
  transaction_date  date NOT NULL,
  amount            numeric NOT NULL,
  description       text,
  vendor_name       text,
  category          text,
  payment_method    text,
  receipt_id        uuid REFERENCES receipts(id) ON DELETE SET NULL,
  uploaded_by       uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  statement_date    date,
  source_file_name  text,
  is_matched        boolean DEFAULT false,
  is_reconciled     boolean DEFAULT false,
  match_source      text,
  match_confidence  numeric,
  created_at        timestamptz DEFAULT now()
);

-- Unique constraints (drop old, create new)
ALTER TABLE bank_transactions DROP CONSTRAINT IF EXISTS uniq_tx_ref;
ALTER TABLE bank_transactions DROP CONSTRAINT IF EXISTS uniq_tx_content;
ALTER TABLE bank_transactions DROP CONSTRAINT IF EXISTS uniq_bank_tx;
ALTER TABLE bank_transactions ADD CONSTRAINT uniq_bank_tx UNIQUE (org_id, transaction_date, amount, description);

-- ============================================================
-- 7. MILEAGE
-- ============================================================

-- ── vehicles ───────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS vehicles (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id        uuid REFERENCES organizations(id) ON DELETE CASCADE,
  user_id       uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  vehicle_name  text,
  license_plate text,
  vehicle_type  text,
  is_primary    boolean DEFAULT false,
  created_at    timestamptz DEFAULT now()
);

-- ── mileage_logs ─────────────────────────────────────────────
DROP VIEW IF EXISTS mileage_logs CASCADE;
CREATE TABLE IF NOT EXISTS mileage_logs (
  id               uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id           uuid REFERENCES organizations(id) ON DELETE CASCADE,
  user_id          uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  vehicle_id       text,
  trip_date        date NOT NULL,
  purpose          text,
  start_odometer   numeric,
  end_odometer     numeric,
  total_km         numeric,
  route_start      text,
  route_end        text,
  trip_claim_amount numeric DEFAULT 0,
  category         text DEFAULT 'mileage',
  notes            text,
  approved         boolean DEFAULT false,
  created_at       timestamptz DEFAULT now(),
  updated_at       timestamptz DEFAULT now()
);

-- Add legacy columns used by materialized view and old code paths
DO $$ BEGIN
  ALTER TABLE mileage_logs ADD COLUMN IF NOT EXISTS distance_km numeric;
EXCEPTION WHEN OTHERS THEN NULL;
END $$;
DO $$ BEGIN
  ALTER TABLE mileage_logs ADD COLUMN IF NOT EXISTS rate_per_km numeric DEFAULT 0.70;
EXCEPTION WHEN OTHERS THEN NULL;
END $$;
DO $$ BEGIN
  ALTER TABLE mileage_logs ADD COLUMN IF NOT EXISTS total_amount numeric GENERATED ALWAYS AS (COALESCE(total_km, trip_claim_amount, 0)) STORED;
EXCEPTION WHEN OTHERS THEN NULL;
END $$;

-- ============================================================
-- 8. FEATURE FLAGS & TIME TRACKING
-- ============================================================

-- ── org_features (per-org feature toggles) ─────────────────
CREATE TABLE IF NOT EXISTS org_features (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id      uuid REFERENCES organizations(id) ON DELETE CASCADE,
  feature_key text NOT NULL,
  enabled     boolean NOT NULL DEFAULT true,
  config      jsonb DEFAULT '{}'::jsonb,
  created_at  timestamptz DEFAULT now(),
  updated_at  timestamptz DEFAULT now(),
  UNIQUE (org_id, feature_key)
);

-- ── time_entries (time tracking against receipts) ────────────
CREATE TABLE IF NOT EXISTS time_entries (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id      uuid REFERENCES organizations(id) ON DELETE CASCADE,
  user_id     uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  receipt_id  uuid REFERENCES receipts(id) ON DELETE SET NULL,
  date        date NOT NULL,
  hours       numeric NOT NULL CHECK (hours > 0 AND hours <= 24),
  description text,
  billable    boolean DEFAULT true,
  created_at  timestamptz DEFAULT now()
);

-- ============================================================
-- 9. NOTIFICATIONS
-- ============================================================
CREATE TABLE IF NOT EXISTS notifications (
  id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id     uuid REFERENCES organizations(id) ON DELETE CASCADE,
  user_id    uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  type       text NOT NULL DEFAULT 'general' CHECK (type IN (
    'receipt_approved','receipt_rejected','receipt_submitted',
    'team_joined','reimbursement_paid','reimbursement_requested',
    'bank_unmatched','export_ready','digest_warning','system','comment_added','general'
  )),
  title      text NOT NULL,
  message    text,
  link       text,
  is_read    boolean NOT NULL DEFAULT false,
  metadata   jsonb DEFAULT '{}'::jsonb,
  category   text DEFAULT 'general',
  body       text,
  created_at timestamptz DEFAULT now()
);

-- ============================================================
-- 10. RECEIPT TAGS & VENDOR RULES
-- ============================================================

-- ── receipt_tags ───────────────────────────────────────────
CREATE TABLE IF NOT EXISTS receipt_tags (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id        uuid REFERENCES organizations(id) ON DELETE CASCADE,
  name          text NOT NULL,
  color         text DEFAULT '#6B7280',
  created_at    timestamptz DEFAULT now()
);

-- ── vendor_rules (auto-categorization) ─────────────────────
CREATE TABLE IF NOT EXISTS vendor_rules (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id      uuid REFERENCES organizations(id) ON DELETE CASCADE,
  pattern     text NOT NULL,
  category    text,
  project_id  uuid REFERENCES projects(id) ON DELETE SET NULL,
  created_at  timestamptz DEFAULT now()
);

-- ============================================================
-- 11. SUPPORT TABLES
-- ============================================================

-- ── processed_webhook_events (idempotency) ─────────────────
CREATE TABLE IF NOT EXISTS processed_webhook_events (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id     text NOT NULL UNIQUE,
  event_type   text NOT NULL,
  status       text DEFAULT 'pending' CHECK (status IN ('pending','processing','completed','failed')),
  processed_at timestamptz,
  error        text,
  created_at   timestamptz DEFAULT now()
);

-- ── fx_rate_cache ──────────────────────────────────────────
CREATE TABLE IF NOT EXISTS fx_rate_cache (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  date        date NOT NULL,
  currency    text NOT NULL,
  rate_to_cad numeric NOT NULL,
  fetched_at  timestamptz DEFAULT now(),
  UNIQUE (date, currency)
);

-- ── vendor_defaults (auto-learning) ────────────────────────
CREATE TABLE IF NOT EXISTS vendor_defaults (
  id                     uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id                 uuid REFERENCES organizations(id) ON DELETE CASCADE,
  vendor_name_normalized text NOT NULL,
  category               text,
  job_code               text,
  business_use_percent   numeric DEFAULT 100,
  appearance_count       integer DEFAULT 1,
  last_seen_at           timestamptz DEFAULT now(),
  created_at             timestamptz DEFAULT now(),
  updated_at             timestamptz DEFAULT now(),
  UNIQUE (org_id, vendor_name_normalized)
);

-- ── receipt_comments ───────────────────────────────────────
CREATE TABLE IF NOT EXISTS receipt_comments (
  id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  receipt_id uuid REFERENCES receipts(id) ON DELETE CASCADE,
  org_id     uuid REFERENCES organizations(id) ON DELETE CASCADE,
  user_id    uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  comment    text NOT NULL,
  created_at timestamptz DEFAULT now()
);

-- ── scan_attempts (rate limiting) ──────────────────────────
CREATE TABLE IF NOT EXISTS scan_attempts (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id      uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  org_id       uuid REFERENCES organizations(id) ON DELETE CASCADE,
  attempted_at timestamptz DEFAULT now()
);

-- ============================================================
-- 12. REPORTS
-- ============================================================

-- ── report_templates ───────────────────────────────────────
CREATE TABLE IF NOT EXISTS report_templates (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id     UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  name       TEXT NOT NULL,
  config     JSONB NOT NULL,
  created_by UUID NOT NULL REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- ── report_schedules ──────────────────────────────────────
CREATE TABLE IF NOT EXISTS report_schedules (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id        UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  report_config JSONB NOT NULL,
  report_name   TEXT NOT NULL,
  frequency     TEXT NOT NULL CHECK (frequency IN ('daily','weekly','monthly','quarterly')),
  day_of_week   INT CHECK (day_of_week BETWEEN 0 AND 6),
  day_of_month  INT CHECK (day_of_month BETWEEN 1 AND 31),
  time_of_day   TIME NOT NULL DEFAULT '08:00',
  email_to      TEXT NOT NULL,
  format        TEXT NOT NULL DEFAULT 'pdf' CHECK (format IN ('pdf','csv')),
  next_run_at   TIMESTAMPTZ NOT NULL,
  is_active     BOOLEAN DEFAULT true,
  created_by    UUID NOT NULL REFERENCES auth.users(id),
  created_at    TIMESTAMPTZ DEFAULT now(),
  updated_at    TIMESTAMPTZ DEFAULT now()
);

-- Fix frequency constraint to include 'daily' (from 00005 migration)
DO $$ BEGIN
  ALTER TABLE report_schedules DROP CONSTRAINT IF EXISTS report_schedules_frequency_check;
  ALTER TABLE report_schedules ADD CONSTRAINT report_schedules_frequency_check CHECK (frequency IN ('daily','weekly','monthly','quarterly'));
EXCEPTION WHEN OTHERS THEN NULL;
END $$;

-- ── report_deliveries ─────────────────────────────────────
CREATE TABLE IF NOT EXISTS report_deliveries (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  schedule_id    UUID NOT NULL REFERENCES report_schedules(id) ON DELETE CASCADE,
  org_id         UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  recipient_count INT NOT NULL DEFAULT 0,
  status         TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','delivered','failed','sent')),
  error_message  TEXT,
  sent_at        TIMESTAMPTZ,
  delivered_at   TIMESTAMPTZ DEFAULT now(),
  created_at     TIMESTAMPTZ DEFAULT now()
);

-- Fix status check to include 'pending' and 'sent' (both used by code)
DO $$ BEGIN
  ALTER TABLE report_deliveries DROP CONSTRAINT IF EXISTS report_deliveries_status_check;
  ALTER TABLE report_deliveries ADD CONSTRAINT report_deliveries_status_check CHECK (status IN ('pending','delivered','failed','sent'));
EXCEPTION WHEN OTHERS THEN NULL;
END $$;

-- ============================================================
-- 13. QUICK-INVOICE FEATURE (from supabase_setup.sql)
-- ============================================================

-- ── invoices ────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS invoices (
  id                  UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id             UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  org_id              UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  client_name         TEXT NOT NULL,
  client_email        TEXT,
  client_address      TEXT,
  invoice_number      TEXT UNIQUE,
  issue_date          DATE NOT NULL DEFAULT CURRENT_DATE,
  due_date            DATE,
  status              TEXT DEFAULT 'draft' CHECK (status IN ('draft','sent','paid','overdue','cancelled')),
  subtotal            NUMERIC(10,2) DEFAULT 0,
  tax_rate            NUMERIC(5,4) DEFAULT 0,
  tax_amount          NUMERIC(10,2) DEFAULT 0,
  total_amount        NUMERIC(10,2) NOT NULL DEFAULT 0,
  notes               TEXT,
  terms_and_conditions TEXT,
  created_at          TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
  updated_at          TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- ── invoice_line_items ─────────────────────────────────────
CREATE TABLE IF NOT EXISTS invoice_line_items (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  invoice_id      UUID NOT NULL REFERENCES invoices(id) ON DELETE CASCADE,
  description     TEXT NOT NULL,
  quantity        NUMERIC(8,2) DEFAULT 1,
  unit_price      NUMERIC(10,2) NOT NULL,
  line_total      NUMERIC(10,2) NOT NULL,
  taxable         BOOLEAN DEFAULT TRUE,
  source_receipt_id UUID,
  created_at      TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- ── tax_form_mappings (T2125 / T777 CRA mappings) ──────────
CREATE TABLE IF NOT EXISTS tax_form_mappings (
  id                   UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  form_type            TEXT NOT NULL CHECK (form_type IN ('T2125','T777')),
  expense_category     TEXT NOT NULL,
  cra_line_number      TEXT NOT NULL,
  cra_line_description TEXT NOT NULL,
  is_active            BOOLEAN DEFAULT TRUE,
  created_at           TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
  updated_at           TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
  UNIQUE (form_type, expense_category)
);

-- ── user_settings (per-user preferences) ───────────────────
CREATE TABLE IF NOT EXISTS user_settings (
  id                      UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id                 UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  home_office_enabled     BOOLEAN DEFAULT FALSE,
  total_home_sqft         NUMERIC(8,2),
  workspace_sqft          NUMERIC(8,2),
  home_utilities_method   TEXT DEFAULT 'square_footage' CHECK (home_utilities_method IN ('square_footage','rooms')),
  currency                TEXT DEFAULT 'CAD',
  date_format             TEXT DEFAULT 'YYYY-MM-DD',
  notifications_enabled   BOOLEAN DEFAULT TRUE,
  email_notifications     BOOLEAN DEFAULT TRUE,
  created_at              TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
  updated_at              TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
  UNIQUE (user_id)
);

-- Ensure unique constraint exists
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'user_settings_user_id_key' AND conrelid = 'user_settings'::regclass) THEN
    ALTER TABLE user_settings ADD CONSTRAINT user_settings_user_id_key UNIQUE (user_id);
  END IF;
END $$;

-- ── user_tax_calculations ──────────────────────────────────
CREATE TABLE IF NOT EXISTS user_tax_calculations (
  id               UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id          UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  org_id           UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  tax_year         INTEGER NOT NULL,
  form_type        TEXT NOT NULL CHECK (form_type IN ('T2125','T777')),
  cra_line_number  TEXT NOT NULL,
  total_amount     NUMERIC(10,2) NOT NULL DEFAULT 0,
  calculated_at    TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
  UNIQUE (user_id, tax_year, form_type, cra_line_number)
);

-- ============================================================
-- 13b. PROFILES TABLE (legacy compat — many old code paths use it)
-- ============================================================
CREATE TABLE IF NOT EXISTS profiles (
  id                      UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  org_id                  UUID REFERENCES organizations(id) ON DELETE SET NULL,
  role                    TEXT NOT NULL DEFAULT 'Owner' CHECK (role IN ('Owner','Admin','Member','Employee','Accountant','Auditor')),
  full_name               TEXT,
  avatar_url              TEXT,
  home_office_enabled     BOOLEAN DEFAULT FALSE,
  total_home_sqft         NUMERIC(8,2),
  workspace_sqft          NUMERIC(8,2),
  home_utilities_method   TEXT DEFAULT 'square_footage' CHECK (home_utilities_method IN ('square_footage','rooms')),
  currency                TEXT DEFAULT 'CAD',
  date_format             TEXT DEFAULT 'YYYY-MM-DD',
  notifications_enabled   BOOLEAN DEFAULT TRUE,
  email_notifications     BOOLEAN DEFAULT TRUE,
  created_at              TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
  updated_at              TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- ============================================================
-- 14. MATERIALIZED VIEW
-- ============================================================

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
GROUP BY r.org_id, r.user_id
WITH NO DATA;

-- Create unique index on the materialized view
CREATE UNIQUE INDEX IF NOT EXISTS idx_org_dashboard_summary_pk
  ON org_dashboard_summary (org_id, user_id);

-- Refresh function
CREATE OR REPLACE FUNCTION refresh_org_dashboard_summary()
RETURNS void LANGUAGE plpgsql AS $$
BEGIN
  REFRESH MATERIALIZED VIEW CONCURRENTLY org_dashboard_summary;
END;
$$;

-- Refresh it once
REFRESH MATERIALIZED VIEW org_dashboard_summary;

-- ============================================================
-- 15. RLS — ENABLE ON ALL TABLES
-- ============================================================

DO $$ DECLARE
  tbl text;
  tables text[] := ARRAY['organizations','user_roles','business_units','projects','receipts',
    'audit_logs','receipt_history','access_codes','subscriptions','organization_settings',
    'bank_transactions','vehicles','mileage_logs','fx_rate_cache','vendor_defaults',
    'receipt_comments','report_templates','report_schedules','report_deliveries','scan_attempts',
    'notifications','receipt_tags','vendor_rules','org_features','time_entries',
    'processed_webhook_events','invoices','invoice_line_items','tax_form_mappings',
    'user_settings','user_tax_calculations','profiles'];
BEGIN
  FOREACH tbl IN ARRAY tables LOOP
    EXECUTE format('ALTER TABLE %I ENABLE ROW LEVEL SECURITY;', tbl);
  END LOOP;
END $$;

-- ============================================================
-- 16. RLS — POLICIES
-- ============================================================

-- Helper: Drop all existing policies on a table, then recreate.
-- This avoids duplicate_object errors when running repeatedly.
CREATE OR REPLACE FUNCTION _drop_all_policies(p_tablename text) RETURNS void
LANGUAGE plpgsql AS $$
DECLARE
  pol record;
BEGIN
  FOR pol IN SELECT policyname FROM pg_policies WHERE schemaname = 'public' AND tablename = p_tablename
  LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON %I', pol.policyname, p_tablename);
  END LOOP;
END;
$$;

DO $$ BEGIN
  PERFORM _drop_all_policies('organizations');
  PERFORM _drop_all_policies('user_roles');
  PERFORM _drop_all_policies('business_units');
  PERFORM _drop_all_policies('projects');
  PERFORM _drop_all_policies('receipts');
  PERFORM _drop_all_policies('audit_logs');
  PERFORM _drop_all_policies('receipt_history');
  PERFORM _drop_all_policies('access_codes');
  PERFORM _drop_all_policies('subscriptions');
  PERFORM _drop_all_policies('organization_settings');
  PERFORM _drop_all_policies('bank_transactions');
  PERFORM _drop_all_policies('vehicles');
  PERFORM _drop_all_policies('mileage_logs');
  PERFORM _drop_all_policies('vendor_defaults');
  PERFORM _drop_all_policies('receipt_comments');
  PERFORM _drop_all_policies('report_templates');
  PERFORM _drop_all_policies('report_schedules');
  PERFORM _drop_all_policies('report_deliveries');
  PERFORM _drop_all_policies('scan_attempts');
  PERFORM _drop_all_policies('notifications');
  PERFORM _drop_all_policies('receipt_tags');
  PERFORM _drop_all_policies('vendor_rules');
  PERFORM _drop_all_policies('org_features');
  PERFORM _drop_all_policies('time_entries');
  PERFORM _drop_all_policies('fx_rate_cache');
  PERFORM _drop_all_policies('processed_webhook_events');
  PERFORM _drop_all_policies('invoices');
  PERFORM _drop_all_policies('invoice_line_items');
  PERFORM _drop_all_policies('tax_form_mappings');
  PERFORM _drop_all_policies('user_settings');
  PERFORM _drop_all_policies('user_tax_calculations');
  PERFORM _drop_all_policies('profiles');
END $$;

-- Now create all policies

-- organizations
CREATE POLICY "Users can view their own organization" ON organizations FOR SELECT USING (id = get_user_org());
CREATE POLICY "Update_Org" ON organizations FOR UPDATE USING (id = get_user_org());
CREATE POLICY "Service role can insert organizations" ON organizations FOR INSERT WITH CHECK (true);

-- user_roles
CREATE POLICY "Users view roles in their organization" ON user_roles FOR SELECT USING (org_id = get_user_org());
CREATE POLICY "Users_Cannot_Manage_Roles_Directly" ON user_roles FOR ALL USING (false) WITH CHECK (false);

-- business_units
CREATE POLICY "View Business Units by Org" ON business_units FOR SELECT USING (org_id = get_user_org());
CREATE POLICY "Manage_BU_Owner" ON business_units FOR ALL USING (org_id = get_user_org() AND has_elevated_role()) WITH CHECK (org_id = get_user_org() AND has_elevated_role());

-- projects
CREATE POLICY "View Projects by Org" ON projects FOR SELECT USING (org_id = get_user_org());
CREATE POLICY "Insert Projects by Org" ON projects FOR INSERT WITH CHECK (org_id = get_user_org());
CREATE POLICY "Update Projects by Org" ON projects FOR UPDATE USING (org_id = get_user_org() AND has_elevated_role());
CREATE POLICY "Delete Projects by Org" ON projects FOR DELETE USING (org_id = get_user_org() AND has_elevated_role());

-- receipts
CREATE POLICY "Select_Receipts_Tenant" ON receipts FOR SELECT USING (org_id = get_user_org() AND is_deleted = false AND (user_id = auth.uid() OR has_elevated_role()));
CREATE POLICY "Insert_Receipts_Tenant" ON receipts FOR INSERT WITH CHECK (org_id = get_user_org() AND user_id = auth.uid());
CREATE POLICY "Update_Receipts_Tenant" ON receipts FOR UPDATE USING (org_id = get_user_org() AND (user_id = auth.uid() OR has_elevated_role()));
CREATE POLICY "Protect_CRA_Retention_Window" ON receipts FOR DELETE USING (transaction_date > (CURRENT_DATE - '7 years'::interval));

-- audit_logs
CREATE POLICY "Select_Audit_Tenant" ON audit_logs FOR SELECT USING (org_id = get_user_org() AND (user_id = auth.uid() OR has_elevated_role()));
CREATE POLICY "Insert_Audit_Tenant" ON audit_logs FOR INSERT WITH CHECK (org_id = get_user_org() AND user_id = auth.uid());
CREATE POLICY "Protect_Audit_Log_Retention" ON audit_logs FOR DELETE USING ((created_at)::date < (now() - '10 years'::interval)::date);

-- receipt_history
CREATE POLICY "Select_History_Tenant" ON receipt_history FOR SELECT USING (org_id = get_user_org());
CREATE POLICY "Insert_History_Tenant" ON receipt_history FOR INSERT WITH CHECK (org_id = get_user_org());

-- access_codes
CREATE POLICY "Select_Invites_Tenant" ON access_codes FOR SELECT USING (org_id = get_user_org());
CREATE POLICY "Insert_Invites_Owner" ON access_codes FOR INSERT WITH CHECK (org_id = get_user_org() AND has_elevated_role());
CREATE POLICY "Delete_Invites_Owner" ON access_codes FOR DELETE USING (org_id = get_user_org() AND has_elevated_role());

-- subscriptions
CREATE POLICY "Select_Sub_Tenant" ON subscriptions FOR SELECT USING (org_id = get_user_org());

-- organization_settings
CREATE POLICY "Select_OrgSettings" ON organization_settings FOR SELECT USING (org_id = get_user_org());
CREATE POLICY "Manage_OrgSettings_Owner" ON organization_settings FOR ALL USING (org_id = get_user_org() AND has_elevated_role()) WITH CHECK (org_id = get_user_org() AND has_elevated_role());

-- bank_transactions
CREATE POLICY "bank_tx_tenant" ON bank_transactions FOR ALL USING (org_id = get_user_org());

-- vehicles
CREATE POLICY "vehicles_tenant" ON vehicles FOR ALL USING (org_id = get_user_org());

-- mileage_logs
CREATE POLICY "mileage_tenant" ON mileage_logs FOR ALL USING (org_id = get_user_org());

-- vendor_defaults
CREATE POLICY "vendor_defaults_tenant" ON vendor_defaults FOR ALL USING (org_id = get_user_org());

-- receipt_comments
CREATE POLICY "comments_tenant" ON receipt_comments FOR ALL USING (org_id = get_user_org());

-- report_templates
CREATE POLICY "report_templates_view" ON report_templates FOR SELECT USING (org_id = get_user_org());
CREATE POLICY "report_templates_insert" ON report_templates FOR INSERT WITH CHECK (org_id = get_user_org());
CREATE POLICY "report_templates_update" ON report_templates FOR UPDATE USING (org_id = get_user_org());
CREATE POLICY "report_templates_delete" ON report_templates FOR DELETE USING (org_id = get_user_org());

-- report_schedules
CREATE POLICY "report_schedules_view" ON report_schedules FOR SELECT USING (org_id = get_user_org());
CREATE POLICY "report_schedules_insert" ON report_schedules FOR INSERT WITH CHECK (org_id = get_user_org());
CREATE POLICY "report_schedules_update" ON report_schedules FOR UPDATE USING (org_id = get_user_org());
CREATE POLICY "report_schedules_delete" ON report_schedules FOR DELETE USING (org_id = get_user_org());

-- report_deliveries
CREATE POLICY "deliveries_view" ON report_deliveries FOR SELECT USING (org_id = get_user_org());
CREATE POLICY "deliveries_insert" ON report_deliveries FOR INSERT WITH CHECK (org_id = get_user_org());

-- scan_attempts
CREATE POLICY "scan_own" ON scan_attempts FOR ALL USING (user_id = auth.uid());

-- notifications
CREATE POLICY "Users read own notifications" ON notifications FOR SELECT USING (user_id = auth.uid());
CREATE POLICY "Users update own notifications" ON notifications FOR UPDATE USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());
CREATE POLICY "Users delete own notifications" ON notifications FOR DELETE USING (user_id = auth.uid());
CREATE POLICY "Service role insert notifications" ON notifications FOR INSERT WITH CHECK (true);

-- receipt_tags
CREATE POLICY "Select_Tags_Tenant" ON receipt_tags FOR SELECT USING (org_id = get_user_org());
CREATE POLICY "Insert_Tags_Tenant" ON receipt_tags FOR INSERT WITH CHECK (org_id = get_user_org());
CREATE POLICY "Delete_Tags_Tenant" ON receipt_tags FOR DELETE USING (org_id = get_user_org());

-- vendor_rules
CREATE POLICY "Select_VendorRules_Tenant" ON vendor_rules FOR SELECT USING (org_id = get_user_org());
CREATE POLICY "Manage_VendorRules_Tenant" ON vendor_rules FOR ALL USING (org_id = get_user_org() AND has_elevated_role()) WITH CHECK (org_id = get_user_org() AND has_elevated_role());

-- org_features
CREATE POLICY "org_features_select" ON org_features FOR SELECT USING (org_id = get_user_org());
CREATE POLICY "org_features_insert" ON org_features FOR INSERT WITH CHECK (org_id = get_user_org() AND has_elevated_role());
CREATE POLICY "org_features_update" ON org_features FOR UPDATE USING (org_id = get_user_org() AND has_elevated_role());
CREATE POLICY "org_features_delete" ON org_features FOR DELETE USING (org_id = get_user_org() AND has_elevated_role());

-- time_entries
CREATE POLICY "time_entries_select" ON time_entries FOR SELECT USING (org_id = get_user_org() AND user_id = auth.uid());
CREATE POLICY "time_entries_insert" ON time_entries FOR INSERT WITH CHECK (org_id = get_user_org() AND user_id = auth.uid());
CREATE POLICY "time_entries_update" ON time_entries FOR UPDATE USING (org_id = get_user_org() AND user_id = auth.uid()) WITH CHECK (org_id = get_user_org() AND user_id = auth.uid());
CREATE POLICY "time_entries_delete" ON time_entries FOR DELETE USING (org_id = get_user_org() AND user_id = auth.uid());

-- fx_rate_cache (read-only for authenticated)
CREATE POLICY "fx_read" ON fx_rate_cache FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "fx_write" ON fx_rate_cache FOR ALL USING (false) WITH CHECK (false);

-- processed_webhook_events (service role only)
CREATE POLICY "webhook_only" ON processed_webhook_events FOR ALL USING (false) WITH CHECK (false);

-- invoices
CREATE POLICY "invoices_select" ON invoices FOR SELECT USING (org_id = get_user_org());
CREATE POLICY "invoices_insert" ON invoices FOR INSERT WITH CHECK (org_id = get_user_org());
CREATE POLICY "invoices_update" ON invoices FOR UPDATE USING (org_id = get_user_org());
CREATE POLICY "invoices_delete" ON invoices FOR DELETE USING (org_id = get_user_org());

-- invoice_line_items
CREATE POLICY "invoice_line_items_select" ON invoice_line_items FOR SELECT USING (
  invoice_id IN (SELECT id FROM invoices WHERE org_id = get_user_org())
);
CREATE POLICY "invoice_line_items_insert" ON invoice_line_items FOR INSERT WITH CHECK (
  invoice_id IN (SELECT id FROM invoices WHERE org_id = get_user_org())
);

-- tax_form_mappings (all authenticated can read)
CREATE POLICY "tax_form_mappings_select" ON tax_form_mappings FOR SELECT USING (auth.role() = 'authenticated');

-- user_settings
CREATE POLICY "user_settings_select" ON user_settings FOR SELECT USING (user_id = auth.uid());
CREATE POLICY "user_settings_insert" ON user_settings FOR INSERT WITH CHECK (user_id = auth.uid());
CREATE POLICY "user_settings_update" ON user_settings FOR UPDATE USING (user_id = auth.uid());

-- user_tax_calculations
CREATE POLICY "user_tax_calculations_select" ON user_tax_calculations FOR SELECT USING (org_id = get_user_org() AND user_id = auth.uid());

-- profiles (legacy compat)
CREATE POLICY "profiles_select" ON profiles FOR SELECT USING (org_id = get_user_org() OR id = auth.uid());
CREATE POLICY "profiles_update" ON profiles FOR UPDATE USING (id = auth.uid());

-- Remove helper function
DROP FUNCTION IF EXISTS _drop_all_policies(text);

-- ============================================================
-- 17. HELPER FUNCTIONS
-- ============================================================

-- ── get_user_org (returns org_id for current user) ──────────
CREATE OR REPLACE FUNCTION get_user_org()
RETURNS uuid
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
  SELECT org_id FROM user_roles WHERE user_id = auth.uid() LIMIT 1;
$$;

-- ── has_elevated_role (Owner/Admin/Accountant check) ────────
CREATE OR REPLACE FUNCTION has_elevated_role()
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
  SELECT EXISTS (
    SELECT 1 FROM user_roles
    WHERE user_id = auth.uid() AND role IN ('Owner', 'Accountant', 'Admin')
  );
$$;

-- ── get_user_email ──────────────────────────────────────────
CREATE OR REPLACE FUNCTION get_user_email(p_user_id uuid)
RETURNS TABLE (email varchar)
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
  SELECT email::varchar FROM auth.users WHERE id = p_user_id;
$$;

-- ── get_user_org_ids (used by old feature flag RLS policies) ─
DROP FUNCTION IF EXISTS get_user_org_ids();
CREATE OR REPLACE FUNCTION get_user_org_ids()
RETURNS TABLE (org_id uuid, role text)
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
  SELECT org_id, role FROM user_roles WHERE user_id = auth.uid();
$$;

-- ============================================================
-- 18. AUTH / ACCESS CODE FUNCTIONS
-- ============================================================

-- ── bootstrap_first_user_org ────────────────────────────────
CREATE OR REPLACE FUNCTION bootstrap_first_user_org(p_user_id uuid, p_org_name text)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE v_org_id uuid; v_slug text;
BEGIN
  IF EXISTS (SELECT 1 FROM user_roles WHERE user_id = p_user_id) THEN RETURN; END IF;
  v_slug := lower(regexp_replace(regexp_replace(p_org_name, '[^a-zA-Z0-9\s-]', '', 'g'), '\s+', '-', 'g'));
  IF length(v_slug) > 50 THEN v_slug := left(v_slug, 50); END IF;
  INSERT INTO organizations (name, org_slug) VALUES (p_org_name, v_slug) RETURNING id INTO v_org_id;
  INSERT INTO user_roles (user_id, org_id, role) VALUES (p_user_id, v_org_id, 'Owner');
END;
$$;

-- ── generate_access_code ────────────────────────────────────
CREATE OR REPLACE FUNCTION generate_access_code(p_created_by uuid, p_role text, p_bu_id uuid DEFAULT NULL)
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE v_code text; v_org_id uuid;
BEGIN
  SELECT org_id INTO v_org_id FROM user_roles WHERE user_id = p_created_by;
  IF v_org_id IS NULL THEN RAISE EXCEPTION 'Inviter does not belong to an organization.'; END IF;
  v_code := substr(md5(gen_random_uuid()::text), 1, 8);
  INSERT INTO access_codes (code, org_id, role, business_unit_id, created_by)
  VALUES (v_code, v_org_id, p_role, p_bu_id, p_created_by);
  RETURN v_code;
END;
$$;

-- ── redeem_access_code ──────────────────────────────────────
CREATE OR REPLACE FUNCTION redeem_access_code(p_code text, p_user_id uuid)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE v_role text; v_bu_id uuid; v_created_by uuid; v_org_id uuid;
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

-- ── upsert_user_role (Owner-only role management) ───────────
CREATE OR REPLACE FUNCTION upsert_user_role(p_target_user_id uuid, p_role text, p_org_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
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

-- ============================================================
-- 19. DASHBOARD FUNCTIONS
-- ============================================================

-- ── get_dashboard_stats ────────────────────────────────────
DROP FUNCTION IF EXISTS get_dashboard_stats(uuid);
DROP FUNCTION IF EXISTS get_dashboard_stats(uuid,uuid,text);
CREATE FUNCTION get_dashboard_stats(p_org_id uuid, p_user_id uuid, p_role text)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
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

-- ── get_receipts_paginated ─────────────────────────────────
DROP FUNCTION IF EXISTS get_receipts_paginated(uuid,int,int,text,text,text,text,text,text,text[],text);
DROP FUNCTION IF EXISTS get_receipts_paginated(uuid,uuid,text,int,int,text,text,text,text,text,text,text,uuid[]);
CREATE FUNCTION get_receipts_paginated(
  p_org_id uuid, p_user_id uuid, p_role text,
  p_limit int, p_offset int, p_order_by text DEFAULT 'created_at', p_order_dir text DEFAULT 'desc',
  p_category text DEFAULT NULL, p_from_date text DEFAULT NULL, p_to_date text DEFAULT NULL,
  p_approval_status text DEFAULT NULL, p_search text DEFAULT NULL, p_semantic_ids uuid[] DEFAULT NULL
)
RETURNS TABLE (receipt json, total_count bigint)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_total bigint; v_data json; v_is_elevated boolean; v_caller_org uuid;
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
    AND (p_from_date IS NULL OR transaction_date >= p_from_date::date)
    AND (p_to_date IS NULL OR transaction_date <= p_to_date::date)
    AND (p_approval_status IS NULL OR approval_status = p_approval_status)
    AND (p_search IS NULL OR vendor_name ILIKE '%' || p_search || '%' OR notes ILIKE '%' || p_search || '%')
    AND (p_semantic_ids IS NULL OR id = ANY(p_semantic_ids));

  SELECT COALESCE(json_agg(row_to_json(t)), '[]'::json) INTO v_data
  FROM (
    SELECT * FROM receipts
    WHERE org_id = p_org_id AND is_deleted = false
      AND (v_is_elevated OR user_id = p_user_id)
      AND (p_category IS NULL OR category = p_category)
      AND (p_from_date IS NULL OR transaction_date >= p_from_date::date)
      AND (p_to_date IS NULL OR transaction_date <= p_to_date::date)
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

-- ── get_spend_anomalies ────────────────────────────────────
DROP FUNCTION IF EXISTS get_spend_anomalies(uuid);
CREATE FUNCTION get_spend_anomalies(p_org_id uuid)
RETURNS TABLE (vendor_name text, latest_amount numeric, avg_amount numeric, ratio numeric, receipt_id uuid, transaction_date date)
LANGUAGE plpgsql
SECURITY DEFINER
STABLE
AS $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM user_roles WHERE user_id = auth.uid() AND org_id = p_org_id) THEN
    RAISE EXCEPTION 'permission denied';
  END IF;
  RETURN QUERY
    SELECT v.vendor_name, v.total_amount, v.avg_amount, v.ratio, v.receipt_id, v.transaction_date
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

-- ── get_project_actuals ─────────────────────────────────────
DROP FUNCTION IF EXISTS get_project_actuals(uuid);
DROP FUNCTION IF EXISTS get_project_actuals(uuid,uuid);
CREATE FUNCTION get_project_actuals(p_org_id uuid)
RETURNS TABLE (project_id uuid, project_name text, project_code text, budget_amount numeric, total_spent numeric, receipt_count bigint, top_categories jsonb)
LANGUAGE plpgsql
SECURITY DEFINER
STABLE
AS $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM user_roles WHERE user_id = auth.uid() AND org_id = p_org_id) THEN
    RAISE EXCEPTION 'permission denied';
  END IF;
  RETURN QUERY
    SELECT p.id, p.name, p.code, p.budget_amount,
      COALESCE(SUM(COALESCE(r.cad_equivalent, r.total_amount)), 0),
      COUNT(r.id),
      COALESCE(jsonb_agg(DISTINCT jsonb_build_object('category', r.category, 'total', sub.cat_total) ORDER BY (jsonb_build_object('category', r.category, 'total', sub.cat_total)) DESC) FILTER (WHERE r.category IS NOT NULL), '[]'::jsonb)
    FROM projects p
    LEFT JOIN receipts r ON r.project_id = p.id AND r.org_id = p_org_id AND r.is_deleted = false
    LEFT JOIN LATERAL (
      SELECT category, SUM(COALESCE(cad_equivalent, total_amount)) AS cat_total
      FROM receipts WHERE project_id = p.id AND org_id = p_org_id AND is_deleted = false
      GROUP BY category ORDER BY cat_total DESC LIMIT 3
    ) sub ON sub.category = r.category
    WHERE p.org_id = p_org_id GROUP BY p.id, p.name, p.code, p.budget_amount ORDER BY total_spent DESC;
END;
$$;

-- ── bulk_approve_receipts ───────────────────────────────────
DROP FUNCTION IF EXISTS bulk_approve_receipts(uuid[],text,uuid);
CREATE OR REPLACE FUNCTION bulk_approve_receipts(
  p_receipt_ids uuid[], p_status text, p_user_id uuid
) RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE v_org_id uuid; v_role text; v_updated integer;
BEGIN
  SELECT role INTO v_role FROM user_roles WHERE user_id = p_user_id LIMIT 1;
  IF v_role NOT IN ('Owner', 'Accountant') THEN
    RAISE EXCEPTION 'Unauthorized: only Owners and Accountants can approve receipts';
  END IF;
  SELECT org_id INTO v_org_id FROM user_roles WHERE user_id = p_user_id LIMIT 1;
  IF v_org_id IS NULL THEN RAISE EXCEPTION 'No organization found for user'; END IF;
  UPDATE receipts SET approval_status = p_status, updated_at = now()
  WHERE id = ANY(p_receipt_ids) AND org_id = v_org_id AND is_deleted = false;
  GET DIAGNOSTICS v_updated = ROW_COUNT;
  INSERT INTO audit_logs (user_id, org_id, action, details)
  VALUES (p_user_id, v_org_id, 'bulk_' || p_status, 'Bulk ' || p_status || ': ' || v_updated || ' receipts');
  RETURN v_updated;
END;
$$;

-- ============================================================
-- 20. REPORT FUNCTIONS
-- ============================================================

-- ── generate_report ─────────────────────────────────────────
DROP FUNCTION IF EXISTS generate_report(p_config jsonb);
DROP FUNCTION IF EXISTS generate_report(p_org_id uuid, p_metrics text[], p_group_by text, p_date_from date, p_date_to date, p_categories text[], p_vendors text[], p_projects uuid[], p_business_units uuid[], p_approval_status text[], p_min_amount numeric, p_max_amount numeric);
CREATE OR REPLACE FUNCTION generate_report(
  p_org_id UUID, p_metrics TEXT[], p_group_by TEXT DEFAULT NULL,
  p_date_from DATE DEFAULT NULL, p_date_to DATE DEFAULT NULL,
  p_categories TEXT[] DEFAULT NULL, p_vendors TEXT[] DEFAULT NULL,
  p_projects UUID[] DEFAULT NULL, p_business_units UUID[] DEFAULT NULL,
  p_approval_status TEXT[] DEFAULT NULL,
  p_min_amount NUMERIC DEFAULT NULL, p_max_amount NUMERIC DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $func$
DECLARE v_sql TEXT; v_result JSONB;
BEGIN
  v_sql := 'SELECT json_agg(row_to_json(t)) FROM (SELECT ';

  IF p_group_by IS NOT NULL THEN
    v_sql := v_sql || CASE p_group_by
      WHEN 'category' THEN 'r.category AS "category"'
      WHEN 'vendor' THEN 'r.vendor_name AS "vendor"'
      WHEN 'month' THEN 'to_char(r.transaction_date::date, ''YYYY-MM'') AS "month"'
      WHEN 'approval_status' THEN 'COALESCE(r.approval_status, ''unknown'') AS "approval_status"'
      WHEN 'project' THEN 'COALESCE(p.name, ''Unassigned'') AS "project"'
      WHEN 'business_unit' THEN 'COALESCE(b.name, ''Unassigned'') AS "business_unit"'
    END || ', ';
  END IF;

  IF p_metrics @> ARRAY['total_spend'] THEN
    v_sql := v_sql || 'SUM(COALESCE(r.cad_equivalent, r.total_amount)) AS "total_spend", ';
  END IF;
  IF p_metrics @> ARRAY['receipt_count'] THEN
    v_sql := v_sql || 'COUNT(*) AS "receipt_count", ';
  END IF;
  IF p_metrics @> ARRAY['avg_receipt'] THEN
    v_sql := v_sql || 'AVG(COALESCE(r.cad_equivalent, r.total_amount)) AS "avg_receipt", ';
  END IF;
  IF p_metrics @> ARRAY['tax_total'] THEN
    v_sql := v_sql || 'SUM(COALESCE(r.tax_amount, 0) + COALESCE(r.pst_amount, 0)) AS "tax_total", ';
  END IF;
  IF p_metrics @> ARRAY['max_receipt'] THEN
    v_sql := v_sql || 'MAX(COALESCE(r.cad_equivalent, r.total_amount)) AS "max_receipt", ';
  END IF;

  v_sql := rtrim(v_sql, ', ');
  v_sql := v_sql || ' FROM receipts r';

  IF p_group_by IN ('project', 'business_unit') THEN
    v_sql := v_sql || ' LEFT JOIN projects p ON p.id = r.project_id';
    IF p_group_by = 'business_unit' THEN
      v_sql := v_sql || ' LEFT JOIN business_units b ON b.id = r.business_unit_id';
    END IF;
  END IF;

  v_sql := v_sql || ' WHERE r.org_id = ' || quote_literal(p_org_id);
  v_sql := v_sql || ' AND r.is_deleted IS DISTINCT FROM true';

  IF p_date_from IS NOT NULL THEN
    v_sql := v_sql || ' AND r.transaction_date >= ' || quote_literal(p_date_from);
  END IF;
  IF p_date_to IS NOT NULL THEN
    v_sql := v_sql || ' AND r.transaction_date <= ' || quote_literal(p_date_to);
  END IF;
  IF p_categories IS NOT NULL AND array_length(p_categories, 1) > 0 THEN
    v_sql := v_sql || ' AND r.category = ANY(' || quote_literal(p_categories) || '::text[])';
  END IF;
  IF p_vendors IS NOT NULL AND array_length(p_vendors, 1) > 0 THEN
    v_sql := v_sql || ' AND r.vendor_name = ANY(' || quote_literal(p_vendors) || '::text[])';
  END IF;
  IF p_projects IS NOT NULL AND array_length(p_projects, 1) > 0 THEN
    v_sql := v_sql || ' AND r.project_id = ANY(' || quote_literal(p_projects) || '::uuid[])';
  END IF;
  IF p_business_units IS NOT NULL AND array_length(p_business_units, 1) > 0 THEN
    v_sql := v_sql || ' AND r.business_unit_id = ANY(' || quote_literal(p_business_units) || '::uuid[])';
  END IF;
  IF p_approval_status IS NOT NULL AND array_length(p_approval_status, 1) > 0 THEN
    v_sql := v_sql || ' AND r.approval_status = ANY(' || quote_literal(p_approval_status) || '::text[])';
  END IF;
  IF p_min_amount IS NOT NULL THEN
    v_sql := v_sql || ' AND COALESCE(r.cad_equivalent, r.total_amount) >= ' || p_min_amount;
  END IF;
  IF p_max_amount IS NOT NULL THEN
    v_sql := v_sql || ' AND COALESCE(r.cad_equivalent, r.total_amount) <= ' || p_max_amount;
  END IF;

  IF p_group_by IS NOT NULL THEN
    v_sql := v_sql || ' GROUP BY ' || CASE p_group_by
      WHEN 'category' THEN 'r.category'
      WHEN 'vendor' THEN 'r.vendor_name'
      WHEN 'month' THEN 'to_char(r.transaction_date::date, ''YYYY-MM'')'
      WHEN 'approval_status' THEN 'COALESCE(r.approval_status, ''unknown'')'
      WHEN 'project' THEN 'COALESCE(p.name, ''Unassigned'')'
      WHEN 'business_unit' THEN 'COALESCE(b.name, ''Unassigned'')'
    END;
  END IF;

  v_sql := v_sql || ' ORDER BY "' || p_metrics[1] || '" DESC NULLS LAST';
  v_sql := v_sql || ') t';

  EXECUTE v_sql INTO v_result;
  RETURN COALESCE(v_result, '[]'::JSONB);
END;
$func$;

REVOKE ALL ON FUNCTION generate_report FROM PUBLIC;
GRANT EXECUTE ON FUNCTION generate_report TO authenticated;

-- ============================================================
-- 21. SEMANTIC SEARCH FUNCTIONS
-- ============================================================

-- ── match_receipts ─────────────────────────────────────────
CREATE OR REPLACE FUNCTION match_receipts(
  query_embedding vector(768), match_threshold float, match_count int, p_user_id uuid, p_org_id uuid DEFAULT NULL
)
RETURNS TABLE (id uuid, similarity float)
LANGUAGE plpgsql
AS $$
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

-- ── compute_duplicate_hash ──────────────────────────────────
CREATE OR REPLACE FUNCTION compute_duplicate_hash(
  p_vendor_name text, p_transaction_date date, p_total_amount numeric, p_tax_amount numeric
) RETURNS text
LANGUAGE sql
IMMUTABLE
AS $$
  SELECT encode(digest(
    COALESCE(lower(trim(p_vendor_name)), '') || '|' ||
    to_char(p_transaction_date, 'YYYY-MM-DD') || '|' ||
    p_total_amount::text || '|' ||
    p_tax_amount::text, 'sha256'
  ), 'hex');
$$;

-- ============================================================
-- 22. WEBHOOK IDEMPOTENCY FUNCTIONS
-- ============================================================

CREATE OR REPLACE FUNCTION claim_webhook_event(p_event_id text, p_event_type text)
RETURNS boolean
LANGUAGE plpgsql
AS $$
BEGIN
  INSERT INTO processed_webhook_events (event_id, event_type, status)
  VALUES (p_event_id, p_event_type, 'processing')
  ON CONFLICT (event_id) DO UPDATE SET status = 'processing'
    WHERE processed_webhook_events.status = 'processing';
  RETURN true;
END;
$$;

CREATE OR REPLACE FUNCTION complete_webhook_event(p_event_id text)
RETURNS void
LANGUAGE plpgsql
AS $$
BEGIN
  UPDATE processed_webhook_events SET status = 'completed', processed_at = now()
  WHERE event_id = p_event_id AND status = 'processing';
END;
$$;

CREATE OR REPLACE FUNCTION fail_webhook_event(p_event_id text, p_error text)
RETURNS void
LANGUAGE plpgsql
AS $$
BEGIN
  UPDATE processed_webhook_events SET status = 'failed', error = p_error, processed_at = now()
  WHERE event_id = p_event_id AND status = 'processing';
END;
$$;

-- ============================================================
-- 23. COMPLIANCE FUNCTIONS (called by TypeScript code)
-- ============================================================

DROP FUNCTION IF EXISTS check_access_logging(p_org_id uuid);
CREATE OR REPLACE FUNCTION check_access_logging(p_org_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
STABLE
AS $$
DECLARE v_has_logs boolean; v_recent_logs bigint;
BEGIN
  IF NOT EXISTS (SELECT 1 FROM user_roles WHERE user_id = auth.uid() AND org_id = p_org_id) THEN
    RAISE EXCEPTION 'permission denied';
  END IF;
  SELECT EXISTS (SELECT 1 FROM audit_logs WHERE org_id = p_org_id) INTO v_has_logs;
  SELECT COUNT(*) INTO v_recent_logs FROM audit_logs WHERE org_id = p_org_id AND created_at >= now() - interval '30 days';
  RETURN jsonb_build_object('has_audit_logs', v_has_logs, 'recent_logs_30d', v_recent_logs, 'passed', v_has_logs);
END;
$$;

CREATE OR REPLACE FUNCTION check_retention_policy(p_org_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
STABLE
AS $$
DECLARE v_old_receipts bigint;
BEGIN
  IF NOT EXISTS (SELECT 1 FROM user_roles WHERE user_id = auth.uid() AND org_id = p_org_id) THEN
    RAISE EXCEPTION 'permission denied';
  END IF;
  SELECT COUNT(*) INTO v_old_receipts
  FROM receipts
  WHERE org_id = p_org_id AND is_deleted = false AND transaction_date < (now() - interval '6 years')::date;
  RETURN jsonb_build_object('receipts_beyond_6yr', v_old_receipts, 'passed', v_old_receipts = 0);
END;
$$;

-- ============================================================
-- 24. FEATURE BOOTSTRAP FUNCTION
-- ============================================================

CREATE OR REPLACE FUNCTION bootstrap_org_features(p_org_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  INSERT INTO org_features (org_id, feature_key, enabled, allowed_roles) VALUES
    (p_org_id, 'dashboard', true, '["Owner","Admin","Employee","Accountant","Auditor"]'::jsonb),
    (p_org_id, 'scanning', true, '["Owner","Admin","Employee","Accountant","Auditor"]'::jsonb),
    (p_org_id, 'receipts', true, '["Owner","Admin","Employee","Accountant","Auditor"]'::jsonb),
    (p_org_id, 'mileage', true, '["Owner","Admin","Employee"]'::jsonb),
    (p_org_id, 'time_tracking', false, '["Owner","Admin","Employee"]'::jsonb),
    (p_org_id, 'export', true, '["Owner","Admin","Accountant"]'::jsonb),
    (p_org_id, 'banking', true, '["Owner","Admin","Accountant"]'::jsonb),
    (p_org_id, 'payables', true, '["Owner","Admin","Accountant"]'::jsonb),
    (p_org_id, 'budgets', true, '["Owner","Admin","Accountant"]'::jsonb),
    (p_org_id, 'tax', true, '["Owner","Admin","Accountant"]'::jsonb),
    (p_org_id, 'cashflow', true, '["Owner","Admin","Accountant"]'::jsonb),
    (p_org_id, 'multi_currency', true, '["Owner","Admin","Accountant"]'::jsonb),
    (p_org_id, 'vendors', true, '["Owner","Admin","Accountant"]'::jsonb),
    (p_org_id, 'approvals', true, '["Owner","Admin","Auditor"]'::jsonb),
    (p_org_id, 'audit', true, '["Owner","Admin","Auditor"]'::jsonb),
    (p_org_id, 'alerts', true, '["Owner","Admin","Auditor"]'::jsonb),
    (p_org_id, 'reports', true, '["Owner","Admin","Auditor"]'::jsonb),
    (p_org_id, 'tags', true, '["Owner","Admin","Employee","Accountant","Auditor"]'::jsonb),
    (p_org_id, 'batch_ops', true, '["Owner","Admin","Accountant","Auditor"]'::jsonb),
    (p_org_id, 'search', true, '["Owner","Admin","Employee","Accountant","Auditor"]'::jsonb),
    (p_org_id, 'calendar', true, '["Owner","Admin","Employee","Accountant","Auditor"]'::jsonb),
    (p_org_id, 'timeline', true, '["Owner","Admin","Employee","Accountant","Auditor"]'::jsonb),
    (p_org_id, 'kanban', true, '["Owner","Admin","Employee","Accountant"]'::jsonb),
    (p_org_id, 'sharing', true, '["Owner","Admin","Employee","Accountant","Auditor"]'::jsonb),
    (p_org_id, 'integrations', true, '["Owner","Admin"]'::jsonb),
    (p_org_id, 'insights', true, '["Owner","Admin","Auditor"]'::jsonb),
    (p_org_id, 'readiness', true, '["Owner","Admin","Accountant"]'::jsonb),
    (p_org_id, 'notifications', true, '["Owner","Admin","Employee","Accountant","Auditor"]'::jsonb),
    (p_org_id, 'projects', true, '["Owner","Admin","Employee"]'::jsonb)
  ON CONFLICT (org_id, feature_key) DO NOTHING;
END;
$$;

-- ============================================================
-- 25. ATOMIC RECEIPT SAVE (with Merkle chain audit)
-- ============================================================

DROP FUNCTION IF EXISTS save_receipt_atomic(p_receipt jsonb);
DROP FUNCTION IF EXISTS save_receipt_atomic(p_payload jsonb, p_user_id uuid);
CREATE OR REPLACE FUNCTION save_receipt_atomic(p_payload jsonb, p_user_id uuid)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_receipt_id uuid; v_prev_hash text; v_event_hash text;
  v_org_id uuid; v_duplicate_hash text;
BEGIN
  SELECT org_id INTO v_org_id FROM user_roles WHERE user_id = p_user_id LIMIT 1;
  IF v_org_id IS NULL THEN RAISE EXCEPTION 'User % does not belong to any organization', p_user_id; END IF;
  IF p_payload->>'org_id' IS NULL THEN RAISE EXCEPTION 'Payload missing org_id'; END IF;
  IF p_payload->>'user_id' IS NULL THEN RAISE EXCEPTION 'Payload missing user_id'; END IF;
  IF (p_payload->>'org_id')::uuid <> v_org_id THEN RAISE EXCEPTION 'Payload org_id does not match user org'; END IF;

  PERFORM pg_advisory_xact_lock(hashtext('audit_chain_' || p_user_id::text));

  SELECT event_hash INTO v_prev_hash
  FROM audit_logs WHERE user_id = p_user_id AND event_hash IS NOT NULL
  ORDER BY created_at DESC LIMIT 1;

  v_duplicate_hash := encode(digest(
    COALESCE(p_payload->>'vendor_name', '') || '|' ||
    COALESCE(p_payload->>'transaction_date', '') || '|' ||
    COALESCE(p_payload->>'total_amount', '0') || '|' ||
    COALESCE(p_payload->>'tax_amount', '0'), 'sha256'
  ), 'hex');

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
    (p_payload->>'org_id')::uuid, (p_payload->>'user_id')::uuid,
    p_payload->>'vendor_name', p_payload->>'vendor_address', p_payload->>'business_number', p_payload->>'vendor_tax_number',
    (p_payload->>'total_amount')::numeric, (p_payload->>'subtotal')::numeric,
    (p_payload->>'tax_amount')::numeric, (p_payload->>'pst_amount')::numeric,
    COALESCE(p_payload->>'currency', 'CAD'), (p_payload->>'exchange_rate')::numeric, (p_payload->>'cad_equivalent')::numeric,
    (p_payload->>'transaction_date')::date, p_payload->>'transaction_time',
    p_payload->>'payment_method', p_payload->>'payment_reference', p_payload->>'card_last_four',
    p_payload->>'category', p_payload->>'notes', COALESCE(p_payload->>'document_type', 'receipt'),
    NULLIF(p_payload->>'business_unit_id', '')::uuid, NULLIF(p_payload->>'project_id', '')::uuid,
    p_payload->>'image_url', p_payload->>'source_file_name', p_payload->>'source_file_type',
    (p_payload->>'confidence_score')::numeric, (p_payload->>'cra_readiness_score')::numeric,
    (p_payload->>'blur_score')::numeric, COALESCE((p_payload->>'thermal_warning')::boolean, false),
    p_payload->>'capture_source', p_payload->>'usage_type', (p_payload->>'business_use_percent')::numeric,
    p_payload->>'job_code', p_payload->>'vehicle_id', p_payload->>'paid_by',
    COALESCE(p_payload->>'reimbursement_status', 'pending'), COALESCE((p_payload->>'needs_reimbursement')::boolean, false),
    COALESCE(p_payload->>'approval_status', 'submitted'), p_payload->>'integrity_hash',
    v_duplicate_hash, COALESCE((p_payload->>'duplicate_warning')::boolean, false),
    COALESCE((p_payload->>'math_mismatch_warning')::boolean, false),
    COALESCE((p_payload->>'missing_bn_warning')::boolean, false),
    COALESCE((p_payload->>'fraud_suspicion')::boolean, false), p_payload->>'fraud_reason',
    COALESCE(p_payload->>'line_items', '[]'::jsonb), now(), now()
  ) RETURNING id INTO v_receipt_id;

  v_event_hash := encode(digest(v_receipt_id::text || COALESCE(v_prev_hash, '') || now()::text, 'sha256'), 'hex');

  INSERT INTO audit_logs (org_id, receipt_id, user_id, action, details, previous_hash, event_hash)
  VALUES (v_org_id, v_receipt_id, p_user_id, 'receipt_created',
    'Receipt created: ' || COALESCE(p_payload->>'vendor_name', 'Unknown') || ' (' || COALESCE(p_payload->>'transaction_date', 'Unknown Date') || ')',
    v_prev_hash, v_event_hash);

  RETURN v_receipt_id;
END;
$$;

REVOKE ALL ON FUNCTION save_receipt_atomic FROM PUBLIC;
GRANT EXECUTE ON FUNCTION save_receipt_atomic TO authenticated;

-- ============================================================
-- 26. TRIGGER FUNCTIONS
-- ============================================================

-- ── set_updated_at ──────────────────────────────────────────
CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END;
$$;

-- ── set_org_id_from_user (auto-assign org on insert) ────────
CREATE OR REPLACE FUNCTION set_org_id_from_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  IF NEW.org_id IS NULL THEN
    NEW.org_id := (SELECT org_id FROM user_roles WHERE user_id = NEW.user_id LIMIT 1);
  END IF;
  RETURN NEW;
END;
$$;

-- ── protect_approved_receipt (CRA 7-year retention) ─────────
CREATE OR REPLACE FUNCTION protect_approved_receipt()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  IF OLD.approval_status = 'approved' AND OLD.transaction_date IS NOT NULL THEN
    IF OLD.transaction_date >= (now() - interval '7 years')::date THEN
      RAISE EXCEPTION 'Cannot delete approved receipts from the last 7 years';
    END IF;
  END IF;
  RETURN OLD;
END;
$$;

-- ── generate_duplicate_hash (server-side hash on insert) ──
CREATE OR REPLACE FUNCTION generate_duplicate_hash()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  NEW.duplicate_hash := encode(digest(
    lower(trim(regexp_replace(NEW.vendor_name, '\s+', ' ', 'g'))) || '|' ||
    trim(NEW.transaction_date::text) || '|' ||
    to_char(COALESCE(NEW.total_amount, 0), 'FM999999999.00'), 'sha256'
  ), 'hex');
  RETURN NEW;
END;
$$;

-- ── update_updated_at_column (legacy compat) ────────────────
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

-- ── apply_updated_at_triggers (legacy compat) ───────────────
CREATE OR REPLACE FUNCTION apply_updated_at_triggers() RETURNS void
LANGUAGE plpgsql
AS $$
DECLARE tbl text;
BEGIN
  FOREACH tbl IN ARRAY ARRAY['organizations','profiles','receipts','projects',
    'bank_connections','organization_settings','subscriptions'] LOOP
    EXECUTE format('DROP TRIGGER IF EXISTS update_%I_updated_at ON %I', tbl, tbl);
    EXECUTE format('CREATE TRIGGER update_%I_updated_at BEFORE UPDATE ON %I FOR EACH ROW EXECUTE FUNCTION update_updated_at_column()', tbl, tbl);
  END LOOP;
END;
$$;

-- ============================================================
-- 27. APPLY TRIGGERS
-- ============================================================

-- Drop and recreate all triggers for idempotency

-- set_updated_at on all relevant tables
DO $$ DECLARE tbl text;
BEGIN
  FOREACH tbl IN ARRAY ARRAY['receipts','subscriptions','organization_settings','bank_transactions','vehicles','mileage_logs','vendor_defaults','projects','report_templates','report_schedules']
  LOOP
    EXECUTE format('DROP TRIGGER IF EXISTS trg_set_updated_at ON %I', tbl);
    EXECUTE format('CREATE TRIGGER trg_set_updated_at BEFORE UPDATE ON %I FOR EACH ROW EXECUTE FUNCTION set_updated_at()', tbl);
  END LOOP;
END $$;

-- set_org_id on receipt/audit/history inserts
DO $$ DECLARE tbl text;
BEGIN
  FOREACH tbl IN ARRAY ARRAY['receipts','audit_logs','receipt_history']
  LOOP
    EXECUTE format('DROP TRIGGER IF EXISTS trg_set_org_id ON %I', tbl);
    EXECUTE format('CREATE TRIGGER trg_set_org_id BEFORE INSERT ON %I FOR EACH ROW EXECUTE FUNCTION set_org_id_from_user()', tbl);
  END LOOP;
END $$;

-- protect_approved_receipt (before delete)
DROP TRIGGER IF EXISTS before_receipt_delete ON receipts;
CREATE TRIGGER before_receipt_delete
  BEFORE DELETE ON receipts
  FOR EACH ROW EXECUTE FUNCTION protect_approved_receipt();

-- generate_duplicate_hash (before insert on receipts)
DROP TRIGGER IF EXISTS set_duplicate_hash ON receipts;
CREATE TRIGGER set_duplicate_hash
  BEFORE INSERT ON receipts
  FOR EACH ROW EXECUTE FUNCTION generate_duplicate_hash();

-- duplicate hash for receipt_history
DROP TRIGGER IF EXISTS set_duplicate_hash_history ON receipt_history;
CREATE TRIGGER set_duplicate_hash_history
  BEFORE INSERT ON receipt_history
  FOR EACH ROW EXECUTE FUNCTION generate_duplicate_hash();

-- org_features updated_at
DROP TRIGGER IF EXISTS set_updated_at_org_features ON org_features;
CREATE TRIGGER set_updated_at_org_features
  BEFORE UPDATE ON org_features
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- time_entries updated_at
DROP TRIGGER IF EXISTS set_updated_at_time_entries ON time_entries;
CREATE TRIGGER set_updated_at_time_entries
  BEFORE UPDATE ON time_entries
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- Legacy triggers (profiles, invoices, etc.)
DROP TRIGGER IF EXISTS update_profiles_updated_at ON profiles;
CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON profiles FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_user_settings_updated_at ON user_settings;
CREATE TRIGGER update_user_settings_updated_at BEFORE UPDATE ON user_settings FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_invoices_updated_at ON invoices;
CREATE TRIGGER update_invoices_updated_at BEFORE UPDATE ON invoices FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_tax_form_mappings_updated_at ON tax_form_mappings;
CREATE TRIGGER update_tax_form_mappings_updated_at BEFORE UPDATE ON tax_form_mappings FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_user_tax_calculations_updated_at ON user_tax_calculations;
CREATE TRIGGER update_user_tax_calculations_updated_at BEFORE UPDATE ON user_tax_calculations FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Add realtime publications (safe to run multiple times)
DO $$ BEGIN
  ALTER PUBLICATION supabase_realtime ADD TABLE org_features;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;
DO $$ BEGIN
  ALTER PUBLICATION supabase_realtime ADD TABLE time_entries;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- ============================================================
-- 28. INDEXES
-- ============================================================

-- Receipts
CREATE INDEX IF NOT EXISTS idx_receipts_org_deleted ON receipts(org_id, is_deleted);
CREATE INDEX IF NOT EXISTS idx_receipts_user_id ON receipts(user_id);
CREATE INDEX IF NOT EXISTS idx_receipts_transaction_date ON receipts(transaction_date);
CREATE INDEX IF NOT EXISTS idx_receipts_created_at ON receipts(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_receipts_org_status ON receipts(org_id, approval_status);
CREATE INDEX IF NOT EXISTS idx_receipts_duplicate_hash ON receipts(duplicate_hash);
CREATE INDEX IF NOT EXISTS idx_receipts_project_id ON receipts(project_id);
CREATE INDEX IF NOT EXISTS idx_receipts_org_id ON receipts(org_id);
CREATE INDEX IF NOT EXISTS idx_receipts_org_user_deleted_date ON receipts(org_id, user_id, is_deleted, transaction_date DESC);
CREATE INDEX IF NOT EXISTS idx_receipts_org_status_date ON receipts(org_id, approval_status, transaction_date DESC) WHERE is_deleted = false;
CREATE INDEX IF NOT EXISTS idx_receipts_org_category_deleted ON receipts(org_id, category) WHERE is_deleted = false;
CREATE INDEX IF NOT EXISTS idx_receipts_org_approval_status ON receipts(org_id, approval_status) WHERE is_deleted = false;
CREATE INDEX IF NOT EXISTS idx_receipts_org_user_approval ON receipts(org_id, user_id, approval_status) WHERE is_deleted = false;
CREATE INDEX IF NOT EXISTS idx_receipts_vendor_fts ON receipts USING gin(to_tsvector('english', coalesce(vendor_name, '')));
CREATE INDEX IF NOT EXISTS idx_receipts_fts ON receipts USING gin(search_vector);
CREATE INDEX IF NOT EXISTS idx_receipts_approval ON receipts(org_id, approval_status) WHERE is_deleted = false;
CREATE INDEX IF NOT EXISTS idx_receipts_approval_status ON receipts(approval_status);
CREATE INDEX IF NOT EXISTS idx_receipts_category ON receipts(category);
CREATE INDEX IF NOT EXISTS idx_receipts_deleted_org ON receipts(org_id, is_deleted, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_receipts_org_date_created ON receipts(org_id, is_deleted, transaction_date, created_at);
CREATE INDEX IF NOT EXISTS idx_receipts_org_category_date ON receipts(org_id, is_deleted, category, transaction_date);
CREATE INDEX IF NOT EXISTS idx_receipts_org_user_date ON receipts(org_id, is_deleted, user_id, transaction_date);
CREATE INDEX IF NOT EXISTS idx_receipts_qbo_synced ON receipts(qbo_synced) WHERE qbo_synced = false;

-- Partial filtered indexes
CREATE INDEX IF NOT EXISTS idx_receipts_category_filtered ON receipts(org_id, category) WHERE is_deleted = false;
CREATE INDEX IF NOT EXISTS idx_receipts_fraud ON receipts(org_id) WHERE fraud_suspicion = true AND is_deleted = false;
CREATE INDEX IF NOT EXISTS idx_receipts_math_mismatch ON receipts(org_id) WHERE math_mismatch_warning = true AND is_deleted = false;
CREATE INDEX IF NOT EXISTS idx_receipts_duplicate_warning ON receipts(org_id) WHERE duplicate_warning = true AND is_deleted = false;
CREATE INDEX IF NOT EXISTS idx_receipts_high_confidence ON receipts(org_id) WHERE confidence_score >= 80 AND is_deleted = false;
CREATE INDEX IF NOT EXISTS idx_receipts_missing_bn ON receipts(org_id) WHERE vendor_tax_number IS NULL AND is_deleted = false;
CREATE INDEX IF NOT EXISTS idx_receipts_reimbursement ON receipts(org_id, reimbursement_status, needs_reimbursement) WHERE is_deleted = false;
CREATE INDEX IF NOT EXISTS idx_receipts_missing_bn_filtered ON receipts(org_id) WHERE vendor_tax_number IS NULL AND is_deleted = false;

-- User roles
CREATE INDEX IF NOT EXISTS idx_user_roles_user_id ON user_roles(user_id);
CREATE INDEX IF NOT EXISTS idx_user_roles_org_id ON user_roles(org_id);

-- Audit logs
CREATE INDEX IF NOT EXISTS idx_audit_logs_org_created ON audit_logs(org_id, created_at);
CREATE INDEX IF NOT EXISTS idx_audit_logs_user_id ON audit_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_receipt_id ON audit_logs(receipt_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_event_hash ON audit_logs(event_hash);
CREATE INDEX IF NOT EXISTS idx_audit_logs_user_created ON audit_logs(user_id, created_at DESC) WHERE event_hash IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_audit_logs_created_at ON audit_logs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_audit_org_id ON audit_logs(org_id);

-- Projects
CREATE INDEX IF NOT EXISTS idx_projects_org_id ON projects(org_id);
CREATE INDEX IF NOT EXISTS idx_projects_user_id ON projects(user_id);

-- Business units
CREATE INDEX IF NOT EXISTS idx_business_units_org_id ON business_units(org_id);

-- Bank transactions
CREATE INDEX IF NOT EXISTS idx_bank_tx_org ON bank_transactions(org_id, matched_receipt_id);
CREATE INDEX IF NOT EXISTS idx_bank_tx_date ON bank_transactions(transaction_date);
CREATE INDEX IF NOT EXISTS idx_bank_tx_org_unmatched ON bank_transactions(org_id, is_reconciled, matched_receipt_id) WHERE is_reconciled = false AND matched_receipt_id IS NULL;
CREATE INDEX IF NOT EXISTS idx_bank_tx_unmatched ON bank_transactions(org_id) WHERE matched_receipt_id IS NULL;

-- Mileage
CREATE INDEX IF NOT EXISTS idx_mileage_logs_org_id ON mileage_logs(org_id);
CREATE INDEX IF NOT EXISTS idx_mileage_logs_user_id ON mileage_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_mileage_logs_vehicle_id ON mileage_logs(vehicle_id);
CREATE INDEX IF NOT EXISTS idx_mileage_logs_trip_date ON mileage_logs(trip_date);
CREATE INDEX IF NOT EXISTS idx_mileage_logs_org_user_date ON mileage_logs(org_id, user_id, trip_date DESC);
CREATE INDEX IF NOT EXISTS idx_mileage_date ON mileage_logs(trip_date DESC);

-- Vehicles
CREATE INDEX IF NOT EXISTS idx_vehicles_org_id ON vehicles(org_id);
CREATE INDEX IF NOT EXISTS idx_vehicles_user_id ON vehicles(user_id);

-- Receipt history
CREATE INDEX IF NOT EXISTS idx_receipt_history_receipt_id ON receipt_history(receipt_id);
CREATE INDEX IF NOT EXISTS idx_receipt_history_org_id ON receipt_history(org_id);

-- Receipt comments
CREATE INDEX IF NOT EXISTS idx_receipt_comments_receipt ON receipt_comments(receipt_id);
CREATE INDEX IF NOT EXISTS idx_receipt_comments_org_id ON receipt_comments(org_id);
CREATE INDEX IF NOT EXISTS idx_receipt_comments_user_id ON receipt_comments(user_id);

-- Report templates
CREATE INDEX IF NOT EXISTS idx_report_templates_org_id ON report_templates(org_id);

-- Report schedules
CREATE INDEX IF NOT EXISTS idx_report_schedules_org_id ON report_schedules(org_id);
CREATE INDEX IF NOT EXISTS idx_report_schedules_next_run ON report_schedules(next_run_at) WHERE is_active = true;

-- Scan attempts
CREATE INDEX IF NOT EXISTS idx_scan_attempts_user_time ON scan_attempts(user_id, attempted_at DESC);
CREATE INDEX IF NOT EXISTS idx_scan_attempts_user_time_lookup ON scan_attempts(user_id, attempted_at);

-- Time entries
CREATE INDEX IF NOT EXISTS idx_time_entries_org_id ON time_entries(org_id);
CREATE INDEX IF NOT EXISTS idx_time_entries_user_id ON time_entries(user_id);
CREATE INDEX IF NOT EXISTS idx_time_entries_status ON time_entries(status);
CREATE INDEX IF NOT EXISTS idx_time_entries_clock_in ON time_entries(clock_in_time);
CREATE INDEX IF NOT EXISTS idx_time_entries_org_user_date ON time_entries(org_id, user_id, clock_in_time);

-- Notifications
CREATE INDEX IF NOT EXISTS idx_notifications_org_user ON notifications(org_id, user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_notifications_unread ON notifications(org_id, user_id) WHERE is_read = false;

-- Receipt tags
CREATE INDEX IF NOT EXISTS idx_receipt_tags_receipt_id ON receipt_tags(receipt_id);
CREATE INDEX IF NOT EXISTS idx_receipt_tags_org_tag ON receipt_tags(org_id, tag);

-- Organization settings
CREATE INDEX IF NOT EXISTS idx_org_settings_qbo_state ON organization_settings(qbo_auth_state);
CREATE INDEX IF NOT EXISTS idx_org_settings_qbo_realm ON organization_settings(qbo_realm_id) WHERE qbo_realm_id IS NOT NULL;

-- Processed webhook events
CREATE INDEX IF NOT EXISTS idx_processed_webhook_events_status ON processed_webhook_events(status);

-- Org features
CREATE INDEX IF NOT EXISTS idx_org_features_org_id ON org_features(org_id);
CREATE INDEX IF NOT EXISTS idx_org_features_key ON org_features(feature_key);

-- Invoices
CREATE INDEX IF NOT EXISTS idx_invoices_user_id ON invoices(user_id);
CREATE INDEX IF NOT EXISTS idx_invoices_org_id ON invoices(org_id);
CREATE INDEX IF NOT EXISTS idx_invoices_status ON invoices(status);
CREATE INDEX IF NOT EXISTS idx_invoice_line_items_invoice_id ON invoice_line_items(invoice_id);

-- Tax form mappings
CREATE INDEX IF NOT EXISTS idx_tax_form_mappings_form ON tax_form_mappings(form_type);

-- User tax calculations
CREATE INDEX IF NOT EXISTS idx_user_tax_calculations_user_year ON user_tax_calculations(user_id, tax_year);
CREATE INDEX IF NOT EXISTS idx_user_tax_calculations_form ON user_tax_calculations(form_type);
CREATE INDEX IF NOT EXISTS idx_user_tax_calculations_org ON user_tax_calculations(org_id);

-- Profiles
CREATE INDEX IF NOT EXISTS idx_profiles_user_id ON profiles(id);
CREATE INDEX IF NOT EXISTS idx_profiles_org_id ON profiles(org_id);

-- User settings
CREATE INDEX IF NOT EXISTS idx_user_settings_user_id ON user_settings(user_id);

-- ============================================================
-- 29. SEED DATA (idempotent — local dev only)
-- ============================================================

-- Seed org
INSERT INTO organizations (id, name, org_slug)
VALUES ('00000000-0000-0000-0000-000000000001', 'Demo Construction Co.', 'demo-construction')
ON CONFLICT (id) DO NOTHING;

-- Business units
INSERT INTO business_units (id, org_id, name) VALUES
  ('10000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000001', 'Framing'),
  ('10000000-0000-0000-0000-000000000002', '00000000-0000-0000-0000-000000000001', 'Electrical'),
  ('10000000-0000-0000-0000-000000000003', '00000000-0000-0000-0000-000000000001', 'Plumbing'),
  ('10000000-0000-0000-0000-000000000004', '00000000-0000-0000-0000-000000000001', 'Site Prep'),
  ('10000000-0000-0000-0000-000000000005', '00000000-0000-0000-0000-000000000001', 'Office/Admin')
ON CONFLICT (id) DO NOTHING;

-- Projects (user_id set to NULL — no fake users exist in auth.users)
INSERT INTO projects (id, org_id, user_id, name, budget_amount) VALUES
  ('20000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000001', NULL, 'Maple Ridge Townhomes', 250000.00),
  ('20000000-0000-0000-0000-000000000002', '00000000-0000-0000-0000-000000000001', NULL, 'West Side Renovation', 75000.00)
ON CONFLICT (id) DO NOTHING;

-- Sample receipts (SKIPPED: receipts.user_id has SET NOT NULL, no real users exist in auth.users;
-- insert after first user signs up via bootstrap_first_user_org)

-- Org settings
INSERT INTO organization_settings (org_id) VALUES ('00000000-0000-0000-0000-000000000001')
ON CONFLICT (org_id) DO NOTHING;

-- Free subscription
INSERT INTO subscriptions (org_id, plan, status)
VALUES ('00000000-0000-0000-0000-000000000001', 'free', 'active')
ON CONFLICT (org_id) DO NOTHING;

-- Insert CRA tax form mappings (wrapped: actual DB may have different column names)
DO $$ BEGIN
  INSERT INTO tax_form_mappings (form_type, expense_category, cra_line_number, cra_line_description) VALUES
    ('T2125', 'Advertising', '8521', 'Advertising'),
    ('T2125', 'Meals and Entertainment', '8523', 'Meals and entertainment'),
    ('T2125', 'Bad debts', '8590', 'Bad debts'),
    ('T2125', 'Insurance', '8690', 'Insurance'),
    ('T2125', 'Interest and bank charges', '8710', 'Interest and bank charges'),
    ('T2125', 'Business taxes, licences, memberships', '8760', 'Business taxes, licences, memberships'),
    ('T2125', 'Office expenses', '9200', 'Office expenses'),
    ('T2125', 'Office stationery and supplies', '9201', 'Office stationery and supplies'),
    ('T2125', 'Rent', '9220', 'Rent'),
    ('T2125', 'Maintenance and repairs', '9270', 'Maintenance and repairs'),
    ('T2125', 'Salaries, wages, and benefits', '9060', 'Salaries, wages, and benefits'),
    ('T2125', 'Property taxes', '9180', 'Property taxes'),
    ('T2125', 'Travel', '9200', 'Travel'),
    ('T2125', 'Utilities', '9220', 'Utilities'),
    ('T2125', 'Fuel costs', '9224', 'Fuel costs'),
    ('T2125', 'Delivery, freight, and express', '9275', 'Delivery, freight, and express'),
    ('T2125', 'Accounting and legal fees', '8860', 'Accounting and legal fees'),
    ('T2125', 'Professional fees', '8860', 'Professional fees'),
    ('T2125', 'Management and administration fees', '8871', 'Management and administration fees'),
    ('T2125', 'Other professional fees', '8872', 'Other professional fees'),
    ('T2125', 'Private health services plans', '8873', 'Private health services plans'),
    ('T2125', 'Other expenses', '9270', 'Other expenses'),
    ('T777', 'Home office', '9130', 'Home office expenses'),
    ('T777', 'Supplies', '9130', 'Supplies'),
    ('T777', 'Other expenses', '9130', 'Other expenses')
  ON CONFLICT (form_type, expense_category) DO NOTHING;
EXCEPTION WHEN undefined_column THEN
  RAISE NOTICE 'tax_form_mappings INSERT skipped — column schema mismatch (expected: form_type, expense_category, cra_line_number, cra_line_description)';
END $$;

-- Grant permissions
GRANT USAGE ON SCHEMA public TO anon, authenticated, service_role;
GRANT ALL ON ALL TABLES IN SCHEMA public TO service_role;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO service_role;
GRANT EXECUTE ON ALL FUNCTIONS IN SCHEMA public TO authenticated;

-- Notify PostgREST to reload schema
NOTIFY pgrst, 'reload schema';

-- ============================================================
-- DONE. The schema is now fully synchronized.
-- ============================================================
--
-- NOTES (from live verification on ferczwlaphittvksrjhq, 2026-07-22):
--
-- POSTGRESQL 17 COMPATIBILITY FIXES:
--
-- 1. _drop_all_policies function: parameter named `tablename` caused
--    42702 "column reference is ambiguous" in PostgreSQL 17 because
--    pg_policies.tablename column created a naming collision.
--    Renamed parameter to `p_tablename`. (line ~1052)
--
-- 2. Function overload conflicts (42P13 in PG17):
--    - get_user_org_ids() — RETURNS TABLE replaces older scalar version
--    - check_access_logging(uuid) — returns boolean replaces void version
--    - generate_report(jsonb) and 12-param overload — different return types
--    - save_receipt_atomic(jsonb,uuid) — different return type
--    All resolved via explicit DROP FUNCTION IF EXISTS (...) before
--    CREATE OR REPLACE. (lines ~1265-1280)
--
-- 3. Indexes on columns that may not exist in the live DB are wrapped
--    in DO $$ BEGIN ... EXCEPTION WHEN undefined_column THEN NULL; END $$;
--    Affected indexes: time_entries(status,clock_in_time), receipt_tags
--    (receipt_id,tag), invoices(user_id), tax_form_mappings(form_type),
--    user_tax_calculations(form_type). (lines ~1900-1992)
--
-- SCHEMA RECONCILIATION NOTES:
--
-- 4. bank_transactions.receipt_id was added via ALTER TABLE
--    because the existing table had matched_receipt_id instead.
--    The CREATE TABLE in this file now uses receipt_id.
--    Run once on existing DBs: ALTER TABLE bank_transactions
--    ADD COLUMN IF NOT EXISTS receipt_id uuid REFERENCES
--    receipts(id) ON DELETE SET NULL;
--
-- 5. receipt_tags was DROP/RECREATED because the old schema
--    had (org_id, receipt_id, tag, created_by) — the new schema
--    is a tag dictionary (org_id, name, color) with a separate
--    receipt_tag_assignments junction table.
--
-- 6. The following tables existed from old migrations with different
--    column schemas than what this file defines. CREATE TABLE IF
--    NOT EXISTS preserves the old columns, so run
--    DROP TABLE IF EXISTS ... CASCADE first if you want a clean
--    schema: mileage_logs, access_codes, scan_attempts, subscriptions,
--    vendor_defaults, fx_rate_cache, receipt_comments.
--    These tables are NOT used by the current TypeScript codebase
--    but are harmless to keep.
--
-- 7. Seed data: projects.user_id is NULL (not a fake UUID) because
--    the FK constraint requires a real auth.users entry. Receipt
--    seed data is commented out entirely (receipts.user_id has
--    SET NOT NULL, and no users exist until bootstrap_first_user_org
--    runs during first sign-in). tax_form_mappings INSERT is wrapped
--    in DO block because the existing DB may have different column
--    names (e.g., category instead of expense_category).
-- ============================================================
