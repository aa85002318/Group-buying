# CHIMEIDIY Premium Bakery Design System v1.0

品牌：CHIMEIDIY 烘焙生活平台  
定位：精品烘焙材料 × 法式甜點 × 食譜教學 × 品味生活  
感受：溫暖 · 高級 · 專業 · 有食慾 · 不冰冷的科技感

## 配色比例

| 比例 | 色 | HEX | 用途 |
|------|----|-----|------|
| 70% | 奶油白 | `#FFFDF9` | 全站背景 |
| 20% | 杏仁白 | `#F8E6D7` | Banner、區塊、Table Header |
| 10% | 珊瑚紅 | `#E86C5C` | CTA、互動、重點 |

## 檔案

| 用途 | 路徑 |
|------|------|
| App / Admin 主 Token | `src/styles/tokens.css` |
| 相容 shim | `src/styles/design-tokens.css` |
| 官網／PWA 公開同步 | `public/design-tokens.css` → `/design-tokens.css` |
| Tailwind 對應 | `tailwind.config.ts` |
| JS／圖表 Token | `src/lib/design/premium-bakery.ts` |

## 品牌色

```css
--color-primary: #E86C5C;
--color-primary-hover: #D95D4F;
--color-secondary: #B56A45;
--color-premium: #F6C65B;
--color-bg: #FFFDF9;
--color-surface: #F8E6D7;
--color-card: #FFFFFF;
--color-border: #F3E5D9;
--color-text: #5E4035;
--color-text-secondary: #8B6B5A;
--color-text-muted: #A98A7A;
```

## 功能模組色

| 模組 | Token | HEX |
|------|-------|-----|
| 烘焙材料 | `--module-materials` | `#B56A45` |
| 團購 | `--module-groupbuy` | `#E86C5C` |
| 食譜 | `--module-recipe` | `#E8B04A` |
| AI 助手 | `--module-ai` / `--color-ai` | `#8F74D8` |
| 烘焙影音 | `--module-video` | `#79A9E8` |
| 門市管理 | `--module-store` | `#72B67A` |
| 課程 | `--module-course` | `#F39C6B` |
| 最新消息 | `--module-news` | `#5BA8D8` |

## 效期色（Store Ops）

| 狀態 | Token | HEX |
|------|-------|-----|
| 正常 | `--expiry-ok` | `#72B67A` |
| 30 天內 | `--expiry-30` | `#E8B04A` |
| 14 天內 | `--expiry-14` | `#F39C6B` |
| 7 天內 | `--expiry-7` | `#E86C5C` |
| 已過期 | `--expiry-expired` | `#C13F36` |
| 已完成 | `--expiry-done` | `#B5B5B5` |

TS 輔助：`expiryColorForDays(days)` in `premium-bakery.ts`。

## 元件 class

| Class | 用途 |
|-------|------|
| `.btn-primary` / `.btn-brand` | Primary CTA `#E86C5C` |
| `.btn-secondary` | 白底 + 珊瑚邊框 |
| `.btn-ghost` | 透明 + `#B56A45`，hover `#FFF5EF` |
| `.ds-tag` | Tag：`#FFF5EF` / `#B56A45` / `#F3D6C7` |
| `.card-surface` / `.card-lift` | 白卡 + `#F3E5D9`，hover 邊框變 Primary |
| `.home-top-area` | Hero：`#FFFDF9 → #F8E6D7` |
| `.home-hero-gold-line` | 法式金色線 |

## Tailwind 快速用法

```tsx
bg-primary text-white
bg-brand-secondary
bg-premium
bg-module-ai / text-module-store
bg-expiry-d7 / text-expiry-expired
bg-ai-bg text-ai
bg-member-vip
shadow-card
bg-hero-gradient
bg-vip-gradient
```

## Store Ops 後台

| 元件 | Token |
|------|-------|
| Sidebar | `--admin-sidebar` `#FFFDF9` |
| Active | `--admin-sidebar-active` `#FFF1EA` |
| Active Border | `--admin-active-border` `#E86C5C` |
| Table Header | `--admin-table-header` `#F8E6D7` |

後台以中性杏仁／奶油為主，僅 CTA／Active 使用珊瑚紅。

## 官網同步

```html
<link rel="stylesheet" href="https://shop.chimeidiygroupbuying.com/design-tokens.css" />
```

## 遷移原則

1. 新元件一律用 CSS Token / Tailwind semantic，禁止硬編碼舊珊瑚 `#FF5A5F`、舊奶油 `#FFF9EA`。
2. 舊別名（`--caramel`、`--cream`、`--group-buy`）仍指向新色，漸進替換即可。
3. App、後台、PWA、官網共用同一套 `design-tokens.css`。
