-- =============================================================================
-- 門市團購 APP — 完整資料庫 Schema（Supabase SQL Editor 一鍵執行版）
-- =============================================================================
--
-- 【使用方式】
-- 1. 登入 Supabase Dashboard → SQL Editor
-- 2. 貼上本檔案全部內容
-- 3. 點擊 Run 執行
-- 4. （選用）再執行 supabase/seed-data.sql 建立範例資料
--
-- 【安裝模式：全新安裝（Fresh Install）】
-- 本腳本開頭會 DROP 所有應用程式資料表、型別、觸發器與函式後重建。
-- 清除順序：Storage 政策 → auth 觸發器 → 資料表 → ENUM 型別 → 輔助函式（CASCADE）
-- ⚠️  警告：會刪除 public schema 內所有業務資料，僅適用於：
--     - 全新 Supabase 專案
--     - 開發／測試環境重置
-- 若專案已有正式資料，請改用 supabase/migrations/ 增量遷移，勿執行本檔。
--
-- 【涵蓋內容】
-- - 擴充套件、ENUM 型別、30 張資料表（含 profiles.store_credit_balance）
-- - 索引、外鍵、updated_at 觸發器
-- - 角色輔助函式（is_admin 等）
-- - Row Level Security（RLS）政策（member / admin / store_staff /
--   group_leader / promoter / livestream_host）
-- - 註冊自動建立 profile 與購物車
-- - Storage 儲存桶與政策
--
-- 【執行順序（重要）】
-- PostgreSQL 在建立函式時會驗證函式內容所參照的資料表是否已存在，
-- 因此必須依下列順序執行，不可調換：
--   1. 擴充套件（Extensions）
--   2. ENUM 型別（Types）
--   3. 所有 CREATE TABLE（含 profiles、products 等）
--   4. 索引與資料表觸發器（updated_at）
--   5. 輔助函式（is_admin、has_role、decrement_product_stock 等）
--      → 必須在 profiles / products 等被參照表建立之後
--   6. auth 註冊觸發器（handle_new_user）
--   7. ALTER TABLE … ENABLE ROW LEVEL SECURITY
--   8. CREATE POLICY（RLS 政策，依賴第 5 節函式）
--   9. Storage 儲存桶與政策
-- =============================================================================

-- =============================================================================
-- 第 0 節：清除舊物件（全新安裝）
-- =============================================================================

-- 先移除 Storage 政策（storage.objects 不在 public schema，DROP TABLE 不會一併清除）
DROP POLICY IF EXISTS storage_product_images_public_read ON storage.objects;
DROP POLICY IF EXISTS storage_product_images_admin_write ON storage.objects;
DROP POLICY IF EXISTS storage_payment_proofs_insert ON storage.objects;
DROP POLICY IF EXISTS storage_payment_proofs_own_read ON storage.objects;
DROP POLICY IF EXISTS storage_payment_proofs_admin ON storage.objects;
DROP POLICY IF EXISTS storage_avatars_own ON storage.objects;
DROP POLICY IF EXISTS storage_avatars_admin ON storage.objects;

-- 移除 auth 觸發器（避免重複建立）
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

-- 依相依順序刪除資料表（CASCADE 一併移除政策、觸發器）
DROP TABLE IF EXISTS
  line_share_events,
  monster_feed_logs,
  monster_rewards,
  product_share_records,
  monster_profiles,
  monster_game_settings,
  reward_rules,
  commission_payout_items,
  commission_payouts,
  commission_records,
  commission_rules,
  share_clicks,
  share_tracking,
  referrals,
  reward_records,
  user_notifications,
  push_notifications,
  livestream_products,
  livestreams,
  videos,
  articles,
  pickup_records,
  payment_reports,
  order_items,
  orders,
  cart_items,
  carts,
  group_buy_products,
  group_buy_events,
  products,
  product_categories,
  support_messages,
  support_conversations,
  support_tickets,
  audit_logs,
  coupons,
  stores,
  profiles
CASCADE;

-- 刪除自訂 ENUM 型別
DROP TYPE IF EXISTS monster_reward_status CASCADE;
DROP TYPE IF EXISTS monster_share_status CASCADE;
DROP TYPE IF EXISTS commission_payout_status CASCADE;
DROP TYPE IF EXISTS commission_rule_status CASCADE;
DROP TYPE IF EXISTS support_ticket_priority CASCADE;
DROP TYPE IF EXISTS support_ticket_status CASCADE;
DROP TYPE IF EXISTS livestream_status CASCADE;
DROP TYPE IF EXISTS group_buy_status CASCADE;
DROP TYPE IF EXISTS reward_status CASCADE;
DROP TYPE IF EXISTS payment_report_status CASCADE;
DROP TYPE IF EXISTS payout_method CASCADE;
DROP TYPE IF EXISTS commission_record_status CASCADE;
DROP TYPE IF EXISTS commission_source_type CASCADE;
DROP TYPE IF EXISTS commission_calculation_base CASCADE;
DROP TYPE IF EXISTS commission_target_role CASCADE;
DROP TYPE IF EXISTS commission_rule_type CASCADE;
DROP TYPE IF EXISTS order_status CASCADE;
DROP TYPE IF EXISTS user_role CASCADE;

-- 刪除輔助函式（CASCADE 以防仍有遺留政策或其他物件相依）
DROP FUNCTION IF EXISTS decrement_product_stock(UUID, INT) CASCADE;
DROP FUNCTION IF EXISTS handle_new_user() CASCADE;
DROP FUNCTION IF EXISTS user_store_id() CASCADE;
DROP FUNCTION IF EXISTS is_livestream_host() CASCADE;
DROP FUNCTION IF EXISTS is_promoter() CASCADE;
DROP FUNCTION IF EXISTS is_group_leader() CASCADE;
DROP FUNCTION IF EXISTS has_role(user_role) CASCADE;
DROP FUNCTION IF EXISTS is_staff_or_admin() CASCADE;
DROP FUNCTION IF EXISTS is_admin() CASCADE;
DROP FUNCTION IF EXISTS update_updated_at_column() CASCADE;

-- =============================================================================
-- 第 1 節：擴充套件
-- =============================================================================
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- =============================================================================
-- 第 2 節：ENUM 型別
-- =============================================================================

