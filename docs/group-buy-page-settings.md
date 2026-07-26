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
- （Phase 2）有效訂單統計、總覽／分類／訂單入口、詳情購買閘道、分類／取貨篩選
- （Phase 3）會員限購跨訂單累計、虛擬銷量標示、溫層拆單提示與後端驗證

## Phase 3 說明

| 項目 | 行為 |
|------|------|
| 每人限購 | `max_qty_per_user` 加總該會員同活動的有效訂單件數後再驗證本次數量 |
| 虛擬銷量 | `virtual_sold_qty` 加到前台顯示；可開關「含虛擬銷量」標籤 |
| 溫層拆單 | 購物車／結帳提示；宅配／超商遇多溫層由後端拒絕，門市取貨可合併 |

Migration：`supabase/migrations/20260726240000_group_buy_phase3.sql`

## 後續可再補

- 宅配正式開放後依溫層自動拆成多筆訂單
- 限購剩餘數量即時顯示於加購按鈕
- 虛擬銷量／真實銷量後台報表分離檢視
