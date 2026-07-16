-- Site header settings (brand + configurable header chips)

create table if not exists public.site_header_settings (
  singleton_key text primary key,
  brand_title text not null,
  brand_subtitle text not null,
  page_keys jsonb not null default '[]'::jsonb,
  category_ids jsonb not null default '[]'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.site_header_settings enable row level security;

drop policy if exists site_header_settings_public_read on public.site_header_settings;
create policy site_header_settings_public_read
  on public.site_header_settings
  for select
  to anon
  using (true);

insert into public.site_header_settings (singleton_key, brand_title, brand_subtitle, page_keys, category_ids)
values (
  'main',
  'CHIMEIDIY 團購',
  '棋美點心屋',
  '["products","group_buy","live","videos","articles"]'::jsonb,
  '[]'::jsonb
)
on conflict (singleton_key) do nothing;

