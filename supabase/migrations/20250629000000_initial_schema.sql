-- 門市團購 APP - Initial Schema
-- Enable extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Enums
CREATE TYPE user_role AS ENUM ('member', 'admin', 'store_staff', 'group_leader', 'promoter', 'livestream_host');
CREATE TYPE order_status AS ENUM ('pending', 'awaiting_payment', 'paid', 'preparing', 'ready_for_pickup', 'completed', 'cancelled', 'refunded');
CREATE TYPE payment_report_status AS ENUM ('pending', 'confirmed', 'rejected');
CREATE TYPE commission_rule_type AS ENUM ('percentage', 'fixed_order', 'fixed_item', 'tiered_amount', 'tiered_quantity', 'manual');
CREATE TYPE commission_target_role AS ENUM ('member', 'group_leader', 'livestream_host', 'store_staff', 'promoter', 'custom');
CREATE TYPE commission_calculation_base AS ENUM ('order_paid_amount', 'product_subtotal', 'gross_profit', 'after_discount', 'manual_amount');
CREATE TYPE commission_source_type AS ENUM ('invite_link', 'product_share', 'group_share', 'video_share', 'livestream_share', 'referral_code', 'manual');
CREATE TYPE commission_record_status AS ENUM ('pending_calculation', 'pending_review', 'approved', 'issued', 'rejected', 'cancelled', 'clawed_back');
CREATE TYPE commission_payout_method AS ENUM ('cash', 'store_credit', 'coupon', 'gift');
CREATE TYPE reward_status AS ENUM ('pending', 'approved', 'rejected', 'issued');
CREATE TYPE support_ticket_status AS ENUM ('open', 'in_progress', 'resolved', 'closed');
CREATE TYPE livestream_status AS ENUM ('scheduled', 'live', 'ended', 'cancelled');
CREATE TYPE group_buy_status AS ENUM ('draft', 'active', 'ended', 'cancelled');

-- Updated_at trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Profiles (extends auth.users)
CREATE TABLE profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT,
  phone TEXT,
  full_name TEXT,
  avatar_url TEXT,
  member_code TEXT UNIQUE NOT NULL DEFAULT encode(gen_random_bytes(4), 'hex'),
  role user_role NOT NULL DEFAULT 'member',
  referrer_user_id UUID REFERENCES profiles(id),
  store_id UUID,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX idx_profiles_member_code ON profiles(member_code);
CREATE INDEX idx_profiles_role ON profiles(role);
CREATE INDEX idx_profiles_referrer ON profiles(referrer_user_id);

-- Stores
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
ALTER TABLE profiles ADD CONSTRAINT fk_profiles_store FOREIGN KEY (store_id) REFERENCES stores(id);

