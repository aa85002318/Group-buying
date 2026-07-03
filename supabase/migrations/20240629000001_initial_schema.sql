-- 門市團購 APP - 完整資料庫 Schema
-- Enable extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Helper: updated_at trigger
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- User roles enum
CREATE TYPE user_role AS ENUM (
  'member', 'admin', 'store_staff', 'group_leader', 'promoter', 'livestream_host'
);

CREATE TYPE order_status AS ENUM (
  'pending', 'awaiting_payment', 'payment_reported', 'payment_confirmed',
  'preparing', 'ready_for_pickup', 'completed', 'cancelled', 'refunded'
);

CREATE TYPE commission_rule_type AS ENUM (
  'percentage', 'fixed_order', 'fixed_item', 'tiered_amount', 'tiered_quantity', 'manual'
);

CREATE TYPE commission_target_role AS ENUM (
  'member', 'group_leader', 'livestream_host', 'store_staff', 'promoter', 'custom'
);

CREATE TYPE commission_calculation_base AS ENUM (
  'order_paid_amount', 'product_subtotal', 'gross_profit', 'after_discount', 'manual_amount'
);

CREATE TYPE commission_source_type AS ENUM (
  'invite_link', 'product_share', 'group_share', 'video_share',
  'livestream_share', 'referral_code', 'manual'
);

CREATE TYPE commission_record_status AS ENUM (
  'pending_calculation', 'pending_review', 'approved', 'issued',
  'rejected', 'cancelled', 'clawed_back'
);

CREATE TYPE payout_method AS ENUM ('cash', 'store_credit', 'coupon', 'gift');

-- ============================================
-- 1. Profiles (extends auth.users)
-- ============================================
CREATE TABLE profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT,
  phone TEXT,
  full_name TEXT,
  member_code TEXT UNIQUE NOT NULL,
  role user_role NOT NULL DEFAULT 'member',
  avatar_url TEXT,
  referrer_user_id UUID REFERENCES profiles(id),
  store_id UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_profiles_member_code ON profiles(member_code);
CREATE INDEX idx_profiles_role ON profiles(role);
CREATE INDEX idx_profiles_referrer ON profiles(referrer_user_id);

