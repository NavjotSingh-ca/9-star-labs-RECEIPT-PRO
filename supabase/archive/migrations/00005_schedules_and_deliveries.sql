-- Migration 00005: Schedules and Deliveries
-- Adds 'daily' frequency option to report_schedules
-- Creates report_deliveries table for tracking delivery status

-- ============================================================
-- UPDATE report_schedules CONSTRAINT
-- ============================================================
ALTER TABLE report_schedules
  DROP CONSTRAINT IF EXISTS report_schedules_frequency_check;

ALTER TABLE report_schedules
  ADD CONSTRAINT report_schedules_frequency_check
  CHECK (frequency IN ('daily', 'weekly', 'monthly', 'quarterly'));

-- ============================================================
-- CREATE report_deliveries TABLE
-- ============================================================
CREATE TABLE IF NOT EXISTS report_deliveries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  schedule_id UUID NOT NULL REFERENCES report_schedules(id) ON DELETE CASCADE,
  org_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  recipient_count INT NOT NULL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'delivered', 'failed')),
  error_message TEXT,
  delivered_at TIMESTAMPTZ DEFAULT now(),
  created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE report_deliveries ENABLE ROW LEVEL SECURITY;

-- RLS policies for report_deliveries
DO $$ BEGIN
  CREATE POLICY "report_deliveries_view" ON report_deliveries
    FOR SELECT USING (org_id = get_user_org());
  CREATE POLICY "report_deliveries_insert" ON report_deliveries
    FOR INSERT WITH CHECK (org_id = get_user_org());
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- Indexes
CREATE INDEX IF NOT EXISTS idx_report_deliveries_schedule_id ON report_deliveries(schedule_id);
CREATE INDEX IF NOT EXISTS idx_report_deliveries_org_id ON report_deliveries(org_id);
CREATE INDEX IF NOT EXISTS idx_report_deliveries_status ON report_deliveries(status);
