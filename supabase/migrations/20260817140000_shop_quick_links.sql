-- Shop version C: quick links + home CMS extras

CREATE TABLE IF NOT EXISTS public.shop_quick_links (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  subtitle TEXT,
  icon_type TEXT NOT NULL DEFAULT 'system_icon'
    CHECK (icon_type IN ('system_icon', 'custom_image')),
  icon_key TEXT NOT NULL DEFAULT 'percent',
  icon_image_url TEXT,
  icon_image_path TEXT,
  background_color TEXT NOT NULL DEFAULT '#FFFFFF'
    CHECK (background_color ~ '^#[0-9A-Fa-f]{6}$'),
  text_color TEXT NOT NULL DEFAULT '#153E73'
    CHECK (text_color ~ '^#[0-9A-Fa-f]{6}$'),
  badge_text TEXT,
  badge_color TEXT,
  target_type TEXT NOT NULL DEFAULT 'internal_page'
    CHECK (target_type IN ('category', 'product', 'article', 'internal_page', 'external_url')),
  target_url TEXT NOT NULL DEFAULT '/',
  sort_order INTEGER NOT NULL DEFAULT 10,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_shop_quick_links_active
  ON public.shop_quick_links (is_active, sort_order);

ALTER TABLE public.shop_quick_links ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS shop_quick_links_public_read ON public.shop_quick_links;
CREATE POLICY shop_quick_links_public_read ON public.shop_quick_links
  FOR SELECT USING (is_active = true);

DROP POLICY IF EXISTS shop_quick_links_staff ON public.shop_quick_links;
CREATE POLICY shop_quick_links_staff ON public.shop_quick_links FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.id = auth.uid() AND p.role IN ('admin', 'content_editor')
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.id = auth.uid() AND p.role IN ('admin', 'content_editor')
    )
  );

INSERT INTO public.shop_quick_links
  (title, subtitle, icon_key, badge_text, badge_color, target_type, target_url, sort_order)
SELECT * FROM (VALUES
  ('本週優惠', NULL, 'percent', 'HOT', '#F16458', 'internal_page', '/group-buy', 10),
  ('新品上架', NULL, 'bag', NULL, NULL, 'internal_page', '/shop/new-arrivals', 20),
  ('熱銷排行', NULL, 'flame', NULL, NULL, 'internal_page', '/shop/popular', 30),
  ('組合優惠', NULL, 'gift', NULL, NULL, 'internal_page', '/group-buy', 40)
) AS v(title, subtitle, icon_key, badge_text, badge_color, target_type, target_url, sort_order)
WHERE NOT EXISTS (SELECT 1 FROM public.shop_quick_links LIMIT 1);

ALTER TABLE public.shop_home_settings
  ADD COLUMN IF NOT EXISTS shop_title TEXT NOT NULL DEFAULT '商城',
  ADD COLUMN IF NOT EXISTS product_blocks JSONB NOT NULL DEFAULT '{
    "popular": {"visible": true, "title": "熱門商品", "limit": 10, "sort": "hot"},
    "new": {"visible": true, "title": "新品上架", "limit": 10, "sort": "new"},
    "featured": {"visible": false, "title": "精選商品", "limit": 8, "sort": "featured"}
  }'::jsonb;

ALTER TABLE public.products
  ADD COLUMN IF NOT EXISTS new_until TIMESTAMPTZ;

GRANT SELECT ON public.shop_quick_links TO anon, authenticated;
GRANT INSERT, UPDATE, DELETE ON public.shop_quick_links TO authenticated;
