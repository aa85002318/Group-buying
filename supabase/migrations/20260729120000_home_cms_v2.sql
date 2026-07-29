-- Home CMS v2: banner styling fields, recipe kits, new homepage blocks, branding settings

-- ---------------------------------------------------------------------------
-- Extend cms_banners for hero text / styling
-- ---------------------------------------------------------------------------
ALTER TABLE cms_banners
  ADD COLUMN IF NOT EXISTS background_color TEXT,
  ADD COLUMN IF NOT EXISTS text_color TEXT,
  ADD COLUMN IF NOT EXISTS text_align TEXT NOT NULL DEFAULT 'center'
    CHECK (text_align IN ('left', 'center', 'right')),
  ADD COLUMN IF NOT EXISTS audience TEXT NOT NULL DEFAULT 'all'
    CHECK (audience IN ('all', 'guest', 'member'));

COMMENT ON COLUMN cms_banners.background_color IS 'Optional banner background hex (e.g. #FFF9F5)';
COMMENT ON COLUMN cms_banners.text_color IS 'Optional overlay text hex';
COMMENT ON COLUMN cms_banners.text_align IS 'Overlay text position: left | center | right';
COMMENT ON COLUMN cms_banners.audience IS 'Who can see: all | guest | member';

-- ---------------------------------------------------------------------------
-- Recipe kits (one-click ingredient packs bound to recipes + products)
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS home_recipe_kits (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  cover_image_url TEXT,
  recipe_id UUID REFERENCES recipes(id) ON DELETE SET NULL,
  kit_price NUMERIC(12, 2),
  button_text TEXT NOT NULL DEFAULT '全部加入購物車',
  sort_order INTEGER NOT NULL DEFAULT 0,
  is_active BOOLEAN NOT NULL DEFAULT true,
  hide_when_oos BOOLEAN NOT NULL DEFAULT true,
  created_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
  updated_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS home_recipe_kit_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  kit_id UUID NOT NULL REFERENCES home_recipe_kits(id) ON DELETE CASCADE,
  product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  quantity INTEGER NOT NULL DEFAULT 1 CHECK (quantity > 0),
  is_required BOOLEAN NOT NULL DEFAULT true,
  is_replaceable BOOLEAN NOT NULL DEFAULT false,
  substitute_product_ids UUID[] NOT NULL DEFAULT '{}',
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (kit_id, product_id)
);

CREATE INDEX IF NOT EXISTS idx_home_recipe_kits_active
  ON home_recipe_kits(is_active, sort_order);
CREATE INDEX IF NOT EXISTS idx_home_recipe_kit_items_kit
  ON home_recipe_kit_items(kit_id, sort_order);

DROP TRIGGER IF EXISTS set_updated_at ON home_recipe_kits;
CREATE TRIGGER set_updated_at BEFORE UPDATE ON home_recipe_kits
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

ALTER TABLE home_recipe_kits ENABLE ROW LEVEL SECURITY;
ALTER TABLE home_recipe_kit_items ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS home_recipe_kits_public_read ON home_recipe_kits;
CREATE POLICY home_recipe_kits_public_read ON home_recipe_kits
  FOR SELECT USING (is_active = true);

DROP POLICY IF EXISTS home_recipe_kits_admin ON home_recipe_kits;
CREATE POLICY home_recipe_kits_admin ON home_recipe_kits FOR ALL
  USING (EXISTS (
    SELECT 1 FROM profiles p
    WHERE p.id = auth.uid() AND p.role IN ('admin', 'content_editor')
  ))
  WITH CHECK (EXISTS (
    SELECT 1 FROM profiles p
    WHERE p.id = auth.uid() AND p.role IN ('admin', 'content_editor')
  ));

DROP POLICY IF EXISTS home_recipe_kit_items_public_read ON home_recipe_kit_items;
CREATE POLICY home_recipe_kit_items_public_read ON home_recipe_kit_items
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM home_recipe_kits k
      WHERE k.id = kit_id AND k.is_active = true
    )
  );

DROP POLICY IF EXISTS home_recipe_kit_items_admin ON home_recipe_kit_items;
CREATE POLICY home_recipe_kit_items_admin ON home_recipe_kit_items FOR ALL
  USING (EXISTS (
    SELECT 1 FROM profiles p
    WHERE p.id = auth.uid() AND p.role IN ('admin', 'content_editor')
  ))
  WITH CHECK (EXISTS (
    SELECT 1 FROM profiles p
    WHERE p.id = auth.uid() AND p.role IN ('admin', 'content_editor')
  ));

