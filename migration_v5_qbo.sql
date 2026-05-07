-- ============================================================
-- QBO OAuth Integration — Migration v5
-- Add columns for OAuth flow and token management
-- ============================================================

-- Add QBO OAuth columns to organization_settings
ALTER TABLE organization_settings
ADD COLUMN IF NOT EXISTS qbo_auth_state text,
ADD COLUMN IF NOT EXISTS qbo_auth_nonce text,
ADD COLUMN IF NOT EXISTS qbo_auth_started_at timestamptz,
ADD COLUMN IF NOT EXISTS qbo_access_token text,
ADD COLUMN IF NOT EXISTS qbo_token_expires_at timestamptz,
ADD COLUMN IF NOT EXISTS qbo_connected_at timestamptz;

-- Add sync status columns to receipts table
ALTER TABLE receipts
ADD COLUMN IF NOT EXISTS qbo_synced boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS qbo_synced_at timestamptz,
ADD COLUMN IF NOT EXISTS qbo_sync_error text,
ADD COLUMN IF NOT EXISTS qbo_expense_id text;

-- Add index for QBO sync queries
CREATE INDEX IF NOT EXISTS idx_receipts_qbo_synced ON receipts(qbo_synced) WHERE qbo_synced = false;

NOTIFY pgrst, 'reload schema';
