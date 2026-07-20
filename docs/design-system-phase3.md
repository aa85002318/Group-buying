# CHIMEIDIY Design System — Phase 3

品牌：CHIMEIDIY 棋美點心屋  
風格：Pinkoi × 寶雅 × MUJI（溫暖、活潑、乾淨）

## Color Palette

| Token | Hex | 用途 |
|-------|-----|------|
| Primary | `#E9285C` | CTA、重點、品牌 |
| Secondary | `#FF7A45` | 活力橘、次要 CTA |
| Yellow | `#FFC83D` | 貼紙、優惠標 |
| Mint | `#4CC9A6` | 文章、客服 |
| Blue | `#3A86FF` | 課程、預購 |
| Background | `#FFF8F6` | 頁面底 |
| Card | `#FFFFFF` | 卡片 |
| Dark | `#222222` | 主文字 |
| Gray | `#757575` | 次文字 |
| Success | `#31B057` | 成功 |
| Warning | `#FF9F1C` | 警示 |
| Error | `#E53935` | 錯誤 / LIVE |

## Design Tokens 檔案

- App：`src/styles/design-tokens.css`
- 公開同步：`/design-tokens.css`（`public/design-tokens.css`）
- Tailwind：`tailwind.config.ts`

## 元件對照（Figma-ready）

| Figma 元件 | 程式元件 | 路徑 |
|------------|----------|------|
| Color / Tokens | CSS variables | `src/styles/design-tokens.css` |
| Button / Primary | `Button` default | `src/components/ui/button.tsx` |
| Button / Secondary | `Button` secondary | 同上 |
| Button / Ghost | `Button` ghost | 同上 |
| Badge / Stickers | `Badge` + `ProductSticker` | `ui/badge.tsx`, `brand/ProductSticker.tsx` |
| Chip | `Chip` | `src/components/ui/chip.tsx` |
| Card | `Card` / `.card-lift` | `ui/card.tsx`, `globals.css` |
| Icon / Brand | `BrandIcon` | `src/components/brand/BrandIcon.tsx` |
| Skeleton | `Skeleton` | `src/components/ui/skeleton.tsx` |
| Product Card | `ProductCard` / `HomeProductCard` | `products/`, `home/` |
| Banner | `BannerCarousel` | `home/BannerCarousel.tsx` |
| Course Card | `CourseCard` | `courses/CourseCard.tsx` |

## Radius / Spacing / Shadow

- Radius：10 / 14 / 18 / 20 / 24 / full
- Spacing：4–40px scale
- Shadow：`card` / `lift` / `brand` / `sticker`

## Motion

- Hover lift：`-translate-y-0.5` + `shadow-lift`
- Page enter：`.page-enter`
- LIVE pulse：`.animate-live`
- Ribbon float：`.animate-ribbon`

## 官網同步說明

`https://www.chimeidiy.shop` 為外部電商平台（非本 repo），**無法從此專案直接改 UI**。

建議官網團隊：

1. 引入 `https://shop.chimeidiygroupbuying.com/design-tokens.css`
2. 將 Primary / Background / Button / Card 對齊上表
3. 商品資料、分類、搜尋功能維持不變，僅換皮

## App 新增路由

- `/courses` 課程中心
- 首頁區塊：今日新品、直播、老師推薦、熱門、大家都在買、猜你喜歡、即將收單、課程、文章
