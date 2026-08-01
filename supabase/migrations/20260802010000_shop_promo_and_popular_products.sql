-- Shop 5:2 promo banners + popular products fields

ALTER TABLE public.cms_banners
  ADD COLUMN IF NOT EXISTS link_type text;

COMMENT ON COLUMN public.cms_banners.link_type IS 'product | category | page | article | external';

ALTER TABLE public.products
  ADD COLUMN IF NOT EXISTS is_popular boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS popular_sort_order integer NOT NULL DEFAULT 0;

CREATE INDEX IF NOT EXISTS products_is_popular_sort_idx
  ON public.products (is_popular, popular_sort_order)
  WHERE is_popular = true;

INSERT INTO public.cms_banners (
  title, subtitle, image_url, mobile_image_url, link_url, button_text,
  placement, banner_type, status, is_active, sort_order, link_type
)
SELECT * FROM (VALUES
  ('本月活動', '滿額免運、滿額折扣', NULL::text, NULL::text, '/shop/categories', '立即逛逛', 'shop_promo', 'shop_promo', 'active', true, 10, 'page'),
  ('新品到貨', '新品牌、新材料、新器具', NULL::text, NULL::text, '/shop/categories?sort=newest', '看新品', 'shop_promo', 'shop_promo', 'active', true, 20, 'page'),
  ('品牌優惠', '精選品牌限時優惠', NULL::text, NULL::text, '/shop/categories', '看優惠', 'shop_promo', 'shop_promo', 'active', true, 30, 'category'),
  ('季節烘焙專區', '中秋、聖誕、母親節、夏季甜點', NULL::text, NULL::text, '/shop/categories', '進入專區', 'shop_promo', 'shop_promo', 'active', true, 40, 'page')
) AS v(title, subtitle, image_url, mobile_image_url, link_url, button_text, placement, banner_type, status, is_active, sort_order, link_type)
WHERE NOT EXISTS (
  SELECT 1 FROM public.cms_banners b WHERE b.placement = 'shop_promo'
);

UPDATE public.products
SET is_popular = true,
    popular_sort_order = COALESCE(sort_order, 0)
WHERE COALESCE(is_hot, false) = true
  AND is_popular = false;
