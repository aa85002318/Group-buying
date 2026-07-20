alter table public.site_header_settings
  add column if not exists side_menu_sections jsonb not null default '[
    {
      "id":"today",
      "title":"今日必逛",
      "icon":"flame",
      "color":"coral",
      "kind":"links",
      "items":[
        {"id":"new","label":"本日上架","description":"今天最新上架商品","href":"/products?sort=newest","icon":"package","color":"berry"},
        {"id":"ending","label":"即將收單","description":"即將截止下單商品","href":"/group-buy","icon":"clock","color":"orange"},
        {"id":"weekly","label":"本週精選","description":"本週推薦商品","href":"/group-buy","icon":"star","color":"yellow"},
        {"id":"popular","label":"熱門商品","description":"最多人購買","href":"/products","icon":"flame","color":"coral"}
      ]
    },
    {
      "id":"categories",
      "title":"商品分類",
      "icon":"shopping-bag",
      "color":"pink",
      "kind":"categories",
      "items":[
        {"id":"category-trigger","label":"瀏覽所有分類","description":"點擊展開商品分類","href":"/categories","icon":"shopping-bag","color":"pink"}
      ]
    },
    {
      "id":"content",
      "title":"影音內容",
      "icon":"video",
      "color":"blue",
      "kind":"links",
      "items":[
        {"id":"live","label":"直播預告","description":"播放中的直播與即將開始","href":"/live","icon":"radio","color":"coral"},
        {"id":"replay","label":"直播回放","description":"所有直播留存影片","href":"/videos","icon":"play","color":"blue"},
        {"id":"tutorial","label":"影音教學","description":"短影音、一分鐘教學","href":"/videos","icon":"video","color":"blue"},
        {"id":"articles","label":"文章專區","description":"食譜、開箱、推薦文章","href":"/articles","icon":"article","color":"yellow"}
      ]
    }
  ]'::jsonb;

update public.site_header_settings
set promo_items = coalesce(
  (
    select jsonb_agg(
      case
        when item ? 'font_size' then item
        else item || '{"font_size":"medium"}'::jsonb
      end
      order by ordinal
    )
    from jsonb_array_elements(promo_items) with ordinality as rows(item, ordinal)
  ),
  '[]'::jsonb
)
where singleton_key = 'main';
