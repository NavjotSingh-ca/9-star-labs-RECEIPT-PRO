-- Migration 00001: Initial schema
-- This is the canonical schema extracted from setup.sql
-- Run: psql -f supabase/migrations/00001_initial_schema.sql

-- ============================================================
-- EXTENSIONS
-- ============================================================
CREATE EXTENSION IF NOT EXISTS "pgcrypto";
CREATE EXTENSION IF NOT EXISTS "pg_stat_statements";

-- ============================================================
-- TABLES
-- ============================================================

-- Organizations (multi-tenant root)
CREATE TABLE IF NOT EXISTS organizations (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name        text NOT NULL,
  slug        text UNIQUE,
  created_at  timestamptz DEFAULT now(),
  updated_at  timestamptz DEFAULT now()
);

-- User profiles (extends Supabase auth.users)
CREATE TABLE IF NOT EXISTS profiles (
  id              uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  org_id          uuid REFERENCES organizations(id) ON DELETE SET NULL,
  role            text NOT NULL DEFAULT 'Owner' CHECK (role IN ('Owner','Admin','Member','Employee','Accountant','Auditor')),
  full_name       text,
  avatar_url      text,
  created_at      timestamptz DEFAULT now(),
  updated_at      timestamptz DEFAULT now()
);

-- Business units (org departments)
CREATE TABLE IF NOT EXISTS business_units (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id      uuid NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  name        text NOT NULL,
  created_at  timestamptz DEFAULT now()
);

-- Projects / job codes
CREATE TABLE IF NOT EXISTS projects (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id      uuid NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  user_id     uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name        text NOT NULL,
  budget      numeric(12,2) DEFAULT 0,
  created_at  timestamptz DEFAULT now(),
  updated_at  timestamptz DEFAULT now()
);

-- Receipts (core table)
CREATE TABLE IF NOT EXISTS receipts (
  id                uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id            uuid NOT NULL REFERENCES organizations(id),
  user_id           uuid NOT NULL REFERENCES auth.users(id),
  vendor_name       text,
  vendor_address    text,
  business_number   text,
  transaction_date  date,
  total_amount      numeric(12,2) DEFAULT 0,
  subtotal          numeric(12,2) DEFAULT 0,
  tax_amount        numeric(12,2) DEFAULT 0,
  pst_amount        numeric(12,2) DEFAULT 0,
  currency          text DEFAULT 'CAD',
  payment_method    text,
  category          text,
  notes             text,
  receipt_image_url text,
  approval_status   text DEFAULT 'pending' CHECK (approval_status IN ('pending','approved','rejected')),
  reimbursement_status text DEFAULT 'pending' CHECK (reimbursement_status IN ('pending','approved','rejected')),
  duplicate_hash    text,
  confidence_score  int DEFAULT 0,
  cra_score         int DEFAULT 0,
  is_flagged        boolean DEFAULT false,
  flag_reason       text,
  is_deleted        boolean DEFAULT false,
  deleted_at        timestamptz,
  business_unit_id  uuid REFERENCES business_units(id) ON DELETE SET NULL,
  project_id        uuid REFERENCES projects(id) ON DELETE SET NULL,
  created_at        timestamptz DEFAULT now(),
  updated_at        timestamptz DEFAULT now()
);

-- Receipt line items
CREATE TABLE IF NOT EXISTS receipt_line_items (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  receipt_id  uuid NOT NULL REFERENCES receipts(id) ON DELETE CASCADE,
  description text,
  quantity    numeric(12,2) DEFAULT 1,
  unit_price  numeric(12,2) DEFAULT 0,
  amount      numeric(12,2) DEFAULT 0,
  created_at  timestamptz DEFAULT now()
);

-- Receipt comments
CREATE TABLE IF NOT EXISTS receipt_comments (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  receipt_id  uuid NOT NULL REFERENCES receipts(id) ON DELETE CASCADE,
  user_id     uuid NOT NULL REFERENCES auth.users(id),
  content     text NOT NULL,
  created_at  timestamptz DEFAULT now()
);

-- Vehicles (for mileage tracking)
CREATE TABLE IF NOT EXISTS vehicles (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id      uuid NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  user_id     uuid NOT NULL REFERENCES auth.users(id),
  nickname    text,
  plate       text,
  make        text,
  model       text,
  year        int,
  created_at  timestamptz DEFAULT now()
);

-- Mileage logs
CREATE TABLE IF NOT EXISTS mileage_logs (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id          uuid NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  user_id         uuid NOT NULL REFERENCES auth.users(id),
  vehicle_id      uuid NOT NULL REFERENCES vehicles(id) ON DELETE CASCADE,
  trip_date       date NOT NULL,
  purpose         text,
  start_address   text,
  end_address     text,
  distance_km     numeric(8,2) NOT NULL,
  rate_per_km     numeric(6,4) DEFAULT 0.70,
  reimbursable    numeric(10,2) DEFAULT 0,
  created_at      timestamptz DEFAULT now()
);

