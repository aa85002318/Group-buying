# Consumer Hub 2.0 — Batch 4 完成報告

## 範圍

食譜／影音前後台（沿用既有 `videos` 表，新建 `recipes` 系列表）

## Migration

`supabase/migrations/20260721030000_consumer_hub_phase2_batch4_recipes_videos.sql`

- `recipe_categories` / `recipes` / `recipe_ingredients` / `recipe_steps` + RLS
- 擴充 `videos`：slug、category、status、duration、SEO 等
- 種子分類：蛋糕、麵包、餅乾…

## 前台

| 路由 | 說明 |
|------|------|
| `/recipes` | 分類、搜尋、難度、列表卡片 |
| `/recipes/[slug]` | 材料、步驟、重點、保存、影音、分享 |
| `/videos` | 分類篩選列表 |
| `/videos/[id]` | 支援 id 或 slug；`VideoEmbed` 安全播放 |

## 後台

| 路由 | 說明 |
|------|------|
| `/admin/recipes` | 列表、複製、刪除、預覽 |
| `/admin/recipes/new` | 新增（材料／步驟） |
| `/admin/recipes/[id]` | 編輯、發布狀態 |
| `/admin/videos` | 深化表單與預覽 |
| `/admin/videos/[id]` | 編輯頁 |

## 安全

- 不接受任意 iframe HTML
- YouTube URL 驗證後才 embed
- Facebook／外部連結改開新分頁（預留）

## Mock

未接 Supabase 時使用 `src/lib/mock/recipes.ts` 與更新後的 `mockVideos`

## 尚未完成（後續批次）

- 食譜／影音正式收藏 target_type
- 關聯商品挑選器 UI
- 排程發布 cron
- 最新資訊／Banner／首頁 CMS