CREATE TRIGGER profiles_updated_at BEFORE UPDATE ON profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- 2. Stores
-- ============================================
CREATE TABLE stores (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  address TEXT NOT NULL,
  phone TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE profiles ADD CONSTRAINT fk_profiles_store
  FOREIGN KEY (store_id) REFERENCES stores(id);

CREATE TRIGGER stores_updated_at BEFORE UPDATE ON stores
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- 3. Product Categories & Products
-- ============================================
CREATE TABLE product_categories (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  sort_order INT NOT NULL DEFAULT 0,
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
  is_active BOOLEAN NOT NULL DEFAULT true,
  disclaimer TEXT DEFAULT '本產品不宣稱任何醫療療效，僅供一般食用參考。',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_products_category ON products(category_id);
CREATE INDEX idx_products_active ON products(is_active);

CREATE TRIGGER products_updated_at BEFORE UPDATE ON products
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- 4. Group Buy Events
-- ============================================
CREATE TABLE group_buy_events (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title TEXT NOT NULL,
  description TEXT,
  banner_url TEXT,
  start_at TIMESTAMPTZ NOT NULL,
  end_at TIMESTAMPTZ NOT NULL,
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'active', 'ended', 'cancelled')),
  leader_user_id UUID REFERENCES profiles(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_group_buy_events_status ON group_buy_events(status);
CREATE INDEX idx_group_buy_events_dates ON group_buy_events(start_at, end_at);

CREATE TRIGGER group_buy_events_updated_at BEFORE UPDATE ON group_buy_events
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TABLE group_buy_products (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  group_buy_event_id UUID NOT NULL REFERENCES group_buy_events(id) ON DELETE CASCADE,
  product_id UUID NOT NULL REFERENCES products(id),
  special_price DECIMAL(12,2),
  max_quantity INT,
  sold_count INT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(group_buy_event_id, product_id)
);

CREATE INDEX idx_group_buy_products_event ON group_buy_products(group_buy_event_id);

CREATE TRIGGER group_buy_products_updated_at BEFORE UPDATE ON group_buy_products
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- 5. Carts
-- ============================================
CREATE TABLE carts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE UNIQUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE cart_items (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  cart_id UUID NOT NULL REFERENCES carts(id) ON DELETE CASCADE,
  product_id UUID NOT NULL REFERENCES products(id),
  quantity INT NOT NULL DEFAULT 1 CHECK (quantity > 0),
  locked_price DECIMAL(12,2),
  group_buy_event_id UUID REFERENCES group_buy_events(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(cart_id, product_id, group_buy_event_id)
);

CREATE INDEX idx_cart_items_cart ON cart_items(cart_id);

CREATE TRIGGER carts_updated_at BEFORE UPDATE ON carts
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER cart_items_updated_at BEFORE UPDATE ON cart_items
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- 6. Orders
-- ============================================
CREATE TABLE orders (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  order_number TEXT UNIQUE NOT NULL,
  user_id UUID NOT NULL REFERENCES profiles(id),
  store_id UUID REFERENCES stores(id),
  group_buy_event_id UUID REFERENCES group_buy_events(id),
  status order_status NOT NULL DEFAULT 'pending',
  subtotal DECIMAL(12,2) NOT NULL DEFAULT 0,
  discount DECIMAL(12,2) NOT NULL DEFAULT 0,
  shipping_fee DECIMAL(12,2) NOT NULL DEFAULT 0,
  store_credit_used DECIMAL(12,2) NOT NULL DEFAULT 0,
  total_amount DECIMAL(12,2) NOT NULL DEFAULT 0,
  referral_code TEXT,
  share_source_type commission_source_type,
  share_source_id TEXT,
  livestream_id UUID,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_orders_user ON orders(user_id);
CREATE INDEX idx_orders_status ON orders(status);
CREATE INDEX idx_orders_number ON orders(order_number);

CREATE TRIGGER orders_updated_at BEFORE UPDATE ON orders
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TABLE order_items (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  product_id UUID NOT NULL REFERENCES products(id),
  product_name TEXT NOT NULL,
  unit_price DECIMAL(12,2) NOT NULL,
  quantity INT NOT NULL,
  subtotal DECIMAL(12,2) NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_order_items_order ON order_items(order_id);

CREATE TRIGGER order_items_updated_at BEFORE UPDATE ON order_items
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- 7. Payment Reports & Pickup
-- ============================================
CREATE TABLE payment_reports (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  order_id UUID NOT NULL REFERENCES orders(id),
  user_id UUID NOT NULL REFERENCES profiles(id),
  amount DECIMAL(12,2) NOT NULL,
  payment_method TEXT NOT NULL DEFAULT 'bank_transfer',
  last_five_digits TEXT,
  proof_image_url TEXT,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'confirmed', 'rejected')),
  confirmed_by UUID REFERENCES profiles(id),
  confirmed_at TIMESTAMPTZ,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_payment_reports_order ON payment_reports(order_id);
CREATE INDEX idx_payment_reports_status ON payment_reports(status);

CREATE TRIGGER payment_reports_updated_at BEFORE UPDATE ON payment_reports
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TABLE pickup_records (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  order_id UUID NOT NULL REFERENCES orders(id),
  store_id UUID NOT NULL REFERENCES stores(id),
  picked_up_by UUID REFERENCES profiles(id),
  picked_up_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  verified_by UUID REFERENCES profiles(id),
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TRIGGER pickup_records_updated_at BEFORE UPDATE ON pickup_records
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- 8. Videos & Livestreams
-- ============================================
CREATE TABLE videos (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title TEXT NOT NULL,
  description TEXT,
  video_url TEXT NOT NULL,
  thumbnail_url TEXT,
  view_count INT NOT NULL DEFAULT 0,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TRIGGER videos_updated_at BEFORE UPDATE ON videos
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TABLE livestreams (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title TEXT NOT NULL,
  description TEXT,
  stream_url TEXT,
  thumbnail_url TEXT,
  host_user_id UUID REFERENCES profiles(id),
  status TEXT NOT NULL DEFAULT 'scheduled' CHECK (status IN ('scheduled', 'live', 'ended')),
  scheduled_at TIMESTAMPTZ,
  started_at TIMESTAMPTZ,
  ended_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

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

CREATE TRIGGER livestream_products_updated_at BEFORE UPDATE ON livestream_products
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- 9. Notifications
-- ============================================
CREATE TABLE push_notifications (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title TEXT NOT NULL,
  body TEXT NOT NULL,
  target_role user_role,
  target_user_id UUID REFERENCES profiles(id),
  link TEXT,
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
  is_read BOOLEAN NOT NULL DEFAULT false,
  link TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_user_notifications_user ON user_notifications(user_id, is_read);

CREATE TRIGGER user_notifications_updated_at BEFORE UPDATE ON user_notifications
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- 10. Share Tracking & Referrals
-- ============================================
CREATE TABLE share_tracking (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  sharer_user_id UUID NOT NULL REFERENCES profiles(id),
  share_type TEXT NOT NULL,
  target_id TEXT NOT NULL,
  click_count INT NOT NULL DEFAULT 0,
  signup_count INT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_share_tracking_sharer ON share_tracking(sharer_user_id);

CREATE TRIGGER share_tracking_updated_at BEFORE UPDATE ON share_tracking
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TABLE share_clicks (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  sharer_user_id UUID NOT NULL REFERENCES profiles(id),
  clicker_user_id UUID REFERENCES profiles(id),
  share_type TEXT NOT NULL,
  target_id TEXT NOT NULL,
  session_id TEXT,
  clicked_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_share_clicks_sharer ON share_clicks(sharer_user_id, clicked_at DESC);

CREATE TABLE referrals (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  referrer_user_id UUID NOT NULL REFERENCES profiles(id),
  referred_user_id UUID NOT NULL REFERENCES profiles(id) UNIQUE,
  referral_code TEXT,
  source_type commission_source_type,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_referrals_referrer ON referrals(referrer_user_id);

CREATE TRIGGER referrals_updated_at BEFORE UPDATE ON referrals
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- 11. Rewards
-- ============================================
CREATE TABLE reward_records (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES profiles(id),
  reward_type TEXT NOT NULL,
  amount DECIMAL(12,2) NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected', 'issued')),
  source_type TEXT,
  source_id TEXT,
  reviewed_by UUID REFERENCES profiles(id),
  reviewed_at TIMESTAMPTZ,
  issued_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_reward_records_user ON reward_records(user_id);
CREATE INDEX idx_reward_records_status ON reward_records(status);

CREATE TRIGGER reward_records_updated_at BEFORE UPDATE ON reward_records
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- 12. Commission Rules & Records
-- ============================================
CREATE TABLE commission_rules (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  rule_type commission_rule_type NOT NULL,
  target_role commission_target_role NOT NULL,
  calculation_base commission_calculation_base NOT NULL DEFAULT 'product_subtotal',
  percentage_rate DECIMAL(8,4),
  fixed_amount DECIMAL(12,2),
  tiers_json JSONB,
  product_id UUID REFERENCES products(id),
  group_buy_event_id UUID REFERENCES group_buy_events(id),
  livestream_id UUID REFERENCES livestreams(id),
  min_order_amount DECIMAL(12,2),
  max_commission_amount DECIMAL(12,2),
  monthly_cap_amount DECIMAL(12,2),
  total_commission_cap_rate DECIMAL(8,4),
  settlement_wait_days INT NOT NULL DEFAULT 7,
  is_multilevel_enabled BOOLEAN NOT NULL DEFAULT false,
  level_1_rate DECIMAL(8,4),
  level_2_rate DECIMAL(8,4),
  priority INT NOT NULL DEFAULT 100,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'inactive')),
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
  level INT NOT NULL DEFAULT 1,
  order_amount DECIMAL(12,2) NOT NULL,
  base_amount DECIMAL(12,2) NOT NULL,
  commission_rate DECIMAL(8,4),
  commission_amount DECIMAL(12,2) NOT NULL,
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
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'completed', 'failed')),
  processed_by UUID REFERENCES profiles(id),
  processed_at TIMESTAMPTZ,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TRIGGER commission_payouts_updated_at BEFORE UPDATE ON commission_payouts
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TABLE commission_payout_items (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  payout_id UUID NOT NULL REFERENCES commission_payouts(id) ON DELETE CASCADE,
  commission_record_id UUID NOT NULL REFERENCES commission_records(id),
  amount DECIMAL(12,2) NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TRIGGER commission_payout_items_updated_at BEFORE UPDATE ON commission_payout_items
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- 13. Support
-- ============================================
CREATE TABLE support_conversations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES profiles(id),
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'closed')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TRIGGER support_conversations_updated_at BEFORE UPDATE ON support_conversations
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TABLE support_messages (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  conversation_id UUID NOT NULL REFERENCES support_conversations(id) ON DELETE CASCADE,
  sender_id UUID REFERENCES profiles(id),
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
  status TEXT NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'in_progress', 'resolved', 'closed')),
  priority TEXT NOT NULL DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high')),
  assigned_to UUID REFERENCES profiles(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_support_tickets_status ON support_tickets(status);

CREATE TRIGGER support_tickets_updated_at BEFORE UPDATE ON support_tickets
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- 14. Audit Logs
-- ============================================
CREATE TABLE audit_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES profiles(id),
  action TEXT NOT NULL,
  entity_type TEXT NOT NULL,
  entity_id TEXT,
  details JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_audit_logs_user ON audit_logs(user_id);
CREATE INDEX idx_audit_logs_entity ON audit_logs(entity_type, entity_id);
CREATE INDEX idx_audit_logs_created ON audit_logs(created_at DESC);

-- ============================================
-- 15. Coupons (stub)
-- ============================================
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
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TRIGGER coupons_updated_at BEFORE UPDATE ON coupons
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- Auto-create profile on signup
-- ============================================
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO profiles (id, email, phone, member_code, full_name)
  VALUES (
    NEW.id,
    NEW.email,
    NEW.phone,
    UPPER(SUBSTRING(NEW.id::TEXT, 1, 8)),
    COALESCE(NEW.raw_user_meta_data->>'full_name', '')
  );
  INSERT INTO carts (user_id) VALUES (NEW.id);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- ============================================
-- RLS Policies
-- ============================================
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
ALTER TABLE livestreams ENABLE ROW LEVEL SECURITY;
ALTER TABLE livestream_products ENABLE ROW LEVEL SECURITY;
ALTER TABLE push_notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE share_tracking ENABLE ROW LEVEL SECURITY;
ALTER TABLE share_clicks ENABLE ROW LEVEL SECURITY;
ALTER TABLE referrals ENABLE ROW LEVEL SECURITY;
ALTER TABLE reward_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE commission_rules ENABLE ROW LEVEL SECURITY;
ALTER TABLE commission_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE commission_payouts ENABLE ROW LEVEL SECURITY;
ALTER TABLE commission_payout_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE support_conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE support_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE support_tickets ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE coupons ENABLE ROW LEVEL SECURITY;

-- Helper: check admin role
CREATE OR REPLACE FUNCTION is_admin()
RETURNS BOOLEAN AS $$
  SELECT EXISTS (
    SELECT 1 FROM profiles
    WHERE id = auth.uid() AND role IN ('admin', 'store_staff')
  );
$$ LANGUAGE sql SECURITY DEFINER STABLE;

-- Profiles
CREATE POLICY "Users can view own profile" ON profiles FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users can update own profile" ON profiles FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "Admins can view all profiles" ON profiles FOR SELECT USING (is_admin());
CREATE POLICY "Admins can update profiles" ON profiles FOR UPDATE USING (is_admin());

-- Public read for catalog
CREATE POLICY "Anyone can view active products" ON products FOR SELECT USING (is_active = true);
CREATE POLICY "Anyone can view categories" ON product_categories FOR SELECT USING (true);
CREATE POLICY "Anyone can view active group buys" ON group_buy_events FOR SELECT USING (status = 'active');
CREATE POLICY "Anyone can view group buy products" ON group_buy_products FOR SELECT USING (true);
CREATE POLICY "Anyone can view stores" ON stores FOR SELECT USING (is_active = true);
CREATE POLICY "Anyone can view videos" ON videos FOR SELECT USING (is_active = true);
CREATE POLICY "Anyone can view livestreams" ON livestreams FOR SELECT USING (true);
CREATE POLICY "Anyone can view livestream products" ON livestream_products FOR SELECT USING (true);

-- Admin write for catalog
CREATE POLICY "Admins manage products" ON products FOR ALL USING (is_admin());
CREATE POLICY "Admins manage categories" ON product_categories FOR ALL USING (is_admin());
CREATE POLICY "Admins manage group buys" ON group_buy_events FOR ALL USING (is_admin());
CREATE POLICY "Admins manage group buy products" ON group_buy_products FOR ALL USING (is_admin());
CREATE POLICY "Admins manage stores" ON stores FOR ALL USING (is_admin());
CREATE POLICY "Admins manage videos" ON videos FOR ALL USING (is_admin());
CREATE POLICY "Admins manage livestreams" ON livestreams FOR ALL USING (is_admin());

-- Carts
CREATE POLICY "Users manage own cart" ON carts FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Users manage own cart items" ON cart_items FOR ALL
  USING (EXISTS (SELECT 1 FROM carts WHERE carts.id = cart_items.cart_id AND carts.user_id = auth.uid()));

-- Orders
CREATE POLICY "Users view own orders" ON orders FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users create own orders" ON orders FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Admins manage orders" ON orders FOR ALL USING (is_admin());
CREATE POLICY "Users view own order items" ON order_items FOR SELECT
  USING (EXISTS (SELECT 1 FROM orders WHERE orders.id = order_items.order_id AND orders.user_id = auth.uid()));
CREATE POLICY "Users create order items" ON order_items FOR INSERT
  WITH CHECK (EXISTS (SELECT 1 FROM orders WHERE orders.id = order_items.order_id AND orders.user_id = auth.uid()));
CREATE POLICY "Admins manage order items" ON order_items FOR ALL USING (is_admin());

-- Payment reports
CREATE POLICY "Users create payment reports" ON payment_reports FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users view own payment reports" ON payment_reports FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Admins manage payment reports" ON payment_reports FOR ALL USING (is_admin());

-- Notifications
CREATE POLICY "Users view own notifications" ON user_notifications FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users update own notifications" ON user_notifications FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Admins manage push notifications" ON push_notifications FOR ALL USING (is_admin());

-- Share & rewards
CREATE POLICY "Users view own share tracking" ON share_tracking FOR SELECT USING (auth.uid() = sharer_user_id);
CREATE POLICY "Anyone can insert share clicks" ON share_clicks FOR INSERT WITH CHECK (true);
CREATE POLICY "Users view own rewards" ON reward_records FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Admins manage rewards" ON reward_records FOR ALL USING (is_admin());

-- Commissions
CREATE POLICY "Users view own commissions" ON commission_records FOR SELECT USING (auth.uid() = referrer_user_id);
CREATE POLICY "Admins manage commission rules" ON commission_rules FOR ALL USING (is_admin());
CREATE POLICY "Admins manage commission records" ON commission_records FOR ALL USING (is_admin());
CREATE POLICY "Users view own payouts" ON commission_payouts FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Admins manage payouts" ON commission_payouts FOR ALL USING (is_admin());

-- Support
CREATE POLICY "Users manage own conversations" ON support_conversations FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Users manage own messages" ON support_messages FOR ALL
  USING (EXISTS (SELECT 1 FROM support_conversations sc WHERE sc.id = support_messages.conversation_id AND sc.user_id = auth.uid()));
CREATE POLICY "Users create tickets" ON support_tickets FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users view own tickets" ON support_tickets FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Admins manage tickets" ON support_tickets FOR ALL USING (is_admin());

-- Audit logs (admin only)
CREATE POLICY "Admins view audit logs" ON audit_logs FOR SELECT USING (is_admin());
CREATE POLICY "Authenticated insert audit logs" ON audit_logs FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

-- Coupons
CREATE POLICY "Anyone view active coupons" ON coupons FOR SELECT USING (is_active = true);
CREATE POLICY "Admins manage coupons" ON coupons FOR ALL USING (is_admin());
