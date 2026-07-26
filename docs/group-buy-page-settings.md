# 團購前台與頁面設定

## 路由

| 路徑 | 說明 |
|------|------|
| `/group-buy` | 前台團購專區（由頁面設定驅動） |
| `/admin/group-buy` | 團購活動 |
| `/admin/group-buy/settings` | 團購頁面設定 |

## API

- `GET /api/group-buy/page-settings`
- `GET|PUT /api/admin/group-buy/page-settings`
- `GET /api/group-buy/campaigns?status=&sort=&search=&page=&pageSize=&section=`

設定存於 `site_settings.key = group_buy_page`（JSON）。

## Migration

`supabase/migrations/20260726230000_group_buy_page_settings.sql`

含 `site_settings` 與 `group_buy_events` 擴充欄位（成團門檻、取貨方式、價格等）。

## 已完成

- 區塊開關／排序、分頁、即將結團／開團時數
- 搜尋／排序、商品卡欄位、購買須知
- 前台依設定渲染；關閉區塊不留白
- 狀態依 start_at／end_at 計算，即將結團依設定時數

## 後續可再補

- （Phase 2 已做）有效訂單統計、總覽／分類／訂單入口、詳情購買閘道、分類／取貨篩選
- 會員限購跨訂單累計、虛擬銷量明確標示 UI
- 溫層拆單規則前端提示與後端再強化
