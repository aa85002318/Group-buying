# CHIMEIDIY Consumer Hub 1.0 — 完成報告（對齊更新）

> 本階段在既有 Consumer Hub 路由／元件上，對齊 App V1 AppShell 後的導航規格落差並補齊驗收項。

## 1. 新增與修改檔案清單

### 本輪新增
- `src/components/layout/AppHamburgerMenu.tsx` — 漢堡選單（主要服務／支援／會員）
- `src/components/layout/ConsumerHeader.tsx` — AppHeader 別名

### 本輪修改
- `src/lib/consumer-hub.ts` — Bottom nav 改回：首頁／商城／團購／AI／我的
- `src/lib/site-header.ts` — 漢堡選單增加「關於」「會員」區塊
- `src/components/layout/AppHeader.tsx` — 漢堡＋搜尋＋購物車＋會員；平板第二層導航
- `src/components/layout/MobileBottomNav.tsx` — Hub 五項
- `src/components/consumer/ConsumerHubNav.tsx` — 納入 Header 第二層
- `src/app/(main)/page.tsx` — 八大入口改回 2 欄＋說明卡片（consumer ServiceHubGrid）
- `src/app/(main)/group-buy/page.tsx` — 今日開團／即將收單／精選／已結束區塊

### 既有（沿用）
- 路由：`/shop` `/recipes` `/news` `/ai-tools` `/store-map` `/search`
- `src/lib/mock/consumer-hub.ts`、consumer 共用元件
- SEO layouts：member／group-buy／support／各入口 page metadata
- AppShell 響應式、Design Tokens（App V1 珊瑚紅系）

## 2. 新增路由清單

| 路由 | 狀態 |
|------|------|
| `/` | 更新首頁（八大入口＋各預覽區） |
| `/shop` | 既有入口 |
| `/recipes` | 既有骨架＋SEO |
| `/member` | 沿用＋福利 Coming Soon |
| `/group-buy` | 區塊整理＋SEO |
| `/news` | 既有 |
| `/support` | 既有（LINE／FB／IG 外連） |
| `/ai-tools` | 既有 mock AI |
| `/store-map` | 既有文字查詢 |
| `/search?q=` | 既有分組結果 |
| `/ai` `/products` `/cart`… | **保留未刪** |

## 3. 共用元件清單

ConsumerHeader（=AppHeader）、AppHamburgerMenu、MobileBottomNav、ServiceHubGrid／Card、HomeSearchBar、SectionHeader、ProductCard、RecipeCard、NewsCard、SocialLinkCard、AIEntryCard、StoreLocationResult、AppLoading／Empty／Error、ConsumerHubNav

## 4. 已沿用的現有功能

商城列表／詳情／購物車／結帳／訂單、團購價與收單、會員登入與載具、搜尋 API、既有 RLS／Auth

## 5. 尚未串接的功能

付費 AI、缺料一鍵購買、點數／優惠券實發、FB／IG API、門市即時定位、新聞正式 CMS

## 6. Mock Data

`src/lib/mock/consumer-hub.ts`（食譜、影音、新聞、分區、商品位置、AI）

## 7. AI API 預留

`/ai-tools` UI＋`mockPickProduct`／`mockPantryRecipes`＋`AIRecommendation` type

## 8. 門市商品位置格式

```ts
{ productId, productName, sku?, barcode?, zoneCode, aisle?, shelf?, level?, description? }
```

## 9. 響應式

- 八大入口：`grid-cols-2 md:grid-cols-4`＋說明文字
- AppShell max 960px、overflow-x hidden、safe-area
- Bottom nav 五項 ≥44px
- Header Logo 置中不擠壓

## 10–12. 測試結果

| 項目 | 結果 |
|------|------|
| lint | ✔ No ESLint warnings or errors |
| typecheck | `npx tsc --noEmit` exit 0 |
| build | success |

## 驗收對照

1–4、8–12：通過（漢堡選單含主要服務／支援／會員）  
5–7：既有流程未重寫  
13–14：無點數／等級／自動合併門市會員  

---

