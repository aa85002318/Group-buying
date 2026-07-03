-- Core five modules: auth, products, cart/checkout, orders, pickup QR
-- Safe to re-run (IF NOT EXISTS)

-- ---------------------------------------------------------------------------
-- profiles
-- ---------------------------------------------------------------------------
ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS store_id UUID REFERENCES stores(id);

CREATE INDEX IF NOT EXISTS idx_profiles_role ON profiles(role);

-- ---------------------------------------------------------------------------
-- product_categories
-- ---------------------------------------------------------------------------
ALTER TABLE product_categories
  ADD COLUMN IF NOT EXISTS is_active BOOLEAN NOT NULL DEFAULT true;

CREATE INDEX IF NOT EXISTS idx_product_categories_active ON product_categories(is_active);

-- ---------------------------------------------------------------------------
-- products — extended fields (status alongside is_active)
-- ---------------------------------------------------------------------------
ALTER TABLE products
  ADD COLUMN IF NOT EXISTS slug TEXT,
  ADD COLUMN IF NOT EXISTS short_description TEXT,
  ADD COLUMN IF NOT EXISTS sale_price DECIMAL(12,2),
  ADD COLUMN IF NOT EXISTS status TEXT NOT NULL DEFAULT 'active',
  ADD COLUMN IF NOT EXISTS sort_order INT NOT NULL DEFAULT 0;

CREATE INDEX IF NOT EXISTS idx_products_status ON products(status);
CREATE INDEX IF NOT EXISTS idx_products_category_id ON products(category_id);

UPDATE products SET status = CASE
  WHEN stock <= 0 THEN 'sold_out'
  WHEN is_active = false THEN 'inactive'
  ELSE 'active'
END
WHERE status IS NULL OR status = 'active';

-- ---------------------------------------------------------------------------
-- orders — customer contact fields
-- ---------------------------------------------------------------------------
ALTER TABLE orders
  ADD COLUMN IF NOT EXISTS customer_name TEXT,
  ADD COLUMN IF NOT EXISTS customer_phone TEXT,
  ADD COLUMN IF NOT EXISTS customer_email TEXT,
  ADD COLUMN IF NOT EXISTS payment_method TEXT DEFAULT 'store_payment';

CREATE INDEX IF NOT EXISTS idx_orders_user_id ON orders(user_id);
CREATE INDEX IF NOT EXISTS idx_orders_pickup_store_id ON orders(pickup_store_id);
CREATE INDEX IF NOT EXISTS idx_orders_payment_status ON orders(payment_status);
CREATE INDEX IF NOT EXISTS idx_orders_pickup_status ON orders(pickup_status);

-- ---------------------------------------------------------------------------
-- order_items
-- ---------------------------------------------------------------------------
ALTER TABLE order_items
  ADD COLUMN IF NOT EXISTS product_image_url TEXT;

CREATE INDEX IF NOT EXISTS idx_order_items_order_id ON order_items(order_id);

-- ---------------------------------------------------------------------------
-- stores
-- ---------------------------------------------------------------------------
CREATE INDEX IF NOT EXISTS idx_stores_active ON stores(is_active);

-- ---------------------------------------------------------------------------
-- pickup_logs — extend action enum values (scan, invalid_token, etc.)
-- ---------------------------------------------------------------------------
DO $$ BEGIN
  ALTER TYPE pickup_log_action ADD VALUE IF NOT EXISTS 'scan';
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;
DO $$ BEGIN
  ALTER TYPE pickup_log_action ADD VALUE IF NOT EXISTS 'already_picked_up';
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;
DO $$ BEGIN
  ALTER TYPE pickup_log_action ADD VALUE IF NOT EXISTS 'invalid_token';
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- ---------------------------------------------------------------------------
-- RLS: products status for public read
-- ---------------------------------------------------------------------------
DROP POLICY IF EXISTS products_public_read ON products;
CREATE POLICY products_public_read ON products FOR SELECT
  USING (is_active = true AND (status IS NULL OR status IN ('active')));

-- member profile self
DROP POLICY IF EXISTS profiles_self_select ON profiles;
CREATE POLICY profiles_self_select ON profiles FOR SELECT TO authenticated
  USING (id = auth.uid() OR public.is_admin());

DROP POLICY IF EXISTS profiles_self_update ON profiles;
CREATE POLICY profiles_self_update ON profiles FOR UPDATE TO authenticated
  USING (id = auth.uid())
  WITH CHECK (id = auth.uid());
