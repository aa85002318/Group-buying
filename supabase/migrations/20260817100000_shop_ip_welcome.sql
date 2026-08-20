-- Shop IP welcome CMS: singleton settings, popular keywords, cms-assets bucket

-- ---------------------------------------------------------------------------
-- Storage: cms-assets (PNG / JPEG / WebP, public read)
-- ---------------------------------------------------------------------------
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'cms-assets',
  'cms-assets',
  true,
  5242880,
  ARRAY['image/png', 'image/jpeg', 'image/webp']::text[]
)
ON CONFLICT (id) DO UPDATE
SET
  public = EXCLUDED.public,
  file_size_limit = EXCLUDED.file_size_limit,
  allowed_mime_types = EXCLUDED.allowed_mime_types;

DROP POLICY IF EXISTS cms_assets_public_read ON storage.objects;
CREATE POLICY cms_assets_public_read
  ON storage.objects FOR SELECT
  USING (bucket_id = 'cms-assets');

DROP POLICY IF EXISTS cms_assets_admin_write ON storage.objects;
CREATE POLICY cms_assets_admin_write
  ON storage.objects FOR ALL
  USING (
    bucket_id = 'cms-assets'
    AND EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.id = auth.uid() AND p.role IN ('admin', 'content_editor')
    )
  )
  WITH CHECK (
    bucket_id = 'cms-assets'
    AND EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.id = auth.uid() AND p.role IN ('admin', 'content_editor')
    )
  );

-- ---------------------------------------------------------------------------
-- shop_home_settings (singleton)
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.shop_home_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  singleton_key TEXT NOT NULL DEFAULT 'main',
  show_welcome_section BOOLEAN NOT NULL DEFAULT true,
  welcome_eyebrow TEXT NOT NULL DEFAULT '歡迎來到',
  welcome_title TEXT NOT NULL DEFAULT 'CHIMEiDIY',
  welcome_subtitle TEXT NOT NULL DEFAULT '烘焙材料這裡都有！
一起享受烘焙的快樂時光 ✨',
  welcome_background_color TEXT NOT NULL DEFAULT '#FFD454'
    CHECK (welcome_background_color ~ '^#[0-9A-Fa-f]{6}$'),
  mascot_image_url TEXT,
  mascot_image_path TEXT,
  mascot_alt TEXT,
  mascot_width INTEGER,
  mascot_height INTEGER,
  mascot_file_size INTEGER,
  mascot_size TEXT NOT NULL DEFAULT 'M'
    CHECK (mascot_size IN ('S', 'M', 'L')),
  mascot_position TEXT NOT NULL DEFAULT 'left'
    CHECK (mascot_position IN ('left', 'center', 'right')),
  search_placeholder TEXT NOT NULL DEFAULT '搜尋商品、食譜、烘焙材料…',
  show_popular_keywords BOOLEAN NOT NULL DEFAULT true,
  decoration_1_url TEXT,
  decoration_2_url TEXT,
  decoration_3_url TEXT,
  decorations JSONB NOT NULL DEFAULT '[]'::jsonb,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  CONSTRAINT shop_home_settings_singleton UNIQUE (singleton_key)
);

INSERT INTO public.shop_home_settings (singleton_key)
VALUES ('main')
ON CONFLICT (singleton_key) DO NOTHING;

ALTER TABLE public.shop_home_settings ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS shop_home_settings_public_read ON public.shop_home_settings;
CREATE POLICY shop_home_settings_public_read ON public.shop_home_settings
  FOR SELECT USING (true);

DROP POLICY IF EXISTS shop_home_settings_staff ON public.shop_home_settings;
CREATE POLICY shop_home_settings_staff ON public.shop_home_settings FOR ALL
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

-- ---------------------------------------------------------------------------
-- shop_popular_keywords
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.shop_popular_keywords (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  keyword TEXT NOT NULL,
  url TEXT,
  sort_order INTEGER NOT NULL DEFAULT 0,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_shop_popular_keywords_active
  ON public.shop_popular_keywords (is_active, sort_order);

ALTER TABLE public.shop_popular_keywords ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS shop_popular_keywords_public_read ON public.shop_popular_keywords;
CREATE POLICY shop_popular_keywords_public_read ON public.shop_popular_keywords
  FOR SELECT USING (is_active = true);

DROP POLICY IF EXISTS shop_popular_keywords_staff ON public.shop_popular_keywords;
CREATE POLICY shop_popular_keywords_staff ON public.shop_popular_keywords FOR ALL
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

INSERT INTO public.shop_popular_keywords (keyword, url, sort_order, is_active)
SELECT v.keyword, v.url, v.sort_order, true
FROM (VALUES
  ('低筋麵粉', '/shop/search?q=%E4%BD%8E%E7%AD%8B%E9%BA%B5%E7%B2%89', 10),
  ('鮮奶油', '/shop/search?q=%E9%AE%AE%E5%A5%B6%E6%B2%B9', 20),
  ('巧克力', '/shop/search?q=%E5%B7%A7%E5%85%8B%E5%8A%9B', 30),
  ('奶油', '/shop/search?q=%E5%A5%B6%E6%B2%B9', 40),
  ('蛋糕模', '/shop/search?q=%E8%9B%8B%E7%B3%95%E6%A8%A1', 50)
) AS v(keyword, url, sort_order)
WHERE NOT EXISTS (SELECT 1 FROM public.shop_popular_keywords LIMIT 1);
