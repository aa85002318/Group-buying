-- Home ingredient categories (圓形 Icon 找材料分類)

create table if not exists home_ingredient_categories (
  id            uuid primary key default gen_random_uuid(),
  category_id   text,                        -- FK hint; no hard FK to keep it loose
  display_name  text        not null,
  desktop_icon  text,                        -- URL
  mobile_icon   text,                        -- URL (falls back to desktop_icon)
  alt           text,
  custom_url    text,
  badge         text check (badge in ('HOT','NEW','限時','推薦')),
  icon_mode     text        not null default 'ip'
                  check (icon_mode in ('ip','product','brand')),
  sort_order    int         not null default 99,
  enabled       boolean     not null default true,
  start_at      timestamptz,
  end_at        timestamptz,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

-- Index for fast ordered selects
create index if not exists idx_home_ingredient_categories_sort
  on home_ingredient_categories (sort_order, enabled);

-- RLS
alter table home_ingredient_categories enable row level security;

-- Public read of enabled rows
drop policy if exists "public_read_ingredient_categories" on home_ingredient_categories;
create policy "public_read_ingredient_categories"
  on home_ingredient_categories for select
  using (enabled = true);

-- Service role bypass (used by admin client)
drop policy if exists "service_role_all_ingredient_categories" on home_ingredient_categories;
create policy "service_role_all_ingredient_categories"
  on home_ingredient_categories for all
  using (auth.role() = 'service_role')
  with check (auth.role() = 'service_role');

-- Add ingredient_categories block if not present
-- (homepage_blocks.block_key is no longer unique after multi-instance migration)
insert into homepage_blocks (block_key, title, subtitle, is_visible, sort_order, config)
select
  'ingredient_categories',
  '找材料',
  null,
  true,
  45,   -- after popular_categories (sort_order 40), before popular_baking_products (50)
  '{
    "title": "找材料",
    "view_all_label": "查看全部",
    "view_all_href": "/products",
    "desktop_cols": 10,
    "mobile_cols": 5
  }'::jsonb
where not exists (
  select 1 from homepage_blocks where block_key = 'ingredient_categories' limit 1
);

-- Seed default categories (idempotent)
insert into home_ingredient_categories
  (display_name, category_id, custom_url, sort_order, enabled, badge, icon_mode)
select * from (values
  ('麵粉',     null::text, '/products?category=flour'::text,     10, true, null::text,  'ip'::text),
  ('巧克力',   null, '/products?category=chocolate', 20, true, 'HOT', 'ip'),
  ('乳製品',   null, '/products?category=dairy',     30, true, null,  'ip'),
  ('烘焙原料', null, '/products?category=raw',       40, true, null,  'ip'),
  ('預拌粉',   null, '/products?category=premix',    50, true, 'NEW', 'ip'),
  ('器具',     null, '/products?category=tools',     60, true, null,  'ip'),
  ('包裝材料', null, '/products?category=packaging', 70, true, null,  'ip'),
  ('冷凍食品', null, '/products?category=frozen',    80, true, null,  'ip'),
  ('冷藏食品', null, '/products?category=chilled',   90, true, null,  'ip'),
  ('更多分類', null, '/products',                    99, true, null,  'ip')
) as v(display_name, category_id, custom_url, sort_order, enabled, badge, icon_mode)
where not exists (select 1 from home_ingredient_categories limit 1);
