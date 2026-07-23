-- ============================================================
-- Migration: Fix date columns, RLS policies, and constraints
-- Run this after setup.sql on existing databases
-- ============================================================

-- 1. Fix receipts.transaction_date from TEXT to DATE
-- This column stores dates as text (e.g., '2024-01-15')
-- We need to cast existing valid dates and handle invalid ones
DO $$
BEGIN
  -- Check if column exists and is text type
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'receipts' 
    AND column_name = 'transaction_date' 
    AND data_type = 'text'
  ) THEN
    -- Add new date column
    ALTER TABLE receipts ADD COLUMN transaction_date_new date;
    
    -- Populate new column from text, handling invalid formats
    UPDATE receipts 
    SET transaction_date_new = CASE 
      WHEN transaction_date ~ '^\d{4}-\d{2}-\d{2}$' THEN transaction_date::date
      ELSE NULL
    END
    WHERE transaction_date IS NOT NULL AND transaction_date <> '';
    
    -- Drop old column and rename new one
    ALTER TABLE receipts DROP COLUMN transaction_date;
    ALTER TABLE receipts RENAME COLUMN transaction_date_new TO transaction_date;
    
    -- Add index for date queries
    CREATE INDEX IF NOT EXISTS idx_receipts_transaction_date ON receipts(org_id, transaction_date);
  END IF;
END $$;

-- 2. Fix receipt_history.transaction_date from TEXT to DATE
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'receipt_history' 
    AND column_name = 'transaction_date' 
    AND data_type = 'text'
  ) THEN
    ALTER TABLE receipt_history ADD COLUMN transaction_date_new date;
    
    UPDATE receipt_history 
    SET transaction_date_new = CASE 
      WHEN transaction_date ~ '^\d{4}-\d{2}-\d{2}$' THEN transaction_date::date
      ELSE NULL
    END
    WHERE transaction_date IS NOT NULL AND transaction_date <> '';
    
    ALTER TABLE receipt_history DROP COLUMN transaction_date;
    ALTER TABLE receipt_history RENAME COLUMN transaction_date_new TO transaction_date;
  END IF;
END $$;

-- 3. Fix bank_transactions: remove redundant transaction_date text, use date column
-- The table has both `date date NOT NULL` and `transaction_date text NOT NULL DEFAULT ''`
-- We should use the `date` column as the primary date field
DO $$
BEGIN
  -- Drop the redundant text column if it exists
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'bank_transactions' 
    AND column_name = 'transaction_date' 
    AND data_type = 'text'
  ) THEN
    -- First, ensure the date column has data (migrate from transaction_date if needed)
    UPDATE bank_transactions 
    SET date = CASE 
      WHEN transaction_date ~ '^\d{4}-\d{2}-\d{2}$' THEN transaction_date::date
      ELSE date
    END
    WHERE date IS NULL AND transaction_date IS NOT NULL AND transaction_date <> '' AND transaction_date ~ '^\d{4}-\d{2}-\d{2}$';
    
    -- Drop the text column
    ALTER TABLE bank_transactions DROP COLUMN transaction_date;
  END IF;
  
  -- Recreate the uniq_tx_content constraint using the date column
  ALTER TABLE bank_transactions DROP CONSTRAINT IF EXISTS uniq_tx_content;
  ALTER TABLE bank_transactions ADD CONSTRAINT uniq_tx_content UNIQUE (org_id, date, amount, description);
END $$;

-- 4. Add INSERT RLS policy to organizations table
-- The bootstrap_first_user_org function uses SECURITY DEFINER, but we should also allow service role to insert
ALTER TABLE organizations ENABLE ROW LEVEL SECURITY;

-- Allow service role to insert (for bootstrap)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'organizations' AND policyname = 'Service role can insert organizations'
  ) THEN
    CREATE POLICY "Service role can insert organizations"
      ON organizations FOR INSERT
      WITH CHECK (true); -- Service role bypasses RLS anyway
  END IF;
END $$;

-- 5. Ensure receipts table has updated_at trigger
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.triggers 
    WHERE trigger_name = 'update_receipts_updated_at' AND event_object_table = 'receipts'
  ) THEN
    CREATE TRIGGER update_receipts_updated_at
      BEFORE UPDATE ON receipts
      FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
  END IF;
END $$;

-- 6. Add org_id index to receipts if missing
CREATE INDEX IF NOT EXISTS idx_receipts_org_id ON receipts(org_id);

-- 7. Add updated_at to bank_transactions if missing
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'bank_transactions' AND column_name = 'updated_at'
  ) THEN
    ALTER TABLE bank_transactions ADD COLUMN updated_at timestamptz DEFAULT now();
    
    CREATE TRIGGER update_bank_transactions_updated_at
      BEFORE UPDATE ON bank_transactions
      FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
  END IF;
END $$;

-- 8. Ensure all tables with updated_at have the trigger
SELECT apply_updated_at_triggers();

-- 8. Grant necessary permissions
GRANT USAGE ON SCHEMA public TO anon, authenticated, service_role;
GRANT ALL ON ALL TABLES IN SCHEMA public TO service_role;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO service_role;

-- 9. Add comments for documentation
COMMENT ON COLUMN receipts.transaction_date IS 'Date of the transaction (YYYY-MM-DD)';
COMMENT ON COLUMN bank_transactions.date IS 'Date of the bank transaction';
COMMENT ON CONSTRAINT uniq_tx_content ON bank_transactions IS 'Ensures unique transactions per org by date, amount, and description';

-- 10. Add duplicate_hash generation trigger for receipts
-- This moves the hash generation from client-side to server-side for consistency
CREATE OR REPLACE FUNCTION generate_duplicate_hash()
RETURNS TRIGGER AS $$
BEGIN
  -- Normalize inputs same as client-side generateDuplicateHash
  NEW.duplicate_hash := encode(
    digest(
      lower(trim(regexp_replace(NEW.vendor_name, '\s+', ' ', 'g'))) || '|' ||
      trim(NEW.transaction_date::text) || '|' ||
      to_char(COALESCE(NEW.total_amount, 0), 'FM999999999.00'),
      'sha256'
    ),
    'hex'
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS set_duplicate_hash ON receipts;
CREATE TRIGGER set_duplicate_hash
  BEFORE INSERT ON receipts
  FOR EACH ROW EXECUTE FUNCTION generate_duplicate_hash();

-- 10b. Also set hash on receipt_history for audit trail
DROP TRIGGER IF EXISTS set_duplicate_hash_history ON receipt_history;
CREATE TRIGGER set_duplicate_hash_history
  BEFORE INSERT ON receipt_history
  FOR EACH ROW EXECUTE FUNCTION generate_duplicate_hash();

-- 11. Grant necessary permissions
GRANT USAGE ON SCHEMA public TO anon, authenticated, service_role;
GRANT ALL ON ALL TABLES IN SCHEMA public TO service_role;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO service_role;