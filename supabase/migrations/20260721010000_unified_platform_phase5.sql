-- Phase 5: Unified Platform foundations
-- Strategy: products table IS the Product Master (no parallel catalog).
-- Additive only — does not drop or rename Phase 1–4 tables.
-- Self-contained: ensures Product Master columns exist even if earlier hub migrations lag.

-- ---------------------------------------------------------------------------
-- Brands / Suppliers (create if missing — required for master FKs)
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS brands (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  slug TEXT UNIQUE,
  logo_url TEXT,
  description TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS suppliers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  contact_name TEXT,
  contact_phone TEXT,
  contact_email TEXT,
  note TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ---------------------------------------------------------------------------
-- Product Master extensions (products)
-- ---------------------------------------------------------------------------
ALTER TABLE products
  ADD COLUMN IF NOT EXISTS barcode TEXT,
  ADD COLUMN IF NOT EXISTS unit TEXT,
  ADD COLUMN IF NOT EXISTS video_url TEXT,
  ADD COLUMN IF NOT EXISTS subtitle TEXT,
  ADD COLUMN IF NOT EXISTS short_description TEXT,
  ADD COLUMN IF NOT EXISTS brand_id UUID REFERENCES brands(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS supplier_id UUID REFERENCES suppliers(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS supplier_name TEXT,
  ADD COLUMN IF NOT EXISTS specifications TEXT,
  ADD COLUMN IF NOT EXISTS cost_price NUMERIC,
  ADD COLUMN IF NOT EXISTS website_price NUMERIC,
  ADD COLUMN IF NOT EXISTS group_buy_price NUMERIC,
  ADD COLUMN IF NOT EXISTS msrp NUMERIC,
  ADD COLUMN IF NOT EXISTS rich_description TEXT,
  ADD COLUMN IF NOT EXISTS seo_title TEXT,
  ADD COLUMN IF NOT EXISTS seo_description TEXT,
  ADD COLUMN IF NOT EXISTS publish_website BOOLEAN NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS publish_group_buy BOOLEAN NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS publish_store BOOLEAN NOT NULL DEFAULT true;

CREATE INDEX IF NOT EXISTS idx_products_barcode ON products(barcode) WHERE barcode IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_products_sku ON products(sku) WHERE sku IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_products_brand ON products(brand_id);
CREATE INDEX IF NOT EXISTS idx_products_supplier ON products(supplier_id);

-- Compatibility view: Product Master naming for docs / reporting
CREATE OR REPLACE VIEW product_master
WITH (security_invoker = true)
AS
SELECT
  id,
  sku,
  barcode,
  name,
  COALESCE(subtitle, short_description) AS subtitle,
  brand_id,
  category_id,
  supplier_id,
  supplier_name,
  specifications,
  unit,
  cost_price AS cost,
  website_price,
  group_buy_price,
  COALESCE(msrp, original_price) AS suggested_price,
  price AS default_price,
  publish_website,
  publish_group_buy,
  publish_store,
  image_url,
  images,
  video_url,
  description,
  rich_description,
  seo_title,
  seo_description,
  is_active,
  status,
  created_at,
  updated_at
FROM products;

-- ---------------------------------------------------------------------------
-- Product channels (multi-channel visibility)
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS product_channels (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  channel TEXT NOT NULL CHECK (channel IN ('website', 'group_buy', 'store_only', 'hidden')),
  is_enabled BOOLEAN NOT NULL DEFAULT true,
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (product_id, channel)
);

CREATE INDEX IF NOT EXISTS idx_product_channels_channel ON product_channels(channel, is_enabled);

INSERT INTO product_channels (product_id, channel, is_enabled)
SELECT id, 'website', publish_website FROM products
ON CONFLICT (product_id, channel) DO NOTHING;

INSERT INTO product_channels (product_id, channel, is_enabled)
SELECT id, 'group_buy', publish_group_buy FROM products
ON CONFLICT (product_id, channel) DO NOTHING;

INSERT INTO product_channels (product_id, channel, is_enabled)
SELECT id, 'store_only', publish_store FROM products
ON CONFLICT (product_id, channel) DO NOTHING;

-- ---------------------------------------------------------------------------
-- Category tree
-- ---------------------------------------------------------------------------
ALTER TABLE product_categories
  ADD COLUMN IF NOT EXISTS parent_id UUID REFERENCES product_categories(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS banner_url TEXT,
  ADD COLUMN IF NOT EXISTS icon_emoji TEXT,
  ADD COLUMN IF NOT EXISTS icon_url TEXT;

CREATE INDEX IF NOT EXISTS idx_product_categories_parent ON product_categories(parent_id);

-- ---------------------------------------------------------------------------
-- Order channel
-- ---------------------------------------------------------------------------
ALTER TABLE orders
  ADD COLUMN IF NOT EXISTS channel TEXT DEFAULT 'group_buy';

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'orders_channel_check'
  ) THEN
    ALTER TABLE orders
      ADD CONSTRAINT orders_channel_check
      CHECK (channel IS NULL OR channel IN ('website', 'group_buy', 'store_reservation'));
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_orders_channel ON orders(channel);

-- ---------------------------------------------------------------------------
-- Store members (phone-only; NEVER auto-merge with online profiles)
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS store_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  phone TEXT NOT NULL,
  store_member_no TEXT,
  store_id UUID REFERENCES stores(id) ON DELETE SET NULL,
  source TEXT NOT NULL DEFAULT 'store' CHECK (source IN ('store', 'import', 'manual', 'other')),
  notes TEXT,
  matched_profile_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  match_noted_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT store_members_phone_format CHECK (phone ~ '^[0-9+\- ]{8,20}$')
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_store_members_phone_store
  ON store_members (phone, (COALESCE(store_id, '00000000-0000-0000-0000-000000000000'::uuid)));

CREATE INDEX IF NOT EXISTS idx_store_members_phone ON store_members(phone);

-- ---------------------------------------------------------------------------
-- Store inventory / batches / anomalies / returns / disposals / reservations
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS store_inventory (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  store_id UUID NOT NULL REFERENCES stores(id) ON DELETE CASCADE,
  product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  quantity NUMERIC NOT NULL DEFAULT 0,
  unit TEXT,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (store_id, product_id)
);

CREATE TABLE IF NOT EXISTS store_batches (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  store_id UUID NOT NULL REFERENCES stores(id) ON DELETE CASCADE,
  product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  batch_no TEXT NOT NULL,
  expiry_date DATE,
  quantity NUMERIC NOT NULL DEFAULT 0,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_store_batches_expiry ON store_batches(expiry_date);

CREATE TABLE IF NOT EXISTS store_anomalies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  store_id UUID NOT NULL REFERENCES stores(id) ON DELETE CASCADE,
  product_id UUID REFERENCES products(id) ON DELETE SET NULL,
  batch_id UUID REFERENCES store_batches(id) ON DELETE SET NULL,
  anomaly_type TEXT NOT NULL CHECK (anomaly_type IN ('expiry', 'damage', 'shortage', 'surplus', 'other')),
  description TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'processing', 'resolved', 'closed')),
  reported_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS store_returns (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  store_id UUID NOT NULL REFERENCES stores(id) ON DELETE CASCADE,
  product_id UUID NOT NULL REFERENCES products(id) ON DELETE RESTRICT,
  batch_id UUID REFERENCES store_batches(id) ON DELETE SET NULL,
  quantity NUMERIC NOT NULL,
  reason TEXT,
  status TEXT NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'approved', 'rejected', 'completed')),
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS store_disposals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  store_id UUID NOT NULL REFERENCES stores(id) ON DELETE CASCADE,
  product_id UUID NOT NULL REFERENCES products(id) ON DELETE RESTRICT,
  batch_id UUID REFERENCES store_batches(id) ON DELETE SET NULL,
  quantity NUMERIC NOT NULL,
  reason TEXT,
  status TEXT NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'approved', 'completed')),
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS store_reservations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  store_id UUID NOT NULL REFERENCES stores(id) ON DELETE CASCADE,
  product_id UUID NOT NULL REFERENCES products(id) ON DELETE RESTRICT,
  store_member_id UUID REFERENCES store_members(id) ON DELETE SET NULL,
  customer_phone TEXT NOT NULL,
  quantity NUMERIC NOT NULL DEFAULT 1,
  status TEXT NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending', 'ready', 'picked_up', 'cancelled')),
  notes TEXT,
  order_id UUID REFERENCES orders(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_store_reservations_phone ON store_reservations(customer_phone);

-- ---------------------------------------------------------------------------
-- CMS pages + homepage blocks + store announcements
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS cms_pages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug TEXT NOT NULL UNIQUE,
  title TEXT NOT NULL,
  content TEXT,
  is_published BOOLEAN NOT NULL DEFAULT false,
  seo_title TEXT,
  seo_description TEXT,
  updated_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS homepage_blocks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  block_key TEXT NOT NULL UNIQUE,
  title TEXT NOT NULL,
  is_visible BOOLEAN NOT NULL DEFAULT true,
  sort_order INTEGER NOT NULL DEFAULT 0,
  config JSONB DEFAULT '{}'::jsonb,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

INSERT INTO homepage_blocks (block_key, title, sort_order) VALUES
  ('new_products', '今日新品', 10),
  ('hot_products', '熱門商品', 20),
  ('articles', '最新文章', 30),
  ('courses', '最新課程', 40),
  ('livestreams', '直播預告', 50),
  ('store_announcements', '門市公告', 60),
  ('campaigns', '活動公告', 70)
ON CONFLICT (block_key) DO NOTHING;

CREATE TABLE IF NOT EXISTS store_announcements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  store_id UUID REFERENCES stores(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  body TEXT NOT NULL,
  is_active BOOLEAN NOT NULL DEFAULT true,
  starts_at TIMESTAMPTZ,
  ends_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ---------------------------------------------------------------------------
-- Role permissions (granular CRUD matrix)
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS role_permissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  role TEXT NOT NULL,
  resource TEXT NOT NULL,
  can_create BOOLEAN NOT NULL DEFAULT false,
  can_read BOOLEAN NOT NULL DEFAULT true,
  can_update BOOLEAN NOT NULL DEFAULT false,
  can_delete BOOLEAN NOT NULL DEFAULT false,
  UNIQUE (role, resource)
);

INSERT INTO role_permissions (role, resource, can_create, can_read, can_update, can_delete) VALUES
  ('admin', 'products', true, true, true, true),
  ('admin', 'orders', true, true, true, true),
  ('admin', 'store', true, true, true, true),
  ('admin', 'cms', true, true, true, true),
  ('admin', 'members', true, true, true, true),
  ('store_staff', 'store', true, true, true, false),
  ('store_staff', 'orders', false, true, true, false),
  ('store_staff', 'products', false, true, false, false),
  ('content_editor', 'cms', true, true, true, false),
  ('content_editor', 'articles', true, true, true, true),
  ('customer_service', 'orders', false, true, true, false),
  ('customer_service', 'members', false, true, false, false),
  ('warehouse', 'store', true, true, true, false),
  ('warehouse', 'products', false, true, true, false),
  ('livestream_manager', 'livestreams', true, true, true, true),
  ('course_manager', 'courses', true, true, true, true)
ON CONFLICT (role, resource) DO NOTHING;

-- ---------------------------------------------------------------------------
-- Triggers
-- ---------------------------------------------------------------------------
DROP TRIGGER IF EXISTS set_updated_at ON store_members;
CREATE TRIGGER set_updated_at BEFORE UPDATE ON store_members
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS set_updated_at ON store_batches;
CREATE TRIGGER set_updated_at BEFORE UPDATE ON store_batches
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS set_updated_at ON store_anomalies;
CREATE TRIGGER set_updated_at BEFORE UPDATE ON store_anomalies
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS set_updated_at ON store_returns;
CREATE TRIGGER set_updated_at BEFORE UPDATE ON store_returns
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS set_updated_at ON store_disposals;
CREATE TRIGGER set_updated_at BEFORE UPDATE ON store_disposals
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS set_updated_at ON store_reservations;
CREATE TRIGGER set_updated_at BEFORE UPDATE ON store_reservations
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS set_updated_at ON cms_pages;
CREATE TRIGGER set_updated_at BEFORE UPDATE ON cms_pages
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS set_updated_at ON store_announcements;
CREATE TRIGGER set_updated_at BEFORE UPDATE ON store_announcements
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ---------------------------------------------------------------------------
-- RLS
-- ---------------------------------------------------------------------------
ALTER TABLE brands ENABLE ROW LEVEL SECURITY;
ALTER TABLE suppliers ENABLE ROW LEVEL SECURITY;
ALTER TABLE product_channels ENABLE ROW LEVEL SECURITY;
ALTER TABLE store_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE store_inventory ENABLE ROW LEVEL SECURITY;
ALTER TABLE store_batches ENABLE ROW LEVEL SECURITY;
ALTER TABLE store_anomalies ENABLE ROW LEVEL SECURITY;
ALTER TABLE store_returns ENABLE ROW LEVEL SECURITY;
ALTER TABLE store_disposals ENABLE ROW LEVEL SECURITY;
ALTER TABLE store_reservations ENABLE ROW LEVEL SECURITY;
ALTER TABLE cms_pages ENABLE ROW LEVEL SECURITY;
ALTER TABLE homepage_blocks ENABLE ROW LEVEL SECURITY;
ALTER TABLE store_announcements ENABLE ROW LEVEL SECURITY;
ALTER TABLE role_permissions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS brands_public_read ON brands;
CREATE POLICY brands_public_read ON brands FOR SELECT USING (is_active = true);
DROP POLICY IF EXISTS brands_admin ON brands;
CREATE POLICY brands_admin ON brands FOR ALL
  USING (EXISTS (SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.role = 'admin'));

DROP POLICY IF EXISTS suppliers_admin ON suppliers;
CREATE POLICY suppliers_admin ON suppliers FOR ALL
  USING (EXISTS (SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.role = 'admin'));

DROP POLICY IF EXISTS product_channels_public_read ON product_channels;
CREATE POLICY product_channels_public_read ON product_channels
  FOR SELECT USING (is_enabled = true AND channel <> 'hidden');

DROP POLICY IF EXISTS product_channels_admin ON product_channels;
CREATE POLICY product_channels_admin ON product_channels FOR ALL
  USING (EXISTS (SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.role IN ('admin', 'store_staff')));

DROP POLICY IF EXISTS store_members_staff ON store_members;
CREATE POLICY store_members_staff ON store_members FOR ALL
  USING (EXISTS (SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.role IN ('admin', 'store_staff')));

DROP POLICY IF EXISTS store_inventory_staff ON store_inventory;
CREATE POLICY store_inventory_staff ON store_inventory FOR ALL
  USING (EXISTS (SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.role IN ('admin', 'store_staff')));

DROP POLICY IF EXISTS store_batches_staff ON store_batches;
CREATE POLICY store_batches_staff ON store_batches FOR ALL
  USING (EXISTS (SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.role IN ('admin', 'store_staff')));

DROP POLICY IF EXISTS store_anomalies_staff ON store_anomalies;
CREATE POLICY store_anomalies_staff ON store_anomalies FOR ALL
  USING (EXISTS (SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.role IN ('admin', 'store_staff')));

DROP POLICY IF EXISTS store_returns_staff ON store_returns;
CREATE POLICY store_returns_staff ON store_returns FOR ALL
  USING (EXISTS (SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.role IN ('admin', 'store_staff')));

DROP POLICY IF EXISTS store_disposals_staff ON store_disposals;
CREATE POLICY store_disposals_staff ON store_disposals FOR ALL
  USING (EXISTS (SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.role IN ('admin', 'store_staff')));

DROP POLICY IF EXISTS store_reservations_staff ON store_reservations;
CREATE POLICY store_reservations_staff ON store_reservations FOR ALL
  USING (EXISTS (SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.role IN ('admin', 'store_staff')));

DROP POLICY IF EXISTS cms_pages_public_read ON cms_pages;
CREATE POLICY cms_pages_public_read ON cms_pages FOR SELECT USING (is_published = true);

DROP POLICY IF EXISTS cms_pages_admin ON cms_pages;
CREATE POLICY cms_pages_admin ON cms_pages FOR ALL
  USING (EXISTS (SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.role = 'admin'));

DROP POLICY IF EXISTS homepage_blocks_public_read ON homepage_blocks;
CREATE POLICY homepage_blocks_public_read ON homepage_blocks FOR SELECT USING (true);

DROP POLICY IF EXISTS homepage_blocks_admin ON homepage_blocks;
CREATE POLICY homepage_blocks_admin ON homepage_blocks FOR ALL
  USING (EXISTS (SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.role = 'admin'));

DROP POLICY IF EXISTS store_announcements_public_read ON store_announcements;
CREATE POLICY store_announcements_public_read ON store_announcements
  FOR SELECT USING (is_active = true);

DROP POLICY IF EXISTS store_announcements_admin ON store_announcements;
CREATE POLICY store_announcements_admin ON store_announcements FOR ALL
  USING (EXISTS (SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.role IN ('admin', 'store_staff')));

DROP POLICY IF EXISTS role_permissions_admin_read ON role_permissions;
CREATE POLICY role_permissions_admin_read ON role_permissions FOR SELECT
  USING (EXISTS (SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.role = 'admin'));
