-- Extend product_variants for multi-spec SKU matrix (backward compatible).
-- Option groups live on products.variant_option_groups JSONB.

ALTER TABLE public.product_variants
  ADD COLUMN IF NOT EXISTS image_url TEXT;

ALTER TABLE public.products
  ADD COLUMN IF NOT EXISTS variant_option_groups JSONB NOT NULL DEFAULT '[]'::jsonb;

COMMENT ON COLUMN public.products.variant_option_groups IS
  '[{id,name,sort_order,values:[{id,label,sort_order}]}] — UI option groups for SKU matrix';
COMMENT ON COLUMN public.product_variants.option_values IS
  'Map of optionGroupId -> optionValueId (or name->label for legacy)';
COMMENT ON COLUMN public.product_variants.image_url IS
  'Optional per-variant image; falls back to product main image on storefront';
