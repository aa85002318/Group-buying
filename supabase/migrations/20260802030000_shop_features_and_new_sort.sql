-- Shop home feature blocks + product hot/new sort orders

CREATE TABLE IF NOT EXISTS public.shop_features (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  icon text NOT NULL DEFAULT 'truck',
  title text NOT NULL,
  subtitle text NOT NULL DEFAULT '',
  link_type text NOT NULL DEFAULT 'internal'
    CHECK (link_type IN ('internal', 'external')),
  link_url text NOT NULL DEFAULT '/',
  background_color text NOT NULL DEFAULT '#E8F3FF',
  sort_order integer NOT NULL DEFAULT 1,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS shop_features_active_sort_idx
  ON public.shop_features (is_active, sort_order);

ALTER TABLE public.products
  ADD COLUMN IF NOT EXISTS hot_sort_order integer NOT NULL DEFAULT 100,
  ADD COLUMN IF NOT EXISTS new_sort_order integer NOT NULL DEFAULT 100;

CREATE INDEX IF NOT EXISTS products_is_hot_sort_idx
  ON public.products (is_hot, hot_sort_order)
  WHERE is_hot = true;

CREATE INDEX IF NOT EXISTS products_is_new_sort_idx
  ON public.products (is_new, new_sort_order)
  WHERE is_new = true;

-- Seed 3 default feature blocks if empty
INSERT INTO public.shop_features (icon, title, subtitle, link_type, link_url, background_color, sort_order, is_active)
SELECT * FROM (VALUES
  ('truck', '滿額 $1500 免運', '全程冷鏈配送', 'internal', '/shop/categories', '#E8F3FF', 1, true),
  ('shield', '快速出貨', '天天出貨更安心', 'internal', '/support/shipping', '#FFF5E6', 2, true),
  ('gift', '會員專屬優惠', '點數回饋折抵', 'internal', '/member/benefits', '#FFEFE2', 3, true)
) AS v(icon, title, subtitle, link_type, link_url, background_color, sort_order, is_active)
WHERE NOT EXISTS (SELECT 1 FROM public.shop_features LIMIT 1);

-- Align existing hot/new flags with sort defaults from popular_sort_order when present
UPDATE public.products
SET hot_sort_order = COALESCE(NULLIF(popular_sort_order, 0), hot_sort_order)
WHERE is_hot = true OR is_popular = true;

ALTER TABLE public.shop_features ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  CREATE POLICY shop_features_public_read ON public.shop_features
    FOR SELECT USING (is_active = true);
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE POLICY shop_features_admin_all ON public.shop_features
    FOR ALL USING (
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
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;
