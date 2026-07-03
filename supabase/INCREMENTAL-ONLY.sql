-- =============================================================================
-- 門市團購 APP — 增量升級 SQL（已有舊庫專用）
-- =============================================================================
-- 適用：已執行過 complete-schema 或 initial_schema 的專案
-- 全新專案請改執行 DEPLOY-FULL.sql
-- 可安全重複執行（IF NOT EXISTS）
-- =============================================================================


-- ########## migrations/20250630000000_add_store_credit_balance.sql ##########
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS store_credit_balance DECIMAL(12,2) NOT NULL DEFAULT 0;

-- ########## migrations/20250630100000_sync_schema.sql ##########
-- 增量同步：將舊版資料庫補齊至 complete-schema.sql 最新狀態
-- 適用於已執行 20250629000000 或 20250630000000 的專案
-- 可安全重複執行（IF NOT EXISTS / IF EXISTS）

-- profiles：儲值金餘額
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS store_credit_balance DECIMAL(12,2) NOT NULL DEFAULT 0;

-- orders：取貨門市
ALTER TABLE orders ADD COLUMN IF NOT EXISTS pickup_store_id UUID REFERENCES stores(id);

-- payment_reports：備註
ALTER TABLE payment_reports ADD COLUMN IF NOT EXISTS notes TEXT;

-- pickup_records：核銷人員
ALTER TABLE pickup_records ADD COLUMN IF NOT EXISTS verified_by UUID REFERENCES profiles(id);

-- push / user notifications：連結
ALTER TABLE push_notifications ADD COLUMN IF NOT EXISTS link TEXT;
ALTER TABLE user_notifications ADD COLUMN IF NOT EXISTS link TEXT;

-- support_tickets：優先級（若舊表無此欄）
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'support_tickets' AND column_name = 'priority'
  ) THEN
    ALTER TABLE support_tickets ADD COLUMN priority support_ticket_priority NOT NULL DEFAULT 'medium';
  END IF;
END $$;

-- commission_payouts：批次發放狀態欄位
ALTER TABLE commission_payouts ADD COLUMN IF NOT EXISTS status commission_payout_status NOT NULL DEFAULT 'pending';
ALTER TABLE commission_payouts ADD COLUMN IF NOT EXISTS processed_by UUID REFERENCES profiles(id);
ALTER TABLE commission_payouts ADD COLUMN IF NOT EXISTS processed_at TIMESTAMPTZ;

-- share_clicks：工作階段追蹤
ALTER TABLE share_clicks ADD COLUMN IF NOT EXISTS session_id TEXT;

-- referrals：推薦碼
ALTER TABLE referrals ADD COLUMN IF NOT EXISTS referral_code TEXT;

-- coupons：有效期間
ALTER TABLE coupons ADD COLUMN IF NOT EXISTS valid_from TIMESTAMPTZ;
ALTER TABLE coupons ADD COLUMN IF NOT EXISTS valid_until TIMESTAMPTZ;

-- audit_logs：額外詳情
ALTER TABLE audit_logs ADD COLUMN IF NOT EXISTS details JSONB DEFAULT '{}';

-- reward_records：審核欄位（舊版可能已有 approved_by，僅在缺少時補齊）
ALTER TABLE reward_records ADD COLUMN IF NOT EXISTS approved_by UUID REFERENCES profiles(id);
ALTER TABLE reward_records ADD COLUMN IF NOT EXISTS approved_at TIMESTAMPTZ;
ALTER TABLE reward_records ADD COLUMN IF NOT EXISTS issued_by UUID REFERENCES profiles(id);
ALTER TABLE reward_records ADD COLUMN IF NOT EXISTS issued_at TIMESTAMPTZ;
ALTER TABLE reward_records ADD COLUMN IF NOT EXISTS reject_reason TEXT;
ALTER TABLE reward_records ADD COLUMN IF NOT EXISTS description TEXT;

