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
