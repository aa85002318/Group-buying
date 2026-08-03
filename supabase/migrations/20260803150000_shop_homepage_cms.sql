-- Shop homepage CMS phase A–C
-- 1) Feature blocks: banner image
-- 2) Recipes: inspiration full-bleed banner
-- 3) Recipe categories: wall image + flags
-- 4) Info banners: order guide + corporate (cms_banners placements)

-- ── shop_features.image_url ──────────────────────────────────────────
ALTER TABLE public.shop_features
  ADD COLUMN IF NOT EXISTS image_url text;

ALTER TABLE public.shop_features
  ALTER COLUMN title DROP NOT NULL;

ALTER TABLE public.shop_features
  ALTER COLUMN title SET DEFAULT '';

COMMENT ON COLUMN public.shop_features.image_url IS 'Shop home 3-slot feature banner image (preferred over icon+text)';

-- ── recipes.inspiration_banner_url ───────────────────────────────────
ALTER TABLE public.recipes
  ADD COLUMN IF NOT EXISTS inspiration_banner_url text;

UPDATE public.recipes
SET inspiration_use_ip_image = false
WHERE inspiration_use_ip_image IS DISTINCT FROM false;

COMMENT ON COLUMN public.recipes.inspiration_banner_url IS 'Full-bleed banner for featured inspiration card (preferred over IP logo)';

-- ── recipe_categories wall fields ────────────────────────────────────
ALTER TABLE public.recipe_categories
  ADD COLUMN IF NOT EXISTS image_url text,
  ADD COLUMN IF NOT EXISTS show_on_inspiration_wall boolean NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS inspiration_sort_order integer NOT NULL DEFAULT 100;

COMMENT ON COLUMN public.recipe_categories.image_url IS 'Circular icon / top image for inspiration wall category menu';
COMMENT ON COLUMN public.recipe_categories.show_on_inspiration_wall IS 'Show on /shop inspiration wall category menu';
COMMENT ON COLUMN public.recipe_categories.inspiration_sort_order IS 'Sort order on inspiration wall ASC';

CREATE INDEX IF NOT EXISTS recipe_categories_inspiration_wall_idx
  ON public.recipe_categories (show_on_inspiration_wall, inspiration_sort_order)
  WHERE show_on_inspiration_wall = true AND is_active = true;

-- Seed wall flags for existing categories
UPDATE public.recipe_categories
SET show_on_inspiration_wall = true
WHERE is_active = true;

-- ── cms_banners: shop_order_guide + shop_corporate ───────────────────
INSERT INTO public.cms_banners (
  title,
  subtitle,
  image_url,
  mobile_image_url,
  link_url,
  button_text,
  placement,
  banner_type,
  link_type,
  alt_text,
  is_active,
  status,
  sort_order
)
SELECT
  v.title,
  v.subtitle,
  v.image_url,
  v.image_url,
  v.link_url,
  v.button_text,
  v.placement,
  v.placement,
  'page',
  v.alt_text,
  true,
  'active',
  v.sort_order
FROM (VALUES
  (
    '商品訂購須知',
    '了解訂購流程與注意事項',
    '/images/shop/banners/order-guide.jpg',
    '/help/order-guide',
    '了解更多',
    'shop_order_guide',
    '商品訂購須知',
    10
  ),
  (
    '企業訂購詢問',
    '大宗採購與企業合作',
    '/images/shop/banners/corporate.jpg',
    '/contact/business',
    '立即聯繫',
    'shop_corporate',
    '企業訂購詢問',
    20
  )
) AS v(title, subtitle, image_url, link_url, button_text, placement, alt_text, sort_order)
WHERE NOT EXISTS (
  SELECT 1 FROM public.cms_banners b WHERE b.placement = v.placement
);
