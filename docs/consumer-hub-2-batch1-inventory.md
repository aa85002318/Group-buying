# Consumer Hub 2.0 — Batch 1 盤點報告

## 不可修改的現有功能

- 購物車／結帳／綠界付款
- 團購開團、收單、庫存
- Supabase Auth 登入／註冊
- 取貨 QR／pickup_token 流程
- Product Master、既有 `orders` 表
- **禁止**：POS、門市消費同步、點數、會員等級、優惠券引擎、付費 AI

## 前台路由（現況）

| 規格路由 | 現況 | 動作 |
|----------|------|------|
| `/member` | ✅ | 深化文案與入口 |
| `/member/barcode` | ❌ | **新建**（有 `MemberBarcode` 元件） |
| `/member/carrier` | ✅ | 沿用 |
| `/member/orders` | ❌（有 `/orders`） | **新建別名頁**＋保留 `/orders` |
| `/member/benefits` | ❌ | **新建骨架**（無假點數） |
| `/member/favorites` | ✅（僅商品） | 後續擴 recipe/video |
| `/member/addresses` | ✅ | 沿用 |
| `/member/notifications` | ✅ | 沿用 |
| `/member/settings` | 部分（account/notifications） | 補入口頁 |
| `/recipes` | 骨架＋mock | 後續接 DB |
| `/videos` | ✅ | 沿用擴 slug |
| `/news` | 骨架＋mock | 後續接 DB |
| `/support` `/faq` | ✅ | 後續拆 support/* |

## 後台路由（現況）

已有：`/admin/orders`、`/admin/members`、`/admin/faqs`、`/admin/videos`、`/admin/notifications`、`/admin/cms`、`/admin/articles`  
缺少：`/admin/recipes`、`/admin/news`、`/admin/banners`、`/admin/home`、`/admin/benefits`、`/admin/audit-logs`、`/admin/media`、`/admin/support-settings`（有 support tickets）

導航標籤待改：「訂單中心」→「App 訂單」、「會員」→「App 會員」

## 資料表

| 需求 | 狀態 |
|------|------|
| `orders` / `order_items` | ✅ App 訂單（無 pos_*） |
| `profiles` + member_number/code | ✅ |
| `invoice_carriers` + RLS | ✅ |
| `product_favorites` + RLS | ✅（僅 product） |
| `member_addresses` + RLS | ✅ |
| `notifications` + prefs | ✅ |
| `faqs` | ✅ |
| `videos` / livestreams | ✅ |
| `articles` | ✅（可當新聞／知識） |
| `audit_logs` | ✅ 早期 schema |
| `store_members`（Phase 5） | ✅ phone-only |
| `recipes` / ingredients / steps | ❌ |
| `favorites` 多類型 | PARTIAL（product only） |
| `member_benefits` | ❌ |
| `banners` / `home_sections` | PARTIAL（cms／header-promos） |
| `pos_*` / offline spending | **不存在（正確）** |

## App 訂單模型

- 來源：`orders`（user 下單）
- 類型：`group_buy_event_id` 有值 → 團購；`channel`：`website`｜`group_buy`｜`store_reservation`
- 履約：`shipments.method`：`store_pickup`｜`home_delivery`｜`cvs_pickup`
- **確認**：types／migrations **無** `pos_order_id` 等欄位

## 權限

- Roles：`admin`｜`store_staff`｜`member`（尚無 Content Editor／CS 細分）
- `src/lib/admin/permissions.ts` + ADMIN_NAV

## Batch 2 缺口（本批實作）

1. 「我的 App 訂單」文案與說明
2. `/member/barcode`
3. `/member/orders`（沿用 `/api/orders/my`）
4. `/member/benefits` Coming Soon（無假點數）
5. `/member/settings` 入口
6. Admin 選單標籤改名