## 配色更新報告（CHIMEIDIY Version 1）

### 1. 原色彩盤點

- Consumer Hub 早期：`#E85D5D`／`#FFF9F3`
- App V1 過渡：`#FF6B6B`＋caramel／butter／peach（已接近本規格）
- 前台殘留：舊藍 `#173F75`、Tailwind `amber-*`／`red-50`、深陰影 rgba(23,63,117,…)
- 後台：藍系 `#1E3A8A`／`#FF4F7B`（**刻意未改**）

### 2. 新 Design Token 對照（核心）

| Token | Hex |
|-------|-----|
| primary | `#FF6B6B` |
| primary-hover / active | `#F05A5A` / `#E95050` |
| cream / background | `#FFF7F1` |
| caramel | `#8B572A` |
| butter | `#FFD97A` |
| peach | `#FFE3D6` |
| group-buy | `#F89A4B` |
| price | `#F14F4F` |
| text-primary | `#4A3124` |
| border | `#EFDCD0` |

來源：`src/styles/tokens.css`

### 3. Tailwind Token

`tailwind.config.ts`：`primary`／`cream`／`caramel`／`butter`／`peach`／`groupBuy`／`background.soft`／`border.soft`／`price`／status soft 系列；RGB channel 保留 opacity（`bg-primary/15`）。

### 4. 修改配色的檔案清單（摘要）

- `src/styles/tokens.css`、`tailwind.config.ts`、`src/app/globals.css`
- `src/components/ui/button.tsx`（primary／caramel／groupBuy／outline／ghost／destructive）
- Hub：`ServiceHubGrid`、`RecipeCard`、`NewsCard`、`HeroCarousel`、`HomeSearchBar`
- Layout：`AppHeader`、`AppShell`、`MobileBottomNav`、`NetworkStatusBanner`
- 商城／會員／客服／FAQ／登入／訂單／門市地圖 等前台頁（見 git diff ~45 files）

### 5. 已替換硬編碼

約 **80+** 處前台 `#173F75`／舊陰影／`amber-*`／`red-50`／舊粉紅 accent 改為 semantic class。

### 6. 尚未替換及原因

| 範圍 | 原因 |
|------|------|
| `src/app/admin/**`、`components/admin/**`（~223 hex） | 規格要求不改後台 |
| LINE `#06C755` | 社群官方識別色 |
| 發票條碼 `#FFFFFF`/`#000000` | 掃碼可讀性 |
| `monster/*` 活動頁 | 獨立活動視覺，非主站 Hub |
| Email HTML layout | 郵件客戶端需 inline hex |

### 7–14. 各區配色摘要

- **首頁**：cream 背景、白卡、Hero cream→peach、CTA primary
- **八大入口**：白卡＋border-soft；icon wells：primary／butter／caramel／groupBuy／peach／surface-warm
- **商城／商品卡**：surface＋border-soft、price、快速加入 primary／groupBuy
- **食譜**：butter／peach 標籤、caramel 標題、primary 播放標
- **會員**：surface 卡、caramel icon、無黑金 VIP
- **團購**：background＋groupBuy CTA／Badge，非整頁橘底
- **最新資訊**：primary-soft 分類、error／info badge
- **AI**：cream／peach／butter 提示、primary CTA（無紫）
- **門市地圖**：caramel-soft 一般區、info 冷藏冷凍、peach 器具、butter 包裝／櫃台

### 15. 響應式配色

同一套 tokens；AppShell `bg-cream` 外框＋`bg-background` 容器；手機／平板／桌機一致。

### 16–18. 測試

| 指令 | 結果 |
|------|------|
| lint | ✔ |
| `npx tsc --noEmit` | exit 0 |
| build | success |

### 配色驗收

奶油白背景、白 Header、珊瑚紅 CTA、焦糖導航 Icon、price 統一、八大入口無高飽和滿底、無科技紫、後台未改、商業邏輯未動 — **通過**。

## 尚待（非阻塞）

- monster 活動頁／Email HTML 可另開任務語意化
- 實機視覺抽檢
- 未 commit／部署（待指示）
