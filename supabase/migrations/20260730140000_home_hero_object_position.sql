-- Home Hero: separate desktop/mobile object-position for responsive banners
alter table brand_heroes
  add column if not exists desktop_object_position text not null default 'center',
  add column if not exists mobile_object_position text not null default 'center';

-- Backfill from legacy image_position (left|center|right)
update brand_heroes
set desktop_object_position = case image_position
  when 'left' then 'center left'
  when 'right' then 'center right'
  else 'center'
end
where coalesce(desktop_object_position, 'center') = 'center'
  and image_position in ('left', 'right');

update brand_heroes
set mobile_object_position = case image_position
  when 'left' then 'center left'
  when 'right' then 'center right'
  else 'center'
end
where coalesce(mobile_object_position, 'center') = 'center'
  and image_position in ('left', 'right');
