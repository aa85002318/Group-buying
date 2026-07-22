-- Homepage CMS redesign: extend blocks, new content tables, product_scope
-- Safe to re-run (IF NOT EXISTS / ON CONFLICT)

-- ---------------------------------------------------------------------------
-- 1) Extend homepage_blocks
-- ---------------------------------------------------------------------------
ALTER TABLE public.homepage_blocks
  ADD COLUMN IF NOT EXISTS data_source TEXT,
  ADD COLUMN IF NOT EXISTS view_all_url TEXT;

-- Remove deleted home-only sections
DELETE FROM public.homepage_blocks
WHERE block_key IN ('recent_browse', 'quick_reorder', 'feature_duo', 'primary_services');

-- Rename existing keys (preserve row ids / config / manual_ids)
UPDATE public.homepage_blocks SET block_key = 'hot_searches', title = COALESCE(NULLIF(title, ''), '熱門搜尋'), sort_order = 10
WHERE block_key = 'hot_search';

UPDATE public.homepage_blocks SET block_key = 'hero', title = COALESCE(NULLIF(title, ''), 'Hero Banner'), sort_order = 20
WHERE block_key = 'hero_banner';

UPDATE public.homepage_blocks SET block_key = 'quick_menu', title = COALESCE(NULLIF(title, ''), '快捷入口'), sort_order = 40
WHERE block_key = 'quick_menu';

UPDATE public.homepage_blocks SET block_key = 'popular_categories', title = '熱門烘焙分類', sort_order = 70
WHERE block_key = 'popular_categories';

UPDATE public.homepage_blocks
SET block_key = 'latest_recipes', title = COALESCE(NULLIF(title, ''), '最新食譜'), sort_order = 80, data_source = COALESCE(data_source, 'auto')
WHERE block_key = 'recipes';

UPDATE public.homepage_blocks
SET block_key = 'weekly_new_products',
    title = '本週新品推薦',
    subtitle = COALESCE(subtitle, '最近上架的烘焙好物'),
    sort_order = 90,
    data_source = COALESCE(data_source, 'mixed'),
    config = COALESCE(config, '{}'::jsonb) || jsonb_build_object('new_days', 7)
WHERE block_key = 'new_products';

UPDATE public.homepage_blocks
SET block_key = 'popular_baking_products',
    title = '人氣烘焙材料',
    subtitle = COALESCE(subtitle, '烘焙材料商城精選'),
    sort_order = 100,
    data_source = COALESCE(data_source, 'manual'),
    config = COALESCE(config, '{}'::jsonb) || jsonb_build_object('product_scope', 'baking')
WHERE block_key = 'hot_products';

UPDATE public.homepage_blocks
SET block_key = 'closing_group_buys', title = '即將結單', sort_order = 130, data_source = COALESCE(data_source, 'auto')
WHERE block_key = 'group_buy_closing';

UPDATE public.homepage_blocks
SET block_key = 'weekly_promotions', title = COALESCE(NULLIF(title, ''), '本週優惠'), sort_order = 140
WHERE block_key = 'weekly_promo';

UPDATE public.homepage_blocks
SET block_key = 'latest_videos', title = '最新影音', sort_order = 170, data_source = COALESCE(data_source, 'auto')
WHERE block_key = 'videos';

UPDATE public.homepage_blocks
SET block_key = 'latest_articles', title = COALESCE(NULLIF(title, ''), '最新資訊'), sort_order = 190, data_source = COALESCE(data_source, 'auto')
WHERE block_key = 'news';

-- Seed / upsert all required section keys
INSERT INTO public.homepage_blocks
  (block_key, title, subtitle, sort_order, display_count, is_visible, source_mode, data_source, view_all_url, config)
