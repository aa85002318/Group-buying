-- Group-buy banner: 5 chalk slides, 團購 first
UPDATE public.homepage_blocks
SET
  display_count = 5,
  config = jsonb_set(
    COALESCE(config, '{}'::jsonb),
    '{slides}',
    '[
      {
        "id": "slide-group-buy",
        "title": "團購",
        "imageUrl": "/images/home/group-buy-banner/slide-group-buy.png",
        "href": "/group-buy",
        "enabled": true,
        "sortOrder": 10
      },
      {
        "id": "slide-snack",
        "title": "零食點心",
        "imageUrl": "/images/home/group-buy-banner/slide-snack.png",
        "href": "/group-buy?category=snack",
        "enabled": true,
        "sortOrder": 20
      },
      {
        "id": "slide-dessert",
        "title": "烘焙甜點",
        "imageUrl": "/images/home/group-buy-banner/slide-dessert.png",
        "href": "/group-buy?category=dessert",
        "enabled": true,
        "sortOrder": 30
      },
      {
        "id": "slide-kitchen",
        "title": "廚房工具",
        "imageUrl": "/images/home/group-buy-banner/slide-kitchen.png",
        "href": "/group-buy?category=kitchen",
        "enabled": true,
        "sortOrder": 40
      },
      {
        "id": "slide-season",
        "title": "季節限定",
        "imageUrl": "/images/home/group-buy-banner/slide-season.png",
        "href": "/group-buy?category=seasonal",
        "enabled": true,
        "sortOrder": 50
      }
    ]'::jsonb
  )
WHERE block_key = 'group_buy_banner';