-- Product categories
CREATE TABLE product_categories (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  sort_order INT NOT NULL DEFAULT 0,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Products
CREATE TABLE products (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  category_id UUID REFERENCES product_categories(id),
  name TEXT NOT NULL,
  description TEXT,
  price DECIMAL(12,2) NOT NULL,
  original_price DECIMAL(12,2),
  stock INT NOT NULL DEFAULT 0,
  image_url TEXT,
  images JSONB DEFAULT '[]',
  sku TEXT,
  unit TEXT DEFAULT '件',
  is_active BOOLEAN NOT NULL DEFAULT true,
  disclaimer TEXT DEFAULT '本產品資訊僅供參考，不構成醫療建議。',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX idx_products_category ON products(category_id);
CREATE INDEX idx_products_active ON products(is_active);

-- Group buy events
CREATE TABLE group_buy_events (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title TEXT NOT NULL,
  description TEXT,
  banner_url TEXT,
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

-- Group buy products
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

-- Carts
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

-- Orders
CREATE TABLE orders (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  order_number TEXT UNIQUE NOT NULL,
  user_id UUID NOT NULL REFERENCES profiles(id),
  store_id UUID REFERENCES stores(id),
  group_buy_event_id UUID REFERENCES group_buy_events(id),
  status order_status NOT NULL DEFAULT 'pending',
  subtotal DECIMAL(12,2) NOT NULL DEFAULT 0,
  discount_amount DECIMAL(12,2) NOT NULL DEFAULT 0,
  store_credit_used DECIMAL(12,2) NOT NULL DEFAULT 0,
  shipping_fee DECIMAL(12,2) NOT NULL DEFAULT 0,
  total_amount DECIMAL(12,2) NOT NULL DEFAULT 0,
  referral_code TEXT,
  share_source_type commission_source_type,
  share_source_id TEXT,
  livestream_id UUID,
  referrer_user_id UUID REFERENCES profiles(id),
  pickup_store_id UUID REFERENCES stores(id),
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX idx_orders_user ON orders(user_id);
CREATE INDEX idx_orders_status ON orders(status);
CREATE INDEX idx_orders_number ON orders(order_number);

CREATE TABLE order_items (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  product_id UUID NOT NULL REFERENCES products(id),
  group_buy_product_id UUID REFERENCES group_buy_products(id),
  product_name TEXT NOT NULL,
  quantity INT NOT NULL,
  unit_price DECIMAL(12,2) NOT NULL,
  subtotal DECIMAL(12,2) NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX idx_order_items_order ON order_items(order_id);

-- Payment reports
CREATE TABLE payment_reports (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  order_id UUID NOT NULL REFERENCES orders(id),
  user_id UUID NOT NULL REFERENCES profiles(id),
  amount DECIMAL(12,2) NOT NULL,
  payment_method TEXT,
  last_five_digits TEXT,
  proof_image_url TEXT,
  status payment_report_status NOT NULL DEFAULT 'pending',
  confirmed_by UUID REFERENCES profiles(id),
  confirmed_at TIMESTAMPTZ,
  reject_reason TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX idx_payment_reports_order ON payment_reports(order_id);
CREATE INDEX idx_payment_reports_status ON payment_reports(status);

-- Pickup records
CREATE TABLE pickup_records (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  order_id UUID NOT NULL REFERENCES orders(id),
  store_id UUID NOT NULL REFERENCES stores(id),
  picked_up_by UUID REFERENCES profiles(id),
  staff_user_id UUID REFERENCES profiles(id),
  picked_up_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Videos
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

-- Livestreams
CREATE TABLE livestreams (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title TEXT NOT NULL,
  description TEXT,
  host_user_id UUID REFERENCES profiles(id),
  stream_url TEXT,
  thumbnail_url TEXT,
  scheduled_at TIMESTAMPTZ,
  started_at TIMESTAMPTZ,
  ended_at TIMESTAMPTZ,
  status livestream_status NOT NULL DEFAULT 'scheduled',
  view_count INT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE livestream_products (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  livestream_id UUID NOT NULL REFERENCES livestreams(id) ON DELETE CASCADE,
  product_id UUID NOT NULL REFERENCES products(id),
  special_price DECIMAL(12,2),
  sort_order INT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Push notifications
CREATE TABLE push_notifications (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title TEXT NOT NULL,
  body TEXT NOT NULL,
  target_role user_role,
  target_user_id UUID REFERENCES profiles(id),
  data JSONB DEFAULT '{}',
  sent_at TIMESTAMPTZ,
  created_by UUID REFERENCES profiles(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE user_notifications (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  push_notification_id UUID REFERENCES push_notifications(id),
  title TEXT NOT NULL,
  body TEXT NOT NULL,
  data JSONB DEFAULT '{}',
  is_read BOOLEAN NOT NULL DEFAULT false,
  read_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX idx_user_notifications_user ON user_notifications(user_id, is_read);

-- Share tracking
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
CREATE INDEX idx_share_tracking_ref ON share_tracking(ref_code);
CREATE INDEX idx_share_tracking_sharer ON share_tracking(sharer_user_id);

CREATE TABLE share_clicks (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  share_tracking_id UUID REFERENCES share_tracking(id),
  sharer_user_id UUID NOT NULL REFERENCES profiles(id),
  share_type TEXT NOT NULL,
  target_id TEXT NOT NULL,
  ref_code TEXT NOT NULL,
  visitor_id TEXT,
  clicked_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  converted_user_id UUID REFERENCES profiles(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX idx_share_clicks_ref ON share_clicks(ref_code, clicked_at DESC);

CREATE TABLE referrals (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  referrer_user_id UUID NOT NULL REFERENCES profiles(id),
  referred_user_id UUID NOT NULL REFERENCES profiles(id) UNIQUE,
  source_type commission_source_type NOT NULL,
  source_id TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Reward records
CREATE TABLE reward_records (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES profiles(id),
  reward_type TEXT NOT NULL,
  amount DECIMAL(12,2) NOT NULL DEFAULT 0,
  description TEXT,
  source_type TEXT,
  source_id TEXT,
  status reward_status NOT NULL DEFAULT 'pending',
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

-- Commission rules (exact fields per spec)
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
  status TEXT NOT NULL DEFAULT 'active',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX idx_commission_rules_priority ON commission_rules(priority, status);

-- Commission records (exact fields per spec)
CREATE TABLE commission_records (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  order_id UUID REFERENCES orders(id),
  order_item_id UUID REFERENCES order_items(id),
  referrer_user_id UUID NOT NULL REFERENCES profiles(id),
  referred_user_id UUID REFERENCES profiles(id),
  commission_rule_id UUID REFERENCES commission_rules(id),
  commission_role commission_target_role NOT NULL,
  source_type commission_source_type NOT NULL,
  source_id TEXT,
  level INT NOT NULL DEFAULT 1,
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
  payout_method commission_payout_method,
  payout_note TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX idx_commission_records_referrer ON commission_records(referrer_user_id);
CREATE INDEX idx_commission_records_order ON commission_records(order_id);
CREATE INDEX idx_commission_records_status ON commission_records(status);

CREATE TABLE commission_payouts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES profiles(id),
  total_amount DECIMAL(12,2) NOT NULL,
  payout_method commission_payout_method NOT NULL,
  notes TEXT,
  issued_by UUID REFERENCES profiles(id),
  issued_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE commission_payout_items (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  payout_id UUID NOT NULL REFERENCES commission_payouts(id) ON DELETE CASCADE,
  commission_record_id UUID NOT NULL REFERENCES commission_records(id),
  amount DECIMAL(12,2) NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Support
CREATE TABLE support_conversations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES profiles(id),
  status TEXT NOT NULL DEFAULT 'active',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE support_messages (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  conversation_id UUID NOT NULL REFERENCES support_conversations(id) ON DELETE CASCADE,
  sender_type TEXT NOT NULL CHECK (sender_type IN ('user', 'bot', 'staff')),
  sender_id UUID REFERENCES profiles(id),
  content TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE support_tickets (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES profiles(id),
  order_id UUID REFERENCES orders(id),
  subject TEXT NOT NULL,
  description TEXT NOT NULL,
  category TEXT NOT NULL DEFAULT 'general',
  status support_ticket_status NOT NULL DEFAULT 'open',
  assigned_to UUID REFERENCES profiles(id),
  resolved_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX idx_support_tickets_status ON support_tickets(status);

-- Coupons (stub)
CREATE TABLE coupons (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  code TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  discount_type TEXT NOT NULL DEFAULT 'fixed',
  discount_value DECIMAL(12,2) NOT NULL,
  min_order_amount DECIMAL(12,2) DEFAULT 0,
  max_uses INT,
  used_count INT NOT NULL DEFAULT 0,
  expires_at TIMESTAMPTZ,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Audit logs
CREATE TABLE audit_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES profiles(id),
  action TEXT NOT NULL,
  entity_type TEXT NOT NULL,
  entity_id TEXT,
  old_data JSONB,
  new_data JSONB,
  ip_address TEXT,
  user_agent TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX idx_audit_logs_entity ON audit_logs(entity_type, entity_id);
CREATE INDEX idx_audit_logs_user ON audit_logs(user_id);
CREATE INDEX idx_audit_logs_created ON audit_logs(created_at DESC);

-- Apply updated_at triggers
DO $$
DECLARE t TEXT;
BEGIN
  FOR t IN SELECT unnest(ARRAY[
    'profiles','stores','product_categories','products','group_buy_events','group_buy_products',
    'carts','cart_items','orders','order_items','payment_reports','pickup_records',
    'videos','livestreams','livestream_products','push_notifications','user_notifications',
    'share_tracking','referrals','reward_records','commission_rules','commission_records',
    'commission_payouts','commission_payout_items','support_conversations','support_tickets',
    'coupons'
  ]) LOOP
    EXECUTE format('CREATE TRIGGER set_updated_at BEFORE UPDATE ON %I FOR EACH ROW EXECUTE FUNCTION update_updated_at_column()', t);
  END LOOP;
END $$;

-- Auto-create profile on signup
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO profiles (id, email, phone, full_name)
  VALUES (
    NEW.id,
    NEW.email,
    NEW.phone,
    COALESCE(NEW.raw_user_meta_data->>'full_name', '')
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- Helper: check user role
CREATE OR REPLACE FUNCTION is_admin()
RETURNS BOOLEAN AS $$
  SELECT EXISTS (
    SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'
  );
$$ LANGUAGE sql SECURITY DEFINER STABLE;

CREATE OR REPLACE FUNCTION is_staff_or_admin()
RETURNS BOOLEAN AS $$
  SELECT EXISTS (
    SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin', 'store_staff')
  );
$$ LANGUAGE sql SECURITY DEFINER STABLE;

-- RLS
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
ALTER TABLE coupons ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;

-- Profiles policies
CREATE POLICY profiles_select_own ON profiles FOR SELECT USING (id = auth.uid() OR is_admin());
CREATE POLICY profiles_update_own ON profiles FOR UPDATE USING (id = auth.uid());
CREATE POLICY profiles_admin_all ON profiles FOR ALL USING (is_admin());

-- Public read for catalog
CREATE POLICY stores_public_read ON stores FOR SELECT USING (is_active = true OR is_staff_or_admin());
CREATE POLICY categories_public_read ON product_categories FOR SELECT USING (is_active = true OR is_admin());
CREATE POLICY products_public_read ON products FOR SELECT USING (is_active = true OR is_admin());
CREATE POLICY products_admin_write ON products FOR ALL USING (is_admin());

CREATE POLICY group_buy_public_read ON group_buy_events FOR SELECT USING (status = 'active' OR is_admin());
CREATE POLICY group_buy_admin_write ON group_buy_events FOR ALL USING (is_admin());
CREATE POLICY group_buy_products_public_read ON group_buy_products FOR SELECT USING (true);
CREATE POLICY group_buy_products_admin_write ON group_buy_products FOR ALL USING (is_admin());

-- Cart policies
CREATE POLICY carts_own ON carts FOR ALL USING (user_id = auth.uid());
CREATE POLICY cart_items_own ON cart_items FOR ALL USING (
  cart_id IN (SELECT id FROM carts WHERE user_id = auth.uid())
);

-- Orders policies
CREATE POLICY orders_own_read ON orders FOR SELECT USING (user_id = auth.uid() OR is_staff_or_admin());
CREATE POLICY orders_own_insert ON orders FOR INSERT WITH CHECK (user_id = auth.uid());
CREATE POLICY orders_staff_update ON orders FOR UPDATE USING (is_staff_or_admin());

CREATE POLICY order_items_own_read ON order_items FOR SELECT USING (
  order_id IN (SELECT id FROM orders WHERE user_id = auth.uid()) OR is_staff_or_admin()
);

-- Payment reports
CREATE POLICY payment_reports_own_insert ON payment_reports FOR INSERT WITH CHECK (user_id = auth.uid());
CREATE POLICY payment_reports_own_read ON payment_reports FOR SELECT USING (user_id = auth.uid() OR is_staff_or_admin());
CREATE POLICY payment_reports_staff_update ON payment_reports FOR UPDATE USING (is_staff_or_admin());

-- Videos & livestreams public read
CREATE POLICY videos_public_read ON videos FOR SELECT USING (is_active = true OR is_admin());
CREATE POLICY videos_admin_write ON videos FOR ALL USING (is_admin());
CREATE POLICY livestreams_public_read ON livestreams FOR SELECT USING (true);
CREATE POLICY livestreams_admin_write ON livestreams FOR ALL USING (is_admin());
CREATE POLICY livestream_products_public_read ON livestream_products FOR SELECT USING (true);

-- Notifications
CREATE POLICY notifications_own ON user_notifications FOR ALL USING (user_id = auth.uid());
CREATE POLICY push_admin ON push_notifications FOR ALL USING (is_admin());

-- Share & rewards
CREATE POLICY share_tracking_own ON share_tracking FOR SELECT USING (sharer_user_id = auth.uid() OR is_admin());
CREATE POLICY share_tracking_insert ON share_tracking FOR INSERT WITH CHECK (sharer_user_id = auth.uid());
CREATE POLICY share_clicks_insert ON share_clicks FOR INSERT WITH CHECK (true);
CREATE POLICY referrals_own_read ON referrals FOR SELECT USING (referrer_user_id = auth.uid() OR referred_user_id = auth.uid() OR is_admin());

CREATE POLICY rewards_own_read ON reward_records FOR SELECT USING (user_id = auth.uid() OR is_admin());
CREATE POLICY rewards_admin_write ON reward_records FOR ALL USING (is_admin());

-- Commission
CREATE POLICY commission_rules_admin ON commission_rules FOR ALL USING (is_admin());
CREATE POLICY commission_rules_read ON commission_rules FOR SELECT USING (is_admin());
CREATE POLICY commission_records_own_read ON commission_records FOR SELECT USING (referrer_user_id = auth.uid() OR is_admin());
CREATE POLICY commission_records_admin_write ON commission_records FOR ALL USING (is_admin());
CREATE POLICY commission_payouts_admin ON commission_payouts FOR ALL USING (is_admin());
CREATE POLICY commission_payouts_own_read ON commission_payouts FOR SELECT USING (user_id = auth.uid() OR is_admin());

-- Support
CREATE POLICY support_conv_own ON support_conversations FOR ALL USING (user_id = auth.uid() OR is_staff_or_admin());
CREATE POLICY support_msg_own ON support_messages FOR ALL USING (
  conversation_id IN (SELECT id FROM support_conversations WHERE user_id = auth.uid()) OR is_staff_or_admin()
);
CREATE POLICY support_tickets_own ON support_tickets FOR SELECT USING (user_id = auth.uid() OR is_staff_or_admin());
CREATE POLICY support_tickets_own_insert ON support_tickets FOR INSERT WITH CHECK (user_id = auth.uid());
CREATE POLICY support_tickets_staff_update ON support_tickets FOR UPDATE USING (is_staff_or_admin());

-- Audit logs admin only
CREATE POLICY audit_logs_admin ON audit_logs FOR SELECT USING (is_admin());
CREATE POLICY audit_logs_insert ON audit_logs FOR INSERT WITH CHECK (true);

-- Coupons public read active
CREATE POLICY coupons_public_read ON coupons FOR SELECT USING (is_active = true OR is_admin());
CREATE POLICY coupons_admin_write ON coupons FOR ALL USING (is_admin());

-- Pickup records
CREATE POLICY pickup_staff ON pickup_records FOR ALL USING (is_staff_or_admin());
