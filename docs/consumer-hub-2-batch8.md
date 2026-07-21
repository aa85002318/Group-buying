# Consumer Hub 2.0 — Batch 8 完成報告

## 範圍

首頁 CMS 同步收尾、Admin Dashboard App／內容指標、角色權限（content_editor／customer_service）、RLS 補強、響應式與 Loading／Error、lint／tsc／build

## Migration

`supabase/migrations/20260721070000_consumer_hub_phase2_batch8_roles_rls.sql`

- `is_content_editor()` / `is_customer_service()` helpers
- 重申 favorites／member_addresses／notifications／invoice_carriers RLS
- **未建立** POS 相關表或指標

部署前請在 Supabase SQL Editor 執行（若尚未套用 batch 3–7，請先依序執行）。

## 前台

| 項目 | 說明 |
|------|------|
| `/` 首頁 | 讀取 `/api/cms` `homepage_blocks`；依可見性／標題／`display_count` 渲染各區塊 |
| 獨立載入 | 商品／團購／食譜／影音／最新資訊／CMS 各自 Loading／Error／Retry |
| 未讀通知 | 會員未讀 badge 獨立於內容區塊 |
| 響應式 | `overflow-x-hidden`；行動版預留 bottom nav 高度 |

## 後台

| 項目 | 說明 |
|------|------|
| `/admin` 儀表板 | 今日 App 訂單、商城／團購拆分、待付款／待確認／待取貨、已發布食譜／影音／最新資訊、排程通知、進行中福利 |
| 標籤 | 一律「App 訂單」語境；**不含 POS 營業額** |
| 導航權限 | `navForRole` 依角色過濾 |

## 角色

| 角色 | 可進入 |
|------|--------|
| `admin` | 全部 |
| `store_staff` | 儀表板、App 訂單、付款、取貨、門市 |
| `content_editor` | 儀表板、食譜／影音／最新資訊／Banner／首頁／FAQ／CMS／文章 |
| `customer_service` | 儀表板、App 訂單／會員、客服／客服設定、通知、FAQ |

API：`requireContentAdmin`（內容）、`requireOpsAdmin`／`requireStaffOrAdmin`（營運）。指派方式：`profiles.role`。

## 檢查清單（完整）

### 首頁同步

- [x] CMS `is_visible` 控制區塊顯示
- [x] CMS `title` / `display_count` 套用
- [x] 食譜／影音／最新資訊／團購／福利獨立 Error／Retry
- [x] 會員未讀通知
- [x] 公開 CMS 回傳含隱藏區塊（供前台判斷）

### Dashboard

- [x] 今日 App 訂單數／營業額（既有）
- [x] 待處理／待確認／待取貨
- [x] 今日商城 vs 團購訂單
- [x] 已發布食譜／影音／最新資訊
- [x] 未發送排程通知
- [x] 進行中福利
- [x] 無 POS 銷售指標

### 權限／RLS

- [x] middleware 路徑 allowlist
- [x] Admin 導航依角色
- [x] 內容／營運 API 角色閘門
- [x] 會員資料表 RLS 重申

### 品質

- [x] lint
- [x] `tsc --noEmit`
- [x] `npm run build`

## POS 排除

確認：Dashboard 與文件皆標明 App 訂單；無門市 POS 消費／刷卡／現場營業額欄位。
