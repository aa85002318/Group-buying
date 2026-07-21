-- Baking Materials Catalog Center
-- Extends existing product_categories / products / brands; creates missing hub tables.
-- Safe to re-run. Does NOT drop or truncate existing product/order/cart data.

-- ---------------------------------------------------------------------------
-- 1. catalog_roots
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.catalog_roots (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  description TEXT,
  image_url TEXT,
  icon_key TEXT,
  sort_order INTEGER NOT NULL DEFAULT 0,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

DROP TRIGGER IF EXISTS set_updated_at ON public.catalog_roots;
CREATE TRIGGER set_updated_at
  BEFORE UPDATE ON public.catalog_roots
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

INSERT INTO public.catalog_roots (name, slug, description, icon_key, sort_order)
VALUES ('烘焙材料', 'baking-materials', '原料、器具、包裝一次購足', 'package', 10)
ON CONFLICT (slug) DO UPDATE SET name = EXCLUDED.name, description = EXCLUDED.description;

-- ---------------------------------------------------------------------------
-- 2. Extend product_categories (tree under catalog root)
-- ---------------------------------------------------------------------------
ALTER TABLE public.product_categories
  ADD COLUMN IF NOT EXISTS catalog_root_id UUID REFERENCES public.catalog_roots(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS description TEXT,
  ADD COLUMN IF NOT EXISTS icon_key TEXT,
  ADD COLUMN IF NOT EXISTS level SMALLINT NOT NULL DEFAULT 1,
  ADD COLUMN IF NOT EXISTS path TEXT,
  ADD COLUMN IF NOT EXISTS seo_title TEXT,
  ADD COLUMN IF NOT EXISTS seo_description TEXT;

CREATE INDEX IF NOT EXISTS idx_product_categories_catalog
  ON public.product_categories (catalog_root_id);
CREATE INDEX IF NOT EXISTS idx_product_categories_parent
  ON public.product_categories (parent_id);
CREATE INDEX IF NOT EXISTS idx_product_categories_path
  ON public.product_categories (path);
CREATE INDEX IF NOT EXISTS idx_product_categories_active_sort
  ON public.product_categories (is_active, sort_order);

-- Unique slug per parent within a catalog (nullable parent → treat as sentinel)
CREATE UNIQUE INDEX IF NOT EXISTS uq_product_categories_catalog_parent_slug
  ON public.product_categories (
    catalog_root_id,
    COALESCE(parent_id, '00000000-0000-0000-0000-000000000000'::uuid),
    slug
  );

-- ---------------------------------------------------------------------------
-- 3. brands extensions
-- ---------------------------------------------------------------------------
ALTER TABLE public.brands
  ADD COLUMN IF NOT EXISTS country TEXT,
  ADD COLUMN IF NOT EXISTS sort_order INTEGER NOT NULL DEFAULT 0;

CREATE INDEX IF NOT EXISTS idx_brands_active_sort ON public.brands (is_active, sort_order);

-- ---------------------------------------------------------------------------
-- 4. products extensions (keep existing stock / category_id for cart/orders)
-- ---------------------------------------------------------------------------
ALTER TABLE public.products
  ADD COLUMN IF NOT EXISTS primary_category_id UUID REFERENCES public.product_categories(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS product_type TEXT NOT NULL DEFAULT 'standard',
  ADD COLUMN IF NOT EXISTS storage_type TEXT NOT NULL DEFAULT 'ambient',
  ADD COLUMN IF NOT EXISTS min_price NUMERIC(12,2),
  ADD COLUMN IF NOT EXISTS max_price NUMERIC(12,2),
  ADD COLUMN IF NOT EXISTS search_keywords TEXT[] DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS published_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS is_featured BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS is_hot BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS is_new BOOLEAN NOT NULL DEFAULT false;

DO $$ BEGIN
  ALTER TABLE public.products
    ADD CONSTRAINT products_storage_type_check
    CHECK (storage_type IN ('ambient', 'chilled', 'frozen'));
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- Backfill primary_category_id from legacy category_id
UPDATE public.products
SET primary_category_id = category_id
WHERE primary_category_id IS NULL AND category_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_products_primary_category ON public.products (primary_category_id);
CREATE INDEX IF NOT EXISTS idx_products_storage_type ON public.products (storage_type);
CREATE INDEX IF NOT EXISTS idx_products_published ON public.products (status, published_at DESC NULLS LAST);
CREATE INDEX IF NOT EXISTS idx_products_min_price ON public.products (min_price);
CREATE INDEX IF NOT EXISTS idx_products_is_new ON public.products (is_new) WHERE is_new = true;
CREATE INDEX IF NOT EXISTS idx_products_is_hot ON public.products (is_hot) WHERE is_hot = true;

-- ---------------------------------------------------------------------------
-- 5. product_category_links (M2M + primary flag)
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.product_category_links (
  product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  category_id UUID NOT NULL REFERENCES public.product_categories(id) ON DELETE CASCADE,
  is_primary BOOLEAN NOT NULL DEFAULT false,
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (product_id, category_id)
);

CREATE INDEX IF NOT EXISTS idx_product_category_links_category
  ON public.product_category_links (category_id, product_id);

CREATE UNIQUE INDEX IF NOT EXISTS uq_product_category_links_one_primary
  ON public.product_category_links (product_id)
  WHERE is_primary = true;

-- Backfill links from products.category_id
INSERT INTO public.product_category_links (product_id, category_id, is_primary, sort_order)
SELECT id, category_id, true, 0
FROM public.products
WHERE category_id IS NOT NULL
ON CONFLICT (product_id, category_id) DO NOTHING;

-- ---------------------------------------------------------------------------
-- 6. product_images
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.product_images (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  image_url TEXT NOT NULL,
  alt_text TEXT,
  sort_order INTEGER NOT NULL DEFAULT 0,
  is_cover BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_product_images_product ON public.product_images (product_id);
CREATE UNIQUE INDEX IF NOT EXISTS uq_product_images_one_cover
  ON public.product_images (product_id)
  WHERE is_cover = true;

-- ---------------------------------------------------------------------------
-- 7. product_variants (create if missing; extend columns)
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.product_variants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  value TEXT,
  price_adjustment NUMERIC(12,2) NOT NULL DEFAULT 0,
  stock INTEGER,
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.product_variants
  ADD COLUMN IF NOT EXISTS sku TEXT,
  ADD COLUMN IF NOT EXISTS option_values JSONB NOT NULL DEFAULT '{}'::jsonb,
  ADD COLUMN IF NOT EXISTS price NUMERIC(12,2),
  ADD COLUMN IF NOT EXISTS sale_price NUMERIC(12,2),
  ADD COLUMN IF NOT EXISTS cost_price NUMERIC(12,2),
  ADD COLUMN IF NOT EXISTS weight_grams INTEGER,
  ADD COLUMN IF NOT EXISTS barcode TEXT,
  ADD COLUMN IF NOT EXISTS is_default BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS is_active BOOLEAN NOT NULL DEFAULT true;

CREATE INDEX IF NOT EXISTS idx_product_variants_product ON public.product_variants (product_id);
CREATE UNIQUE INDEX IF NOT EXISTS uq_product_variants_sku
  ON public.product_variants (sku) WHERE sku IS NOT NULL;
CREATE UNIQUE INDEX IF NOT EXISTS uq_product_variants_one_default
  ON public.product_variants (product_id) WHERE is_default = true;

DROP TRIGGER IF EXISTS set_updated_at ON public.product_variants;
CREATE TRIGGER set_updated_at
  BEFORE UPDATE ON public.product_variants
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ---------------------------------------------------------------------------
-- 8. inventory (per variant; products.stock remains for legacy cart)
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.inventory (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  variant_id UUID NOT NULL REFERENCES public.product_variants(id) ON DELETE CASCADE,
  location_id UUID,
  quantity INTEGER NOT NULL DEFAULT 0 CHECK (quantity >= 0),
  reserved_quantity INTEGER NOT NULL DEFAULT 0 CHECK (reserved_quantity >= 0),
  safety_stock INTEGER NOT NULL DEFAULT 0 CHECK (safety_stock >= 0),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_inventory_variant ON public.inventory (variant_id);
CREATE UNIQUE INDEX IF NOT EXISTS uq_inventory_variant_default_location
  ON public.inventory (variant_id) WHERE location_id IS NULL;
CREATE UNIQUE INDEX IF NOT EXISTS uq_inventory_variant_location
  ON public.inventory (variant_id, location_id) WHERE location_id IS NOT NULL;

DROP TRIGGER IF EXISTS set_updated_at ON public.inventory;
CREATE TRIGGER set_updated_at
  BEFORE UPDATE ON public.inventory
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ---------------------------------------------------------------------------
-- 9. tags / product_tags
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.tags (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE,
  slug TEXT NOT NULL UNIQUE,
  color TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.product_tags (
  product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  tag_id UUID NOT NULL REFERENCES public.tags(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (product_id, tag_id)
);

CREATE INDEX IF NOT EXISTS idx_product_tags_tag ON public.product_tags (tag_id, product_id);

INSERT INTO public.tags (name, slug, color) VALUES
  ('新品', 'new', '#FFC83D'),
  ('熱銷', 'hot', '#FF5A5F'),
  ('老師推薦', 'teacher-pick', '#FF8A3D'),
  ('中秋限定', 'mid-autumn', '#FFB27A'),
  ('限時優惠', 'sale', '#F0444A'),
  ('冷藏', 'chilled', '#8C644A'),
  ('冷凍', 'frozen', '#6B3F24')
ON CONFLICT (slug) DO NOTHING;

-- ---------------------------------------------------------------------------
-- 10. product_attributes
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.product_attributes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  data_type TEXT NOT NULL DEFAULT 'text',
  is_filterable BOOLEAN NOT NULL DEFAULT false,
  sort_order INTEGER NOT NULL DEFAULT 0
);

CREATE TABLE IF NOT EXISTS public.product_attribute_values (
  product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  attribute_id UUID NOT NULL REFERENCES public.product_attributes(id) ON DELETE CASCADE,
  value_text TEXT,
  value_number NUMERIC,
  value_boolean BOOLEAN,
  value_json JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (product_id, attribute_id)
);

INSERT INTO public.product_attributes (name, slug, data_type, is_filterable, sort_order) VALUES
  ('產地', 'origin', 'text', true, 10),
  ('蛋白質含量', 'protein', 'text', true, 20),
  ('可可濃度', 'cocoa', 'text', true, 30),
  ('重量', 'weight', 'text', true, 40),
  ('保存方式', 'storage', 'text', true, 50),
  ('過敏原', 'allergen', 'text', false, 60)
ON CONFLICT (slug) DO NOTHING;

-- ---------------------------------------------------------------------------
-- 11. Category path/level helper
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.sync_category_path()
RETURNS TRIGGER AS $$
DECLARE
  parent_path TEXT;
  parent_level SMALLINT;
BEGIN
  IF NEW.parent_id IS NOT NULL AND NEW.parent_id = NEW.id THEN
    RAISE EXCEPTION 'parent_id cannot equal id';
  END IF;

  IF NEW.parent_id IS NULL THEN
    NEW.level := 1;
    NEW.path := '/' || NEW.slug || '/';
  ELSE
    SELECT path, level INTO parent_path, parent_level
    FROM public.product_categories WHERE id = NEW.parent_id;
    NEW.level := COALESCE(parent_level, 0) + 1;
    IF NEW.level > 4 THEN
      RAISE EXCEPTION 'category level cannot exceed 4';
    END IF;
    NEW.path := COALESCE(parent_path, '/') || NEW.slug || '/';
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_sync_category_path ON public.product_categories;
CREATE TRIGGER trg_sync_category_path
  BEFORE INSERT OR UPDATE OF parent_id, slug
  ON public.product_categories
  FOR EACH ROW EXECUTE FUNCTION public.sync_category_path();

-- ---------------------------------------------------------------------------
-- 12. Seed 20 baking material categories
-- ---------------------------------------------------------------------------
DO $$
DECLARE
  root_id UUID;
BEGIN
  SELECT id INTO root_id FROM public.catalog_roots WHERE slug = 'baking-materials';

  INSERT INTO public.product_categories
    (id, catalog_root_id, parent_id, name, slug, sort_order, is_active, level, path, icon_key)
  VALUES
    ('c1000001-0000-4000-8000-000000000001', root_id, NULL, '麵粉', 'flour', 10, true, 1, '/flour/', 'package'),
    ('c1000001-0000-4000-8000-000000000002', root_id, NULL, '糖類', 'sugar', 20, true, 1, '/sugar/', 'package'),
    ('c1000001-0000-4000-8000-000000000003', root_id, NULL, '奶油', 'butter', 30, true, 1, '/butter/', 'package'),
    ('c1000001-0000-4000-8000-000000000004', root_id, NULL, '乳製品', 'dairy', 40, true, 1, '/dairy/', 'package'),
    ('c1000001-0000-4000-8000-000000000005', root_id, NULL, '巧克力', 'chocolate', 50, true, 1, '/chocolate/', 'package'),
    ('c1000001-0000-4000-8000-000000000006', root_id, NULL, '果泥果醬', 'fruit-paste', 60, true, 1, '/fruit-paste/', 'package'),
    ('c1000001-0000-4000-8000-000000000007', root_id, NULL, '餡料', 'fillings', 70, true, 1, '/fillings/', 'package'),
    ('c1000001-0000-4000-8000-000000000008', root_id, NULL, '堅果乾果', 'nuts-dried-fruit', 80, true, 1, '/nuts-dried-fruit/', 'package'),
    ('c1000001-0000-4000-8000-000000000009', root_id, NULL, '香料香精', 'spices-flavor', 90, true, 1, '/spices-flavor/', 'package'),
    ('c1000001-0000-4000-8000-000000000010', root_id, NULL, '色粉色膏', 'food-coloring', 100, true, 1, '/food-coloring/', 'package'),
    ('c1000001-0000-4000-8000-000000000011', root_id, NULL, '食品添加物', 'additives', 110, true, 1, '/additives/', 'package'),
    ('c1000001-0000-4000-8000-000000000012', root_id, NULL, '酵母膨脹劑', 'yeast-leaveners', 120, true, 1, '/yeast-leaveners/', 'package'),
    ('c1000001-0000-4000-8000-000000000013', root_id, NULL, '預拌粉', 'premix', 130, true, 1, '/premix/', 'package'),
    ('c1000001-0000-4000-8000-000000000014', root_id, NULL, '裝飾材料', 'decorations', 140, true, 1, '/decorations/', 'package'),
    ('c1000001-0000-4000-8000-000000000015', root_id, NULL, '烘焙模具', 'molds', 150, true, 1, '/molds/', 'package'),
    ('c1000001-0000-4000-8000-000000000016', root_id, NULL, '烘焙器具', 'tools', 160, true, 1, '/tools/', 'package'),
    ('c1000001-0000-4000-8000-000000000017', root_id, NULL, '包裝材料', 'packaging', 170, true, 1, '/packaging/', 'package'),
    ('c1000001-0000-4000-8000-000000000018', root_id, NULL, '冷凍商品', 'frozen-goods', 180, true, 1, '/frozen-goods/', 'package'),
    ('c1000001-0000-4000-8000-000000000019', root_id, NULL, '冷藏商品', 'chilled-goods', 190, true, 1, '/chilled-goods/', 'package'),
    ('c1000001-0000-4000-8000-000000000020', root_id, NULL, '品牌專區', 'brands', 200, true, 1, '/brands/', 'package')
  ON CONFLICT (id) DO UPDATE SET
    catalog_root_id = EXCLUDED.catalog_root_id,
    name = EXCLUDED.name,
    sort_order = EXCLUDED.sort_order,
    is_active = true,
    path = EXCLUDED.path,
    level = 1;
END $$;

-- ---------------------------------------------------------------------------
-- 13. RLS
-- ---------------------------------------------------------------------------
ALTER TABLE public.catalog_roots ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.product_category_links ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.product_images ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.product_variants ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.inventory ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tags ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.product_tags ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.product_attributes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.product_attribute_values ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS catalog_roots_public_read ON public.catalog_roots;
CREATE POLICY catalog_roots_public_read ON public.catalog_roots
  FOR SELECT USING (is_active = true OR public.is_admin());

DROP POLICY IF EXISTS catalog_roots_admin_all ON public.catalog_roots;
CREATE POLICY catalog_roots_admin_all ON public.catalog_roots
  FOR ALL USING (public.is_admin()) WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS product_category_links_public_read ON public.product_category_links;
CREATE POLICY product_category_links_public_read ON public.product_category_links
  FOR SELECT USING (true);

DROP POLICY IF EXISTS product_category_links_admin_all ON public.product_category_links;
CREATE POLICY product_category_links_admin_all ON public.product_category_links
  FOR ALL USING (public.is_admin()) WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS product_images_public_read ON public.product_images;
CREATE POLICY product_images_public_read ON public.product_images
  FOR SELECT USING (true);

DROP POLICY IF EXISTS product_images_admin_all ON public.product_images;
CREATE POLICY product_images_admin_all ON public.product_images
  FOR ALL USING (public.is_admin()) WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS product_variants_public_read ON public.product_variants;
CREATE POLICY product_variants_public_read ON public.product_variants
  FOR SELECT USING (is_active = true OR public.is_admin());

DROP POLICY IF EXISTS product_variants_admin_all ON public.product_variants;
CREATE POLICY product_variants_admin_all ON public.product_variants
  FOR ALL USING (public.is_admin()) WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS inventory_admin_all ON public.inventory;
CREATE POLICY inventory_admin_all ON public.inventory
  FOR ALL USING (public.is_admin()) WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS inventory_public_read ON public.inventory;
CREATE POLICY inventory_public_read ON public.inventory
  FOR SELECT USING (true);

DROP POLICY IF EXISTS tags_public_read ON public.tags;
CREATE POLICY tags_public_read ON public.tags
  FOR SELECT USING (is_active = true OR public.is_admin());

DROP POLICY IF EXISTS tags_admin_all ON public.tags;
CREATE POLICY tags_admin_all ON public.tags
  FOR ALL USING (public.is_admin()) WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS product_tags_public_read ON public.product_tags;
CREATE POLICY product_tags_public_read ON public.product_tags FOR SELECT USING (true);

DROP POLICY IF EXISTS product_tags_admin_all ON public.product_tags;
CREATE POLICY product_tags_admin_all ON public.product_tags
  FOR ALL USING (public.is_admin()) WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS product_attributes_public_read ON public.product_attributes;
CREATE POLICY product_attributes_public_read ON public.product_attributes FOR SELECT USING (true);

DROP POLICY IF EXISTS product_attributes_admin_all ON public.product_attributes;
CREATE POLICY product_attributes_admin_all ON public.product_attributes
  FOR ALL USING (public.is_admin()) WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS product_attribute_values_public_read ON public.product_attribute_values;
CREATE POLICY product_attribute_values_public_read ON public.product_attribute_values FOR SELECT USING (true);

DROP POLICY IF EXISTS product_attribute_values_admin_all ON public.product_attribute_values;
CREATE POLICY product_attribute_values_admin_all ON public.product_attribute_values
  FOR ALL USING (public.is_admin()) WITH CHECK (public.is_admin());
