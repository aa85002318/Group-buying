# Consumer Hub 2.0 — Batch 3 完成報告

## 範圍

- App 訂單後台深化
- App 會員後台深化
- 操作紀錄（audit_logs）檢視與寫入強化
- Dashboard／選單標示為 App 訂單／App 會員

## 新增／修改

### Migration

- `supabase/migrations/20260721020000_consumer_hub_phase2_batch3.sql`
  - `orders.admin_notes`
  - `profiles.is_active`
  - `profiles.admin_notes`
  - audit_logs RLS 冪等確認

### 後台路由

| 路由 | 狀態 |
|------|------|
| `/admin/orders` | 深化：App 文案、類型／履約／日期篩選、搜尋會員電話 |
| `/admin/orders/[id]` | **新建**詳細頁（內部備註、狀態、操作紀錄、列印） |
| `/admin/members` | 深化：App 會員編號、訂單數、收藏數、帳號狀態 |
| `/admin/members/[id]` | **新建**詳細頁（停用／恢復、遮罩載具、門市電話提醒、無合併按鈕） |
| `/admin/audit-logs` | **新建**操作紀錄列表 |
| `/admin` | Dashboard 標示「App 訂單」 |

### API

- `GET/PATCH /api/admin/orders`、`/api/admin/orders/[id]`（備註＋狀態＋audit）
- `GET /api/admin/members`（App 訂單／收藏計數）
- `GET/PATCH /api/admin/members/[id]`（詳情、停用、遮罩載具、store_members 提醒）
- `GET /api/admin/audit-logs`
- `src/lib/services/auditService.ts`（敏感欄位 redact）

## POS 排除確認

- 訂單僅查 `orders` 表
- 無 POS 匯入／同步 UI
- 會員分群「總消費」改為「App 訂單總額」
- 移除 mock VIP／VVIP 等級選項
- 門市會員同電話僅警告、無自動合併

## 尚未完成（後續批次）

- 食譜／影音／最新資訊 CMS
- Banner／首頁 CMS
- 福利後台、細分角色（Content Editor／CS）
- Dashboard 待處理／待取貨等更細指標

## 測試

- `tsc --noEmit`：通過
- Migration 需於 Supabase 環境套用後，`admin_notes`／`is_active` 才可寫入