-- ---------------------------------------------------------------------------
-- New / remapped homepage_blocks
-- ---------------------------------------------------------------------------
INSERT INTO homepage_blocks (block_key, title, subtitle, sort_order, is_visible, display_count, source_mode, view_all_url, config)
VALUES
  ('recipe_kits', '一鍵購買材料', '依食譜一次備齊材料', 85, true, 4, 'auto', '/recipes', '{"show_desktop":true,"show_mobile":true}'::jsonb),
  ('featured_courses', '最新課程', '跟老師一起做', 115, true, 4, 'auto', '/courses', '{"show_desktop":true,"show_mobile":true}'::jsonb),
  ('trust_services', '安心服務', NULL, 175, true, 4, 'manual', NULL,
    '{"show_desktop":true,"show_mobile":true,"items":[{"id":"quality","title":"嚴選原料","subtitle":"品質把關","icon":"ShieldCheck"},{"id":"pickup","title":"門市取貨","subtitle":"方便安心","icon":"MapPin"},{"id":"support","title":"專人客服","subtitle":"烘焙諮詢","icon":"Headphones"},{"id":"fresh","title":"冷藏配送","subtitle":"新鮮直送","icon":"Snowflake"}]}'::jsonb)
ON CONFLICT (block_key) DO NOTHING;

-- Align default sort + visibility for the new architecture (spec order 1–10)
UPDATE homepage_blocks SET sort_order = 10, is_visible = true, title = COALESCE(NULLIF(title, ''), 'Hero Banner')
WHERE block_key = 'hero';
UPDATE homepage_blocks SET sort_order = 20, is_visible = true, title = COALESCE(NULLIF(title, ''), '熱門搜尋')
WHERE block_key = 'hot_searches';
UPDATE homepage_blocks SET sort_order = 30, is_visible = true, title = '本週熱門食譜',
  source_mode = 'manual', view_all_url = COALESCE(view_all_url, '/recipes')
WHERE block_key = 'latest_recipes';
UPDATE homepage_blocks SET sort_order = 40, is_visible = true
WHERE block_key = 'recipe_kits';
UPDATE homepage_blocks SET sort_order = 50, is_visible = true, title = '找材料',
  view_all_url = COALESCE(view_all_url, '/baking-materials')
WHERE block_key = 'popular_categories';
UPDATE homepage_blocks SET sort_order = 60, is_visible = true, title = '本週熱賣商品',
  view_all_url = COALESCE(view_all_url, '/shop')
WHERE block_key = 'popular_baking_products';
UPDATE homepage_blocks SET sort_order = 70, is_visible = true
WHERE block_key = 'featured_courses';
UPDATE homepage_blocks SET sort_order = 80, is_visible = true, title = '團購優惠',
  view_all_url = COALESCE(view_all_url, '/group-buy'),
  config = COALESCE(config, '{}'::jsonb) || '{"show_countdown":true}'::jsonb
WHERE block_key = 'closing_group_buys';
UPDATE homepage_blocks SET sort_order = 90, is_visible = true, title = COALESCE(NULLIF(title, ''), '最新影音')
WHERE block_key = 'latest_videos';
UPDATE homepage_blocks SET sort_order = 100, is_visible = true
WHERE block_key = 'trust_services';

-- Keep legacy sections available but hidden by default
UPDATE homepage_blocks SET is_visible = false
WHERE block_key IN (
  'brand_statement', 'quick_menu', 'ai_assistant', 'baking_inspiration',
  'weekly_new_products', 'chime_select', 'weekly_live_streams', 'weekly_promotions',
  'monthly_challenge', 'seasonal_themes', 'store_information', 'latest_articles'
);

-- Hide any other legacy keys not in the primary architecture
UPDATE homepage_blocks SET is_visible = false
WHERE block_key NOT IN (
  'hero','hot_searches','latest_recipes','recipe_kits','popular_categories',
  'popular_baking_products','featured_courses','closing_group_buys',
  'latest_videos','trust_services'
);

-- ---------------------------------------------------------------------------
-- Branding site_settings
-- ---------------------------------------------------------------------------
INSERT INTO site_settings (key, value)
VALUES (
  'branding',
  '{
    "primary": "#FF6B5B",
    "primaryHover": "#FF8273",
    "background": "#FFF9F5",
    "surface": "#FFFFFF",
    "softCoral": "#FFE8E2",
    "honey": "#FFC857",
    "mint": "#9FD8B6",
    "sky": "#A7D7FF",
    "title": "#43332B",
    "text": "#6D5C53",
    "border": "#F2E7DF",
    "pagePaddingX": "15px",
    "cardRadius": "16px"
  }'::jsonb
)
ON CONFLICT (key) DO NOTHING;
