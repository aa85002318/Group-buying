# Consumer Hub 2.0 — Batch 6 完成報告

## 範圍

多類型收藏、地址管理深化、會員福利前後台（不含 POS／點數／等級）

## Migration

`supabase/migrations/20260721050000_consumer_hub_phase2_batch6_favorites_benefits.sql`

- 新建 `favorites`（product／recipe／video）+ RLS；自 `product_favorites` 遷移
- `member_addresses.note`
- 新建 `member_benefits`、`member_benefit_assignments` + RLS

**未建立** POS／門市消費／點數相關表。

## 前台

| 路由 | 說明 |
|------|------|
| `/member/favorites` | Tabs：商品／食譜／影音；下架顯示「目前無法購買」；Loading／Empty／Error |
| `/member/addresses` | 備註、設為預設；結帳已可選地址（既有） |
| `/member/benefits` | 顯示發放福利與狀態（可使用／已用／過期／即將開始…） |

食譜／影音詳情已接 `FavoriteButton`。

## 後台

| 路由 | 說明 |
|------|------|
| `/admin/benefits` | 列表 |
| `/admin/benefits/new` | 新增 |
| `/admin/benefits/[id]` | 編輯、預估人數、確認發放、標記已使用、撤銷未使用 |

發放對象：指定會員 ID、全部 App 會員、團購參加者。二次確認、略過已持有、Audit Log。

## 安全

- 收藏／地址／福利發放紀錄：本人或 admin RLS
- 地址不寫入 localStorage
- 福利不依 POS 消費自動發放

## 尚未完成（後續）

- 收藏／福利正式 feature API 層（仍走 route handlers）
- 活動／課程參加者發放（預留 source）
- 通知中心深化（第七批）

## POS 排除

確認：無 POS 表、無門市消費累計、福利說明文案標明僅 App 發放。
