-- Unify storefront URLs: retire public /baking-materials in favor of /shop

-- Homepage CMS blocks
UPDATE public.homepage_blocks
SET view_all_url = '/shop/categories'
WHERE view_all_url IN ('/baking-materials', '/baking-materials/');

UPDATE public.homepage_blocks
SET view_all_url = regexp_replace(view_all_url, '^/baking-materials/', '/shop/category/')
WHERE view_all_url LIKE '/baking-materials/%';

UPDATE public.homepage_blocks
SET config = jsonb_set(
  COALESCE(config, '{}'::jsonb),
  '{more_card_link}',
  '"/shop/categories"'::jsonb,
  true
)
WHERE config ? 'more_card_link'
  AND config->>'more_card_link' IN ('/baking-materials', '/baking-materials/');

-- Brand home sections "more" links
UPDATE public.brand_home_sections
SET more_href = '/shop/categories'
WHERE more_href IN ('/baking-materials', '/baking-materials/');

UPDATE public.brand_home_sections
SET more_href = regexp_replace(more_href, '^/baking-materials/', '/shop/category/')
WHERE more_href LIKE '/baking-materials/%';

-- Quick menu
UPDATE public.home_quick_menu_items
SET link_url = '/shop'
WHERE link_url IN ('/baking-materials', '/baking-materials/');

UPDATE public.home_quick_menu_items
SET link_url = regexp_replace(link_url, '^/baking-materials/', '/shop/category/')
WHERE link_url LIKE '/baking-materials/%';

-- Brand navigation (bottom / side)
UPDATE public.brand_navigation_items
SET href = '/shop'
WHERE href IN ('/baking-materials', '/baking-materials/');

UPDATE public.brand_navigation_items
SET href = regexp_replace(href, '^/baking-materials/', '/shop/category/')
WHERE href LIKE '/baking-materials/%';
