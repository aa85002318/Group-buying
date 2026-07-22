-- Remove feature duo cards from homepage CMS

DELETE FROM public.homepage_blocks WHERE block_key = 'feature_duo';

DROP POLICY IF EXISTS home_feature_duo_items_public_read ON public.home_feature_duo_items;
DROP POLICY IF EXISTS home_feature_duo_items_admin_all ON public.home_feature_duo_items;
DROP TRIGGER IF EXISTS set_updated_at ON public.home_feature_duo_items;
DROP TABLE IF EXISTS public.home_feature_duo_items;

-- Articles: pin / featured for homepage 最新資訊
ALTER TABLE public.articles
  ADD COLUMN IF NOT EXISTS is_featured BOOLEAN NOT NULL DEFAULT false;

CREATE INDEX IF NOT EXISTS idx_articles_featured_sort
  ON public.articles (is_featured DESC, sort_order ASC, created_at DESC);
