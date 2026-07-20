-- Admin Product Hub: extended product fields, brands, suppliers, inventory, analytics, reports

-- ---------------------------------------------------------------------------
-- Brands & Suppliers
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS brands (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  slug TEXT UNIQUE,
  logo_url TEXT,
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
-- Extend products
-- ---------------------------------------------------------------------------
ALTER TABLE products
  ADD COLUMN IF NOT EXISTS subtitle TEXT,
  ADD COLUMN IF NOT EXISTS brand_id UUID REFERENCES brands(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS supplier_id UUID REFERENCES suppliers(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS live_price DECIMAL(12,2),
  ADD COLUMN IF NOT EXISTS vip_price DECIMAL(12,2),
  ADD COLUMN IF NOT EXISTS gross_margin DECIMAL(12,2),
  ADD COLUMN IF NOT EXISTS seo_title TEXT,
  ADD COLUMN IF NOT EXISTS seo_description TEXT,
  ADD COLUMN IF NOT EXISTS seo_keywords TEXT,
  ADD COLUMN IF NOT EXISTS slug TEXT,
  ADD COLUMN IF NOT EXISTS tags JSONB NOT NULL DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS is_featured BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS is_hot BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS is_new BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS is_weekly_pick BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS is_closing_soon BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS inventory_mode TEXT NOT NULL DEFAULT 'stock'
    CHECK (inventory_mode IN ('stock', 'preorder', 'both')),
  ADD COLUMN IF NOT EXISTS preorder_stock INT NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS safety_stock INT NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS min_stock_alert INT NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS preorder_note TEXT,
  ADD COLUMN IF NOT EXISTS auto_deduct_stock BOOLEAN NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS allow_oversell BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS temp_ambient BOOLEAN NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS temp_chilled BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS temp_frozen BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS ship_home BOOLEAN NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS ship_cvs BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS ship_store_pickup BOOLEAN NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS weight_grams INT,
  ADD COLUMN IF NOT EXISTS dimensions TEXT,
  ADD COLUMN IF NOT EXISTS rich_description TEXT,
  ADD COLUMN IF NOT EXISTS view_count INT NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS favorite_count INT NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS cart_add_count INT NOT NULL DEFAULT 0;

CREATE INDEX IF NOT EXISTS idx_products_brand ON products(brand_id);
CREATE INDEX IF NOT EXISTS idx_products_supplier ON products(supplier_id);
CREATE INDEX IF NOT EXISTS idx_products_slug ON products(slug) WHERE slug IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_products_featured ON products(is_featured) WHERE is_featured = true;
CREATE INDEX IF NOT EXISTS idx_products_status ON products(status);

-- Auto-generate SKU if missing
CREATE OR REPLACE FUNCTION generate_product_sku()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.sku IS NULL OR TRIM(NEW.sku) = '' THEN
    NEW.sku := 'SKU-' || UPPER(SUBSTRING(REPLACE(NEW.id::text, '-', ''), 1, 8));
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS products_auto_sku ON products;
CREATE TRIGGER products_auto_sku
  BEFORE INSERT ON products
  FOR EACH ROW EXECUTE FUNCTION generate_product_sku();

-- Product ↔ Category many-to-many
CREATE TABLE IF NOT EXISTS product_category_links (
  product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  category_id UUID NOT NULL REFERENCES product_categories(id) ON DELETE CASCADE,
  sort_order INT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (product_id, category_id)
);

CREATE INDEX IF NOT EXISTS idx_product_category_links_category ON product_category_links(category_id);

-- Product videos
CREATE TABLE IF NOT EXISTS product_videos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  title TEXT,
  url TEXT NOT NULL,
  video_type TEXT NOT NULL DEFAULT 'youtube' CHECK (video_type IN ('youtube', 'mp4')),
  cover_url TEXT,
  sort_order INT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_product_videos_product ON product_videos(product_id);

-- Product variants (specs)
CREATE TABLE IF NOT EXISTS product_variants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  value TEXT NOT NULL,
  price_adjustment DECIMAL(12,2) NOT NULL DEFAULT 0,
  stock INT,
  sort_order INT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_product_variants_product ON product_variants(product_id);

-- Product batches (lot management)
CREATE TABLE IF NOT EXISTS product_batches (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  batch_number TEXT NOT NULL,
  expiry_date DATE,
  arrival_date DATE,
  supplier_id UUID REFERENCES suppliers(id) ON DELETE SET NULL,
  quantity INT NOT NULL DEFAULT 0,
  note TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_product_batches_product ON product_batches(product_id);

-- Inventory logs
CREATE TABLE IF NOT EXISTS inventory_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  change_type TEXT NOT NULL CHECK (change_type IN ('sale', 'restock', 'adjustment', 'return', 'preorder')),
  quantity_change INT NOT NULL,
  stock_before INT NOT NULL DEFAULT 0,
  stock_after INT NOT NULL DEFAULT 0,
  reference_type TEXT,
  reference_id UUID,
  note TEXT,
  created_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_inventory_logs_product ON inventory_logs(product_id);
CREATE INDEX IF NOT EXISTS idx_inventory_logs_created ON inventory_logs(created_at DESC);

-- Product analytics (daily rollup per product)
CREATE TABLE IF NOT EXISTS product_analytics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  sold_quantity INT NOT NULL DEFAULT 0,
  revenue DECIMAL(14,2) NOT NULL DEFAULT 0,
  gross_profit DECIMAL(14,2) NOT NULL DEFAULT 0,
  return_quantity INT NOT NULL DEFAULT 0,
  view_count INT NOT NULL DEFAULT 0,
  cart_add_count INT NOT NULL DEFAULT 0,
  favorite_count INT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(product_id, date)
);

CREATE INDEX IF NOT EXISTS idx_product_analytics_date ON product_analytics(date DESC);

-- Daily reports
CREATE TABLE IF NOT EXISTS reports_daily (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  report_date DATE NOT NULL UNIQUE,
  order_count INT NOT NULL DEFAULT 0,
  revenue DECIMAL(14,2) NOT NULL DEFAULT 0,
  gross_profit DECIMAL(14,2) NOT NULL DEFAULT 0,
  return_count INT NOT NULL DEFAULT 0,
  return_amount DECIMAL(14,2) NOT NULL DEFAULT 0,
  new_customers INT NOT NULL DEFAULT 0,
  avg_order_value DECIMAL(12,2) NOT NULL DEFAULT 0,
  items_sold INT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Monthly reports
CREATE TABLE IF NOT EXISTS reports_monthly (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  year_month TEXT NOT NULL UNIQUE,
  order_count INT NOT NULL DEFAULT 0,
  revenue DECIMAL(14,2) NOT NULL DEFAULT 0,
  gross_profit DECIMAL(14,2) NOT NULL DEFAULT 0,
  return_count INT NOT NULL DEFAULT 0,
  new_customers INT NOT NULL DEFAULT 0,
  avg_order_value DECIMAL(12,2) NOT NULL DEFAULT 0,
  items_sold INT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Customer statistics
CREATE TABLE IF NOT EXISTS customer_statistics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE UNIQUE,
  gender TEXT CHECK (gender IN ('male', 'female', 'unknown')),
  age_group TEXT CHECK (age_group IN ('18-24', '25-34', '35-44', '45-54', '55+')),
  city TEXT,
  district TEXT,
  member_level TEXT,
  total_orders INT NOT NULL DEFAULT 0,
  total_spent DECIMAL(14,2) NOT NULL DEFAULT 0,
  avg_order_value DECIMAL(12,2) NOT NULL DEFAULT 0,
  last_order_at TIMESTAMPTZ,
  favorite_product_ids JSONB NOT NULL DEFAULT '[]'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_customer_statistics_city ON customer_statistics(city);

-- RLS
ALTER TABLE brands ENABLE ROW LEVEL SECURITY;
ALTER TABLE suppliers ENABLE ROW LEVEL SECURITY;
ALTER TABLE product_category_links ENABLE ROW LEVEL SECURITY;
ALTER TABLE product_videos ENABLE ROW LEVEL SECURITY;
ALTER TABLE product_variants ENABLE ROW LEVEL SECURITY;
ALTER TABLE product_batches ENABLE ROW LEVEL SECURITY;
ALTER TABLE inventory_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE product_analytics ENABLE ROW LEVEL SECURITY;
ALTER TABLE reports_daily ENABLE ROW LEVEL SECURITY;
ALTER TABLE reports_monthly ENABLE ROW LEVEL SECURITY;
ALTER TABLE customer_statistics ENABLE ROW LEVEL SECURITY;

-- Public read for brands (storefront may use)
DROP POLICY IF EXISTS brands_public_read ON brands;
CREATE POLICY brands_public_read ON brands FOR SELECT USING (is_active = true);

DROP POLICY IF EXISTS brands_admin_all ON brands;
CREATE POLICY brands_admin_all ON brands FOR ALL
  USING (EXISTS (SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.role = 'admin'));

DROP POLICY IF EXISTS suppliers_admin_all ON suppliers;
CREATE POLICY suppliers_admin_all ON suppliers FOR ALL
  USING (EXISTS (SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.role = 'admin'));

DROP POLICY IF EXISTS product_category_links_public_read ON product_category_links;
CREATE POLICY product_category_links_public_read ON product_category_links FOR SELECT USING (true);

DROP POLICY IF EXISTS product_category_links_admin_write ON product_category_links;
CREATE POLICY product_category_links_admin_write ON product_category_links FOR ALL
  USING (EXISTS (SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.role = 'admin'));

DROP POLICY IF EXISTS product_videos_public_read ON product_videos;
CREATE POLICY product_videos_public_read ON product_videos FOR SELECT USING (true);

DROP POLICY IF EXISTS product_videos_admin_write ON product_videos;
CREATE POLICY product_videos_admin_write ON product_videos FOR ALL
  USING (EXISTS (SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.role = 'admin'));

DROP POLICY IF EXISTS product_variants_public_read ON product_variants;
CREATE POLICY product_variants_public_read ON product_variants FOR SELECT USING (true);

DROP POLICY IF EXISTS product_variants_admin_write ON product_variants;
CREATE POLICY product_variants_admin_write ON product_variants FOR ALL
  USING (EXISTS (SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.role = 'admin'));

DROP POLICY IF EXISTS product_batches_admin_all ON product_batches;
CREATE POLICY product_batches_admin_all ON product_batches FOR ALL
  USING (EXISTS (SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.role = 'admin'));

DROP POLICY IF EXISTS inventory_logs_admin_all ON inventory_logs;
CREATE POLICY inventory_logs_admin_all ON inventory_logs FOR ALL
  USING (EXISTS (SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.role = 'admin'));

DROP POLICY IF EXISTS product_analytics_admin_all ON product_analytics;
CREATE POLICY product_analytics_admin_all ON product_analytics FOR ALL
  USING (EXISTS (SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.role = 'admin'));

DROP POLICY IF EXISTS reports_daily_admin_all ON reports_daily;
CREATE POLICY reports_daily_admin_all ON reports_daily FOR ALL
  USING (EXISTS (SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.role = 'admin'));

DROP POLICY IF EXISTS reports_monthly_admin_all ON reports_monthly;
CREATE POLICY reports_monthly_admin_all ON reports_monthly FOR ALL
  USING (EXISTS (SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.role = 'admin'));

DROP POLICY IF EXISTS customer_statistics_admin_all ON customer_statistics;
CREATE POLICY customer_statistics_admin_all ON customer_statistics FOR ALL
  USING (EXISTS (SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.role = 'admin'));
