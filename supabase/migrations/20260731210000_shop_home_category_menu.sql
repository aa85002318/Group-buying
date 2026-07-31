-- Shop home circular category menu fields on product_categories.
-- 「全部分類」 is frontend-only and must not be stored.

ALTER TABLE product_categories
  ADD COLUMN IF NOT EXISTS show_on_shop_home boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS shop_home_sort_order integer NOT NULL DEFAULT 100,
  ADD COLUMN IF NOT EXISTS shop_home_icon text,
  ADD COLUMN IF NOT EXISTS shop_home_bg_color text;

COMMENT ON COLUMN product_categories.show_on_shop_home IS 'Show in /shop home circular category menu (max 8)';
COMMENT ON COLUMN product_categories.shop_home_sort_order IS 'Sort order for shop home category menu ASC';
COMMENT ON COLUMN product_categories.shop_home_icon IS 'Optional icon image URL for shop home menu';
COMMENT ON COLUMN product_categories.shop_home_bg_color IS 'Pastel circle background hex for shop home menu';

-- Seed known baking category slugs when present
UPDATE product_categories SET
  show_on_shop_home = true,
  shop_home_sort_order = CASE slug
    WHEN 'flour' THEN 10
    WHEN 'dairy' THEN 20
    WHEN 'chocolate' THEN 30
    WHEN 'packaging' THEN 40
    WHEN 'tools' THEN 60
    WHEN 'frozen-goods' THEN 70
    WHEN 'ingredients' THEN 80
    ELSE shop_home_sort_order
  END,
  shop_home_bg_color = CASE slug
    WHEN 'flour' THEN '#FFF5D9'
    WHEN 'dairy' THEN '#FFF5D9'
    WHEN 'chocolate' THEN '#FFE8E8'
    WHEN 'packaging' THEN '#FFF0E2'
    WHEN 'tools' THEN '#EEE9FF'
    WHEN 'frozen-goods' THEN '#DFF3FF'
    WHEN 'ingredients' THEN '#FFE5E5'
    ELSE COALESCE(shop_home_bg_color, '#F1F2F7')
  END,
  shop_home_icon = CASE slug
    WHEN 'flour' THEN '/images/shop/categories/flour.png'
    WHEN 'dairy' THEN '/images/shop/categories/butter.png'
    WHEN 'chocolate' THEN '/images/shop/categories/chocolate.png'
    WHEN 'packaging' THEN '/images/shop/categories/packaging.png'
    WHEN 'tools' THEN '/images/shop/categories/baking-tools.png'
    WHEN 'frozen-goods' THEN '/images/shop/categories/frozen.png'
    WHEN 'ingredients' THEN '/images/shop/categories/food.png'
    ELSE shop_home_icon
  END
WHERE slug IN ('flour', 'dairy', 'chocolate', 'packaging', 'tools', 'frozen-goods', 'ingredients')
  AND COALESCE(is_active, true) = true;
