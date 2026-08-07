-- Extend existing product_images for main / gallery / content.
-- Keep products.image_url + products.images in sync via app layer (backward compatible).
-- Additive only; do not drop columns.

ALTER TABLE public.product_images
  ADD COLUMN IF NOT EXISTS image_type TEXT NOT NULL DEFAULT 'gallery',
  ADD COLUMN IF NOT EXISTS caption TEXT,
  ADD COLUMN IF NOT EXISTS width_mode TEXT NOT NULL DEFAULT 'full',
  ADD COLUMN IF NOT EXISTS is_active BOOLEAN NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW();

DO $$
BEGIN
  ALTER TABLE public.product_images
    DROP CONSTRAINT IF EXISTS product_images_image_type_check;
  ALTER TABLE public.product_images
    ADD CONSTRAINT product_images_image_type_check
    CHECK (image_type IN ('main', 'gallery', 'content'));
EXCEPTION
  WHEN undefined_table THEN NULL;
END $$;

DO $$
BEGIN
  ALTER TABLE public.product_images
    DROP CONSTRAINT IF EXISTS product_images_width_mode_check;
  ALTER TABLE public.product_images
    ADD CONSTRAINT product_images_width_mode_check
    CHECK (width_mode IN ('full', 'three_quarters', 'half'));
EXCEPTION
  WHEN undefined_table THEN NULL;
END $$;

-- One active main image per product
DROP INDEX IF EXISTS public.uq_product_images_one_cover;
CREATE UNIQUE INDEX IF NOT EXISTS uq_product_images_one_main
  ON public.product_images (product_id)
  WHERE image_type = 'main' AND is_active = true;

CREATE INDEX IF NOT EXISTS idx_product_images_product_type
  ON public.product_images (product_id, image_type);

CREATE INDEX IF NOT EXISTS idx_product_images_product_type_sort
  ON public.product_images (product_id, image_type, sort_order);

-- Backfill image_type from is_cover when present
UPDATE public.product_images
SET image_type = 'main'
WHERE COALESCE(is_cover, false) = true
  AND (image_type IS NULL OR image_type = 'gallery');

-- Manual related rails on product (soft-fail in API if missing)
ALTER TABLE public.products
  ADD COLUMN IF NOT EXISTS related_recipe_ids UUID[] DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS related_product_ids UUID[] DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS content_images JSONB NOT NULL DEFAULT '[]'::jsonb;

COMMENT ON COLUMN public.products.related_recipe_ids IS 'PDP「用這項材料做什麼」手動指定食譜';
COMMENT ON COLUMN public.products.related_product_ids IS 'PDP「經常一起購買」手動指定商品';
COMMENT ON COLUMN public.products.content_images IS
  '商品介紹內容圖 [{url,alt_text,caption,width_mode,sort_order}]；與 product_images.content 雙寫';

COMMENT ON COLUMN public.product_images.image_type IS 'main | gallery | content';
COMMENT ON COLUMN public.product_images.width_mode IS 'full | three_quarters | half（桌面；手機一律滿版）';
