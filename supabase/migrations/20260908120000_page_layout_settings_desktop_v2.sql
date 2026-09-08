-- Desktop V2 layout settings (UI only — shared content tables unchanged)
-- page_layout_settings: per platform (mobile|desktop) section display config
-- cms_banners.desktop_image_url: optional desktop override (falls back to image_url)

CREATE TABLE IF NOT EXISTS public.page_layout_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  page_key TEXT NOT NULL,
  platform TEXT NOT NULL CHECK (platform IN ('mobile', 'desktop')),
  section_key TEXT NOT NULL,
  enabled BOOLEAN NOT NULL DEFAULT true,
  sort_order INTEGER NOT NULL DEFAULT 0,
  layout_type TEXT,
  columns INTEGER,
  display_limit INTEGER,
  settings_json JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (page_key, platform, section_key)
);

CREATE INDEX IF NOT EXISTS idx_page_layout_settings_page_platform
  ON public.page_layout_settings (page_key, platform, sort_order);

DROP TRIGGER IF EXISTS set_updated_at_page_layout_settings ON public.page_layout_settings;
CREATE TRIGGER set_updated_at_page_layout_settings
  BEFORE UPDATE ON public.page_layout_settings
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

ALTER TABLE public.page_layout_settings ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS page_layout_settings_public_read ON public.page_layout_settings;
CREATE POLICY page_layout_settings_public_read ON public.page_layout_settings
  FOR SELECT USING (true);

DROP POLICY IF EXISTS page_layout_settings_admin ON public.page_layout_settings;
CREATE POLICY page_layout_settings_admin ON public.page_layout_settings
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.id = auth.uid()
        AND p.role IN ('admin', 'content_editor')
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.id = auth.uid()
        AND p.role IN ('admin', 'content_editor')
    )
  );

ALTER TABLE public.cms_banners
  ADD COLUMN IF NOT EXISTS desktop_image_url TEXT,
  ADD COLUMN IF NOT EXISTS mobile_image_url TEXT,
  ADD COLUMN IF NOT EXISTS focus_position TEXT DEFAULT 'center',
  ADD COLUMN IF NOT EXISTS cta_text TEXT;

-- Seed desktop home sections (idempotent)
INSERT INTO public.page_layout_settings (
  page_key, platform, section_key, enabled, sort_order, layout_type, columns, display_limit, settings_json
) VALUES
  ('home', 'desktop', 'hero', true, 1, 'full_width', 1, 5,
   '{"title":"Hero Banner","showTitle":false,"heroRatio":"5:2","heroMaxHeight":600,"focusPosition":"center","useDesktopImage":false}'::jsonb),
  ('home', 'desktop', 'search', true, 2, 'search', 1, 1,
   '{"title":"搜尋","showTitle":false}'::jsonb),
  ('home', 'desktop', 'quick_services', true, 3, 'icon_row', 8, 8,
   '{"title":"常用服務","showTitle":true,"gap":24}'::jsonb),
  ('home', 'desktop', 'latest_campaigns', true, 4, 'grid', 3, 6,
   '{"title":"最新活動","showTitle":true,"showViewAll":true,"viewAllUrl":"/articles?category=%E5%84%AA%E6%83%A0%E6%B4%BB%E5%8B%95","gap":24}'::jsonb),
  ('home', 'desktop', 'featured_recipes', true, 5, 'grid', 4, 8,
   '{"title":"精選食譜","showTitle":true,"showViewAll":true,"viewAllUrl":"/recipes","imageRatio":"4:3","showPrepTime":true,"showDifficulty":true,"showFavorite":true,"gap":24}'::jsonb),
  ('home', 'desktop', 'ingredient_shop', true, 6, 'grid', 5, 10,
   '{"title":"一鍵買齊材料","showTitle":true,"showViewAll":true,"viewAllUrl":"/shop","cardStyle":"standard","showName":true,"showSpec":true,"showPrice":true,"showFavorite":true,"showAddToCart":true,"gap":20}'::jsonb),
  ('home', 'desktop', 'popular_products', true, 7, 'grid', 5, 10,
   '{"title":"熱門商品","showTitle":true,"showViewAll":true,"viewAllUrl":"/shop/popular","productSource":"popular","cardStyle":"standard","showName":true,"showSpec":true,"showPrice":true,"showFavorite":true,"showAddToCart":true,"gap":20}'::jsonb),
  ('home', 'desktop', 'shop_features', true, 8, 'feature_row', 4, 4,
   '{"title":"商城特色","showTitle":true}'::jsonb),
  ('shop', 'desktop', 'sidebar_filters', true, 1, 'sidebar', 1, 1,
   '{"title":"篩選","showTitle":true}'::jsonb),
  ('shop', 'desktop', 'product_grid', true, 2, 'grid', 4, 24,
   '{"title":"商品列表","showTitle":false,"cardStyle":"standard"}'::jsonb),
  ('recipes', 'desktop', 'hero', true, 1, 'full_width', 1, 1,
   '{"title":"食譜 Hero","showTitle":false}'::jsonb),
  ('recipes', 'desktop', 'recipe_grid', true, 2, 'grid', 4, 12,
   '{"title":"食譜列表","showTitle":false,"imageRatio":"4:3"}'::jsonb),
  ('member', 'desktop', 'sidebar', true, 1, 'sidebar', 1, 1,
   '{"title":"會員選單","showTitle":true}'::jsonb),
  ('member', 'desktop', 'dashboard', true, 2, 'dashboard', 1, 1,
   '{"title":"會員總覽","showTitle":true}'::jsonb)
ON CONFLICT (page_key, platform, section_key) DO NOTHING;

-- Read-only mobile mirrors (do not change existing mobile CMS behaviour)
INSERT INTO public.page_layout_settings (
  page_key, platform, section_key, enabled, sort_order, layout_type, columns, display_limit, settings_json
) VALUES
  ('home', 'mobile', 'featured_recipes', true, 5, 'carousel', NULL, 6,
   '{"title":"精選食譜","layout":"carousel","peek":0.18,"gap":12}'::jsonb),
  ('home', 'mobile', 'ingredient_shop', true, 6, 'carousel', NULL, 8,
   '{"title":"一鍵買齊材料","layout":"carousel","gap":12}'::jsonb)
ON CONFLICT (page_key, platform, section_key) DO NOTHING;
