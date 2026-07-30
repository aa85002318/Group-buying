-- Homepage: ingredient shop product browsing section
INSERT INTO public.homepage_blocks (block_key, title, subtitle, is_visible, sort_order, display_count, source_mode, view_all_url, config)
SELECT
  'ingredient_shop',
  '一鍵買齊材料',
  '完整食材一次購足，讓烘焙更輕鬆！',
  true,
  48,
  12,
  'auto',
  '/baking-materials',
  jsonb_build_object(
    'enabled', true,
    'subtitle', '完整食材一次購足，讓烘焙更輕鬆！',
    'product_source', 'automatic',
    'category_slugs', jsonb_build_array('flour', 'dairy', 'sugar', 'butter'),
    'category_labels', jsonb_build_object('flour', '烘焙粉類', 'butter', '油脂類'),
    'sort_type', 'hot',
    'product_limit', 12,
    'more_card_title', '更多商品',
    'more_card_subtitle', '查看更多烘焙材料',
    'more_card_link', '/baking-materials'
  )
WHERE NOT EXISTS (
  SELECT 1 FROM public.homepage_blocks WHERE block_key = 'ingredient_shop' LIMIT 1
);