VALUES
  ('hot_searches', '熱門搜尋', NULL, 10, 10, true, 'manual', 'manual', NULL,
    jsonb_build_object('keywords', jsonb_build_array('麵粉', '奶油', '巧克力', '模具', '吐司', '巴斯克'))),
  ('hero', 'Hero Banner', '首頁主視覺', 20, 5, true, 'auto', 'banners', NULL, '{}'::jsonb),
  ('brand_statement', '品牌定位', '從靈感到成品，一站完成你的烘焙生活。', 30, 4, true, 'manual', 'manual', NULL,
    jsonb_build_object(
      'headline', '從靈感到成品，一站完成你的烘焙生活。',
      'tags', jsonb_build_array(
        jsonb_build_object('id', 'ai', 'label', 'AI 助手', 'href', '/ai', 'sortOrder', 10, 'active', true),
        jsonb_build_object('id', 'recipes', 'label', '食譜教學', 'href', '/recipes', 'sortOrder', 20, 'active', true),
        jsonb_build_object('id', 'store', 'label', '門市體驗', 'href', '/stores', 'sortOrder', 30, 'active', true),
        jsonb_build_object('id', 'chime', 'label', 'CHIME 精選', 'href', '/shop?scope=chime_select', 'sortOrder', 40, 'active', true)
      )
    )),
  ('quick_menu', '快捷入口', NULL, 40, 8, true, 'manual', 'cms_items', NULL, '{}'::jsonb),
  ('ai_assistant', 'AI 烘焙助手', '今天想做什麼？', 50, 4, true, 'manual', 'manual', '/ai',
    jsonb_build_object(
      'placeholder', '輸入材料、問題或想做的甜點……',
      'target_path', '/ai'
    )),
  ('baking_inspiration', '今日烘焙靈感', '今天想來一點甜的？', 60, 4, true, 'manual', 'manual', NULL, '{}'::jsonb),
  ('popular_categories', '熱門烘焙分類', NULL, 70, 8, true, 'manual', 'manual', '/baking-materials', '{}'::jsonb),
  ('latest_recipes', '最新食譜', '一分鐘教你做', 80, 4, true, 'auto', 'auto', '/recipes', '{}'::jsonb),
  ('weekly_new_products', '本週新品推薦', '最近上架的烘焙好物', 90, 8, true, 'manual', 'mixed', '/products?sort=newest',
    jsonb_build_object('new_days', 7, 'product_scope', 'baking')),
  ('popular_baking_products', '人氣烘焙材料', '烘焙材料商城精選', 100, 8, true, 'manual', 'manual', '/baking-materials',
    jsonb_build_object('product_scope', 'baking')),
  ('chime_select', 'CHIME 精選', '每天發現值得買的生活好物', 110, 8, true, 'manual', 'mixed', '/shop?scope=chime_select',
    jsonb_build_object('product_scope', 'chime_select', 'category_count', 6)),
  ('weekly_live_streams', '本週團購直播', NULL, 120, 4, true, 'auto', 'auto', '/live', '{}'::jsonb),
  ('closing_group_buys', '即將結單', NULL, 130, 4, true, 'auto', 'auto', '/group-buy',
    jsonb_build_object('show_countdown', true)),
  ('weekly_promotions', '本週優惠', NULL, 140, 4, true, 'manual', 'banners', NULL, '{}'::jsonb),
  ('monthly_challenge', '本月烘焙挑戰', NULL, 150, 3, true, 'auto', 'auto', '/challenges', '{}'::jsonb),
  ('seasonal_themes', '季節主題企劃', NULL, 160, 4, true, 'auto', 'auto', '/themes', '{}'::jsonb),
  ('latest_videos', '最新影音', NULL, 170, 4, true, 'auto', 'auto', '/videos', '{}'::jsonb),
  ('store_information', '門市資訊', NULL, 180, 1, true, 'manual', 'manual', '/stores', '{}'::jsonb),
  ('latest_articles', '最新資訊', NULL, 190, 5, true, 'auto', 'auto', '/articles', '{}'::jsonb)
ON CONFLICT (block_key) DO UPDATE SET
  title = EXCLUDED.title,
  subtitle = COALESCE(homepage_blocks.subtitle, EXCLUDED.subtitle),
  sort_order = EXCLUDED.sort_order,
  display_count = COALESCE(homepage_blocks.display_count, EXCLUDED.display_count),
  data_source = COALESCE(homepage_blocks.data_source, EXCLUDED.data_source),
  view_all_url = COALESCE(homepage_blocks.view_all_url, EXCLUDED.view_all_url),
  config = COALESCE(homepage_blocks.config, '{}'::jsonb) || COALESCE(EXCLUDED.config, '{}'::jsonb);