-- 訂單狀態 ENUM 補齊（payment_reported / payment_confirmed 取代舊版 paid）
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_enum e JOIN pg_type t ON e.enumtypid = t.oid WHERE t.typname = 'order_status' AND e.enumlabel = 'payment_reported') THEN
    ALTER TYPE order_status ADD VALUE IF NOT EXISTS 'payment_reported';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_enum e JOIN pg_type t ON e.enumtypid = t.oid WHERE t.typname = 'order_status' AND e.enumlabel = 'payment_confirmed') THEN
    ALTER TYPE order_status ADD VALUE IF NOT EXISTS 'payment_confirmed';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_enum e JOIN pg_type t ON e.enumtypid = t.oid WHERE t.typname = 'order_status' AND e.enumlabel = 'awaiting_payment') THEN
    ALTER TYPE order_status ADD VALUE IF NOT EXISTS 'awaiting_payment';
  END IF;
END $$;

-- ########## migrations/20250701000000_monster_game.sql ##########
-- 麵包小怪獸：購後分享小遊戲
-- 可安全重複執行（IF NOT EXISTS）

-- ENUM 型別
DO $$ BEGIN
  CREATE TYPE monster_share_status AS ENUM ('pending_review', 'approved', 'rejected');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE monster_reward_status AS ENUM ('pending_review', 'issued', 'used', 'expired');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- 小怪獸檔案（每位會員一隻）
