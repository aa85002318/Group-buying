# 首頁彈跳公告（Homepage Popup）V1

## 後台

- `/admin/content/popups` — 列表
- `/admin/content/popups/new` — 新增
- `/admin/content/popups/[id]` — 編輯＋顯示紀錄＋統計

選單：內容管理 → 首頁彈跳公告

## 前台

- 首頁載入約 0.7 秒後顯示一則有效公告
- localStorage：`chimeidiy_popup_dismissed_{id}_{YYYY-MM-DD}`
- sessionStorage：同工作階段最多一則
- 文案固定「今天不再顯示」

## 資料表

- `homepage_popups`
- `homepage_popup_events`

Migration：`supabase/migrations/20260724193000_homepage_popups.sql`

## API

- `GET/POST /api/admin/popups`
- `GET/PATCH/DELETE /api/admin/popups/[id]`
- `GET /api/popups/active`
- `POST /api/popups/[id]/events`

## 驗收對照（V1）

| 條件 | 狀態 |
|------|------|
| 首頁載入後顯示有效公告 | ✅ |
| 一天同一公告最多一次（勾選後） | ✅ localStorage |
| 隔日可再顯示 | ✅ 日期 key |
| CTA 內部／外部連結 | ✅ |
| 結束時間後不顯示 | ✅ |
| 後台停用立即不顯示 | ✅ status≠active |
| 多則只顯示最高優先級一則 | ✅ |
| 不影響首頁載入 | ✅ 延遲＋獨立 fetch |

## 部署注意

需在 Supabase 套用 migration 後，後台 CRUD 與前台顯示才會有資料。
