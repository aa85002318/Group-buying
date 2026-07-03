-- 更新商品分類圖示（自訂貼圖）
INSERT INTO product_categories (name, slug, sort_order, is_active, icon_url, icon_emoji)
VALUES
  ('食品',     'food',     1, true, '/categories/food.png',     NULL),
  ('生鮮食材', 'fresh',    2, true, '/categories/fresh.png',    NULL),
  ('冷凍食品', 'frozen',   3, true, '/categories/frozen.png',   NULL),
  ('廚房用品', 'kitchen',  4, true, '/categories/kitchen.png',  NULL),
  ('居家清潔', 'cleaning', 5, true, '/categories/cleaning.png', NULL),
  ('季節限定', 'seasonal', 6, true, '/categories/seasonal.png', NULL)
ON CONFLICT (slug) DO UPDATE SET
  name = EXCLUDED.name,
  sort_order = EXCLUDED.sort_order,
  is_active = EXCLUDED.is_active,
  icon_url = EXCLUDED.icon_url,
  icon_emoji = NULL,
  updated_at = NOW();

-- 停用未在新分類清單中的舊分類
UPDATE product_categories
SET is_active = false, updated_at = NOW()
WHERE slug NOT IN ('food', 'fresh', 'frozen', 'kitchen', 'cleaning', 'seasonal');
