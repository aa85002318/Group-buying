-- Home feature duo cards (快捷選單下方：AI 助手／直播資訊)
-- Safe to re-run.

CREATE TABLE IF NOT EXISTS public.home_feature_duo_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slot_key TEXT NOT NULL UNIQUE,
  title TEXT NOT NULL,
  image_url TEXT,
  link_url TEXT NOT NULL,
  link_target TEXT NOT NULL DEFAULT '_self'
    CHECK (link_target IN ('_self', '_blank')),
  alt_text TEXT,
  notes TEXT,
  sort_order INT NOT NULL DEFAULT 0,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  updated_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_home_feature_duo_items_sort
  ON public.home_feature_duo_items (sort_order ASC);

CREATE INDEX IF NOT EXISTS idx_home_feature_duo_items_active_sort
  ON public.home_feature_duo_items (is_active, sort_order ASC);

DROP TRIGGER IF EXISTS set_updated_at ON public.home_feature_duo_items;
CREATE TRIGGER set_updated_at
  BEFORE UPDATE ON public.home_feature_duo_items
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

ALTER TABLE public.home_feature_duo_items ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS home_feature_duo_items_public_read ON public.home_feature_duo_items;
CREATE POLICY home_feature_duo_items_public_read
  ON public.home_feature_duo_items
  FOR SELECT
  USING (is_active = true OR public.is_admin());

DROP POLICY IF EXISTS home_feature_duo_items_admin_all ON public.home_feature_duo_items;
CREATE POLICY home_feature_duo_items_admin_all
  ON public.home_feature_duo_items
  FOR ALL
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

-- Seed 兩張預設卡片（僅在表格為空時寫入）
INSERT INTO public.home_feature_duo_items
  (slot_key, title, image_url, link_url, link_target, alt_text, sort_order, is_active)
SELECT * FROM (VALUES
  (
    'ai',
    'AI 助手',
    '/branding/feature-duo-ai.png',
    '/ai-tools',
    '_self',
    'AI 助手',
    10,
    true
  ),
  (
    'live',
    '直播資訊',
    '/branding/feature-duo-live.png',
    '/live',
    '_self',
    '直播資訊',
    20,
    true
  )
) AS seed(slot_key, title, image_url, link_url, link_target, alt_text, sort_order, is_active)
WHERE NOT EXISTS (SELECT 1 FROM public.home_feature_duo_items LIMIT 1);
