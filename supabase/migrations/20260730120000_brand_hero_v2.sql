-- Brand Hero V2: lifestyle banner + CTA fields + home defaults

alter table brand_heroes
  add column if not exists capsule_label text,
  add column if not exists show_ctas boolean not null default false,
  add column if not exists primary_cta_label text,
  add column if not exists primary_cta_href text,
  add column if not exists secondary_cta_label text,
  add column if not exists secondary_cta_href text;

-- Seed home hero with bundled banner illustration + V2 copy
update brand_heroes
set
  title = '今天想做點什麼？',
  subtitle = E'探索食譜、團購、生鮮、居家好物\n讓每天的生活更簡單。',
  capsule_label = '✨ CHIMEiDIY Lifestyle',
  show_title = false,
  show_subtitle = false,
  show_ctas = false,
  primary_cta_label = '立即逛逛',
  primary_cta_href = '/products',
  secondary_cta_label = '看看食譜',
  secondary_cta_href = '/recipes',
  desktop_image_url = coalesce(nullif(desktop_image_url, ''), '/brand/hero-home-banner.png'),
  mobile_image_url = coalesce(nullif(mobile_image_url, ''), '/brand/hero-home-banner.png'),
  image_alt = coalesce(image_alt, 'CHIMEiDIY Lifestyle 首頁主視覺'),
  image_position = 'center',
  search_placeholder = '今天想做什麼？搜尋食譜、商品、團購、生鮮…',
  show_popular_tags = true,
  enabled = true,
  status = 'published',
  updated_at = now()
where hero_key = 'home';

-- Re-seed popular search chips (CMS editable)
delete from brand_hero_tags
where hero_id = (select id from brand_heroes where hero_key = 'home');

insert into brand_hero_tags (hero_id, label, keyword, link_type, target_url, sort_order, enabled)
select
  id,
  t.label,
  t.keyword,
  'search',
  null,
  t.sort_order,
  true
from brand_heroes,
  (values
    ('🥐 佛卡夏', '佛卡夏', 10),
    ('🍪 餅乾', '餅乾', 20),
    ('🍰 蛋糕', '蛋糕', 30),
    ('🧈 奶油乳酪', '奶油乳酪', 40),
    ('🛒 團購', '團購', 50),
    ('🥬 生鮮', '生鮮', 60),
    ('🧹 居家清潔', '居家清潔', 70),
    ('🎉 限時優惠', '限時優惠', 80)
  ) as t(label, keyword, sort_order)
where brand_heroes.hero_key = 'home';
