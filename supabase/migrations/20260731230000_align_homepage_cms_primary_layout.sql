-- Align homepage CMS draft + live blocks to staging primary layout (11 sections).
-- Preserves existing primary configs; hides legacy keys; rebuilds admin draft snapshot.

INSERT INTO public.homepage_blocks (
  id, block_key, title, subtitle, is_visible, sort_order, display_count,
  source_mode, data_source, view_all_url, manual_ids, config, instance_label, updated_at
)
SELECT
  gen_random_uuid(),
  v.block_key,
  v.title,
  NULL,
  true,
  v.sort_order,
  v.display_count,
  v.source_mode,
  v.data_source,
  v.view_all_url,
  ARRAY[]::uuid[],
  v.config::jsonb,
  NULL,
  now()
FROM (
  VALUES
    (
      'quick_entry',
      '常用服務',
      20,
      8,
      'auto',
      NULL::text,
      NULL::text,
      '{"enabled":true,"title":"常用服務"}'::text
    ),
    (
      'ingredient_shop',
      '一鍵買齊材料',
      40,
      12,
      'auto',
      NULL::text,
      '/shop/categories',
      '{"enabled":true,"subtitle":"完整食材一次購足，讓烘焙更輕鬆！","product_source":"automatic","sort_type":"hot","product_limit":12,"more_card_title":"更多商品","more_card_subtitle":"查看更多烘焙材料","more_card_link":"/shop/categories"}'::text
    )
) AS v(block_key, title, sort_order, display_count, source_mode, data_source, view_all_url, config)
WHERE NOT EXISTS (
  SELECT 1 FROM public.homepage_blocks hb WHERE hb.block_key = v.block_key
);

UPDATE public.homepage_blocks SET title = '主視覺 Banner', is_visible = true, sort_order = 10 WHERE block_key = 'hero';
UPDATE public.homepage_blocks SET title = '最新活動', is_visible = true, sort_order = 15 WHERE block_key = 'latest_campaigns';
UPDATE public.homepage_blocks SET title = '常用服務', is_visible = true, sort_order = 20 WHERE block_key = 'quick_entry';
UPDATE public.homepage_blocks SET title = '精選食譜', is_visible = true, sort_order = 30 WHERE block_key = 'latest_recipes';
UPDATE public.homepage_blocks SET title = '一鍵買齊材料', is_visible = true, sort_order = 40 WHERE block_key = 'ingredient_shop';
UPDATE public.homepage_blocks SET title = '團購輪播 Banner', is_visible = true, sort_order = 50 WHERE block_key = 'group_buy_banner';
UPDATE public.homepage_blocks SET title = '本週開團', is_visible = true, sort_order = 60 WHERE block_key = 'weekly_group_buys';
UPDATE public.homepage_blocks SET title = '即將結單', is_visible = true, sort_order = 70 WHERE block_key = 'closing_group_buys';
UPDATE public.homepage_blocks SET title = 'LIVE 團購直播', is_visible = true, sort_order = 80 WHERE block_key = 'weekly_live_streams';
UPDATE public.homepage_blocks SET title = 'CHIMEIDIY 團購精選', is_visible = true, sort_order = 90 WHERE block_key = 'chime_select';
UPDATE public.homepage_blocks SET title = '快捷服務入口', is_visible = true, sort_order = 100 WHERE block_key = 'service_shortcuts';

UPDATE public.homepage_blocks
SET is_visible = false
WHERE block_key NOT IN (
  'hero',
  'latest_campaigns',
  'quick_entry',
  'latest_recipes',
  'ingredient_shop',
  'group_buy_banner',
  'weekly_group_buys',
  'closing_group_buys',
  'weekly_live_streams',
  'chime_select',
  'service_shortcuts'
);

UPDATE public.site_settings
SET
  value = jsonb_set(
    jsonb_set(
      jsonb_set(
        COALESCE(value, '{}'::jsonb),
        '{blocks_snapshot}',
        COALESCE(
          (
            SELECT jsonb_agg(to_jsonb(hb) ORDER BY hb.sort_order)
            FROM public.homepage_blocks hb
            WHERE hb.block_key IN (
              'hero',
              'latest_campaigns',
              'quick_entry',
              'latest_recipes',
              'ingredient_shop',
              'group_buy_banner',
              'weekly_group_buys',
              'closing_group_buys',
              'weekly_live_streams',
              'chime_select',
              'service_shortcuts'
            )
          ),
          '[]'::jsonb
        ),
        true
      ),
      '{label}',
      '"前台核心版型"'::jsonb,
      true
    ),
    '{note}',
    '"已依 staging 前台順序重建，僅保留 11 個核心區塊"'::jsonb,
    true
  ),
  updated_at = now()
WHERE key = 'homepage_layout_draft';
