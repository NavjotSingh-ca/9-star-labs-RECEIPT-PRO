-- Migration 00007: Role-based feature access
-- Adds allowed_roles to org_features so Owners can control which roles see which features
-- Owner role always has full access (bypassed in application logic)

-- ============================================================
-- 1. ADD allowed_roles COLUMN
-- ============================================================

ALTER TABLE IF EXISTS public.org_features
  ADD COLUMN IF NOT EXISTS allowed_roles jsonb NOT NULL DEFAULT '["Owner","Admin","Employee","Accountant","Auditor"]'::jsonb;

COMMENT ON COLUMN public.org_features.allowed_roles IS 'Array of role keys that can access this feature. Owner always has access regardless.';

-- ============================================================
-- 2. UPDATE bootstrap function with role defaults
-- ============================================================

CREATE OR REPLACE FUNCTION public.bootstrap_org_features(p_org_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = ''
AS $$
BEGIN
  INSERT INTO public.org_features (org_id, feature_key, enabled, allowed_roles)
  VALUES
    -- Core: all roles
    (p_org_id, 'dashboard', true, '["Owner","Admin","Employee","Accountant","Auditor"]'::jsonb),
    (p_org_id, 'scanning', true, '["Owner","Admin","Employee","Accountant","Auditor"]'::jsonb),
    (p_org_id, 'receipts', true, '["Owner","Admin","Employee","Accountant","Auditor"]'::jsonb),
    -- Tracking: Owner/Admin/Employee
    (p_org_id, 'mileage', true, '["Owner","Admin","Employee"]'::jsonb),
    (p_org_id, 'time_tracking', false, '["Owner","Admin","Employee"]'::jsonb),
    -- Finance: Owner/Admin/Accountant
    (p_org_id, 'export', true, '["Owner","Admin","Accountant"]'::jsonb),
    (p_org_id, 'banking', true, '["Owner","Admin","Accountant"]'::jsonb),
    (p_org_id, 'payables', true, '["Owner","Admin","Accountant"]'::jsonb),
    (p_org_id, 'budgets', true, '["Owner","Admin","Accountant"]'::jsonb),
    (p_org_id, 'tax', true, '["Owner","Admin","Accountant"]'::jsonb),
    (p_org_id, 'cashflow', true, '["Owner","Admin","Accountant"]'::jsonb),
    (p_org_id, 'multi_currency', true, '["Owner","Admin","Accountant"]'::jsonb),
    (p_org_id, 'vendors', true, '["Owner","Admin","Accountant"]'::jsonb),
    -- Oversight: Owner/Admin/Auditor
    (p_org_id, 'approvals', true, '["Owner","Admin","Auditor"]'::jsonb),
    (p_org_id, 'audit', true, '["Owner","Admin","Auditor"]'::jsonb),
    (p_org_id, 'alerts', true, '["Owner","Admin","Auditor"]'::jsonb),
    (p_org_id, 'reports', true, '["Owner","Admin","Auditor"]'::jsonb),
    -- Productivity: all roles
    (p_org_id, 'tags', true, '["Owner","Admin","Employee","Accountant","Auditor"]'::jsonb),
    (p_org_id, 'batch_ops', true, '["Owner","Admin","Accountant","Auditor"]'::jsonb),
    (p_org_id, 'search', true, '["Owner","Admin","Employee","Accountant","Auditor"]'::jsonb),
    (p_org_id, 'calendar', true, '["Owner","Admin","Employee","Accountant","Auditor"]'::jsonb),
    (p_org_id, 'timeline', true, '["Owner","Admin","Employee","Accountant","Auditor"]'::jsonb),
    (p_org_id, 'kanban', true, '["Owner","Admin","Employee","Accountant"]'::jsonb),
    (p_org_id, 'sharing', true, '["Owner","Admin","Employee","Accountant","Auditor"]'::jsonb),
    -- Integrations: Owner/Admin
    (p_org_id, 'integrations', true, '["Owner","Admin"]'::jsonb),
    -- Insights: Owner/Admin/Auditor
    (p_org_id, 'insights', true, '["Owner","Admin","Auditor"]'::jsonb),
    (p_org_id, 'readiness', true, '["Owner","Admin","Accountant"]'::jsonb),
    (p_org_id, 'notifications', true, '["Owner","Admin","Employee","Accountant","Auditor"]'::jsonb)
  ON CONFLICT (org_id, feature_key) DO UPDATE
    SET allowed_roles = EXCLUDED.allowed_roles
    WHERE org_features.allowed_roles IS NULL OR org_features.allowed_roles = '[]'::jsonb;
END;
$$;
