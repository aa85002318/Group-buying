-- Homepage architecture v3: nine primary sections + store news + service shortcuts

INSERT INTO homepage_blocks (block_key, title, subtitle, sort_order, is_visible, display_count, source_mode, view_all_url, config)
SELECT
  'store_news',
  '門市最新資訊',
  NULL,
  20,
  true,
  2,
  'manual',
  '/member',
  '{
    "show_desktop": true,
    "show_mobile": true,
    "cards": [
      {
        "id": "app-gift",
        "cardType": "app_store_gift",
        "name": "App 門市禮",
        "title": "App 門市禮",
        "subtitle": "到門市出示 CHIMEIDIY App，享 App 會員限定優惠與好禮。",
        "icon": "Gift",
        "buttonText": "查看活動",
        "buttonHref": "/member/gifts",
        "backgroundColor": "#FFF4EC",
        "sortOrder": 10,
        "enabled": true
      },
      {
        "id": "store-member",
        "cardType": "store_member",
        "name": "門市會員",
        "title": "門市會員",
        "subtitle": "綁定門市會員，查詢點數與優惠。",
        "icon": "UserRound",
        "buttonText": "登入／註冊",
        "buttonHref": "/member",
        "backgroundColor": "#FFF8F3",
        "sortOrder": 20,
        "enabled": true
      }
    ]
  }'::jsonb
WHERE NOT EXISTS (
  SELECT 1 FROM homepage_blocks WHERE block_key = 'store_news' LIMIT 1
);

INSERT INTO homepage_blocks (block_key, title, subtitle, sort_order, is_visible, display_count, source_mode, view_all_url, config)
SELECT
  'service_shortcuts',
  '服務快捷入口',
  NULL,
  80,
  true,
  4,
  'manual',
  NULL,
  '{
    "show_desktop": true,
    "show_mobile": true,
    "items": [
      {"id":"quality","title":"嚴選安心食材","subtitle":"安心檢驗把關","icon":"ShieldCheck","href":"/support","sortOrder":10,"enabled":true},
      {"id":"shipping","title":"快速出貨","subtitle":"當日出貨更安心","icon":"Truck","href":"/support/shipping","sortOrder":20,"enabled":true},
      {"id":"pickup","title":"門市自取","subtitle":"線上下單門市取貨","icon":"Store","href":"/stores","sortOrder":30,"enabled":true},
      {"id":"support","title":"專業客服","subtitle":"一對一貼心服務","icon":"Headphones","href":"/support/contact","sortOrder":40,"enabled":true}
    ]
  }'::jsonb
WHERE NOT EXISTS (
  SELECT 1 FROM homepage_blocks WHERE block_key = 'service_shortcuts' LIMIT 1
);

-- Primary section order & titles
UPDATE homepage_blocks SET sort_order = 10, is_visible = true WHERE block_key = 'hero';
UPDATE homepage_blocks SET sort_order = 20, is_visible = true, title = '門市最新資訊', view_all_url = COALESCE(view_all_url, '/member')
WHERE block_key = 'store_news';
UPDATE homepage_blocks SET sort_order = 30, is_visible = true, title = '熱門食譜', display_count = COALESCE(NULLIF(display_count, 0), 8),
  view_all_url = COALESCE(view_all_url, '/recipes')
WHERE block_key = 'latest_recipes';
UPDATE homepage_blocks SET sort_order = 40, is_visible = true, title = '一鍵買齊材料',
  subtitle = COALESCE(subtitle, '跟著食譜，一次買齊所有材料')
WHERE block_key = 'recipe_kits';
UPDATE homepage_blocks SET sort_order = 50, is_visible = true, title = '找材料',
  view_all_url = COALESCE(view_all_url, '/baking-materials')
WHERE block_key = 'popular_categories';
UPDATE homepage_blocks SET sort_order = 60, is_visible = true, title = '本週熱門商品', display_count = COALESCE(NULLIF(display_count, 0), 8),
  view_all_url = COALESCE(view_all_url, '/baking-materials')
WHERE block_key = 'popular_baking_products';
UPDATE homepage_blocks SET sort_order = 70, is_visible = true, title = '團購優惠中',
  view_all_url = COALESCE(view_all_url, '/group-buy'),
  config = COALESCE(config, '{}'::jsonb) || '{"show_countdown":true,"show_progress":true}'::jsonb
WHERE block_key = 'closing_group_buys';
UPDATE homepage_blocks SET sort_order = 80, is_visible = true, title = '服務快捷入口'
WHERE block_key = 'service_shortcuts';

-- Hide deprecated / secondary sections
UPDATE homepage_blocks SET is_visible = false
WHERE block_key IN (
  'hot_searches', 'featured_courses', 'latest_videos', 'trust_services',
  'brand_statement', 'quick_menu', 'ai_assistant', 'baking_inspiration',
  'weekly_new_products', 'chime_select', 'weekly_live_streams', 'weekly_promotions',
  'banner_strip', 'monthly_challenge', 'seasonal_themes', 'store_information',
  'latest_articles', 'product_series'
);

-- Hero CMS copy (brand_heroes)
UPDATE brand_heroes SET
  title = '今天想做什麼？',
  subtitle = '從食譜開始，輕鬆完成每一個烘焙時刻',
  search_placeholder = '搜尋食譜、材料、商品、課程……'
WHERE hero_key = 'home';

DELETE FROM brand_hero_tags WHERE hero_id IN (SELECT id FROM brand_heroes WHERE hero_key = 'home');
INSERT INTO brand_hero_tags (hero_id, label, keyword, sort_order)
SELECT h.id, t.label, t.keyword, t.sort_order
FROM brand_heroes h
CROSS JOIN (VALUES
  ('草莓蛋糕', '草莓蛋糕', 10),
  ('司康', '司康', 20),
  ('生乳捲', '生乳捲', 30),
  ('巧克力餅乾', '巧克力餅乾', 40),
  ('可頌', '可頌', 50)
) AS t(label, keyword, sort_order)
WHERE h.hero_key = 'home';

-- Bottom nav: 首頁 / 商城 / 團購 / AI / 我的
DELETE FROM brand_navigation_items WHERE navigation_type = 'bottom';
INSERT INTO brand_navigation_items (navigation_type, label, icon_key, href, sort_order)
VALUES
  ('bottom', '首頁', 'home', '/', 10),
  ('bottom', '商城', 'products', '/baking-materials', 20),
  ('bottom', '團購', 'groupBuy', '/group-buy', 30),
  ('bottom', 'AI', 'knowledge', '/ai', 40),
  ('bottom', '我的', 'account', '/member', 50);

-- brand_home_sections align with primary architecture
UPDATE brand_home_sections SET enabled = false WHERE section_key NOT IN (
  'hero', 'latest_recipes', 'recipe_kits', 'popular_categories',
  'popular_baking_products', 'closing_group_buys'
);
INSERT INTO brand_home_sections (section_key, title, subtitle, more_href, sort_order, enabled)
VALUES
  ('store_news', '門市最新資訊', NULL, '/member', 15, true),
  ('service_shortcuts', '服務快捷入口', NULL, NULL, 85, true)
ON CONFLICT (section_key) DO UPDATE SET
  title = EXCLUDED.title,
  sort_order = EXCLUDED.sort_order,
  enabled = EXCLUDED.enabled;
