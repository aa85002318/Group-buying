-- Sync Hamburger Side Menu CMS with the current consumer AppSideMenu entries.

UPDATE public.site_header_settings
SET
  side_menu_sections = $json$
[
  {
    "id": "primary",
    "title": "主要入口",
    "icon": "sparkles",
    "color": "berry",
    "kind": "links",
    "items": [
      {
        "id": "home",
        "label": "首頁",
        "description": "回到首頁",
        "href": "/",
        "icon": "house",
        "color": "berry",
        "section": "home",
        "enabled": true,
        "order": 10
      },
      {
        "id": "shop",
        "label": "商城",
        "description": "烘焙材料與商品",
        "href": "/shop",
        "icon": "shopping-bag",
        "color": "pink",
        "enabled": true,
        "order": 20
      },
      {
        "id": "materials",
        "label": "商品分類",
        "description": "展開烘焙材料分類",
        "href": "/shop",
        "icon": "wheat",
        "color": "orange",
        "section": "materials",
        "enabled": true,
        "order": 25
      },
      {
        "id": "group_buy",
        "label": "團購",
        "description": "限時開團與收單",
        "href": "/group-buy",
        "icon": "gift",
        "color": "orange",
        "section": "group_buy",
        "enabled": false,
        "comingSoon": false,
        "order": 30
      },
      {
        "id": "recipes",
        "label": "食譜影音",
        "description": "食譜教學與短影音",
        "href": "/recipes",
        "icon": "book",
        "color": "yellow",
        "section": "recipes",
        "enabled": true,
        "order": 40
      },
      {
        "id": "ai",
        "label": "AI烘焙助手",
        "description": "選品與食材食譜",
        "href": "/ai",
        "icon": "sparkles",
        "color": "pink",
        "enabled": true,
        "order": 50
      },
      {
        "id": "favorites",
        "label": "收藏",
        "description": "收藏商品與食譜",
        "href": "/favorites",
        "icon": "heart",
        "color": "coral",
        "enabled": true,
        "order": 60
      },
      {
        "id": "member",
        "label": "會員中心",
        "description": "條碼、載具與福利",
        "href": "/member",
        "icon": "user",
        "color": "green",
        "enabled": true,
        "order": 70
      },
      {
        "id": "orders",
        "label": "我的訂單",
        "description": "訂單狀態與取貨",
        "href": "/member/orders",
        "icon": "clipboard",
        "color": "berry",
        "requiresAuth": true,
        "enabled": true,
        "order": 80
      },
      {
        "id": "benefits",
        "label": "會員禮",
        "description": "會員禮、滿額贈與兌換券",
        "href": "/member/benefits",
        "icon": "gift",
        "color": "yellow",
        "requiresAuth": true,
        "enabled": true,
        "order": 90
      },
      {
        "id": "stores",
        "label": "門市資訊",
        "description": "地址與營業時間",
        "href": "/stores",
        "icon": "store",
        "color": "green",
        "enabled": true,
        "order": 100
      },
      {
        "id": "news",
        "label": "最新消息",
        "description": "文章分類：最新消息",
        "href": "/articles?category=%E6%9C%80%E6%96%B0%E6%B6%88%E6%81%AF",
        "icon": "newspaper",
        "color": "blue",
        "enabled": true,
        "order": 110
      },
      {
        "id": "promotions",
        "label": "優惠活動",
        "description": "文章分類：優惠活動",
        "href": "/articles?category=%E5%84%AA%E6%83%A0%E6%B4%BB%E5%8B%95",
        "icon": "tag",
        "color": "orange",
        "enabled": true,
        "order": 120
      },
      {
        "id": "support",
        "label": "客服中心",
        "description": "LINE、社群與表單",
        "href": "/support",
        "icon": "headphones",
        "color": "blue",
        "enabled": true,
        "order": 130
      }
    ]
  }
]
$json$::jsonb,
  updated_at = now()
WHERE singleton_key = 'main';
