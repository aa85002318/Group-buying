-- Consumer Hub 2.0 Batch 5: news CMS + banner/home section extensions
-- Safe to re-run. Extends cms_banners / homepage_blocks; adds news_* tables.

-- ---------------------------------------------------------------------------
-- news_categories
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS news_categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  sort_order INT NOT NULL DEFAULT 0,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_news_categories_sort ON news_categories(is_active, sort_order);

DROP TRIGGER IF EXISTS set_updated_at ON news_categories;
CREATE TRIGGER set_updated_at BEFORE UPDATE ON news_categories
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

INSERT INTO news_categories (name, slug, sort_order) VALUES
  ('全部', 'all', 0),
  ('新品', 'new', 10),
  ('活動', 'campaign', 20),
  ('優惠', 'promo', 30),
  ('課程', 'course', 40),
  ('直播', 'live', 50),
  ('門市公告', 'store', 60),
  ('停班停課', 'closure', 70),
  ('系統公告', 'system', 80)
ON CONFLICT (slug) DO NOTHING;

-- ---------------------------------------------------------------------------
-- news_posts
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS news_posts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  summary TEXT,
  cover_image TEXT,
  category_id UUID REFERENCES news_categories(id) ON DELETE SET NULL,
  content TEXT,
  is_featured BOOLEAN NOT NULL DEFAULT false,
  is_important BOOLEAN NOT NULL DEFAULT false,
  status TEXT NOT NULL DEFAULT 'draft'
    CHECK (status IN ('draft', 'scheduled', 'published', 'archived')),
  published_at TIMESTAMPTZ,
  starts_at TIMESTAMPTZ,
  ends_at TIMESTAMPTZ,
  related_url TEXT,
  seo_title TEXT,
  seo_description TEXT,
  sort_order INT NOT NULL DEFAULT 0,
  created_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
  updated_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_news_posts_status_pub ON news_posts(status, published_at DESC);
CREATE INDEX IF NOT EXISTS idx_news_posts_category ON news_posts(category_id);
CREATE INDEX IF NOT EXISTS idx_news_posts_featured ON news_posts(is_featured) WHERE is_featured = true;

DROP TRIGGER IF EXISTS set_updated_at ON news_posts;
CREATE TRIGGER set_updated_at BEFORE UPDATE ON news_posts
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ---------------------------------------------------------------------------
-- Extend cms_banners (do not create a second banners table)
-- ---------------------------------------------------------------------------
ALTER TABLE cms_banners
  ADD COLUMN IF NOT EXISTS mobile_image_url TEXT,
  ADD COLUMN IF NOT EXISTS button_text TEXT,
  ADD COLUMN IF NOT EXISTS placement TEXT NOT NULL DEFAULT 'home_hero',
  ADD COLUMN IF NOT EXISTS status TEXT NOT NULL DEFAULT 'active'
    CHECK (status IN ('draft', 'active', 'inactive')),
  ADD COLUMN IF NOT EXISTS created_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS updated_by UUID REFERENCES profiles(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_cms_banners_placement
  ON cms_banners(placement, is_active, sort_order);

-- ---------------------------------------------------------------------------
-- Extend homepage_blocks for home CMS
-- ---------------------------------------------------------------------------
ALTER TABLE homepage_blocks
  ADD COLUMN IF NOT EXISTS subtitle TEXT,
  ADD COLUMN IF NOT EXISTS display_count INT NOT NULL DEFAULT 6,
  ADD COLUMN IF NOT EXISTS source_mode TEXT NOT NULL DEFAULT 'auto'
    CHECK (source_mode IN ('auto', 'manual')),
  ADD COLUMN IF NOT EXISTS manual_ids UUID[] DEFAULT '{}';

INSERT INTO homepage_blocks (block_key, title, sort_order, subtitle, display_count) VALUES
  ('hero_banner', 'Hero Banner', 5, '首頁主視覺', 3),
  ('primary_services', '四大快捷入口', 8, NULL, 4),
  ('new_products', '今日新品', 10, NULL, 8),
  ('hot_products', '熱門商品', 20, NULL, 8),
  ('recipes', '最新食譜', 25, '烘焙靈感', 4),
  ('videos', '熱門影音', 28, NULL, 4),
  ('group_buy_closing', '即將收單團購', 35, NULL, 4),
  ('news', '最新資訊', 45, NULL, 5),
  ('member_benefits', '會員福利入口', 55, NULL, 1),
  ('ai_tools', 'AI 工具入口', 65, NULL, 2),
  ('store_info', '門市資訊', 80, NULL, 1)
ON CONFLICT (block_key) DO NOTHING;

-- Backfill display defaults for blocks created in earlier migrations
UPDATE homepage_blocks SET display_count = COALESCE(display_count, 6)
WHERE display_count IS NULL;

-- ---------------------------------------------------------------------------
-- RLS
-- ---------------------------------------------------------------------------
ALTER TABLE news_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE news_posts ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS news_categories_public_read ON news_categories;
CREATE POLICY news_categories_public_read ON news_categories
  FOR SELECT USING (is_active = true OR is_admin());

DROP POLICY IF EXISTS news_categories_admin ON news_categories;
CREATE POLICY news_categories_admin ON news_categories
  FOR ALL USING (is_admin()) WITH CHECK (is_admin());

DROP POLICY IF EXISTS news_posts_public_read ON news_posts;
CREATE POLICY news_posts_public_read ON news_posts
  FOR SELECT USING (
    (
      status = 'published'
      AND (published_at IS NULL OR published_at <= NOW())
      AND (starts_at IS NULL OR starts_at <= NOW())
      AND (ends_at IS NULL OR ends_at >= NOW())
    )
    OR is_admin()
  );

DROP POLICY IF EXISTS news_posts_admin ON news_posts;
CREATE POLICY news_posts_admin ON news_posts
  FOR ALL USING (is_admin()) WITH CHECK (is_admin());
