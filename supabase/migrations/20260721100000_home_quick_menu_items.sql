-- Home quick menu (Banner 下方橫向快捷選單)
-- Safe to re-run.

CREATE TABLE IF NOT EXISTS public.home_quick_menu_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  icon_url TEXT,
  icon_key TEXT,
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

CREATE INDEX IF NOT EXISTS idx_home_quick_menu_items_sort
  ON public.home_quick_menu_items (sort_order ASC);

CREATE INDEX IF NOT EXISTS idx_home_quick_menu_items_active_sort
  ON public.home_quick_menu_items (is_active, sort_order ASC);

DROP TRIGGER IF EXISTS set_updated_at ON public.home_quick_menu_items;
CREATE TRIGGER set_updated_at
  BEFORE UPDATE ON public.home_quick_menu_items
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

ALTER TABLE public.home_quick_menu_items ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS home_quick_menu_items_public_read ON public.home_quick_menu_items;
CREATE POLICY home_quick_menu_items_public_read
  ON public.home_quick_menu_items
  FOR SELECT
  USING (is_active = true OR public.is_admin());

DROP POLICY IF EXISTS home_quick_menu_items_admin_all ON public.home_quick_menu_items;
CREATE POLICY home_quick_menu_items_admin_all
  ON public.home_quick_menu_items
  FOR ALL
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

-- Seed CHIMEIDIY 8 項（僅在表格為空時寫入）
INSERT INTO public.home_quick_menu_items
  (title, icon_key, link_url, link_target, alt_text, sort_order, is_active)
SELECT * FROM (VALUES
  ('烘焙材料', 'package', '/shop', '_self', '烘焙材料', 10, true),
  ('團購', 'users', '/group-buy', '_self', '團購', 20, true),
  ('食譜影音', 'chef-hat', '/recipes', '_self', '食譜影音', 30, true),
  ('會員中心', 'badge-check', '/member', '_self', '會員中心', 40, true),
  ('AI 助手', 'sparkles', '/ai-tools', '_self', 'AI 助手', 50, true),
  ('門市地圖', 'map-pin', '/store-map', '_self', '門市地圖', 60, true),
  ('優惠活動', 'percent', '/shop?promo=1', '_self', '優惠活動', 70, true),
  ('最新消息', 'newspaper', '/news', '_self', '最新消息', 80, true)
) AS seed(title, icon_key, link_url, link_target, alt_text, sort_order, is_active)
WHERE NOT EXISTS (SELECT 1 FROM public.home_quick_menu_items LIMIT 1);
