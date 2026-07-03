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
