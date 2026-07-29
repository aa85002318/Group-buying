-- CHIMEIDIY Brand Experience System
-- Safe to re-run

CREATE TABLE IF NOT EXISTS brand_heroes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  hero_key TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  title TEXT NOT NULL,
  subtitle TEXT,
  desktop_image_url TEXT,
  mobile_image_url TEXT,
  image_alt TEXT,
  search_placeholder TEXT,
  search_scope TEXT NOT NULL DEFAULT 'global',
  enabled BOOLEAN NOT NULL DEFAULT true,
  status TEXT NOT NULL DEFAULT 'draft'
    CHECK (status IN ('draft', 'scheduled', 'published', 'archived')),
  start_at TIMESTAMPTZ,
  end_at TIMESTAMPTZ,
  created_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
  updated_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS brand_hero_tags (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  hero_id UUID NOT NULL REFERENCES brand_heroes(id) ON DELETE CASCADE,
  label TEXT NOT NULL,
  keyword TEXT,
  link_type TEXT NOT NULL DEFAULT 'search',
  target_url TEXT,
  sort_order INTEGER NOT NULL DEFAULT 0,
  enabled BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_brand_hero_tags_hero
  ON brand_hero_tags(hero_id, sort_order);

CREATE TABLE IF NOT EXISTS brand_navigation_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  navigation_type TEXT NOT NULL,
  parent_id UUID REFERENCES brand_navigation_items(id) ON DELETE SET NULL,
  label TEXT NOT NULL,
  icon_key TEXT,
  href TEXT NOT NULL,
  requires_auth BOOLEAN NOT NULL DEFAULT false,
  mobile_visible BOOLEAN NOT NULL DEFAULT true,
  desktop_visible BOOLEAN NOT NULL DEFAULT true,
  sort_order INTEGER NOT NULL DEFAULT 0,
  enabled BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_brand_nav_type_sort
  ON brand_navigation_items(navigation_type, sort_order);

CREATE TABLE IF NOT EXISTS brand_home_sections (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  section_key TEXT UNIQUE NOT NULL,
  title TEXT,
  subtitle TEXT,
  more_label TEXT,
  more_href TEXT,
  mobile_visible BOOLEAN NOT NULL DEFAULT true,
  desktop_visible BOOLEAN NOT NULL DEFAULT true,
  sort_order INTEGER NOT NULL DEFAULT 0,
  enabled BOOLEAN NOT NULL DEFAULT true,
  settings JSONB NOT NULL DEFAULT '{}'::jsonb,
  updated_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS brand_assets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  asset_type TEXT NOT NULL,
  file_url TEXT NOT NULL,
  alt_text TEXT,
  tags TEXT[],
  usage_locations TEXT[],
  enabled BOOLEAN NOT NULL DEFAULT true,
  created_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS brand_versions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  resource_type TEXT NOT NULL,
  resource_id UUID NOT NULL,
  before_data JSONB,
  after_data JSONB,
  action TEXT NOT NULL,
  created_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_brand_versions_resource
  ON brand_versions(resource_type, resource_id, created_at DESC);

-- RLS
ALTER TABLE brand_heroes ENABLE ROW LEVEL SECURITY;
ALTER TABLE brand_hero_tags ENABLE ROW LEVEL SECURITY;
ALTER TABLE brand_navigation_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE brand_home_sections ENABLE ROW LEVEL SECURITY;
ALTER TABLE brand_assets ENABLE ROW LEVEL SECURITY;
ALTER TABLE brand_versions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS brand_heroes_public_read ON brand_heroes;
CREATE POLICY brand_heroes_public_read ON brand_heroes FOR SELECT
  USING (status = 'published' AND enabled = true);

DROP POLICY IF EXISTS brand_heroes_admin ON brand_heroes;
CREATE POLICY brand_heroes_admin ON brand_heroes FOR ALL
  USING (EXISTS (
    SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.role IN ('admin', 'content_editor')
  ))
  WITH CHECK (EXISTS (
    SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.role IN ('admin', 'content_editor')
  ));

DROP POLICY IF EXISTS brand_hero_tags_public_read ON brand_hero_tags;
CREATE POLICY brand_hero_tags_public_read ON brand_hero_tags FOR SELECT USING (true);

DROP POLICY IF EXISTS brand_hero_tags_admin ON brand_hero_tags;
CREATE POLICY brand_hero_tags_admin ON brand_hero_tags FOR ALL
  USING (EXISTS (
    SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.role IN ('admin', 'content_editor')
  ))
  WITH CHECK (EXISTS (
    SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.role IN ('admin', 'content_editor')
  ));

DROP POLICY IF EXISTS brand_nav_public_read ON brand_navigation_items;
CREATE POLICY brand_nav_public_read ON brand_navigation_items FOR SELECT
  USING (enabled = true);

DROP POLICY IF EXISTS brand_nav_admin ON brand_navigation_items;
CREATE POLICY brand_nav_admin ON brand_navigation_items FOR ALL
  USING (EXISTS (
    SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.role IN ('admin', 'content_editor')
  ))
  WITH CHECK (EXISTS (
    SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.role IN ('admin', 'content_editor')
  ));

DROP POLICY IF EXISTS brand_home_sections_public_read ON brand_home_sections;
CREATE POLICY brand_home_sections_public_read ON brand_home_sections FOR SELECT
  USING (enabled = true);

DROP POLICY IF EXISTS brand_home_sections_admin ON brand_home_sections;
CREATE POLICY brand_home_sections_admin ON brand_home_sections FOR ALL
  USING (EXISTS (
    SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.role IN ('admin', 'content_editor')
  ))
  WITH CHECK (EXISTS (
    SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.role IN ('admin', 'content_editor')
  ));

DROP POLICY IF EXISTS brand_assets_public_read ON brand_assets;
CREATE POLICY brand_assets_public_read ON brand_assets FOR SELECT
  USING (enabled = true);

DROP POLICY IF EXISTS brand_assets_admin ON brand_assets;
CREATE POLICY brand_assets_admin ON brand_assets FOR ALL
  USING (EXISTS (
    SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.role IN ('admin', 'content_editor')
  ))
  WITH CHECK (EXISTS (
    SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.role IN ('admin', 'content_editor')
  ));

DROP POLICY IF EXISTS brand_versions_admin ON brand_versions;
CREATE POLICY brand_versions_admin ON brand_versions FOR ALL
  USING (EXISTS (
    SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.role IN ('admin', 'content_editor')
  ))
  WITH CHECK (EXISTS (
    SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.role IN ('admin', 'content_editor')
  ));

-- Seed default heroes
INSERT INTO brand_heroes (hero_key, name, title, subtitle, search_placeholder, search_scope, enabled, status)
VALUES
  ('home', '首頁 Hero', '從靈感到成品', '一站完成你的烘焙生活', '搜尋材料、食譜、課程…', 'global', true, 'published'),
  ('recipes', '食譜 Hero', '找食譜', '跟著老師一步步完成', '搜尋食譜名稱或材料…', 'recipes', true, 'published'),
  ('products', '商品 Hero', '找材料', '嚴選烘焙原料與器具', '搜尋商品名稱…', 'products', true, 'published'),
  ('courses', '課程 Hero', '烘焙課程', '跟老師一起做', '搜尋課程…', 'courses', true, 'published'),
  ('group-buy', '團購 Hero', '團購優惠', '好料一起買更划算', '搜尋團購活動…', 'group_buy', true, 'published')
ON CONFLICT (hero_key) DO NOTHING;

-- Seed home tags for home hero
INSERT INTO brand_hero_tags (hero_id, label, keyword, sort_order)
SELECT h.id, t.label, t.keyword, t.sort_order
FROM brand_heroes h
CROSS JOIN (VALUES
  ('麵粉', '麵粉', 10),
  ('奶油', '奶油', 20),
  ('巧克力', '巧克力', 30)
) AS t(label, keyword, sort_order)
WHERE h.hero_key = 'home'
  AND NOT EXISTS (SELECT 1 FROM brand_hero_tags x WHERE x.hero_id = h.id)
;

-- Seed bottom nav
INSERT INTO brand_navigation_items (navigation_type, label, icon_key, href, sort_order)
SELECT * FROM (VALUES
  ('bottom', '首頁', 'home', '/', 10),
  ('bottom', '商城', 'products', '/products', 20),
  ('bottom', '團購', 'groupBuy', '/group-buy', 30),
  ('bottom', 'AI', 'knowledge', '/ai', 40),
  ('bottom', '我的', 'account', '/profile', 50)
) AS v(navigation_type, label, icon_key, href, sort_order)
WHERE NOT EXISTS (
  SELECT 1 FROM brand_navigation_items b WHERE b.navigation_type = 'bottom' LIMIT 1
);

INSERT INTO brand_home_sections (section_key, title, subtitle, more_href, sort_order, enabled)
VALUES
  ('hero', 'Brand Hero', null, null, 10, true),
  ('latest_recipes', '本週熱門食譜', '從靈感開始，找到今天想做的甜點', '/recipes', 20, true),
  ('recipe_kits', '一鍵購買材料', null, '/recipes', 30, true),
  ('popular_categories', '找材料', null, '/baking-materials', 40, true),
  ('popular_baking_products', '本週熱賣', null, '/baking-materials', 50, true),
  ('featured_courses', '最新課程', null, '/courses', 60, true),
  ('closing_group_buys', '團購優惠', null, '/group-buy', 70, true),
  ('latest_videos', '最新影音', null, '/videos', 80, true),
  ('trust_services', '安心服務', null, null, 90, true),
  ('community', '社群入口', null, '/community', 100, true)
ON CONFLICT (section_key) DO NOTHING;