-- ---------------------------------------------------------------------------
-- 2) products.product_scope
-- ---------------------------------------------------------------------------
ALTER TABLE public.products
  ADD COLUMN IF NOT EXISTS product_scope TEXT NOT NULL DEFAULT 'baking';

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'products_product_scope_check'
  ) THEN
    ALTER TABLE public.products
      ADD CONSTRAINT products_product_scope_check
      CHECK (product_scope IN ('baking', 'chime_select'));
  END IF;
END $$;

UPDATE public.products SET product_scope = 'baking' WHERE product_scope IS NULL OR product_scope = '';

-- ---------------------------------------------------------------------------
-- 3) AI prompts
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.home_ai_prompts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  label TEXT NOT NULL,
  prompt TEXT NOT NULL,
  sort_order INT NOT NULL DEFAULT 0,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_home_ai_prompts_active_sort
  ON public.home_ai_prompts (is_active, sort_order ASC);

DROP TRIGGER IF EXISTS set_updated_at ON public.home_ai_prompts;
CREATE TRIGGER set_updated_at
  BEFORE UPDATE ON public.home_ai_prompts
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

ALTER TABLE public.home_ai_prompts ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS home_ai_prompts_public_read ON public.home_ai_prompts;
CREATE POLICY home_ai_prompts_public_read ON public.home_ai_prompts
  FOR SELECT USING (is_active = true OR public.is_admin());

DROP POLICY IF EXISTS home_ai_prompts_admin_all ON public.home_ai_prompts;
CREATE POLICY home_ai_prompts_admin_all ON public.home_ai_prompts
  FOR ALL USING (public.is_admin()) WITH CHECK (public.is_admin());

INSERT INTO public.home_ai_prompts (label, prompt, sort_order, is_active)
SELECT * FROM (VALUES
  ('低筋麵粉可以做什麼？', '我只有低筋麵粉可以做什麼？', 10, true),
  ('巴斯克裂開怎麼辦？', '巴斯克裂開怎麼辦？', 20, true),
  ('換算成 8 吋配方', '幫我換算成 8 吋配方', 30, true),
  ('剩蛋白可以做什麼？', '家裡剩蛋白可以做什麼？', 40, true)
) AS v(label, prompt, sort_order, is_active)
WHERE NOT EXISTS (SELECT 1 FROM public.home_ai_prompts LIMIT 1);

-- ---------------------------------------------------------------------------
-- 4) Baking inspirations
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.home_inspirations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  subtitle TEXT,
  image_url TEXT,
  link_type TEXT,
  target_url TEXT,
  button_label TEXT DEFAULT '去看看',
  sort_order INT NOT NULL DEFAULT 0,
  is_active BOOLEAN NOT NULL DEFAULT true,
  start_at TIMESTAMPTZ,
  end_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_home_inspirations_active_sort
  ON public.home_inspirations (is_active, sort_order ASC);

DROP TRIGGER IF EXISTS set_updated_at ON public.home_inspirations;
CREATE TRIGGER set_updated_at
  BEFORE UPDATE ON public.home_inspirations
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

ALTER TABLE public.home_inspirations ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS home_inspirations_public_read ON public.home_inspirations;
CREATE POLICY home_inspirations_public_read ON public.home_inspirations
  FOR SELECT USING (
    (is_active = true AND (start_at IS NULL OR start_at <= NOW()) AND (end_at IS NULL OR end_at >= NOW()))
    OR public.is_admin()
  );

DROP POLICY IF EXISTS home_inspirations_admin_all ON public.home_inspirations;
CREATE POLICY home_inspirations_admin_all ON public.home_inspirations
  FOR ALL USING (public.is_admin()) WITH CHECK (public.is_admin());

