-- Shop hero banners use cms_banners with placement/banner_type = shop_hero
-- (do not create a second banners table)

ALTER TABLE cms_banners
  ADD COLUMN IF NOT EXISTS mobile_image_url TEXT,
  ADD COLUMN IF NOT EXISTS button_text TEXT,
  ADD COLUMN IF NOT EXISTS placement TEXT DEFAULT 'home_weekly_promo',
  ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'active',
  ADD COLUMN IF NOT EXISTS banner_type TEXT;

COMMENT ON COLUMN cms_banners.banner_type IS 'Logical type alias e.g. shop_hero; placement remains primary filter';

CREATE INDEX IF NOT EXISTS banners_type_active_sort_idx
  ON cms_banners (COALESCE(banner_type, placement), is_active, sort_order);

CREATE INDEX IF NOT EXISTS idx_cms_banners_placement_active_sort
  ON cms_banners (placement, is_active, sort_order);

INSERT INTO cms_banners (
  title,
  subtitle,
  image_url,
  mobile_image_url,
  link_url,
  button_text,
  placement,
  banner_type,
  status,
  sort_order,
  is_active
)
SELECT
  '烘焙好物商城',
  '精選超過 4,000 項商品，材料、器具、包裝一次購足',
  '/images/shop/hero-desktop.jpg',
  '/images/shop/hero-mobile.jpg',
  '/baking-materials',
  '立即逛商城',
  'shop_hero',
  'shop_hero',
  'active',
  0,
  true
WHERE NOT EXISTS (
  SELECT 1 FROM cms_banners
  WHERE placement = 'shop_hero' OR banner_type = 'shop_hero'
);
