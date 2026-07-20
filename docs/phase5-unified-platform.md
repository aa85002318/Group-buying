# CHIMEIDIY Phase 5 — Unified Platform

## 設計原則
- **不重做**：保留 Phase 1–4 功能與既有 API 契約
- **不破壞 API**：`GET /api/products` 等既有參數維持；僅**加性**擴充（如 `?channel=`）
- **Product Master = `products` 表**：不另建平行商品表；`product_master` 為相容 VIEW
- **門市會員僅電話**：`store_members` 無姓名／Email／地址欄位；同電話僅提示、不自動合併
- **模組化**：`productChannelService`、`storeMemberService`、`/api/store`、`/admin/store`、`/admin/cms` 可獨立維護

## Migration
`supabase/migrations/20260721010000_unified_platform_phase5.sql`

已套用至 Supabase（分批）：
- `unified_platform_phase5_a` — master 欄位／channels／category tree／orders.channel
- `unified_platform_phase5_b` — store_*／cms／role_permissions
- `unified_platform_phase5_c_rls` — triggers + RLS

## 新增／擴充表
| 表 | 用途 |
|---|---|
| `product_channels` | website / group_buy / store_only / hidden |
| `store_members` | 門市會員（phone only） |
| `store_inventory` | 門市庫存 |
| `store_batches` | 批號／效期 |
| `store_anomalies` | 異常 |
| `store_returns` | 退貨 |
| `store_disposals` | 報廢 |
| `store_reservations` | 客人訂購 |
| `cms_pages` | CMS 頁面 |
| `homepage_blocks` | 首頁區塊排序 |
| `store_announcements` | 門市公告 |
| `role_permissions` | CRUD 權限矩陣 |
| `product_master` | VIEW（對應 products） |

## 新增路由
| 路徑 | 說明 |
|---|---|
| `/admin/store` | 門市管理後台 |
| `/admin/cms` | 統一 CMS |
| `/admin/orders` | 統一訂單中心（渠道篩選） |
| `/admin/products` | 沿用（Product Master） |

## API
| Endpoint | 說明 |
|---|---|
| `GET /api/products?channel=` | 加性渠道篩選 |
| `GET /api/search?q=` | 統一搜尋（商品／文章／課程／直播／FAQ／品牌） |
| `GET /api/cms` | Banner／區塊／門市公告 |
| `GET|POST|PATCH /api/store?resource=` | 門市營運 |
| `GET|POST|PUT /api/store-members` | 門市會員（電話） |
| `GET|POST|PATCH /api/admin/cms` | CMS 後台 |
| `GET /api/admin/orders?channel=` | 訂單渠道篩選 |
| `GET /api/categories` | 既有（分類含 parent_id） |

## Components / Hooks
- `src/components/home/StoreAnnouncementsSection.tsx`
- `src/hooks/useUnifiedSearch.ts`
- `src/lib/services/productChannelService.ts`
- `src/lib/services/storeMemberService.ts`

## 確認清單
- [x] 官網與團購共用商品主檔（`products` + channels）
- [x] 官網與團購共用 CMS（`cms_banners` / `cms_pages` / `homepage_blocks`）
- [x] 門市管理使用同一商品資料（FK → `products.id`）
- [x] 門市會員僅保留電話號碼（+編號／日期／來源／備註）
- [x] 不自動同步門市會員其他資料（API 拒絕 name/email/address）
- [x] 所有模組皆可獨立維護

## 尚未完整（明確標註）
- 分類拖曳排序 UI（欄位已支援 `parent_id` / `sort_order`）
- Excel Import UI（Export JSON 已有；CSV/XLSX 匯入可接現有 `/api/admin/products/import` 模式）
- Super Admin 等細分角色寫入 `profiles.role`（`role_permissions` 矩陣已建）
- Lighthouse 正式跑分需部署後量測
- 官網 `www.chimeidiy.shop` 仍為外部平台，本 App 為團購／會員／門市整合端
