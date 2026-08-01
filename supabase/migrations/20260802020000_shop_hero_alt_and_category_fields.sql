-- Shop hero: reuse cms_banners (placement shop_hero). Add alt_text + link_target.
-- Categories: extend product_categories for main-category / custom link flags.

ALTER TABLE cms_banners
  ADD COLUMN IF NOT EXISTS alt_text text NOT NULL DEFAULT '',
  ADD COLUMN IF NOT EXISTS link_target text NOT NULL DEFAULT '_self';

DO $$ BEGIN
  ALTER TABLE cms_banners
    ADD CONSTRAINT cms_banners_link_target_check
    CHECK (link_target IN ('_self', '_blank'));
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

CREATE INDEX IF NOT EXISTS cms_banners_shop_hero_active_sort_idx
  ON cms_banners (is_active, sort_order)
  WHERE placement = 'shop_hero' OR banner_type = 'shop_hero';

ALTER TABLE product_categories
  ADD COLUMN IF NOT EXISTS is_main_category boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS custom_link text;

UPDATE product_categories
SET is_main_category = true
WHERE show_on_shop_home = true;

DO $$ BEGIN
  ALTER TABLE product_categories
    ADD CONSTRAINT product_categories_shop_home_bg_color_check
    CHECK (
      shop_home_bg_color IS NULL
      OR shop_home_bg_color ~ '^#[0-9A-Fa-f]{6}$'
    );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

UPDATE cms_banners
SET
  alt_text = COALESCE(NULLIF(alt_text, ''), title),
  updated_at = now()
WHERE (placement = 'shop_hero' OR banner_type = 'shop_hero')
  AND (alt_text IS NULL OR alt_text = '');
