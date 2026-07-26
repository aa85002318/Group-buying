-- App promo price + monochrome price-label templates (simple / app_month / sale)

ALTER TABLE products
  ADD COLUMN IF NOT EXISTS app_price NUMERIC;

COMMENT ON COLUMN products.app_price IS '本月 App 優惠價（價格牌／促銷用，獨立於 sale_price）';

-- Expand style_variant for new monochrome presets
ALTER TABLE label_templates DROP CONSTRAINT IF EXISTS label_templates_style_variant_check;
ALTER TABLE label_templates
  ADD CONSTRAINT label_templates_style_variant_check
  CHECK (style_variant IN ('standard', 'sale', 'vip', 'wholesale', 'minimal', 'simple', 'app_month'));

ALTER TABLE label_templates
  ADD COLUMN IF NOT EXISTS monochrome BOOLEAN NOT NULL DEFAULT false;

-- Move classic colorful "sale" aside so code `sale` is the B/W 特價版
UPDATE label_templates
SET code = 'sale_classic',
    name = '特價（經典）',
    monochrome = false
WHERE code = 'sale' AND COALESCE(monochrome, false) = false;

INSERT INTO label_templates (
  name, code, width_mm, height_mm,
  show_name, show_price, show_barcode, show_weight, show_spec, show_brand, show_sku,
  show_qrcode, show_promo_text, show_logo, show_origin,
  name_font_size, price_font_size, barcode_font_size, price_font_weight,
  barcode_type, style_variant, promo_text, is_default, is_system, sort_order, monochrome
) VALUES
  ('簡約版', 'simple', 70, 30,
   true, true, true, true, true, false, false,
   false, false, false, false,
   11, 22, 8, 'black',
   'CODE128', 'simple', NULL, true, true, 0, true),
  ('本月 App 優惠版', 'app_month', 70, 30,
   true, true, true, true, true, false, false,
   false, true, false, false,
   11, 22, 8, 'black',
   'CODE128', 'app_month', '本月 APP 優惠', false, true, 0, true),
  ('特價版', 'sale', 70, 30,
   true, true, true, true, true, false, false,
   false, true, false, false,
   11, 22, 8, 'black',
   'CODE128', 'sale', '特價', false, true, 0, true)
ON CONFLICT (code) DO UPDATE SET
  name = EXCLUDED.name,
  width_mm = EXCLUDED.width_mm,
  height_mm = EXCLUDED.height_mm,
  monochrome = true,
  style_variant = EXCLUDED.style_variant,
  promo_text = EXCLUDED.promo_text,
  show_logo = false,
  show_origin = false,
  updated_at = now();

-- Prefer simple as default among system templates
UPDATE label_templates SET is_default = false WHERE is_default = true;
UPDATE label_templates SET is_default = true WHERE code = 'simple';
