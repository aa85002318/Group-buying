-- Free-form header nav items: each item has label + href
alter table public.site_header_settings
  add column if not exists nav_items jsonb not null default '[]'::jsonb;

update public.site_header_settings
set nav_items = jsonb_build_array(
  jsonb_build_object('id', 'products', 'label', '全部商品', 'href', '/products', 'icon_emoji', '🛍️'),
  jsonb_build_object('id', 'group_buy', 'label', '熱門團購', 'href', '/group-buy', 'badge', 'hot', 'icon_emoji', '🔥'),
  jsonb_build_object('id', 'live', 'label', '直播專區', 'href', '/live', 'badge', 'live', 'icon_emoji', '📡'),
  jsonb_build_object('id', 'videos', 'label', '影音專區', 'href', '/videos', 'icon_emoji', '🎬'),
  jsonb_build_object('id', 'articles', 'label', '文章專區', 'href', '/articles', 'icon_emoji', '📝')
),
updated_at = now()
where singleton_key = 'main'
  and (nav_items is null or nav_items = '[]'::jsonb);
