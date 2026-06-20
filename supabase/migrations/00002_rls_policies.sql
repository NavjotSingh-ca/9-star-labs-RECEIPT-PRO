-- Migration 00002: Row-Level Security policies
-- Run after 00001_initial_schema.sql

-- ============================================================
-- ENABLE RLS ON ALL TABLES
-- ============================================================
ALTER TABLE organizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE receipts ENABLE ROW LEVEL SECURITY;
ALTER TABLE receipt_line_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE receipt_comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE vehicles ENABLE ROW LEVEL SECURITY;
ALTER TABLE mileage_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE bank_connections ENABLE ROW LEVEL SECURITY;
ALTER TABLE bank_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE business_units ENABLE ROW LEVEL SECURITY;
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE organization_settings ENABLE ROW LEVEL SECURITY;

-- ============================================================
-- ORGANIZATIONS
-- ============================================================
CREATE POLICY "Select_Org" ON organizations
  FOR SELECT USING (
    id IN (SELECT org_id FROM profiles WHERE id = auth.uid())
  );

CREATE POLICY "Update_Org" ON organizations
  FOR UPDATE USING (
    id IN (SELECT org_id FROM profiles WHERE id = auth.uid() AND role IN ('Owner', 'Admin'))
  );

-- ============================================================
-- PROFILES
-- ============================================================
CREATE POLICY "Select_Profile" ON profiles
  FOR SELECT USING (
    org_id IN (SELECT org_id FROM profiles WHERE id = auth.uid())
    OR id = auth.uid()
  );

CREATE POLICY "Update_Own_Profile" ON profiles
  FOR UPDATE USING (id = auth.uid());

-- ============================================================
-- RECEIPTS
-- ============================================================
CREATE POLICY "Select_Receipt" ON receipts
  FOR SELECT USING (
    org_id IN (SELECT org_id FROM profiles WHERE id = auth.uid())
  );

CREATE POLICY "Insert_Receipt" ON receipts
  FOR INSERT WITH CHECK (
    org_id IN (SELECT org_id FROM profiles WHERE id = auth.uid())
  );

CREATE POLICY "Update_Receipt" ON receipts
  FOR UPDATE USING (
    org_id IN (SELECT org_id FROM profiles WHERE id = auth.uid())
  );

CREATE POLICY "Delete_Receipt" ON receipts
  FOR DELETE USING (
    org_id IN (SELECT org_id FROM profiles WHERE id = auth.uid())
    AND (is_deleted = true OR (approval_status != 'approved'))
  );

-- ============================================================
-- RECEIPT LINE ITEMS
-- ============================================================
CREATE POLICY "Select_LineItem" ON receipt_line_items
  FOR SELECT USING (
    receipt_id IN (SELECT id FROM receipts WHERE org_id IN (SELECT org_id FROM profiles WHERE id = auth.uid()))
  );

CREATE POLICY "Insert_LineItem" ON receipt_line_items
  FOR INSERT WITH CHECK (
    receipt_id IN (SELECT id FROM receipts WHERE org_id IN (SELECT org_id FROM profiles WHERE id = auth.uid()))
  );

-- ============================================================
-- RECEIPT COMMENTS
-- ============================================================
CREATE POLICY "Select_Comment" ON receipt_comments
  FOR SELECT USING (
    receipt_id IN (SELECT id FROM receipts WHERE org_id IN (SELECT org_id FROM profiles WHERE id = auth.uid()))
  );

CREATE POLICY "Insert_Comment" ON receipt_comments
  FOR INSERT WITH CHECK (
    receipt_id IN (SELECT id FROM receipts WHERE org_id IN (SELECT org_id FROM profiles WHERE id = auth.uid()))
  );

-- ============================================================
-- VEHICLES
-- ============================================================
CREATE POLICY "Select_Vehicle" ON vehicles
  FOR SELECT USING (
    org_id IN (SELECT org_id FROM profiles WHERE id = auth.uid())
  );

CREATE POLICY "Insert_Vehicle" ON vehicles
  FOR INSERT WITH CHECK (
    org_id IN (SELECT org_id FROM profiles WHERE id = auth.uid())
  );

CREATE POLICY "Update_Vehicle" ON vehicles
  FOR UPDATE USING (
    org_id IN (SELECT org_id FROM profiles WHERE id = auth.uid())
  );

-- ============================================================
-- MILEAGE LOGS
-- ============================================================
CREATE POLICY "Select_Mileage" ON mileage_logs
  FOR SELECT USING (
    org_id IN (SELECT org_id FROM profiles WHERE id = auth.uid())
  );

CREATE POLICY "Insert_Mileage" ON mileage_logs
  FOR INSERT WITH CHECK (
    org_id IN (SELECT org_id FROM profiles WHERE id = auth.uid())
  );

-- ============================================================
-- AUDIT LOGS
-- ============================================================
CREATE POLICY "Select_Audit" ON audit_logs
  FOR SELECT USING (
    org_id IN (SELECT org_id FROM profiles WHERE id = auth.uid())
  );

-- ============================================================
-- BANK CONNECTIONS & TRANSACTIONS
-- ============================================================
CREATE POLICY "Select_BankConnection" ON bank_connections
  FOR SELECT USING (
    org_id IN (SELECT org_id FROM profiles WHERE id = auth.uid())
  );

CREATE POLICY "Select_BankTransaction" ON bank_transactions
  FOR SELECT USING (
    org_id IN (SELECT org_id FROM profiles WHERE id = auth.uid())
  );

CREATE POLICY "Insert_BankTransaction" ON bank_transactions
  FOR INSERT WITH CHECK (
    org_id IN (SELECT org_id FROM profiles WHERE id = auth.uid())
  );

CREATE POLICY "Update_BankTransaction" ON bank_transactions
  FOR UPDATE USING (
    org_id IN (SELECT org_id FROM profiles WHERE id = auth.uid())
  );

-- ============================================================
-- BUSINESS UNITS
-- ============================================================
CREATE POLICY "Select_BusinessUnit" ON business_units
  FOR SELECT USING (
    org_id IN (SELECT org_id FROM profiles WHERE id = auth.uid())
  );

-- ============================================================
-- PROJECTS
-- ============================================================
CREATE POLICY "Select_Project" ON projects
  FOR SELECT USING (
    org_id IN (SELECT org_id FROM profiles WHERE id = auth.uid())
  );

CREATE POLICY "Insert_Project" ON projects
  FOR INSERT WITH CHECK (
    org_id IN (SELECT org_id FROM profiles WHERE id = auth.uid())
  );

-- ============================================================
-- SUBSCRIPTIONS
-- ============================================================
CREATE POLICY "Select_Subscription" ON subscriptions
  FOR SELECT USING (
    org_id IN (SELECT org_id FROM profiles WHERE id = auth.uid())
  );

-- ============================================================
-- ORGANIZATION SETTINGS
-- ============================================================
CREATE POLICY "Select_OrgSettings" ON organization_settings
  FOR SELECT USING (
    org_id IN (SELECT org_id FROM profiles WHERE id = auth.uid())
  );

CREATE POLICY "Update_OrgSettings" ON organization_settings
  FOR UPDATE USING (
    org_id IN (SELECT org_id FROM profiles WHERE id = auth.uid())
    AND auth.uid() IN (SELECT id FROM profiles WHERE role IN ('Owner', 'Admin'))
  );
