-- Homepage CMS hub v4: seed primary stack keys (latest_campaigns, weekly_group_buys)
-- and align titles / visibility for the live home composition.

-- Ensure latest_campaigns block exists
INSERT INTO homepage_blocks (
  id, block_key, title, is_visible, sort_order, display_count, source_mode, view_all_url, config, updated_at
)
SELECT
  gen_random_uuid(),
  'latest_campaigns',
  '最新活動',
  true,
  15,
  6,
  'manual',
  '/group-buy',
  jsonb_build_object(
    'enabled', true,
    'title', '最新活動',
    'viewAllLabel', '查看更多',
    'viewAllHref', '/group-buy',
    'autoPlayMs', 4500,
    'slides', '[]'::jsonb
  ),
  now()
WHERE NOT EXISTS (
  SELECT 1 FROM homepage_blocks WHERE block_key = 'latest_campaigns'
);

-- Ensure weekly_group_buys block exists
INSERT INTO homepage_blocks (
  id, block_key, title, is_visible, sort_order, display_count, source_mode, view_all_url, config, updated_at
)
SELECT
  gen_random_uuid(),
  'weekly_group_buys',
  '本週開團',
  true,
  60,
  12,
  'auto',
  '/group-buy',
  jsonb_build_object(
    'subtitle', '本週熱門開團，一起買更划算',
    'source', 'group_buy_events',
    'manageHref', '/admin/group-buy-events'
  ),
  now()
WHERE NOT EXISTS (
  SELECT 1 FROM homepage_blocks WHERE block_key = 'weekly_group_buys'
);

-- Align existing primary sections
UPDATE homepage_blocks SET
  title = '精選食譜',
  sort_order = 30,
  is_visible = true,
  updated_at = now()
WHERE block_key = 'latest_recipes';

UPDATE homepage_blocks SET
  title = '即將結單',
  sort_order = 70,
  is_visible = true,
  display_count = COALESCE(display_count, 12),
  config = COALESCE(config, '{}'::jsonb) || jsonb_build_object(
    'subtitle', COALESCE(config->>'subtitle', '倒數中的團購，把握最後機會'),
    'source', 'group_buy_events',
    'manageHref', '/admin/group-buy-events'
  ),
  updated_at = now()
WHERE block_key = 'closing_group_buys';

UPDATE homepage_blocks SET
  title = 'LIVE 團購直播',
  sort_order = 80,
  is_visible = true,
  display_count = COALESCE(display_count, 8),
  view_all_url = COALESCE(view_all_url, '/live'),
  config = COALESCE(config, '{}'::jsonb) || jsonb_build_object(
    'subtitle', COALESCE(config->>'subtitle', '鎖定直播檔期，不錯過限時優惠'),
    'source', 'livestreams',
    'manageHref', '/admin/livestreams'
  ),
  updated_at = now()
WHERE block_key = 'weekly_live_streams';

UPDATE homepage_blocks SET
  title = 'CHIMEIDIY 團購精選',
  sort_order = 90,
  is_visible = true,
  display_count = COALESCE(display_count, 24),
  view_all_url = COALESCE(view_all_url, '/group-buy'),
  config = COALESCE(config, '{}'::jsonb) || jsonb_build_object(
    'subtitle', COALESCE(config->>'subtitle', '精選團購好物，一起買更划算'),
    'source', 'group_buy_events'
  ),
  updated_at = now()
WHERE block_key = 'chime_select';

UPDATE homepage_blocks SET
  title = '服務快捷入口',
  sort_order = 100,
  is_visible = true,
  updated_at = now()
WHERE block_key = 'service_shortcuts';

UPDATE homepage_blocks SET
  title = '常用服務',
  sort_order = 20,
  is_visible = true,
  updated_at = now()
WHERE block_key = 'quick_entry';

UPDATE homepage_blocks SET
  title = '一鍵買齊材料',
  sort_order = 40,
  is_visible = true,
  updated_at = now()
WHERE block_key = 'ingredient_shop';

UPDATE homepage_blocks SET
  title = '團購輪播 Banner',
  sort_order = 50,
  is_visible = true,
  updated_at = now()
WHERE block_key = 'group_buy_banner';

UPDATE homepage_blocks SET
  title = 'Hero Banner',
  sort_order = 10,
  is_visible = true,
  updated_at = now()
WHERE block_key = 'hero';
