-- Phase 1: invoice carriers + extended member profile fields

-- ---------------------------------------------------------------------------
-- Extend profiles (reuse existing table)
-- ---------------------------------------------------------------------------
ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS gender TEXT CHECK (gender IN ('female', 'male', 'other', 'prefer_not_to_say')),
  ADD COLUMN IF NOT EXISTS city TEXT,
  ADD COLUMN IF NOT EXISTS district TEXT,
  ADD COLUMN IF NOT EXISTS contact_address TEXT;

COMMENT ON COLUMN profiles.gender IS '會員性別（選填）';
COMMENT ON COLUMN profiles.city IS '縣市（選填）';
COMMENT ON COLUMN profiles.district IS '行政區（選填）';
COMMENT ON COLUMN profiles.contact_address IS '聯絡地址（選填）';

-- ---------------------------------------------------------------------------
-- Invoice carriers (one mobile barcode per member)
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS invoice_carriers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  carrier_type TEXT NOT NULL DEFAULT 'mobile_barcode' CHECK (carrier_type = 'mobile_barcode'),
  carrier_name TEXT,
  carrier_code TEXT NOT NULL,
  is_default BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT invoice_carriers_user_id_unique UNIQUE (user_id)
);

CREATE INDEX IF NOT EXISTS idx_invoice_carriers_user_id ON invoice_carriers(user_id);

DROP TRIGGER IF EXISTS set_updated_at ON invoice_carriers;
CREATE TRIGGER set_updated_at
  BEFORE UPDATE ON invoice_carriers
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ---------------------------------------------------------------------------
-- RLS
-- ---------------------------------------------------------------------------
ALTER TABLE invoice_carriers ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS invoice_carriers_select_own ON invoice_carriers;
CREATE POLICY invoice_carriers_select_own ON invoice_carriers
  FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS invoice_carriers_insert_own ON invoice_carriers;
CREATE POLICY invoice_carriers_insert_own ON invoice_carriers
  FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS invoice_carriers_update_own ON invoice_carriers;
CREATE POLICY invoice_carriers_update_own ON invoice_carriers
  FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS invoice_carriers_delete_own ON invoice_carriers;
CREATE POLICY invoice_carriers_delete_own ON invoice_carriers
  FOR DELETE USING (auth.uid() = user_id);
