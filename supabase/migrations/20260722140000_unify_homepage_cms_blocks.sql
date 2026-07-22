-- Unify homepage CMS blocks for admin hub
-- Safe to re-run.

INSERT INTO homepage_blocks (block_key, title, sort_order, subtitle, display_count, source_mode, is_visible, config)
VALUES
  ('hot_search', '熱門搜尋', 3, '搜尋列下方關鍵字', 10, 'manual', true,
    jsonb_build_object(
      'keywords', jsonb_build_array('麵粉', '奶油', '杜拜巧克力', '中秋禮盒', '乳酪', '烘焙模具')
    )),
  ('hero_banner', 'Hero Banner', 5, '首頁主視覺', 3, 'auto', true, '{}'::jsonb),
  ('quick_menu', '快捷入口', 7, '橫向快捷選單', 8, 'manual', true, '{}'::jsonb),
  ('popular_categories', '熱門分類', 12, '圓形分類入口', 8, 'manual', true,
    jsonb_build_object(
      'categories', jsonb_build_array(
        jsonb_build_object('id', 'flour', 'name', '麵粉', 'href', '/baking-materials/flour', 'imageUrl', '/categories/food.png'),
        jsonb_build_object('id', 'choco', 'name', '巧克力', 'href', '/baking-materials/chocolate', 'imageUrl', '/categories/fresh.png'),
        jsonb_build_object('id', 'dairy', 'name', '乳製品', 'href', '/baking-materials/dairy', 'imageUrl', '/categories/kitchen.png'),
        jsonb_build_object('id', 'tools', 'name', '器具', 'href', '/baking-materials/tools', 'imageUrl', '/categories/seasonal.png'),
        jsonb_build_object('id', 'pack', 'name', '包裝', 'href', '/baking-materials/packaging', 'imageUrl', '/categories/cleaning.png'),
        jsonb_build_object('id', 'frozen', 'name', '冷凍', 'href', '/baking-materials/frozen-goods', 'imageUrl', '/categories/frozen.png'),
        jsonb_build_object('id', 'chill', 'name', '冷藏', 'href', '/baking-materials/chilled-goods', 'imageUrl', '/categories/fresh.png'),
        jsonb_build_object('id', 'mix', 'name', '預拌粉', 'href', '/baking-materials/premix', 'imageUrl', '/categories/food.png')
      )
    )),
  ('new_products', '今日新品', 15, '依上架時間自動排序', 8, 'auto', true, '{}'::jsonb),
  ('hot_products', '熱門商品', 20, '可自行選取商品', 8, 'manual', true, '{}'::jsonb),
  ('group_buy_closing', '即將收單團購', 30, '進行中團購', 4, 'auto', true, '{}'::jsonb),
  ('weekly_promo', '本週優惠', 35, '橫向優惠 Banner', 4, 'manual', true, '{}'::jsonb),
  ('recipes', '最新食譜', 40, '依上傳時間自動排序', 4, 'auto', true, '{}'::jsonb),
  ('videos', '影音', 45, '依上傳時間自動排序', 4, 'auto', true, '{}'::jsonb),
  ('news', '最新資訊', 50, '可調整置頂與順序', 5, 'auto', true, '{}'::jsonb)
ON CONFLICT (block_key) DO UPDATE SET
  title = EXCLUDED.title,
  subtitle = COALESCE(homepage_blocks.subtitle, EXCLUDED.subtitle),
  sort_order = EXCLUDED.sort_order,
  display_count = COALESCE(homepage_blocks.display_count, EXCLUDED.display_count),
  source_mode = CASE
    WHEN homepage_blocks.block_key IN ('hot_products', 'hot_search', 'popular_categories', 'quick_menu', 'weekly_promo')
      THEN EXCLUDED.source_mode
    ELSE homepage_blocks.source_mode
  END;

-- Align titles for existing related blocks
UPDATE homepage_blocks SET title = '今日新品', subtitle = '依上架時間自動排序', source_mode = 'auto'
WHERE block_key = 'new_products';

UPDATE homepage_blocks SET title = '熱門商品', subtitle = '可自行選取商品'
WHERE block_key = 'hot_products';

UPDATE homepage_blocks SET title = '即將收單團購'
WHERE block_key = 'group_buy_closing';

UPDATE homepage_blocks SET title = '最新食譜', subtitle = '依上傳時間自動排序', source_mode = 'auto'
WHERE block_key = 'recipes';

UPDATE homepage_blocks SET title = '影音', subtitle = '依上傳時間自動排序', source_mode = 'auto'
WHERE block_key = 'videos';

UPDATE homepage_blocks SET title = '最新資訊', subtitle = '可調整置頂與順序'
WHERE block_key = 'news';