-- Audit trail (immutable)
CREATE TABLE IF NOT EXISTS audit_logs (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id          uuid NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  user_id         uuid REFERENCES auth.users(id),
  action          text NOT NULL,
  entity_type     text NOT NULL,
  entity_id       text,
  changes         jsonb,
  ip_address      text,
  previous_hash   text,
  current_hash    text UNIQUE,
  created_at      timestamptz DEFAULT now()
);

-- Bank connections
CREATE TABLE IF NOT EXISTS bank_connections (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id      uuid NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  plaid_token text,
  qbo_token   text,
  created_at  timestamptz DEFAULT now(),
  updated_at  timestamptz DEFAULT now()
);

-- Bank transactions
CREATE TABLE IF NOT EXISTS bank_transactions (
  id                uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id            uuid NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  bank_connection_id uuid REFERENCES bank_connections(id) ON DELETE SET NULL,
  transaction_date  date NOT NULL,
  description       text,
  amount            numeric(12,2) NOT NULL,
  category          text,
  uploaded_by       uuid REFERENCES auth.users(id),
  statement_date    date,
  source_file_name  text,
  matched_receipt_id uuid REFERENCES receipts(id) ON DELETE SET NULL,
  created_at        timestamptz DEFAULT now()
);

-- Processed webhook events (idempotency)
CREATE TABLE IF NOT EXISTS processed_webhook_events (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id        text UNIQUE NOT NULL,
  source          text NOT NULL,
  processed_at    timestamptz DEFAULT now()
);

-- Processed digest dates (cron dedup)
CREATE TABLE IF NOT EXISTS processed_digest_dates (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  digest_date     date NOT NULL,
  processed_at    timestamptz DEFAULT now(),
  UNIQUE(digest_date)
);

-- Subscriptions
CREATE TABLE IF NOT EXISTS subscriptions (
  id                uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id            uuid UNIQUE NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  stripe_subscription_id text,
  plan_tier         text DEFAULT 'free' CHECK (plan_tier IN ('free','starter','business','enterprise')),
  status            text DEFAULT 'active',
  current_period_start timestamptz,
  current_period_end   timestamptz,
  trial_end         timestamptz,
  created_at        timestamptz DEFAULT now(),
  updated_at        timestamptz DEFAULT now()
);

-- Organization settings
CREATE TABLE IF NOT EXISTS organization_settings (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id          uuid UNIQUE NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  blur_threshold  int DEFAULT 40,
  allowed_domains text[],
  created_at      timestamptz DEFAULT now(),
  updated_at      timestamptz DEFAULT now()
);

-- ============================================================
-- INDEXES
-- ============================================================
CREATE INDEX IF NOT EXISTS idx_profiles_org_id ON profiles(org_id);
CREATE INDEX IF NOT EXISTS idx_receipts_org_id ON receipts(org_id);
CREATE INDEX IF NOT EXISTS idx_receipts_user_id ON receipts(user_id);
CREATE INDEX IF NOT EXISTS idx_receipts_approval_status ON receipts(approval_status);
CREATE INDEX IF NOT EXISTS idx_receipts_created_at ON receipts(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_receipts_duplicate_hash ON receipts(duplicate_hash);
CREATE INDEX IF NOT EXISTS idx_receipt_line_items_receipt_id ON receipt_line_items(receipt_id);
CREATE INDEX IF NOT EXISTS idx_receipt_comments_receipt_id ON receipt_comments(receipt_id);
CREATE INDEX IF NOT EXISTS idx_vehicles_org_id ON vehicles(org_id);
CREATE INDEX IF NOT EXISTS idx_mileage_logs_org_id ON mileage_logs(org_id);
CREATE INDEX IF NOT EXISTS idx_mileage_logs_vehicle_id ON mileage_logs(vehicle_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_org_id ON audit_logs(org_id);
CREATE INDEX IF NOT EXISTS idx_bank_transactions_org_id ON bank_transactions(org_id);
CREATE INDEX IF NOT EXISTS idx_business_units_org_id ON business_units(org_id);
CREATE INDEX IF NOT EXISTS idx_projects_org_id ON projects(org_id);
CREATE INDEX IF NOT EXISTS idx_subscriptions_org_id ON subscriptions(org_id);
CREATE INDEX IF NOT EXISTS idx_processed_webhook_events_event_id ON processed_webhook_events(event_id);
CREATE INDEX IF NOT EXISTS idx_processed_digest_dates_date ON processed_digest_dates(digest_date);

-- Partial indexes for common filtered queries
CREATE INDEX IF NOT EXISTS idx_receipts_active ON receipts(org_id) WHERE is_deleted = false;
CREATE INDEX IF NOT EXISTS idx_receipts_pending ON receipts(org_id) WHERE approval_status = 'pending' AND is_deleted = false;
CREATE INDEX IF NOT EXISTS idx_receipts_flagged ON receipts(org_id) WHERE is_flagged = true AND is_deleted = false;

-- Unique constraints
CREATE UNIQUE INDEX IF NOT EXISTS uniq_org_duplicate_hash ON receipts(org_id, duplicate_hash) WHERE duplicate_hash IS NOT NULL AND is_deleted = false;
CREATE UNIQUE INDEX IF NOT EXISTS uniq_tx_content ON bank_transactions(org_id, transaction_date, amount, description);