-- 使用者角色
CREATE TYPE user_role AS ENUM (
  'member', 'admin', 'store_staff', 'group_leader', 'promoter', 'livestream_host'
);

-- 訂單狀態
CREATE TYPE order_status AS ENUM (
  'pending', 'awaiting_payment', 'payment_reported', 'payment_confirmed',
  'preparing', 'ready_for_pickup', 'completed', 'cancelled', 'refunded'
);

-- 付款回報狀態
CREATE TYPE payment_report_status AS ENUM ('pending', 'confirmed', 'rejected');

-- 獎勵紀錄狀態
CREATE TYPE reward_status AS ENUM ('pending', 'approved', 'rejected', 'issued');

-- 麵包小怪獸分享狀態
CREATE TYPE monster_share_status AS ENUM ('pending_review', 'approved', 'rejected');

-- 麵包小怪獸獎勵狀態
CREATE TYPE monster_reward_status AS ENUM ('pending_review', 'issued', 'used', 'expired');

-- 團購活動狀態
CREATE TYPE group_buy_status AS ENUM ('draft', 'active', 'ended', 'cancelled');

-- 直播狀態
CREATE TYPE livestream_status AS ENUM ('scheduled', 'live', 'ended', 'cancelled');

-- 客服工單狀態與優先級
CREATE TYPE support_ticket_status AS ENUM ('open', 'in_progress', 'resolved', 'closed');
CREATE TYPE support_ticket_priority AS ENUM ('low', 'medium', 'high');

-- 分潤規則型別
CREATE TYPE commission_rule_type AS ENUM (
  'percentage', 'fixed_order', 'fixed_item', 'tiered_amount', 'tiered_quantity', 'manual'
);

-- 分潤對象角色
CREATE TYPE commission_target_role AS ENUM (
  'member', 'group_leader', 'livestream_host', 'store_staff', 'promoter', 'custom'
);

-- 分潤計算基礎
CREATE TYPE commission_calculation_base AS ENUM (
  'order_paid_amount', 'product_subtotal', 'gross_profit', 'after_discount', 'manual_amount'
);

-- 分潤來源類型
CREATE TYPE commission_source_type AS ENUM (
  'invite_link', 'product_share', 'group_share', 'video_share',
  'livestream_share', 'referral_code', 'manual'
);

-- 分潤紀錄狀態
CREATE TYPE commission_record_status AS ENUM (
  'pending_calculation', 'pending_review', 'approved', 'issued',
  'rejected', 'cancelled', 'clawed_back'
);

-- 分潤發放方式
CREATE TYPE payout_method AS ENUM ('cash', 'store_credit', 'coupon', 'gift');

-- 分潤規則啟用狀態
CREATE TYPE commission_rule_status AS ENUM ('active', 'inactive');

-- 分潤批次發放狀態
CREATE TYPE commission_payout_status AS ENUM ('pending', 'processing', 'completed', 'failed');

-- =============================================================================
-- 第 3 節：觸發器輔助函式（不依賴任何資料表）
-- =============================================================================

-- 自動更新 updated_at 欄位
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- =============================================================================
-- 第 4 節：資料表
-- =============================================================================

-- ---------------------------------------------------------------------------
-- 4.1 使用者資料（profiles）— 延伸 auth.users
-- ---------------------------------------------------------------------------
CREATE TABLE profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT,
  phone TEXT,
  full_name TEXT,
  member_code TEXT UNIQUE NOT NULL DEFAULT encode(gen_random_bytes(4), 'hex'),
  role user_role NOT NULL DEFAULT 'member',
  avatar_url TEXT,
  referrer_user_id UUID REFERENCES profiles(id),
  store_id UUID,
  is_active BOOLEAN NOT NULL DEFAULT true,
  store_credit_balance DECIMAL(12,2) NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_profiles_member_code ON profiles(member_code);
CREATE INDEX idx_profiles_role ON profiles(role);
CREATE INDEX idx_profiles_referrer ON profiles(referrer_user_id);
CREATE INDEX idx_profiles_store ON profiles(store_id);

