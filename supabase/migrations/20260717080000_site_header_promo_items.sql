alter table public.site_header_settings
  add column if not exists promo_items jsonb not null default '[
    {"id":"today","label":"今日開團","value":"12","suffix":"團","icon_emoji":"✨"},
    {"id":"ending","label":"即將結團","value":"5","suffix":"團","icon_emoji":"🔥"},
    {"id":"shipping","label":"滿額免運","icon_emoji":"📦"},
    {"id":"invite","label":"邀請好友賺購物金","icon_emoji":"🏷️","href":"/share-rewards"}
  ]'::jsonb;
