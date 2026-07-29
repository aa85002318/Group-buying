-- Brand Hero 16:9 update
-- Adds new fields: show_title, show_subtitle, image_position, show_popular_tags

alter table brand_heroes
  add column if not exists show_title       boolean not null default true,
  add column if not exists show_subtitle    boolean not null default true,
  add column if not exists image_position   text    not null default 'center'
    check (image_position in ('left','center','right')),
  add column if not exists show_popular_tags boolean not null default true;

-- Update home hero defaults to match new 16:9 spec
update brand_heroes
set
  title           = '今天想做什麼？',
  subtitle        = '從食譜開始，輕鬆完成每一個烘焙時刻',
  show_title      = true,
  show_subtitle   = true,
  image_position  = 'center',
  show_popular_tags = true
where hero_key = 'home';

-- Re-seed home popular tags to ensure defaults match spec
delete from brand_hero_tags where hero_id = (select id from brand_heroes where hero_key = 'home');
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
    ('草莓蛋糕', '草莓蛋糕', 10),
    ('司康',     '司康',     20),
    ('生乳捲',   '生乳捲',   30),
    ('巧克力餅乾', '巧克力餅乾', 40),
    ('可頌',     '可頌',     50)
  ) as t(label, keyword, sort_order)
where brand_heroes.hero_key = 'home';