CREATE TABLE IF NOT EXISTS monster_profiles (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL UNIQUE REFERENCES profiles(id) ON DELETE CASCADE,
  monster_name TEXT NOT NULL DEFAULT '麵包小怪獸',
  bread_kg DECIMAL(8,2) NOT NULL DEFAULT 0,
  level INTEGER NOT NULL DEFAULT 1,
  current_stage TEXT NOT NULL DEFAULT 'hungry',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_monster_profiles_user ON monster_profiles(user_id);

DROP TRIGGER IF EXISTS monster_profiles_updated_at ON monster_profiles;
CREATE TRIGGER monster_profiles_updated_at BEFORE UPDATE ON monster_profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- 遊戲獎勵門檻規則
CREATE TABLE IF NOT EXISTS reward_rules (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  threshold_kg DECIMAL(8,2) NOT NULL,
  reward_type TEXT NOT NULL,
  reward_name TEXT NOT NULL,
  reward_value TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_reward_rules_threshold ON reward_rules(threshold_kg);

DROP TRIGGER IF EXISTS reward_rules_updated_at ON reward_rules;
CREATE TRIGGER reward_rules_updated_at BEFORE UPDATE ON reward_rules
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- 遊戲設定（單列）
CREATE TABLE IF NOT EXISTS monster_game_settings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  share_kg DECIMAL(8,2) NOT NULL DEFAULT 0.5,
  min_chars INTEGER NOT NULL DEFAULT 10,
  bonus_chars INTEGER NOT NULL DEFAULT 30,
  bonus_kg DECIMAL(8,2) NOT NULL DEFAULT 0.5,
  photo_kg DECIMAL(8,2) NOT NULL DEFAULT 1,
  daily_limit INTEGER NOT NULL DEFAULT 3,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

DROP TRIGGER IF EXISTS monster_game_settings_updated_at ON monster_game_settings;
CREATE TRIGGER monster_game_settings_updated_at BEFORE UPDATE ON monster_game_settings
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- 商品分享紀錄
CREATE TABLE IF NOT EXISTS product_share_records (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  product_id UUID NOT NULL REFERENCES products(id),
  order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  review_text TEXT NOT NULL,
  has_photo BOOLEAN NOT NULL DEFAULT false,
  line_share_text TEXT,
  share_url TEXT,
  bread_kg_awarded DECIMAL(8,2) NOT NULL DEFAULT 0,
  status monster_share_status NOT NULL DEFAULT 'pending_review',
  reviewed_by UUID REFERENCES profiles(id),
  reviewed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(user_id, order_id, product_id)
);

CREATE INDEX IF NOT EXISTS idx_product_share_records_user ON product_share_records(user_id);
CREATE INDEX IF NOT EXISTS idx_product_share_records_status ON product_share_records(status);
CREATE INDEX IF NOT EXISTS idx_product_share_records_created ON product_share_records(created_at);

DROP TRIGGER IF EXISTS product_share_records_updated_at ON product_share_records;
CREATE TRIGGER product_share_records_updated_at BEFORE UPDATE ON product_share_records
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- 餵食紀錄
CREATE TABLE IF NOT EXISTS monster_feed_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  product_id UUID REFERENCES products(id),
  order_id UUID REFERENCES orders(id),
  share_record_id UUID REFERENCES product_share_records(id),
  bread_kg DECIMAL(8,2) NOT NULL,
  reason TEXT,
  status TEXT NOT NULL DEFAULT 'pending',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_monster_feed_logs_user ON monster_feed_logs(user_id);

-- 小怪獸獎勵
CREATE TABLE IF NOT EXISTS monster_rewards (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  reward_rule_id UUID NOT NULL REFERENCES reward_rules(id),
  threshold_kg DECIMAL(8,2) NOT NULL,
  reward_type TEXT NOT NULL,
  reward_name TEXT NOT NULL,
  reward_value TEXT,
  status monster_reward_status NOT NULL DEFAULT 'pending_review',
  issued_at TIMESTAMPTZ,
  used_at TIMESTAMPTZ,
  expires_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_monster_rewards_user ON monster_rewards(user_id);
CREATE INDEX IF NOT EXISTS idx_monster_rewards_status ON monster_rewards(status);

DROP TRIGGER IF EXISTS monster_rewards_updated_at ON monster_rewards;
CREATE TRIGGER monster_rewards_updated_at BEFORE UPDATE ON monster_rewards
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- LINE 分享事件
CREATE TABLE IF NOT EXISTS line_share_events (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  product_id UUID REFERENCES products(id),
  share_record_id UUID REFERENCES product_share_records(id),
  event_type TEXT NOT NULL,
  raw_payload JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_line_share_events_user ON line_share_events(user_id);

-- 預設遊戲設定
INSERT INTO monster_game_settings (id, share_kg, min_chars, bonus_chars, bonus_kg, photo_kg, daily_limit)
SELECT uuid_generate_v4(), 0.5, 10, 30, 0.5, 1, 3
WHERE NOT EXISTS (SELECT 1 FROM monster_game_settings LIMIT 1);

-- 預設獎勵門檻
INSERT INTO reward_rules (id, threshold_kg, reward_type, reward_name, reward_value, is_active)
VALUES
  ('a7000001-0000-4000-8000-000000000001', 5,  'store_credit',  '儲值金 20 元', '20', true),
  ('a7000001-0000-4000-8000-000000000002', 10, 'coupon',        '折價券 50 元', '50', true),
  ('a7000001-0000-4000-8000-000000000003', 20, 'free_shipping', '免運券',       NULL, true),
  ('a7000001-0000-4000-8000-000000000004', 30, 'mystery_gift',  '神秘禮物',     NULL, true)
ON CONFLICT (id) DO NOTHING;

-- RLS
ALTER TABLE monster_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE reward_rules ENABLE ROW LEVEL SECURITY;
ALTER TABLE monster_game_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE product_share_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE monster_feed_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE monster_rewards ENABLE ROW LEVEL SECURITY;
ALTER TABLE line_share_events ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS monster_profiles_own ON monster_profiles;
CREATE POLICY monster_profiles_own ON monster_profiles FOR ALL
  USING (user_id = auth.uid() OR is_admin());

DROP POLICY IF EXISTS reward_rules_read ON reward_rules;
CREATE POLICY reward_rules_read ON reward_rules FOR SELECT
  USING (true);
DROP POLICY IF EXISTS reward_rules_admin ON reward_rules;
CREATE POLICY reward_rules_admin ON reward_rules FOR ALL
  USING (is_admin());

DROP POLICY IF EXISTS monster_game_settings_read ON monster_game_settings;
CREATE POLICY monster_game_settings_read ON monster_game_settings FOR SELECT
  USING (true);
DROP POLICY IF EXISTS monster_game_settings_admin ON monster_game_settings;
CREATE POLICY monster_game_settings_admin ON monster_game_settings FOR ALL
  USING (is_admin());

DROP POLICY IF EXISTS product_share_records_own ON product_share_records;
CREATE POLICY product_share_records_own ON product_share_records FOR ALL
  USING (user_id = auth.uid() OR is_admin());

DROP POLICY IF EXISTS monster_feed_logs_own ON monster_feed_logs;
CREATE POLICY monster_feed_logs_own ON monster_feed_logs FOR SELECT
  USING (user_id = auth.uid() OR is_admin());
DROP POLICY IF EXISTS monster_feed_logs_insert ON monster_feed_logs;
CREATE POLICY monster_feed_logs_insert ON monster_feed_logs FOR INSERT
  WITH CHECK (user_id = auth.uid() OR is_admin());

DROP POLICY IF EXISTS monster_rewards_own ON monster_rewards;
CREATE POLICY monster_rewards_own ON monster_rewards FOR SELECT
  USING (user_id = auth.uid() OR is_admin());
DROP POLICY IF EXISTS monster_rewards_admin ON monster_rewards;
CREATE POLICY monster_rewards_admin ON monster_rewards FOR ALL
  USING (is_admin());

DROP POLICY IF EXISTS line_share_events_own ON line_share_events;
CREATE POLICY line_share_events_own ON line_share_events FOR ALL
  USING (user_id = auth.uid() OR is_admin());

-- ########## migrations/20250701100000_product_images_homepage_featured.sql ##########
-- 商品多圖與首頁輪播精選團購欄位
-- products.images 已存在於初始 schema，此處僅確保型別正確

ALTER TABLE products
  ALTER COLUMN images SET DEFAULT '[]'::jsonb;

-- 團購活動首頁輪播與橫幅比例備註
ALTER TABLE group_buy_events
  ADD COLUMN IF NOT EXISTS is_homepage_featured BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS homepage_sort_order INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS banner_aspect_ratio TEXT DEFAULT '16:9';

CREATE INDEX IF NOT EXISTS idx_group_buy_events_homepage
  ON group_buy_events (is_homepage_featured, homepage_sort_order)
  WHERE is_homepage_featured = true;

COMMENT ON COLUMN group_buy_events.is_homepage_featured IS '是否顯示於首頁輪播';
COMMENT ON COLUMN group_buy_events.homepage_sort_order IS '首頁輪播排序（數字越小越前面）';
COMMENT ON COLUMN group_buy_events.banner_aspect_ratio IS '橫幅建議比例，預設 16:9';

-- ########## migrations/20250702100000_articles_categories_icons.sql ##########
-- 文章、分類圖示、商品預購欄位

-- 分類圖示（emoji 或圖片網址）
ALTER TABLE product_categories
  ADD COLUMN IF NOT EXISTS icon_emoji TEXT,
  ADD COLUMN IF NOT EXISTS icon_url TEXT;

COMMENT ON COLUMN product_categories.icon_emoji IS '分類 emoji 圖示';
COMMENT ON COLUMN product_categories.icon_url IS '分類自訂圖片網址（優先於 emoji）';

-- 商品預購與預計到貨
ALTER TABLE products
  ADD COLUMN IF NOT EXISTS expected_arrival_date DATE,
  ADD COLUMN IF NOT EXISTS preorder_deadline TIMESTAMPTZ;

COMMENT ON COLUMN products.expected_arrival_date IS '商品預計到貨日期';
COMMENT ON COLUMN products.preorder_deadline IS '商品預購截單時間';

CREATE INDEX IF NOT EXISTS idx_products_preorder_deadline
  ON products(preorder_deadline)
  WHERE preorder_deadline IS NOT NULL;

-- 文章
CREATE TABLE IF NOT EXISTS articles (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  content TEXT NOT NULL DEFAULT '',
  cover_image TEXT,
  category_id UUID REFERENCES product_categories(id) ON DELETE SET NULL,
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'published')),
  sort_order INT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_articles_status ON articles(status);
CREATE INDEX IF NOT EXISTS idx_articles_slug ON articles(slug);
CREATE INDEX IF NOT EXISTS idx_articles_sort ON articles(sort_order);

DROP TRIGGER IF EXISTS articles_updated_at ON articles;
CREATE TRIGGER articles_updated_at BEFORE UPDATE ON articles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

ALTER TABLE articles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS articles_public_read ON articles;
CREATE POLICY articles_public_read ON articles FOR SELECT
  USING (status = 'published' OR is_admin());

DROP POLICY IF EXISTS articles_admin_write ON articles;
CREATE POLICY articles_admin_write ON articles FOR ALL USING (is_admin());

-- ########## migrations/20250703000000_production_phase1.sql ##########
-- Phase 1: Production deployment — pickup, payments, shipments, staff, RLS
-- Safe to re-run (IF NOT EXISTS / DO blocks)

-- ---------------------------------------------------------------------------
-- ENUMs
-- ---------------------------------------------------------------------------
DO $$ BEGIN
  CREATE TYPE order_payment_status AS ENUM (
    'unpaid', 'paid_online', 'paid_store', 'failed', 'refunded', 'cancelled'
  );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE order_pickup_status AS ENUM (
    'pending', 'ready', 'picked_up', 'returned', 'cancelled'
  );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE shipment_method AS ENUM ('store_pickup', 'home_delivery', 'cvs_pickup');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE shipment_status AS ENUM (
    'pending', 'processing', 'shipped', 'arrived', 'picked_up', 'returned'
  );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE payment_gateway AS ENUM ('ecpay', 'newebpay', 'bank_transfer', 'store_cash', 'manual');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE pickup_log_action AS ENUM (
    'lookup', 'confirm_payment', 'confirm_pickup', 'report_issue'
  );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- ---------------------------------------------------------------------------
-- categories view (alias for product_categories)
-- ---------------------------------------------------------------------------
CREATE OR REPLACE VIEW categories AS
  SELECT id, name, slug, sort_order, icon_emoji, icon_url, created_at, updated_at
  FROM product_categories;

-- ---------------------------------------------------------------------------
-- orders: pickup_token, order_no, payment_status, pickup_status
-- ---------------------------------------------------------------------------
ALTER TABLE orders
  ADD COLUMN IF NOT EXISTS order_no TEXT,
  ADD COLUMN IF NOT EXISTS pickup_token TEXT,
  ADD COLUMN IF NOT EXISTS payment_status order_payment_status NOT NULL DEFAULT 'unpaid',
  ADD COLUMN IF NOT EXISTS pickup_status order_pickup_status NOT NULL DEFAULT 'pending';

UPDATE orders SET order_no = order_number WHERE order_no IS NULL;

CREATE UNIQUE INDEX IF NOT EXISTS idx_orders_pickup_token ON orders(pickup_token) WHERE pickup_token IS NOT NULL;
CREATE UNIQUE INDEX IF NOT EXISTS idx_orders_order_no ON orders(order_no) WHERE order_no IS NOT NULL;

-- ---------------------------------------------------------------------------
-- pickup_codes
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS pickup_codes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  order_id UUID NOT NULL UNIQUE REFERENCES orders(id) ON DELETE CASCADE,
  pickup_token TEXT NOT NULL UNIQUE,
  qr_payload TEXT NOT NULL,
  expires_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_pickup_codes_token ON pickup_codes(pickup_token);

-- ---------------------------------------------------------------------------
-- pickup_logs (staff scan / confirm actions)
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS pickup_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  store_id UUID REFERENCES stores(id),
  staff_id UUID REFERENCES profiles(id),
  action pickup_log_action NOT NULL,
  notes TEXT,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_pickup_logs_order ON pickup_logs(order_id);
CREATE INDEX IF NOT EXISTS idx_pickup_logs_store ON pickup_logs(store_id);

-- ---------------------------------------------------------------------------
-- payments (gateway transactions)
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS payments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES profiles(id),
  amount DECIMAL(12,2) NOT NULL,
  currency TEXT NOT NULL DEFAULT 'TWD',
  gateway payment_gateway NOT NULL DEFAULT 'manual',
  gateway_trade_no TEXT,
  merchant_trade_no TEXT UNIQUE,
  status order_payment_status NOT NULL DEFAULT 'unpaid',
  raw_request JSONB,
  raw_response JSONB,
  paid_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_payments_order ON payments(order_id);
CREATE INDEX IF NOT EXISTS idx_payments_status ON payments(status);
CREATE INDEX IF NOT EXISTS idx_payments_merchant_trade ON payments(merchant_trade_no);

DROP TRIGGER IF EXISTS payments_updated_at ON payments;
CREATE TRIGGER payments_updated_at BEFORE UPDATE ON payments
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ---------------------------------------------------------------------------
-- shipments
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS shipments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  method shipment_method NOT NULL DEFAULT 'store_pickup',
  status shipment_status NOT NULL DEFAULT 'pending',
  store_id UUID REFERENCES stores(id),
  tracking_no TEXT,
  carrier TEXT,
  recipient_name TEXT,
  recipient_phone TEXT,
  address TEXT,
  cvs_store_id TEXT,
  shipped_at TIMESTAMPTZ,
  arrived_at TIMESTAMPTZ,
  picked_up_at TIMESTAMPTZ,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_shipments_order_unique ON shipments(order_id);
CREATE INDEX IF NOT EXISTS idx_shipments_order ON shipments(order_id);
CREATE INDEX IF NOT EXISTS idx_shipments_status ON shipments(status);

DROP TRIGGER IF EXISTS shipments_updated_at ON shipments;
CREATE TRIGGER shipments_updated_at BEFORE UPDATE ON shipments
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ---------------------------------------------------------------------------
-- staff (門市人員與門市關聯)
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS staff (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL UNIQUE REFERENCES profiles(id) ON DELETE CASCADE,
  store_id UUID NOT NULL REFERENCES stores(id),
  title TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_staff_store ON staff(store_id);

DROP TRIGGER IF EXISTS staff_updated_at ON staff;
CREATE TRIGGER staff_updated_at BEFORE UPDATE ON staff
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ---------------------------------------------------------------------------
-- coupons (預留)
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS coupons (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  code TEXT NOT NULL UNIQUE,
  title TEXT NOT NULL,
  discount_type TEXT NOT NULL DEFAULT 'fixed',
  discount_value DECIMAL(12,2) NOT NULL DEFAULT 0,
  min_order_amount DECIMAL(12,2) NOT NULL DEFAULT 0,
  max_uses INT,
  used_count INT NOT NULL DEFAULT 0,
  livestream_id UUID,
  starts_at TIMESTAMPTZ,
  ends_at TIMESTAMPTZ,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ---------------------------------------------------------------------------
-- reward_logs, game_logs, line_bindings, ai_chat_logs (預留架構)
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS reward_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  reward_type TEXT NOT NULL,
  amount DECIMAL(12,2) NOT NULL DEFAULT 0,
  source_type TEXT,
  source_id TEXT,
  status TEXT NOT NULL DEFAULT 'pending',
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_reward_logs_user ON reward_logs(user_id);

CREATE TABLE IF NOT EXISTS game_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  task_type TEXT NOT NULL,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_game_logs_user ON game_logs(user_id);

CREATE TABLE IF NOT EXISTS line_bindings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL UNIQUE REFERENCES profiles(id) ON DELETE CASCADE,
  line_user_id TEXT NOT NULL UNIQUE,
  display_name TEXT,
  picture_url TEXT,
  bound_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS ai_chat_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
  session_id TEXT NOT NULL,
  role TEXT NOT NULL,
  message TEXT NOT NULL,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_ai_chat_logs_session ON ai_chat_logs(session_id);
CREATE INDEX IF NOT EXISTS idx_ai_chat_logs_user ON ai_chat_logs(user_id);

-- ---------------------------------------------------------------------------
-- RLS helper functions
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN AS $$
  SELECT EXISTS (
    SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'
  );
$$ LANGUAGE sql SECURITY DEFINER STABLE;

CREATE OR REPLACE FUNCTION public.is_store_staff()
RETURNS BOOLEAN AS $$
  SELECT EXISTS (
    SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'store_staff'
  );
$$ LANGUAGE sql SECURITY DEFINER STABLE;

CREATE OR REPLACE FUNCTION public.staff_store_id()
RETURNS UUID AS $$
  SELECT COALESCE(
    (SELECT store_id FROM staff WHERE user_id = auth.uid() AND is_active = true LIMIT 1),
    (SELECT store_id FROM profiles WHERE id = auth.uid())
  );
$$ LANGUAGE sql SECURITY DEFINER STABLE;

-- ---------------------------------------------------------------------------
-- RLS: orders — members own; staff by store; admin all; no member UPDATE
-- ---------------------------------------------------------------------------
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS orders_select_own ON orders;
DROP POLICY IF EXISTS orders_select_staff_store ON orders;
DROP POLICY IF EXISTS orders_select_admin ON orders;
DROP POLICY IF EXISTS orders_member_select ON orders;
DROP POLICY IF EXISTS orders_staff_select ON orders;
DROP POLICY IF EXISTS orders_admin_all ON orders;

CREATE POLICY orders_member_select ON orders
  FOR SELECT TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY orders_staff_select ON orders
  FOR SELECT TO authenticated
  USING (
    public.is_store_staff()
    AND (
      store_id = public.staff_store_id()
      OR pickup_store_id = public.staff_store_id()
    )
  );

CREATE POLICY orders_admin_all ON orders
  FOR ALL TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

-- Members cannot update orders directly (payment/pickup via API only)
DROP POLICY IF EXISTS orders_member_update ON orders;
-- (no UPDATE policy for members = denied by default)

-- ---------------------------------------------------------------------------
-- RLS: order_items
-- ---------------------------------------------------------------------------
ALTER TABLE order_items ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS order_items_member_select ON order_items;
DROP POLICY IF EXISTS order_items_staff_select ON order_items;
DROP POLICY IF EXISTS order_items_admin_all ON order_items;

CREATE POLICY order_items_member_select ON order_items
  FOR SELECT TO authenticated
  USING (
    EXISTS (SELECT 1 FROM orders o WHERE o.id = order_items.order_id AND o.user_id = auth.uid())
  );

CREATE POLICY order_items_staff_select ON order_items
  FOR SELECT TO authenticated
  USING (
    public.is_store_staff()
    AND EXISTS (
      SELECT 1 FROM orders o
      WHERE o.id = order_items.order_id
        AND (o.store_id = public.staff_store_id() OR o.pickup_store_id = public.staff_store_id())
    )
  );

CREATE POLICY order_items_admin_all ON order_items
  FOR ALL TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

-- ---------------------------------------------------------------------------
-- RLS: pickup_logs, payments, shipments
-- ---------------------------------------------------------------------------
ALTER TABLE pickup_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE shipments ENABLE ROW LEVEL SECURITY;
ALTER TABLE staff ENABLE ROW LEVEL SECURITY;
ALTER TABLE pickup_codes ENABLE ROW LEVEL SECURITY;

CREATE POLICY pickup_logs_admin ON pickup_logs FOR ALL TO authenticated
  USING (public.is_admin()) WITH CHECK (public.is_admin());

CREATE POLICY pickup_logs_staff_select ON pickup_logs FOR SELECT TO authenticated
  USING (public.is_store_staff() AND store_id = public.staff_store_id());

CREATE POLICY payments_member_select ON payments FOR SELECT TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY payments_admin ON payments FOR ALL TO authenticated
  USING (public.is_admin()) WITH CHECK (public.is_admin());

CREATE POLICY shipments_member_select ON shipments FOR SELECT TO authenticated
  USING (
    EXISTS (SELECT 1 FROM orders o WHERE o.id = shipments.order_id AND o.user_id = auth.uid())
  );

CREATE POLICY shipments_admin ON shipments FOR ALL TO authenticated
  USING (public.is_admin()) WITH CHECK (public.is_admin());

CREATE POLICY staff_admin ON staff FOR ALL TO authenticated
  USING (public.is_admin()) WITH CHECK (public.is_admin());

CREATE POLICY staff_self_select ON staff FOR SELECT TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY pickup_codes_member_select ON pickup_codes FOR SELECT TO authenticated
  USING (
    EXISTS (SELECT 1 FROM orders o WHERE o.id = pickup_codes.order_id AND o.user_id = auth.uid())
  );

CREATE POLICY pickup_codes_staff_select ON pickup_codes FOR SELECT TO authenticated
  USING (public.is_store_staff() OR public.is_admin());
