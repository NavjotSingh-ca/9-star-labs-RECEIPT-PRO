-- Migration 00006: Feature flags + employee time tracking
-- Part of the feature configuration system and hour tracker

-- ============================================================
-- 1. FEATURE FLAGS
-- ============================================================

CREATE TABLE IF NOT EXISTS public.org_features (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id      uuid NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  feature_key text NOT NULL,
  enabled     boolean NOT NULL DEFAULT true,
  config      jsonb DEFAULT '{}'::jsonb,
  created_at  timestamptz DEFAULT now(),
  updated_at  timestamptz DEFAULT now(),
  UNIQUE(org_id, feature_key)
);

COMMENT ON TABLE public.org_features IS 'Per-organization feature flag toggles';
COMMENT ON COLUMN public.org_features.feature_key IS 'Machine-readable feature identifier (snake_case)';
COMMENT ON COLUMN public.org_features.config IS 'Optional JSON configuration for the feature';

-- Auto-update updated_at
CREATE TRIGGER set_updated_at_org_features
  BEFORE UPDATE ON public.org_features
  FOR EACH ROW
  EXECUTE FUNCTION public.set_updated_at();

-- RLS
ALTER TABLE public.org_features ENABLE ROW LEVEL SECURITY;

CREATE POLICY org_features_select ON public.org_features
  FOR SELECT USING (
    org_id IN (SELECT org_id FROM public.get_user_org_ids())
  );

CREATE POLICY org_features_insert ON public.org_features
  FOR INSERT WITH CHECK (
    org_id IN (SELECT org_id FROM public.get_user_org_ids() WHERE role IN ('Owner', 'Admin'))
  );

CREATE POLICY org_features_update ON public.org_features
  FOR UPDATE USING (
    org_id IN (SELECT org_id FROM public.get_user_org_ids() WHERE role IN ('Owner', 'Admin'))
  );

CREATE POLICY org_features_delete ON public.org_features
  FOR DELETE USING (
    org_id IN (SELECT org_id FROM public.get_user_org_ids() WHERE role IN ('Owner', 'Admin'))
  );

-- Indexes
CREATE INDEX IF NOT EXISTS idx_org_features_org_id ON public.org_features(org_id);
CREATE INDEX IF NOT EXISTS idx_org_features_key ON public.org_features(feature_key);

-- Enable realtime for live updates
ALTER PUBLICATION supabase_realtime ADD TABLE IF NOT EXISTS public.org_features;

-- ============================================================
-- 2. TIME TRACKING (Clock In/Out)
-- ============================================================

CREATE TABLE IF NOT EXISTS public.time_entries (
  id             uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id         uuid NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  user_id        uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  clock_in_time  timestamptz NOT NULL DEFAULT now(),
  clock_out_time timestamptz,
  notes          text,
  status         text NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'completed')),
  created_at     timestamptz DEFAULT now(),
  updated_at     timestamptz DEFAULT now()
);

COMMENT ON TABLE public.time_entries IS 'Simple employee clock-in/out records';
COMMENT ON COLUMN public.time_entries.status IS 'active = currently clocked in, completed = clocked out';

-- Auto-update updated_at
CREATE TRIGGER set_updated_at_time_entries
  BEFORE UPDATE ON public.time_entries
  FOR EACH ROW
  EXECUTE FUNCTION public.set_updated_at();

-- RLS
ALTER TABLE public.time_entries ENABLE ROW LEVEL SECURITY;

CREATE POLICY time_entries_select ON public.time_entries
  FOR SELECT USING (
    user_id = auth.uid()
    OR org_id IN (SELECT org_id FROM public.get_user_org_ids())
  );

CREATE POLICY time_entries_insert ON public.time_entries
  FOR INSERT WITH CHECK (
    user_id = auth.uid()
    AND org_id IN (SELECT org_id FROM public.get_user_org_ids())
  );

CREATE POLICY time_entries_update ON public.time_entries
  FOR UPDATE USING (
    user_id = auth.uid()
    OR org_id IN (SELECT org_id FROM public.get_user_org_ids() WHERE role IN ('Owner', 'Admin'))
  );

CREATE POLICY time_entries_delete ON public.time_entries
  FOR DELETE USING (
    user_id = auth.uid()
    OR org_id IN (SELECT org_id FROM public.get_user_org_ids() WHERE role IN ('Owner', 'Admin'))
  );

-- Indexes
CREATE INDEX IF NOT EXISTS idx_time_entries_org_id ON public.time_entries(org_id);
CREATE INDEX IF NOT EXISTS idx_time_entries_user_id ON public.time_entries(user_id);
CREATE INDEX IF NOT EXISTS idx_time_entries_status ON public.time_entries(status);
CREATE INDEX IF NOT EXISTS idx_time_entries_clock_in ON public.time_entries(clock_in_time);
CREATE INDEX IF NOT EXISTS idx_time_entries_org_user_date ON public.time_entries(org_id, user_id, clock_in_time);

-- Enable realtime for live clock status
ALTER PUBLICATION supabase_realtime ADD TABLE IF NOT EXISTS public.time_entries;

-- ============================================================
-- 3. HELPER: Bootstrap default features for a new org
-- ============================================================

CREATE OR REPLACE FUNCTION public.bootstrap_org_features(p_org_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = ''
AS $$
BEGIN
  -- Enable all features by default for new orgs
  INSERT INTO public.org_features (org_id, feature_key, enabled)
  VALUES
    (p_org_id, 'dashboard', true),
    (p_org_id, 'scanning', true),
    (p_org_id, 'receipts', true),
    (p_org_id, 'mileage', true),
    (p_org_id, 'time_tracking', false),  -- opt-in for time tracking
    (p_org_id, 'export', true),
    (p_org_id, 'banking', true),
    (p_org_id, 'approvals', true),
    (p_org_id, 'payables', true),
    (p_org_id, 'projects', true),
    (p_org_id, 'audit', true),
    (p_org_id, 'alerts', true),
    (p_org_id, 'reports', true),
    (p_org_id, 'budgets', true),
    (p_org_id, 'tax', true),
    (p_org_id, 'cashflow', true),
    (p_org_id, 'multi_currency', true),
    (p_org_id, 'vendors', true),
    (p_org_id, 'integrations', true),
    (p_org_id, 'tags', true),
    (p_org_id, 'batch_ops', true),
    (p_org_id, 'search', true),
    (p_org_id, 'calendar', true),
    (p_org_id, 'timeline', true),
    (p_org_id, 'kanban', true),
    (p_org_id, 'insights', true),
    (p_org_id, 'readiness', true),
    (p_org_id, 'notifications', true),
    (p_org_id, 'sharing', true)
  ON CONFLICT (org_id, feature_key) DO NOTHING;
END;
$$;

COMMENT ON FUNCTION public.bootstrap_org_features IS 'Inserts default feature flags for a newly created organization';