CREATE TRIGGER profiles_updated_at BEFORE UPDATE ON profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ---------------------------------------------------------------------------
-- 4.2 門市（取貨據點）
-- ---------------------------------------------------------------------------
CREATE TABLE stores (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  address TEXT NOT NULL,
  phone TEXT,
  business_hours TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE profiles ADD CONSTRAINT fk_profiles_store
  FOREIGN KEY (store_id) REFERENCES stores(id);

CREATE TRIGGER stores_updated_at BEFORE UPDATE ON stores
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ---------------------------------------------------------------------------
-- 4.3 商品分類與商品
-- ---------------------------------------------------------------------------
CREATE TABLE product_categories (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  sort_order INT NOT NULL DEFAULT 0,
  icon_emoji TEXT,
  icon_url TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TRIGGER product_categories_updated_at BEFORE UPDATE ON product_categories
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TABLE products (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  category_id UUID REFERENCES product_categories(id),
  name TEXT NOT NULL,
  description TEXT,
  price DECIMAL(12,2) NOT NULL,
  original_price DECIMAL(12,2),
  stock INT NOT NULL DEFAULT 0,
  image_url TEXT,
  images JSONB NOT NULL DEFAULT '[]',
  sku TEXT,
  unit TEXT NOT NULL DEFAULT '件',
  is_active BOOLEAN NOT NULL DEFAULT true,
  disclaimer TEXT NOT NULL DEFAULT '本產品不宣稱任何醫療療效，僅供一般食用參考。',
  expected_arrival_date DATE,
  preorder_deadline TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_products_preorder_deadline ON products(preorder_deadline) WHERE preorder_deadline IS NOT NULL;

CREATE INDEX idx_products_category ON products(category_id);
CREATE INDEX idx_products_active ON products(is_active);
CREATE INDEX idx_products_sku ON products(sku) WHERE sku IS NOT NULL;

CREATE TRIGGER products_updated_at BEFORE UPDATE ON products
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ---------------------------------------------------------------------------
-- 4.4 團購活動與團購商品
-- ---------------------------------------------------------------------------
CREATE TABLE group_buy_events (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title TEXT NOT NULL,
  description TEXT,
  banner_url TEXT,
  banner_aspect_ratio TEXT DEFAULT '16:9',
  is_homepage_featured BOOLEAN NOT NULL DEFAULT false,
  homepage_sort_order INTEGER NOT NULL DEFAULT 0,
  start_at TIMESTAMPTZ NOT NULL,
  end_at TIMESTAMPTZ NOT NULL,
  status group_buy_status NOT NULL DEFAULT 'draft',
  leader_user_id UUID REFERENCES profiles(id),
  store_id UUID REFERENCES stores(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_group_buy_events_status ON group_buy_events(status);
CREATE INDEX idx_group_buy_events_dates ON group_buy_events(start_at, end_at);
CREATE INDEX idx_group_buy_events_leader ON group_buy_events(leader_user_id);
CREATE INDEX idx_group_buy_events_homepage ON group_buy_events (is_homepage_featured, homepage_sort_order)
  WHERE is_homepage_featured = true;

CREATE TRIGGER group_buy_events_updated_at BEFORE UPDATE ON group_buy_events
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TABLE group_buy_products (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  group_buy_event_id UUID NOT NULL REFERENCES group_buy_events(id) ON DELETE CASCADE,
  product_id UUID NOT NULL REFERENCES products(id),
  group_price DECIMAL(12,2) NOT NULL,
  min_quantity INT NOT NULL DEFAULT 1,
  max_quantity INT,
  sold_count INT NOT NULL DEFAULT 0,
  stock_limit INT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(group_buy_event_id, product_id)
);

CREATE INDEX idx_group_buy_products_event ON group_buy_products(group_buy_event_id);
CREATE INDEX idx_group_buy_products_product ON group_buy_products(product_id);

CREATE TRIGGER group_buy_products_updated_at BEFORE UPDATE ON group_buy_products
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ---------------------------------------------------------------------------
-- 4.5 購物車
-- ---------------------------------------------------------------------------
CREATE TABLE carts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(user_id)
);

CREATE TABLE cart_items (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  cart_id UUID NOT NULL REFERENCES carts(id) ON DELETE CASCADE,
  product_id UUID NOT NULL REFERENCES products(id),
  group_buy_product_id UUID REFERENCES group_buy_products(id),
  quantity INT NOT NULL DEFAULT 1 CHECK (quantity > 0),
  locked_price DECIMAL(12,2),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(cart_id, product_id, group_buy_product_id)
);

CREATE INDEX idx_cart_items_cart ON cart_items(cart_id);

CREATE TRIGGER carts_updated_at BEFORE UPDATE ON carts
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER cart_items_updated_at BEFORE UPDATE ON cart_items
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ---------------------------------------------------------------------------
-- 4.6 訂單與訂單明細
-- ---------------------------------------------------------------------------
CREATE TABLE orders (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  order_number TEXT UNIQUE NOT NULL,
  user_id UUID NOT NULL REFERENCES profiles(id),
  store_id UUID REFERENCES stores(id),
  pickup_store_id UUID REFERENCES stores(id),
  group_buy_event_id UUID REFERENCES group_buy_events(id),
  status order_status NOT NULL DEFAULT 'pending',
  subtotal DECIMAL(12,2) NOT NULL DEFAULT 0,
  discount_amount DECIMAL(12,2) NOT NULL DEFAULT 0,
  shipping_fee DECIMAL(12,2) NOT NULL DEFAULT 0,
  store_credit_used DECIMAL(12,2) NOT NULL DEFAULT 0,
  total_amount DECIMAL(12,2) NOT NULL DEFAULT 0,
  referral_code TEXT,
  share_source_type commission_source_type,
  share_source_id TEXT,
  livestream_id UUID,
  referrer_user_id UUID REFERENCES profiles(id),
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_orders_user ON orders(user_id);
CREATE INDEX idx_orders_status ON orders(status);
CREATE INDEX idx_orders_number ON orders(order_number);
CREATE INDEX idx_orders_store ON orders(store_id);
CREATE INDEX idx_orders_group_buy ON orders(group_buy_event_id);

CREATE TRIGGER orders_updated_at BEFORE UPDATE ON orders
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TABLE order_items (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  product_id UUID NOT NULL REFERENCES products(id),
  group_buy_product_id UUID REFERENCES group_buy_products(id),
  product_name TEXT NOT NULL,
  unit_price DECIMAL(12,2) NOT NULL,
  quantity INT NOT NULL CHECK (quantity > 0),
  subtotal DECIMAL(12,2) NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_order_items_order ON order_items(order_id);

CREATE TRIGGER order_items_updated_at BEFORE UPDATE ON order_items
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ---------------------------------------------------------------------------
-- 4.7 付款回報與取貨紀錄
-- ---------------------------------------------------------------------------
CREATE TABLE payment_reports (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  order_id UUID NOT NULL REFERENCES orders(id),
  user_id UUID NOT NULL REFERENCES profiles(id),
  amount DECIMAL(12,2) NOT NULL,
  payment_method TEXT NOT NULL DEFAULT 'bank_transfer',
  last_five_digits TEXT,
  proof_image_url TEXT,
  status payment_report_status NOT NULL DEFAULT 'pending',
  confirmed_by UUID REFERENCES profiles(id),
  confirmed_at TIMESTAMPTZ,
  notes TEXT,
  reject_reason TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_payment_reports_order ON payment_reports(order_id);
CREATE INDEX idx_payment_reports_status ON payment_reports(status);
CREATE INDEX idx_payment_reports_user ON payment_reports(user_id);

CREATE TRIGGER payment_reports_updated_at BEFORE UPDATE ON payment_reports
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TABLE pickup_records (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  order_id UUID NOT NULL REFERENCES orders(id),
  store_id UUID NOT NULL REFERENCES stores(id),
  picked_up_by UUID REFERENCES profiles(id),
  staff_user_id UUID REFERENCES profiles(id),
  picked_up_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  verified_by UUID REFERENCES profiles(id),
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_pickup_records_order ON pickup_records(order_id);
CREATE INDEX idx_pickup_records_store ON pickup_records(store_id);

CREATE TRIGGER pickup_records_updated_at BEFORE UPDATE ON pickup_records
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ---------------------------------------------------------------------------
-- 4.8 影音與直播
-- ---------------------------------------------------------------------------
CREATE TABLE videos (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title TEXT NOT NULL,
  description TEXT,
  video_url TEXT NOT NULL,
  thumbnail_url TEXT,
  product_id UUID REFERENCES products(id),
  view_count INT NOT NULL DEFAULT 0,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_videos_active ON videos(is_active);

CREATE TRIGGER videos_updated_at BEFORE UPDATE ON videos
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TABLE articles (
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

CREATE INDEX idx_articles_status ON articles(status);
CREATE INDEX idx_articles_slug ON articles(slug);
CREATE INDEX idx_articles_sort ON articles(sort_order);

CREATE TRIGGER articles_updated_at BEFORE UPDATE ON articles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TABLE livestreams (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title TEXT NOT NULL,
  description TEXT,
  stream_url TEXT,
  thumbnail_url TEXT,
  host_user_id UUID REFERENCES profiles(id),
  status livestream_status NOT NULL DEFAULT 'scheduled',
  scheduled_at TIMESTAMPTZ,
  started_at TIMESTAMPTZ,
  ended_at TIMESTAMPTZ,
  view_count INT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_livestreams_host ON livestreams(host_user_id);
CREATE INDEX idx_livestreams_status ON livestreams(status);

CREATE TRIGGER livestreams_updated_at BEFORE UPDATE ON livestreams
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TABLE livestream_products (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  livestream_id UUID NOT NULL REFERENCES livestreams(id) ON DELETE CASCADE,
  product_id UUID NOT NULL REFERENCES products(id),
  special_price DECIMAL(12,2),
  sort_order INT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(livestream_id, product_id)
);

CREATE INDEX idx_livestream_products_stream ON livestream_products(livestream_id);

CREATE TRIGGER livestream_products_updated_at BEFORE UPDATE ON livestream_products
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- 補上 orders.livestream_id 外鍵（livestreams 已建立）
ALTER TABLE orders DROP CONSTRAINT IF EXISTS fk_orders_livestream;
ALTER TABLE orders ADD CONSTRAINT fk_orders_livestream
  FOREIGN KEY (livestream_id) REFERENCES livestreams(id);

-- ---------------------------------------------------------------------------
-- 4.9 推播與站內通知
-- ---------------------------------------------------------------------------
CREATE TABLE push_notifications (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title TEXT NOT NULL,
  body TEXT NOT NULL,
  target_role user_role,
  target_user_id UUID REFERENCES profiles(id),
  link TEXT,
  data JSONB NOT NULL DEFAULT '{}',
  sent_at TIMESTAMPTZ,
  created_by UUID REFERENCES profiles(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TRIGGER push_notifications_updated_at BEFORE UPDATE ON push_notifications
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TABLE user_notifications (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  push_notification_id UUID REFERENCES push_notifications(id),
  title TEXT NOT NULL,
  body TEXT NOT NULL,
  link TEXT,
  data JSONB NOT NULL DEFAULT '{}',
  is_read BOOLEAN NOT NULL DEFAULT false,
  read_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_user_notifications_user ON user_notifications(user_id, is_read);

CREATE TRIGGER user_notifications_updated_at BEFORE UPDATE ON user_notifications
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ---------------------------------------------------------------------------
-- 4.10 分享追蹤與推薦
-- ---------------------------------------------------------------------------
CREATE TABLE share_tracking (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  sharer_user_id UUID NOT NULL REFERENCES profiles(id),
  share_type TEXT NOT NULL,
  target_id TEXT NOT NULL,
  ref_code TEXT NOT NULL,
  click_count INT NOT NULL DEFAULT 0,
  signup_count INT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_share_tracking_sharer ON share_tracking(sharer_user_id);
CREATE INDEX idx_share_tracking_ref ON share_tracking(ref_code);

CREATE TRIGGER share_tracking_updated_at BEFORE UPDATE ON share_tracking
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TABLE share_clicks (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  share_tracking_id UUID REFERENCES share_tracking(id),
  sharer_user_id UUID NOT NULL REFERENCES profiles(id),
  clicker_user_id UUID REFERENCES profiles(id),
  share_type TEXT NOT NULL,
  target_id TEXT NOT NULL,
  ref_code TEXT NOT NULL,
  session_id TEXT,
  visitor_id TEXT,
  clicked_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  converted_user_id UUID REFERENCES profiles(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_share_clicks_sharer ON share_clicks(sharer_user_id, clicked_at DESC);
CREATE INDEX idx_share_clicks_ref ON share_clicks(ref_code, clicked_at DESC);

CREATE TABLE referrals (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  referrer_user_id UUID NOT NULL REFERENCES profiles(id),
  referred_user_id UUID NOT NULL REFERENCES profiles(id) UNIQUE,
  referral_code TEXT,
  source_type commission_source_type,
  source_id TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_referrals_referrer ON referrals(referrer_user_id);

CREATE TRIGGER referrals_updated_at BEFORE UPDATE ON referrals
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ---------------------------------------------------------------------------
-- 4.11 獎勵紀錄
-- ---------------------------------------------------------------------------
CREATE TABLE reward_records (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES profiles(id),
  reward_type TEXT NOT NULL,
  amount DECIMAL(12,2) NOT NULL,
  description TEXT,
  status reward_status NOT NULL DEFAULT 'pending',
  source_type TEXT,
  source_id TEXT,
  approved_by UUID REFERENCES profiles(id),
  approved_at TIMESTAMPTZ,
  issued_by UUID REFERENCES profiles(id),
  issued_at TIMESTAMPTZ,
  reject_reason TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_reward_records_user ON reward_records(user_id);
CREATE INDEX idx_reward_records_status ON reward_records(status);

CREATE TRIGGER reward_records_updated_at BEFORE UPDATE ON reward_records
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ---------------------------------------------------------------------------
-- 4.11b 麵包小怪獸（購後分享小遊戲）
-- ---------------------------------------------------------------------------
CREATE TABLE monster_profiles (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL UNIQUE REFERENCES profiles(id) ON DELETE CASCADE,
  monster_name TEXT NOT NULL DEFAULT '麵包小怪獸',
  bread_kg DECIMAL(8,2) NOT NULL DEFAULT 0,
  level INTEGER NOT NULL DEFAULT 1,
  current_stage TEXT NOT NULL DEFAULT 'hungry',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX idx_monster_profiles_user ON monster_profiles(user_id);
CREATE TRIGGER monster_profiles_updated_at BEFORE UPDATE ON monster_profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TABLE reward_rules (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  threshold_kg DECIMAL(8,2) NOT NULL,
  reward_type TEXT NOT NULL,
  reward_name TEXT NOT NULL,
  reward_value TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX idx_reward_rules_threshold ON reward_rules(threshold_kg);
CREATE TRIGGER reward_rules_updated_at BEFORE UPDATE ON reward_rules
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TABLE monster_game_settings (
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
CREATE TRIGGER monster_game_settings_updated_at BEFORE UPDATE ON monster_game_settings
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TABLE product_share_records (
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
CREATE INDEX idx_product_share_records_user ON product_share_records(user_id);
CREATE INDEX idx_product_share_records_status ON product_share_records(status);
CREATE TRIGGER product_share_records_updated_at BEFORE UPDATE ON product_share_records
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TABLE monster_feed_logs (
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
CREATE INDEX idx_monster_feed_logs_user ON monster_feed_logs(user_id);

CREATE TABLE monster_rewards (
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
CREATE INDEX idx_monster_rewards_user ON monster_rewards(user_id);
CREATE INDEX idx_monster_rewards_status ON monster_rewards(status);
CREATE TRIGGER monster_rewards_updated_at BEFORE UPDATE ON monster_rewards
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TABLE line_share_events (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  product_id UUID REFERENCES products(id),
  share_record_id UUID REFERENCES product_share_records(id),
  event_type TEXT NOT NULL,
  raw_payload JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX idx_line_share_events_user ON line_share_events(user_id);

-- ---------------------------------------------------------------------------
-- 4.12 分潤規則、紀錄與發放
-- ---------------------------------------------------------------------------
CREATE TABLE commission_rules (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  rule_type commission_rule_type NOT NULL,
  target_role commission_target_role NOT NULL,
  calculation_base commission_calculation_base NOT NULL DEFAULT 'after_discount',
  percentage_rate DECIMAL(8,4),
  fixed_amount DECIMAL(12,2),
  tiers_json JSONB,
  product_id UUID REFERENCES products(id),
  group_buy_event_id UUID REFERENCES group_buy_events(id),
  livestream_id UUID REFERENCES livestreams(id),
  min_order_amount DECIMAL(12,2) DEFAULT 0,
  max_commission_amount DECIMAL(12,2),
  monthly_cap_amount DECIMAL(12,2),
  total_commission_cap_rate DECIMAL(8,4),
  settlement_wait_days INT NOT NULL DEFAULT 7,
  is_multilevel_enabled BOOLEAN NOT NULL DEFAULT false,
  level_1_rate DECIMAL(8,4),
  level_2_rate DECIMAL(8,4),
  priority INT NOT NULL DEFAULT 100,
  status commission_rule_status NOT NULL DEFAULT 'active',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_commission_rules_status ON commission_rules(status, priority);

CREATE TRIGGER commission_rules_updated_at BEFORE UPDATE ON commission_rules
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TABLE commission_records (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  order_id UUID NOT NULL REFERENCES orders(id),
  order_item_id UUID REFERENCES order_items(id),
  referrer_user_id UUID NOT NULL REFERENCES profiles(id),
  referred_user_id UUID NOT NULL REFERENCES profiles(id),
  commission_rule_id UUID REFERENCES commission_rules(id),
  commission_role commission_target_role NOT NULL,
  source_type commission_source_type NOT NULL,
  source_id TEXT,
  level INT NOT NULL DEFAULT 1 CHECK (level BETWEEN 1 AND 2),
  order_amount DECIMAL(12,2) NOT NULL DEFAULT 0,
  base_amount DECIMAL(12,2) NOT NULL DEFAULT 0,
  commission_rate DECIMAL(8,4),
  commission_amount DECIMAL(12,2) NOT NULL DEFAULT 0,
  status commission_record_status NOT NULL DEFAULT 'pending_calculation',
  reason TEXT,
  reviewed_by UUID REFERENCES profiles(id),
  reviewed_at TIMESTAMPTZ,
  issued_by UUID REFERENCES profiles(id),
  issued_at TIMESTAMPTZ,
  payout_method payout_method,
  payout_note TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_commission_records_referrer ON commission_records(referrer_user_id);
CREATE INDEX idx_commission_records_order ON commission_records(order_id);
CREATE INDEX idx_commission_records_status ON commission_records(status);

CREATE TRIGGER commission_records_updated_at BEFORE UPDATE ON commission_records
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TABLE commission_payouts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES profiles(id),
  total_amount DECIMAL(12,2) NOT NULL,
  payout_method payout_method NOT NULL,
  status commission_payout_status NOT NULL DEFAULT 'pending',
  processed_by UUID REFERENCES profiles(id),
  processed_at TIMESTAMPTZ,
  issued_by UUID REFERENCES profiles(id),
  issued_at TIMESTAMPTZ,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_commission_payouts_user ON commission_payouts(user_id);
CREATE INDEX idx_commission_payouts_status ON commission_payouts(status);

CREATE TRIGGER commission_payouts_updated_at BEFORE UPDATE ON commission_payouts
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TABLE commission_payout_items (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  payout_id UUID NOT NULL REFERENCES commission_payouts(id) ON DELETE CASCADE,
  commission_record_id UUID NOT NULL REFERENCES commission_records(id),
  amount DECIMAL(12,2) NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(payout_id, commission_record_id)
);

CREATE TRIGGER commission_payout_items_updated_at BEFORE UPDATE ON commission_payout_items
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ---------------------------------------------------------------------------
-- 4.13 客服
-- ---------------------------------------------------------------------------
CREATE TABLE support_conversations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES profiles(id),
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'closed')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_support_conversations_user ON support_conversations(user_id);

CREATE TRIGGER support_conversations_updated_at BEFORE UPDATE ON support_conversations
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TABLE support_messages (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  conversation_id UUID NOT NULL REFERENCES support_conversations(id) ON DELETE CASCADE,
  sender_id UUID REFERENCES profiles(id),
  sender_type TEXT NOT NULL DEFAULT 'user' CHECK (sender_type IN ('user', 'bot', 'staff')),
  is_bot BOOLEAN NOT NULL DEFAULT false,
  content TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_support_messages_conversation ON support_messages(conversation_id);

CREATE TABLE support_tickets (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES profiles(id),
  order_id UUID REFERENCES orders(id),
  subject TEXT NOT NULL,
  description TEXT,
  category TEXT NOT NULL DEFAULT 'general',
  status support_ticket_status NOT NULL DEFAULT 'open',
  priority support_ticket_priority NOT NULL DEFAULT 'medium',
  assigned_to UUID REFERENCES profiles(id),
  resolved_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_support_tickets_status ON support_tickets(status);
CREATE INDEX idx_support_tickets_user ON support_tickets(user_id);

CREATE TRIGGER support_tickets_updated_at BEFORE UPDATE ON support_tickets
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ---------------------------------------------------------------------------
-- 4.14 稽核日誌
-- ---------------------------------------------------------------------------
CREATE TABLE audit_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES profiles(id),
  action TEXT NOT NULL,
  entity_type TEXT NOT NULL,
  entity_id TEXT,
  old_data JSONB,
  new_data JSONB,
  details JSONB DEFAULT '{}',
  ip_address TEXT,
  user_agent TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_audit_logs_user ON audit_logs(user_id);
CREATE INDEX idx_audit_logs_entity ON audit_logs(entity_type, entity_id);
CREATE INDEX idx_audit_logs_created ON audit_logs(created_at DESC);

-- ---------------------------------------------------------------------------
-- 4.15 優惠券（預留）
-- ---------------------------------------------------------------------------
CREATE TABLE coupons (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  code TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  discount_type TEXT NOT NULL CHECK (discount_type IN ('percentage', 'fixed')),
  discount_value DECIMAL(12,2) NOT NULL,
  min_order_amount DECIMAL(12,2),
  max_uses INT,
  used_count INT NOT NULL DEFAULT 0,
  valid_from TIMESTAMPTZ,
  valid_until TIMESTAMPTZ,
  expires_at TIMESTAMPTZ,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TRIGGER coupons_updated_at BEFORE UPDATE ON coupons
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- =============================================================================
-- 第 5 節：角色與業務輔助函式（須於 profiles / products 建立後）
-- =============================================================================

-- 檢查是否為管理員
CREATE OR REPLACE FUNCTION is_admin()
RETURNS BOOLEAN AS $$
  SELECT EXISTS (
    SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'
  );
$$ LANGUAGE sql SECURITY DEFINER STABLE SET search_path = public;

-- 檢查是否為門市人員或管理員
CREATE OR REPLACE FUNCTION is_staff_or_admin()
RETURNS BOOLEAN AS $$
  SELECT EXISTS (
    SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin', 'store_staff')
  );
$$ LANGUAGE sql SECURITY DEFINER STABLE SET search_path = public;

-- 檢查是否具備指定角色
CREATE OR REPLACE FUNCTION has_role(required user_role)
RETURNS BOOLEAN AS $$
  SELECT EXISTS (
    SELECT 1 FROM profiles WHERE id = auth.uid() AND role = required
  );
$$ LANGUAGE sql SECURITY DEFINER STABLE SET search_path = public;

-- 各角色捷徑函式
CREATE OR REPLACE FUNCTION is_group_leader()
RETURNS BOOLEAN AS $$ SELECT has_role('group_leader'); $$ LANGUAGE sql SECURITY DEFINER STABLE SET search_path = public;

CREATE OR REPLACE FUNCTION is_promoter()
RETURNS BOOLEAN AS $$ SELECT has_role('promoter'); $$ LANGUAGE sql SECURITY DEFINER STABLE SET search_path = public;

CREATE OR REPLACE FUNCTION is_livestream_host()
RETURNS BOOLEAN AS $$ SELECT has_role('livestream_host'); $$ LANGUAGE sql SECURITY DEFINER STABLE SET search_path = public;

-- 取得目前使用者所屬門市
CREATE OR REPLACE FUNCTION user_store_id()
RETURNS UUID AS $$
  SELECT store_id FROM profiles WHERE id = auth.uid();
$$ LANGUAGE sql SECURITY DEFINER STABLE SET search_path = public;

-- 扣減商品庫存（訂單服務 RPC 使用）
CREATE OR REPLACE FUNCTION decrement_product_stock(p_product_id UUID, p_quantity INT)
RETURNS VOID AS $$
BEGIN
  UPDATE products
  SET stock = GREATEST(0, stock - p_quantity)
  WHERE id = p_product_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- =============================================================================
-- 第 6 節：註冊時自動建立 profile 與購物車
-- =============================================================================
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO profiles (id, email, phone, member_code, full_name)
  VALUES (
    NEW.id,
    NEW.email,
    NEW.phone,
    UPPER(SUBSTRING(REPLACE(NEW.id::TEXT, '-', ''), 1, 8)),
    COALESCE(NEW.raw_user_meta_data->>'full_name', '')
  );
  INSERT INTO carts (user_id) VALUES (NEW.id);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- =============================================================================
-- 第 7 節：啟用 Row Level Security（RLS）
-- =============================================================================
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE stores ENABLE ROW LEVEL SECURITY;
ALTER TABLE product_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE group_buy_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE group_buy_products ENABLE ROW LEVEL SECURITY;
ALTER TABLE carts ENABLE ROW LEVEL SECURITY;
ALTER TABLE cart_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE payment_reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE pickup_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE videos ENABLE ROW LEVEL SECURITY;
ALTER TABLE articles ENABLE ROW LEVEL SECURITY;
ALTER TABLE livestreams ENABLE ROW LEVEL SECURITY;
ALTER TABLE livestream_products ENABLE ROW LEVEL SECURITY;
ALTER TABLE push_notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE share_tracking ENABLE ROW LEVEL SECURITY;
ALTER TABLE share_clicks ENABLE ROW LEVEL SECURITY;
ALTER TABLE referrals ENABLE ROW LEVEL SECURITY;
ALTER TABLE reward_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE monster_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE reward_rules ENABLE ROW LEVEL SECURITY;
ALTER TABLE monster_game_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE product_share_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE monster_feed_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE monster_rewards ENABLE ROW LEVEL SECURITY;
ALTER TABLE line_share_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE commission_rules ENABLE ROW LEVEL SECURITY;
ALTER TABLE commission_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE commission_payouts ENABLE ROW LEVEL SECURITY;
ALTER TABLE commission_payout_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE support_conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE support_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE support_tickets ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE coupons ENABLE ROW LEVEL SECURITY;

-- =============================================================================
-- 第 8 節：RLS 政策（依角色）
-- =============================================================================

-- ---- profiles ----
CREATE POLICY profiles_select_own ON profiles FOR SELECT
  USING (id = auth.uid() OR is_admin() OR is_staff_or_admin());
CREATE POLICY profiles_update_own ON profiles FOR UPDATE
  USING (id = auth.uid());
CREATE POLICY profiles_admin_all ON profiles FOR ALL
  USING (is_admin());

-- ---- 公開目錄（member 與訪客可讀）----
CREATE POLICY stores_public_read ON stores FOR SELECT
  USING (is_active = true OR is_staff_or_admin() OR is_admin());
CREATE POLICY categories_public_read ON product_categories FOR SELECT
  USING (is_active = true OR is_admin());
CREATE POLICY products_public_read ON products FOR SELECT
  USING (is_active = true OR is_admin());
CREATE POLICY group_buy_public_read ON group_buy_events FOR SELECT
  USING (status = 'active' OR is_admin() OR (is_group_leader() AND leader_user_id = auth.uid()));
CREATE POLICY group_buy_products_public_read ON group_buy_products FOR SELECT
  USING (true);
CREATE POLICY videos_public_read ON videos FOR SELECT
  USING (is_active = true OR is_admin());
CREATE POLICY articles_public_read ON articles FOR SELECT
  USING (status = 'published' OR is_admin());
CREATE POLICY livestreams_public_read ON livestreams FOR SELECT
  USING (true);
CREATE POLICY livestream_products_public_read ON livestream_products FOR SELECT
  USING (true);
CREATE POLICY coupons_public_read ON coupons FOR SELECT
  USING (is_active = true OR is_admin());

-- ---- admin 寫入目錄 ----
CREATE POLICY products_admin_write ON products FOR ALL USING (is_admin());
CREATE POLICY categories_admin_write ON product_categories FOR ALL USING (is_admin());
CREATE POLICY group_buy_admin_write ON group_buy_events FOR ALL USING (is_admin());
CREATE POLICY group_buy_products_admin_write ON group_buy_products FOR ALL USING (is_admin());
CREATE POLICY stores_admin_write ON stores FOR ALL USING (is_admin());
CREATE POLICY videos_admin_write ON videos FOR ALL USING (is_admin());
CREATE POLICY articles_admin_write ON articles FOR ALL USING (is_admin());
CREATE POLICY livestreams_admin_write ON livestreams FOR ALL USING (is_admin());
CREATE POLICY livestream_products_admin_write ON livestream_products FOR ALL USING (is_admin());
CREATE POLICY coupons_admin_write ON coupons FOR ALL USING (is_admin());

-- ---- group_leader：管理自己的團購活動 ----
CREATE POLICY group_buy_leader_manage ON group_buy_events FOR ALL
  USING (is_group_leader() AND leader_user_id = auth.uid())
  WITH CHECK (is_group_leader() AND leader_user_id = auth.uid());

-- ---- livestream_host：管理自己的直播 ----
CREATE POLICY livestreams_host_manage ON livestreams FOR ALL
  USING (is_livestream_host() AND host_user_id = auth.uid())
  WITH CHECK (is_livestream_host() AND host_user_id = auth.uid());

-- ---- 購物車（member）----
CREATE POLICY carts_own ON carts FOR ALL USING (user_id = auth.uid());
CREATE POLICY cart_items_own ON cart_items FOR ALL
  USING (cart_id IN (SELECT id FROM carts WHERE user_id = auth.uid()));

-- ---- 訂單 ----
CREATE POLICY orders_own_read ON orders FOR SELECT
  USING (user_id = auth.uid() OR is_staff_or_admin() OR is_admin());
CREATE POLICY orders_own_insert ON orders FOR INSERT
  WITH CHECK (user_id = auth.uid());
CREATE POLICY orders_staff_update ON orders FOR UPDATE
  USING (is_staff_or_admin() OR is_admin());
CREATE POLICY orders_admin_all ON orders FOR ALL
  USING (is_admin());

CREATE POLICY order_items_own_read ON order_items FOR SELECT
  USING (
    order_id IN (SELECT id FROM orders WHERE user_id = auth.uid())
    OR is_staff_or_admin() OR is_admin()
  );
CREATE POLICY order_items_own_insert ON order_items FOR INSERT
  WITH CHECK (order_id IN (SELECT id FROM orders WHERE user_id = auth.uid()));
CREATE POLICY order_items_staff_all ON order_items FOR ALL
  USING (is_staff_or_admin() OR is_admin());

-- ---- 付款回報 ----
CREATE POLICY payment_reports_own_insert ON payment_reports FOR INSERT
  WITH CHECK (user_id = auth.uid());
CREATE POLICY payment_reports_own_read ON payment_reports FOR SELECT
  USING (user_id = auth.uid() OR is_staff_or_admin() OR is_admin());
CREATE POLICY payment_reports_staff_update ON payment_reports FOR UPDATE
  USING (is_staff_or_admin() OR is_admin());

-- ---- 取貨紀錄（store_staff）----
CREATE POLICY pickup_staff ON pickup_records FOR ALL
  USING (
    is_staff_or_admin() OR is_admin()
    OR (has_role('store_staff') AND store_id = user_store_id())
  );

-- ---- 通知 ----
CREATE POLICY notifications_own ON user_notifications FOR ALL
  USING (user_id = auth.uid());
CREATE POLICY push_admin ON push_notifications FOR ALL
  USING (is_admin());

-- ---- 分享與推薦（member / promoter）----
CREATE POLICY share_tracking_own ON share_tracking FOR SELECT
  USING (sharer_user_id = auth.uid() OR is_admin() OR is_promoter());
CREATE POLICY share_tracking_insert ON share_tracking FOR INSERT
  WITH CHECK (sharer_user_id = auth.uid() OR is_promoter());
CREATE POLICY share_clicks_insert ON share_clicks FOR INSERT
  WITH CHECK (true);
CREATE POLICY share_clicks_own_read ON share_clicks FOR SELECT
  USING (sharer_user_id = auth.uid() OR is_admin());
CREATE POLICY referrals_own_read ON referrals FOR SELECT
  USING (
    referrer_user_id = auth.uid()
    OR referred_user_id = auth.uid()
    OR is_admin()
    OR is_promoter()
  );

-- ---- 獎勵 ----
CREATE POLICY rewards_own_read ON reward_records FOR SELECT
  USING (user_id = auth.uid() OR is_admin());
CREATE POLICY rewards_admin_write ON reward_records FOR ALL
  USING (is_admin());

-- ---- 麵包小怪獸 ----
CREATE POLICY monster_profiles_own ON monster_profiles FOR ALL
  USING (user_id = auth.uid() OR is_admin());
CREATE POLICY reward_rules_read ON reward_rules FOR SELECT
  USING (true);
CREATE POLICY reward_rules_admin ON reward_rules FOR ALL
  USING (is_admin());
CREATE POLICY monster_game_settings_read ON monster_game_settings FOR SELECT
  USING (true);
CREATE POLICY monster_game_settings_admin ON monster_game_settings FOR ALL
  USING (is_admin());
CREATE POLICY product_share_records_own ON product_share_records FOR ALL
  USING (user_id = auth.uid() OR is_admin());
CREATE POLICY monster_feed_logs_own ON monster_feed_logs FOR SELECT
  USING (user_id = auth.uid() OR is_admin());
CREATE POLICY monster_feed_logs_insert ON monster_feed_logs FOR INSERT
  WITH CHECK (user_id = auth.uid() OR is_admin());
CREATE POLICY monster_rewards_own ON monster_rewards FOR SELECT
  USING (user_id = auth.uid() OR is_admin());
CREATE POLICY monster_rewards_admin ON monster_rewards FOR ALL
  USING (is_admin());
CREATE POLICY line_share_events_own ON line_share_events FOR ALL
  USING (user_id = auth.uid() OR is_admin());

-- ---- 分潤（member / promoter 可看自己的）----
CREATE POLICY commission_rules_admin ON commission_rules FOR ALL
  USING (is_admin());
CREATE POLICY commission_rules_read ON commission_rules FOR SELECT
  USING (is_admin() OR is_promoter());
CREATE POLICY commission_records_own_read ON commission_records FOR SELECT
  USING (referrer_user_id = auth.uid() OR is_admin() OR is_promoter());
CREATE POLICY commission_records_admin_write ON commission_records FOR ALL
  USING (is_admin());
CREATE POLICY commission_payouts_own_read ON commission_payouts FOR SELECT
  USING (user_id = auth.uid() OR is_admin() OR is_promoter());
CREATE POLICY commission_payouts_admin ON commission_payouts FOR ALL
  USING (is_admin());
CREATE POLICY commission_payout_items_admin ON commission_payout_items FOR ALL
  USING (is_admin());
CREATE POLICY commission_payout_items_own_read ON commission_payout_items FOR SELECT
  USING (
    payout_id IN (SELECT id FROM commission_payouts WHERE user_id = auth.uid())
    OR is_admin()
  );

-- ---- 客服 ----
CREATE POLICY support_conv_own ON support_conversations FOR ALL
  USING (user_id = auth.uid() OR is_staff_or_admin() OR is_admin());
CREATE POLICY support_msg_own ON support_messages FOR ALL
  USING (
    conversation_id IN (SELECT id FROM support_conversations WHERE user_id = auth.uid())
    OR is_staff_or_admin() OR is_admin()
  );
CREATE POLICY support_tickets_own ON support_tickets FOR SELECT
  USING (user_id = auth.uid() OR is_staff_or_admin() OR is_admin());
CREATE POLICY support_tickets_own_insert ON support_tickets FOR INSERT
  WITH CHECK (user_id = auth.uid());
CREATE POLICY support_tickets_staff_update ON support_tickets FOR UPDATE
  USING (is_staff_or_admin() OR is_admin());

-- ---- 稽核日誌（僅 admin）----
CREATE POLICY audit_logs_admin ON audit_logs FOR SELECT
  USING (is_admin());
CREATE POLICY audit_logs_insert ON audit_logs FOR INSERT
  WITH CHECK (auth.uid() IS NOT NULL);

-- =============================================================================
-- 第 9 節：Storage 儲存桶
-- =============================================================================
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES
  ('product-images', 'product-images', true, 5242880, ARRAY['image/jpeg', 'image/png', 'image/webp']),
  ('payment-proofs', 'payment-proofs', false, 10485760, ARRAY['image/jpeg', 'image/png', 'image/webp']),
  ('avatars', 'avatars', false, 2097152, ARRAY['image/jpeg', 'image/png', 'image/webp'])
ON CONFLICT (id) DO NOTHING;

-- 移除舊 Storage 政策（可重複執行）
DROP POLICY IF EXISTS storage_product_images_public_read ON storage.objects;
DROP POLICY IF EXISTS storage_product_images_admin_write ON storage.objects;
DROP POLICY IF EXISTS storage_payment_proofs_insert ON storage.objects;
DROP POLICY IF EXISTS storage_payment_proofs_own_read ON storage.objects;
DROP POLICY IF EXISTS storage_payment_proofs_admin ON storage.objects;
DROP POLICY IF EXISTS storage_avatars_own ON storage.objects;
DROP POLICY IF EXISTS storage_avatars_admin ON storage.objects;

-- Storage 政策：商品圖公開讀取
CREATE POLICY storage_product_images_public_read ON storage.objects FOR SELECT
  USING (bucket_id = 'product-images');
CREATE POLICY storage_product_images_admin_write ON storage.objects FOR ALL
  USING (bucket_id = 'product-images' AND is_admin());

-- Storage 政策：付款證明（使用者上傳、管理員讀取）
CREATE POLICY storage_payment_proofs_insert ON storage.objects FOR INSERT
  WITH CHECK (bucket_id = 'payment-proofs' AND auth.uid() IS NOT NULL);
CREATE POLICY storage_payment_proofs_own_read ON storage.objects FOR SELECT
  USING (bucket_id = 'payment-proofs' AND (auth.uid()::text = (storage.foldername(name))[1] OR is_admin()));
CREATE POLICY storage_payment_proofs_admin ON storage.objects FOR ALL
  USING (bucket_id = 'payment-proofs' AND is_admin());

-- Storage 政策：頭像（使用者管理自己的資料夾）
CREATE POLICY storage_avatars_own ON storage.objects FOR ALL
  USING (bucket_id = 'avatars' AND auth.uid()::text = (storage.foldername(name))[1]);
CREATE POLICY storage_avatars_admin ON storage.objects FOR ALL
  USING (bucket_id = 'avatars' AND is_admin());

-- =============================================================================
-- 完成
-- =============================================================================
-- 執行成功後，可執行 supabase/seed-data.sql 建立範例資料。
