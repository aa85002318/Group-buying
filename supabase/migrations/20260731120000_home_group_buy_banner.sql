-- Homepage: group-buy 4-tile chalk banner (below ingredient shop)
INSERT INTO public.homepage_blocks (block_key, title, subtitle, is_visible, sort_order, display_count, source_mode, view_all_url, config)
SELECT
  'group_buy_banner',
  '團購四格 Banner',
  '一鍵買齊材料與團購專區之間的分類轉場',
  true,
  55,
  4,
  'manual',
  '/group-buy',
  '{
    "enabled": true,
    "title": "團購分類",
    "seasonMode": "auto",
    "seasonImages": {
      "spring": "/images/home/group-buy-banner/art-season-spring.svg",
      "summer": "/images/home/group-buy-banner/art-season-summer.svg",
      "autumn": "/images/home/group-buy-banner/art-season-autumn.svg",
      "winter": "/images/home/group-buy-banner/art-season-winter.svg"
    },
    "ip": {
      "enabled": true,
      "imageUrl": "/images/home/group-buy-banner/ip-angel.svg",
      "positionPercent": 50,
      "heightPercent": 58
    },
    "tiles": [
      {
        "id": "snack",
        "title": "零食點心",
        "subtitle": "美味零食，隨時享受",
        "backgroundColor": "#9FD36F",
        "backgroundImageUrl": "/images/home/group-buy-banner/bg-snack.png",
        "imageUrl": "/images/home/group-buy-banner/art-snack.svg",
        "href": "/group-buy?category=snack",
        "enabled": true,
        "sortOrder": 10
      },
      {
        "id": "dessert",
        "title": "烘焙甜點",
        "subtitle": "手作烘焙，甜蜜幸福",
        "backgroundColor": "#F7A9B8",
        "backgroundImageUrl": "/images/home/group-buy-banner/bg-dessert.png",
        "imageUrl": "/images/home/group-buy-banner/art-dessert.svg",
        "href": "/group-buy?category=dessert",
        "enabled": true,
        "sortOrder": 20
      },
      {
        "id": "kitchen",
        "title": "廚房工具",
        "subtitle": "好用工具，輕鬆料理",
        "backgroundColor": "#FFD454",
        "backgroundImageUrl": "/images/home/group-buy-banner/bg-kitchen.png",
        "imageUrl": "/images/home/group-buy-banner/art-kitchen.svg",
        "href": "/group-buy?category=kitchen",
        "enabled": true,
        "sortOrder": 30
      },
      {
        "id": "season",
        "title": "季節限定",
        "subtitle": "限定好物，錯過不再",
        "backgroundColor": "#79C7E8",
        "backgroundImageUrl": "/images/home/group-buy-banner/bg-season.png",
        "imageUrl": "/images/home/group-buy-banner/art-season-spring.svg",
        "href": "/group-buy?category=seasonal",
        "enabled": true,
        "sortOrder": 40
      }
    ],
    "benefits": [
      {
        "id": "brand",
        "title": "精選品牌",
        "subtitle": "品質安心",
        "iconUrl": "/images/home/group-buy-banner/icon-brand.svg",
        "enabled": true,
        "sortOrder": 10
      },
      {
        "id": "offer",
        "title": "專屬優惠",
        "subtitle": "團購更划算",
        "iconUrl": "/images/home/group-buy-banner/icon-offer.svg",
        "enabled": true,
        "sortOrder": 20
      },
      {
        "id": "group",
        "title": "揪團便利",
        "subtitle": "人越多越便宜",
        "iconUrl": "/images/home/group-buy-banner/icon-group.svg",
        "enabled": true,
        "sortOrder": 30
      },
      {
        "id": "gift",
        "title": "好康好禮",
        "subtitle": "團購限定回饋",
        "iconUrl": "/images/home/group-buy-banner/icon-gift.svg",
        "enabled": true,
        "sortOrder": 40
      }
    ]
  }'::jsonb
WHERE NOT EXISTS (
  SELECT 1 FROM public.homepage_blocks WHERE block_key = 'group_buy_banner' LIMIT 1
);