INSERT INTO public.home_inspirations (title, subtitle, target_url, link_type, sort_order, is_active)
SELECT * FROM (VALUES
  ('夏日水果塔', '清爽水果與酥皮的相遇', '/recipes', 'recipe', 10, true),
  ('北海道吐司', '柔軟拉絲的經典吐司', '/recipes', 'recipe', 20, true),
  ('提拉米蘇', '咖啡香氣的層次甜點', '/recipes', 'recipe', 30, true),
  ('巴斯克', '表面焦香、內裡濕潤', '/recipes', 'recipe', 40, true)
) AS v(title, subtitle, target_url, link_type, sort_order, is_active)
WHERE NOT EXISTS (SELECT 1 FROM public.home_inspirations LIMIT 1);

-- ---------------------------------------------------------------------------
-- 5) Challenges
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.baking_challenges (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  cover_image_url TEXT,
  description TEXT,
  rules TEXT,
  starts_at TIMESTAMPTZ,
  ends_at TIMESTAMPTZ,
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'published', 'archived')),
  participant_count INT NOT NULL DEFAULT 0,
  featured_on_home BOOLEAN NOT NULL DEFAULT false,
  sort_order INT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_baking_challenges_status_sort
  ON public.baking_challenges (status, sort_order ASC);

DROP TRIGGER IF EXISTS set_updated_at ON public.baking_challenges;
CREATE TRIGGER set_updated_at
  BEFORE UPDATE ON public.baking_challenges
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

ALTER TABLE public.baking_challenges ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS baking_challenges_public_read ON public.baking_challenges;
CREATE POLICY baking_challenges_public_read ON public.baking_challenges
  FOR SELECT USING (status = 'published' OR public.is_admin());

DROP POLICY IF EXISTS baking_challenges_admin_all ON public.baking_challenges;
CREATE POLICY baking_challenges_admin_all ON public.baking_challenges
  FOR ALL USING (public.is_admin()) WITH CHECK (public.is_admin());

-- ---------------------------------------------------------------------------
-- 6) Seasonal themes
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.seasonal_themes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  cover_image_url TEXT,
  mobile_cover_image_url TEXT,
  description TEXT,
  theme_color TEXT,
  starts_at TIMESTAMPTZ,
  ends_at TIMESTAMPTZ,
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'published', 'archived')),
  featured_on_home BOOLEAN NOT NULL DEFAULT false,
  sort_order INT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_seasonal_themes_status_sort
  ON public.seasonal_themes (status, sort_order ASC);

DROP TRIGGER IF EXISTS set_updated_at ON public.seasonal_themes;
CREATE TRIGGER set_updated_at
  BEFORE UPDATE ON public.seasonal_themes
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

ALTER TABLE public.seasonal_themes ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS seasonal_themes_public_read ON public.seasonal_themes;
CREATE POLICY seasonal_themes_public_read ON public.seasonal_themes
  FOR SELECT USING (status = 'published' OR public.is_admin());

DROP POLICY IF EXISTS seasonal_themes_admin_all ON public.seasonal_themes;
CREATE POLICY seasonal_themes_admin_all ON public.seasonal_themes
  FOR ALL USING (public.is_admin()) WITH CHECK (public.is_admin());

-- ---------------------------------------------------------------------------
-- 7) Extend livestreams + stores for home
-- ---------------------------------------------------------------------------
ALTER TABLE public.livestreams
  ADD COLUMN IF NOT EXISTS featured_on_home BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS sort_order INT NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS host_name TEXT,
  ADD COLUMN IF NOT EXISTS theme_label TEXT,
  ADD COLUMN IF NOT EXISTS replay_url TEXT;

ALTER TABLE public.stores
  ADD COLUMN IF NOT EXISTS cover_image_url TEXT,
  ADD COLUMN IF NOT EXISTS navigation_url TEXT,
  ADD COLUMN IF NOT EXISTS services JSONB NOT NULL DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS daily_highlights JSONB NOT NULL DEFAULT '{}'::jsonb;

UPDATE public.stores
SET cover_image_url = COALESCE(cover_image_url, image_url),
    navigation_url = COALESCE(navigation_url, map_url)
WHERE cover_image_url IS NULL OR navigation_url IS NULL;
