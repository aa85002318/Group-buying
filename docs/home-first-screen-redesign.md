# 首頁封面與第一屏重設計

## 1. 原首頁問題盤點

- 八大服務入口等寬卡片，像後台 Dashboard
- Header Logo 置中＋搜尋圖示佔權重，不像商城 App
- Hero 以文字輪播為主，缺乏商品／烘焙生活情境與品牌 IP
- 第一屏被功能卡占滿，商品區露出不足
- 所有入口權重相同，無法快速辨識購物／團購／食譜主路徑

## 2. 新首頁區塊順序

1. Sticky Header（Logo 左／通知・購物車・會員右）
2. 歡迎文字（登入／未登入）
3. 全站搜尋列
4. 視覺型 Hero Banner
5. 四個主要快捷入口
6. 次要服務橫向滑動
7. 今天想買什麼？（分類）
8. 今日新品
9. 本週熱門
10. 一分鐘教你做（食譜）
11. 即將收單（團購）
12. AI 烘焙助手
13. 最新資訊
14. 門市服務
15. Footer

## 3. 修改檔案清單

- `src/app/(main)/page.tsx`
- `src/components/layout/AppHeader.tsx`
- `src/components/layout/MobileBottomNav.tsx`
- `src/components/consumer/ConsumerHubNav.tsx`
- `src/components/consumer/ServiceHubGrid.tsx`（新增 `variant="compact"`）
- `src/components/home/HomeSearchBar.tsx`
- `src/components/home/PopularCategories.tsx`
- `src/components/home/NewProductsSection.tsx`
- `src/lib/consumer-hub.ts`
- `src/styles/tokens.css`

## 4. 新增元件

- `HomeWelcome`
- `HomeHero`
- `PrimaryQuickActions`
- `SecondaryServiceScroller`

## 5. 重構元件

- `AppHeader`（首頁布局）
- `ServiceHubGrid`（保留 full，加 compact）
- `PopularCategories`／`ConsumerHubNav`／`MobileBottomNav`

## 6. Hero 修改內容

- 奶油白→蜜桃橘柔和背景
- 主標「今天想烤什麼？」
- CTA「逛烘焙材料」＋食譜文字連結
- 右側品牌 Icon＋麵粉／奶油／蛋／打蛋器等 CSS 情境裝飾

## 7. 八大入口分組

**主要四入口：** 烘焙材料、食譜影音、團購專區、我的會員  
**次要橫滑：** AI 助手、門市地圖、最新資訊、門市客服

## 8–10. 響應式

- 手機：第一屏改為歡迎＋搜尋＋Hero＋四快捷＋次要橫滑露出
- 平板／桌機：Hero 左右排、四入口橫向卡、導航焦糖棕＋珊瑚紅 active
- 桌機 `--app-max-width` ≥1024px 為 1200px

## 11. 保留功能

- 所有路由、商品／團購 API fetch、購物車、登入、底部導航五項
- 未改 DB／API／結帳／訂單

## 12. 尚未處理

- 真實商品分類情境圖（目前文字縮寫 fallback）
- 專用天使公仔插圖資產（暫用 app icon）
- 掃描條碼仍為 disabled 預留
- 未執行完整瀏覽器各斷點截圖驗收（需本機／部署後目視）
