-- Phase 2: favorites, addresses, notifications, FAQs, account deletion, store extensions

-- ---------------------------------------------------------------------------
-- profiles: member_number (display id CM000001)
-- ---------------------------------------------------------------------------
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS member_number TEXT UNIQUE;

CREATE OR REPLACE FUNCTION generate_member_number()
RETURNS TRIGGER AS $$
DECLARE
  next_num INT;
BEGIN
  IF NEW.member_number IS NULL OR NEW.member_number = '' THEN
    SELECT COALESCE(MAX(CAST(SUBSTRING(member_number FROM 3) AS INT)), 0) + 1
    INTO next_num FROM profiles WHERE member_number ~ '^CM[0-9]+$';
    NEW.member_number := 'CM' || LPAD(next_num::TEXT, 6, '0');
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS profiles_member_number ON profiles;
CREATE TRIGGER profiles_member_number
  BEFORE INSERT ON profiles
  FOR EACH ROW EXECUTE FUNCTION generate_member_number();

-- Backfill existing profiles without member_number
DO $$
DECLARE r RECORD; n INT := 0;
BEGIN
  FOR r IN SELECT id FROM profiles WHERE member_number IS NULL ORDER BY created_at LOOP
    n := n + 1;
    UPDATE profiles SET member_number = 'CM' || LPAD(n::TEXT, 6, '0') WHERE id = r.id;
  END LOOP;
END $$;

-- ---------------------------------------------------------------------------
-- product_favorites
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS product_favorites (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT product_favorites_user_product_unique UNIQUE (user_id, product_id)
);

CREATE INDEX IF NOT EXISTS idx_product_favorites_user ON product_favorites(user_id);

-- ---------------------------------------------------------------------------
-- member_addresses
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS member_addresses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  recipient_name TEXT NOT NULL,
  phone TEXT NOT NULL,
  postal_code TEXT,
  city TEXT NOT NULL,
  district TEXT NOT NULL,
  address_line TEXT NOT NULL,
  label TEXT,
  is_default BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_member_addresses_user ON member_addresses(user_id);

DROP TRIGGER IF EXISTS set_updated_at ON member_addresses;
CREATE TRIGGER set_updated_at BEFORE UPDATE ON member_addresses
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ---------------------------------------------------------------------------
-- notifications (in-app member notifications)
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  notification_type TEXT NOT NULL CHECK (notification_type IN ('order', 'pickup', 'product', 'livestream', 'system')),
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  link_url TEXT,
  reference_id TEXT,
  is_read BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  read_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_notifications_user_created ON notifications(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_notifications_user_unread ON notifications(user_id) WHERE is_read = false;

-- ---------------------------------------------------------------------------
-- notification_preferences
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS notification_preferences (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  order_updates BOOLEAN NOT NULL DEFAULT true,
  pickup_reminders BOOLEAN NOT NULL DEFAULT true,
  new_products BOOLEAN NOT NULL DEFAULT true,
  closing_soon BOOLEAN NOT NULL DEFAULT true,
  livestreams BOOLEAN NOT NULL DEFAULT true,
  marketing BOOLEAN NOT NULL DEFAULT false,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

DROP TRIGGER IF EXISTS set_updated_at ON notification_preferences;
CREATE TRIGGER set_updated_at BEFORE UPDATE ON notification_preferences
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ---------------------------------------------------------------------------
-- faqs
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS faqs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  category TEXT NOT NULL,
  question TEXT NOT NULL,
  answer TEXT NOT NULL,
  is_active BOOLEAN NOT NULL DEFAULT true,
  sort_order INT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_faqs_category ON faqs(category, sort_order);

DROP TRIGGER IF EXISTS set_updated_at ON faqs;
CREATE TRIGGER set_updated_at BEFORE UPDATE ON faqs
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ---------------------------------------------------------------------------
-- account_deletion_requests
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS account_deletion_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  reason TEXT,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'completed', 'rejected')),
  requested_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  processed_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_account_deletion_user ON account_deletion_requests(user_id);

