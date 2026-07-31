-- Update group_buy_banner block to same-size image carousel config
UPDATE public.homepage_blocks
SET
  title = '團購 Banner 輪播',
  subtitle = '同尺寸輪播圖＋四大特色',
  config = '{
    "enabled": true,
    "title": "團購 Banner",
    "autoPlayMs": 4500,
    "slides": [
      {
        "id": "slide-1",
        "title": "零食點心團購",
        "imageUrl": "/images/home/group-buy-banner/slide-snack.png",
        "href": "/group-buy?category=snack",
        "enabled": true,
        "sortOrder": 10
      },
      {
        "id": "slide-2",
        "title": "烘焙甜點團購",
        "imageUrl": "/images/home/group-buy-banner/slide-dessert.png",
        "href": "/group-buy?category=dessert",
        "enabled": true,
        "sortOrder": 20
      },
      {
        "id": "slide-3",
        "title": "廚房工具團購",
        "imageUrl": "/images/home/group-buy-banner/slide-kitchen.png",
        "href": "/group-buy?category=kitchen",
        "enabled": true,
        "sortOrder": 30
      },
      {
        "id": "slide-4",
        "title": "季節限定團購",
        "imageUrl": "/images/home/group-buy-banner/slide-season.png",
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
WHERE block_key = 'group_buy_banner';
