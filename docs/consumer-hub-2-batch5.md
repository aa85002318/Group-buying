# Consumer Hub 2.0 — Batch 5 完成報告

## 範圍

最新資訊前後台、Banner 管理、首頁 CMS、首頁區塊獨立載入

## Migration

`supabase/migrations/20260721040000_consumer_hub_phase2_batch5_news_banners_home.sql`

- 新建：`news_categories`、`news_posts` + RLS + 分類種子
- 擴充既有 `cms_banners`：`mobile_image_url`、`button_text`、`placement`、`status`、建立／更新者
- 擴充既有 `homepage_blocks`：`subtitle`、`display_count`、`source_mode`、`manual_ids`
- 種子首頁區塊（Hero、快捷、新品、熱門、食譜、影音、團購、資訊、福利、AI、門市）

**未新建** 平行的 `banners` / `home_sections` 表（沿用 `cms_banners`、`homepage_blocks`）。

## 前台

| 路由 | 說明 |
|------|------|
| `/news` | 分類（含優惠）、搜尋、列表 |
| `/news/[slug]` | 詳細頁（消毒 HTML、相關連結安全屬性） |
| `/` | Hero 接 CMS `home_hero`；食譜／影音／資訊／團購／商品獨立載入；區塊失敗可重試；未登入福利區顯示「登入查看會員福利」；登入後顯示未讀通知數 |

## 後台

| 路由 | 說明 |
|------|------|
| `/admin/news`、`/new`、`/[id]` | 草稿／排程／發布／置頂／重要／分類 |
| `/admin/banners` | 版位、桌機／手機圖、排程、排序上下移、連結驗證 |
| `/admin/home` | 區塊啟用、標題／副標／顯示數量、上下排序（無拖曳套件） |

後台導覽已加入「最新資訊」「Banner 管理」「首頁管理」。

## 安全

- 新聞／Banner 連結：`isSafeLinkUrl`（拒 `javascript:`）
- 新聞內文：`sanitizeCmsHtml` 後再輸出
- Banner 公開 API 過濾 `is_active`、`status`、排程區間

## Mock

未接 Supabase 時新聞走 `src/lib/mock/news.ts`；Banner／首頁區塊回空陣列，Hero 使用品牌預設視覺。

## 尚未完成（後續批次）

- 收藏多類型／地址／福利發放引擎（第六批）
- 通知推播正式串接、FAQ／客服設定深化（第七批）
- Dashboard 指標擴充、手動指定區塊內容挑選器、首頁區塊完全依 CMS 排序渲染
- 排程發布 cron

## POS 排除

本批未建立任何 POS／門市消費相關表或 API。