-- ---------------------------------------------------------------------------
-- Extend stores
-- ---------------------------------------------------------------------------
ALTER TABLE stores
  ADD COLUMN IF NOT EXISTS map_url TEXT,
  ADD COLUMN IF NOT EXISTS line_url TEXT,
  ADD COLUMN IF NOT EXISTS image_url TEXT,
  ADD COLUMN IF NOT EXISTS pickup_available BOOLEAN NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS sort_order INT NOT NULL DEFAULT 0;

-- Convert business_hours to jsonb if still text (keep text compatible)
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'stores' AND column_name = 'business_hours' AND data_type = 'text'
  ) THEN
    ALTER TABLE stores ADD COLUMN IF NOT EXISTS business_hours_json JSONB;
    UPDATE stores SET business_hours_json = jsonb_build_object('default', business_hours) WHERE business_hours IS NOT NULL AND business_hours_json IS NULL;
  END IF;
END $$;

-- Extend support_tickets
ALTER TABLE support_tickets
  ADD COLUMN IF NOT EXISTS contact_name TEXT,
  ADD COLUMN IF NOT EXISTS contact_phone TEXT,
  ADD COLUMN IF NOT EXISTS contact_email TEXT;

-- ---------------------------------------------------------------------------
-- RLS
-- ---------------------------------------------------------------------------
ALTER TABLE product_favorites ENABLE ROW LEVEL SECURITY;
ALTER TABLE member_addresses ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE notification_preferences ENABLE ROW LEVEL SECURITY;
ALTER TABLE faqs ENABLE ROW LEVEL SECURITY;
ALTER TABLE account_deletion_requests ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS product_favorites_own ON product_favorites;
CREATE POLICY product_favorites_own ON product_favorites FOR ALL
  USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS member_addresses_own ON member_addresses;
CREATE POLICY member_addresses_own ON member_addresses FOR ALL
  USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS notifications_own ON notifications;
CREATE POLICY notifications_own ON notifications FOR ALL
  USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS notification_preferences_own ON notification_preferences;
CREATE POLICY notification_preferences_own ON notification_preferences FOR ALL
  USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS faqs_public_read ON faqs;
CREATE POLICY faqs_public_read ON faqs FOR SELECT USING (is_active = true);

DROP POLICY IF EXISTS faqs_admin_all ON faqs;
CREATE POLICY faqs_admin_all ON faqs FOR ALL
  USING (EXISTS (SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.role = 'admin'));

DROP POLICY IF EXISTS account_deletion_own ON account_deletion_requests;
CREATE POLICY account_deletion_own ON account_deletion_requests FOR ALL
  USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- Seed default store if none active
INSERT INTO stores (name, address, phone, line_url, pickup_available, is_active, sort_order, business_hours)
SELECT '棋美點心屋', '台北市大安區復興南路二段292號', '02-2737-5508', 'https://line.me/R/ti/p/@diy_chimei', true, true, 0, '週一至週日 09:00–21:00'
WHERE NOT EXISTS (SELECT 1 FROM stores WHERE is_active = true LIMIT 1);

-- Seed sample FAQs (only if table empty)
INSERT INTO faqs (category, question, answer, sort_order)
SELECT * FROM (VALUES
  ('發票載具', '如何設定手機條碼？', '請至「我的」→「發票載具」新增您的財政部手機條碼。本 App 僅協助儲存及顯示，不代表已完成財政部申請。', 1),
  ('取貨方式', '如何取貨？', '訂單付款確認後，可至訂單詳情頁出示取貨 QR Code，由門市人員掃描完成取貨。', 2),
  ('訂單與付款', '如何確認付款？', '轉帳後請至訂單頁填寫付款回報，或由門市現場付款。', 3)
) AS v(category, question, answer, sort_order)
WHERE NOT EXISTS (SELECT 1 FROM faqs LIMIT 1);
