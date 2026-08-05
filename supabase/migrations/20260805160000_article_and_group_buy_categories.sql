-- Article categories + group-buy product flags/categories

CREATE TABLE IF NOT EXISTS article_categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  sort_order INTEGER NOT NULL DEFAULT 0,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

INSERT INTO article_categories (name, slug, sort_order)
VALUES
  ('最新團購', 'latest-group-buy', 10),
  ('最新資訊', 'latest-news', 20),
  ('新品介紹', 'new-products', 30)
ON CONFLICT (slug) DO UPDATE
SET name = EXCLUDED.name,
    sort_order = EXCLUDED.sort_order,
    is_active = TRUE,
    updated_at = NOW();

-- Repoint articles.category_id from product_categories → article_categories
ALTER TABLE articles DROP CONSTRAINT IF EXISTS articles_category_id_fkey;
-- Clear orphan product category refs before attaching new FK
UPDATE articles SET category_id = NULL
WHERE category_id IS NOT NULL
  AND NOT EXISTS (
    SELECT 1 FROM article_categories ac WHERE ac.id = articles.category_id
  );

ALTER TABLE articles
  ADD CONSTRAINT articles_category_id_fkey
  FOREIGN KEY (category_id) REFERENCES article_categories(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_articles_category ON articles(category_id);

ALTER TABLE article_categories ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS article_categories_public_read ON article_categories;
CREATE POLICY article_categories_public_read ON article_categories FOR SELECT
  USING (is_active = TRUE OR EXISTS (
    SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.role IN ('admin', 'content_editor')
  ));
DROP POLICY IF EXISTS article_categories_admin_write ON article_categories;
CREATE POLICY article_categories_admin_write ON article_categories FOR ALL
  USING (EXISTS (
    SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.role IN ('admin', 'content_editor')
  ))
  WITH CHECK (EXISTS (
    SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.role IN ('admin', 'content_editor')
  ));

-- Group-buy categories (for products)
CREATE TABLE IF NOT EXISTS group_buy_categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  sort_order INTEGER NOT NULL DEFAULT 0,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

INSERT INTO group_buy_categories (name, slug, sort_order)
VALUES
  ('食材原料', 'ingredients', 10),
  ('器具耗材', 'tools', 20),
  ('季節限定', 'seasonal', 30),
  ('其他', 'other', 90)
ON CONFLICT (slug) DO NOTHING;

ALTER TABLE products
  ADD COLUMN IF NOT EXISTS is_monthly_group_buy BOOLEAN NOT NULL DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS is_limited_product BOOLEAN NOT NULL DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS group_buy_category_id UUID REFERENCES group_buy_categories(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_products_group_buy_category
  ON products(group_buy_category_id)
  WHERE group_buy_category_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_products_monthly_group_buy
  ON products(is_monthly_group_buy)
  WHERE is_monthly_group_buy = TRUE;

ALTER TABLE group_buy_categories ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS group_buy_categories_public_read ON group_buy_categories;
CREATE POLICY group_buy_categories_public_read ON group_buy_categories FOR SELECT
  USING (is_active = TRUE OR EXISTS (
    SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.role IN ('admin', 'content_editor', 'store_staff')
  ));
DROP POLICY IF EXISTS group_buy_categories_admin_write ON group_buy_categories;
CREATE POLICY group_buy_categories_admin_write ON group_buy_categories FOR ALL
  USING (EXISTS (
    SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.role IN ('admin', 'content_editor')
  ))
  WITH CHECK (EXISTS (
    SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.role IN ('admin', 'content_editor')
  ));

COMMENT ON TABLE article_categories IS '文章分類：最新團購／最新資訊／新品介紹';
COMMENT ON TABLE group_buy_categories IS '團購商品分類（與商品主檔共用）';
COMMENT ON COLUMN products.is_monthly_group_buy IS '本月團購標籤';
COMMENT ON COLUMN products.is_limited_product IS '限定商品標籤';
