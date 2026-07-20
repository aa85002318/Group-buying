# CHIMEIDIY App V1 UI — Phase 1 完成報告

## 1. 原專案架構盤點

- Next.js 14 App Router + React 18 + TypeScript + Tailwind
- Supabase Auth / PostgreSQL / RLS（未改 Schema）
- 既有：商品、分類、購物車、結帳、訂單、會員、團購、取貨 QR
- 先前 Consumer Hub 八大入口路由已存在，本階段改為 **Mobile-first App Shell**

## 2. 沿用功能清單

- `/products`、`/cart`、`/checkout`、`/orders`
- `/group-buy` 與團購價邏輯
- `/member` 登入、載具、收藏、地址、通知
- `/recipes` `/news` `/support` `/ai-tools` `/store-map` `/search`（入口骨架）
- `useCart`、FavoriteButton、既有 API

## 3. 修改檔案清單（主要）

- `src/styles/tokens.css` — App V1 配色
- `tailwind.config.ts` — caramel / butter / peach / semantic tokens
- `src/app/globals.css` — header gap
- `src/app/layout.tsx` — metadata / themeColor
- `src/app/(main)/page.tsx` — App 首頁
- `src/app/(main)/shop/ShopHubClient.tsx`
- `src/components/layout/MainLayout.tsx` → AppShell
- `src/components/layout/AppHeader.tsx`（重寫）
- `src/components/layout/MobileBottomNav.tsx`
- `src/components/products/ProductCard.tsx`
- `src/lib/consumer-hub.ts` — Bottom nav 五項
- `src/components/consumer/HomeSearchBar.tsx` — re-export
- `public/manifest.webmanifest`

## 4. 新增檔案清單

- `public/branding/chimeidiy-app-header-logo.png`
- `public/branding/chimeidiy-logo-compact.png`
- `public/branding/chimeidiy-app-icon.png`
- `src/components/branding/ChimeidiyLogo.tsx`
- `src/components/layout/AppShell.tsx`
- `src/components/app/AppAccessGuard.tsx`
- `src/components/home/HomeSearchBar.tsx`
- `src/components/home/HeroCarousel.tsx`
- `src/components/home/ServiceHubGrid.tsx` / `ServiceHubCard.tsx`
- `src/components/home/PopularCategories.tsx`
- `src/components/home/NewProductsSection.tsx` / `PopularProductsSection.tsx`
- `src/components/ui/AppLoading.tsx` / `AppEmptyState.tsx` / `AppErrorState.tsx`
- `docs/app-v1-ui-phase1.md`

## 5. Design Token 對照（摘要）

| Token | 值 |
|-------|-----|
| primary | `#FF6B6B` |
| caramel | `#8B572A` |
| butter | `#FFD97A` |
| peach | `#FFE3D6` |
| group-buy | `#FF9A3D` |
| background | `#FFF9F5` |
| text-primary | `#4A352A` |
| price | `#FF5B4A` |

Tailwind：`bg-primary`、`bg-caramel-soft`、`text-caramel`、`bg-groupBuy`、`text-price`、`bg-cream-soft` 等。

## 6. Logo 使用位置

- Header：`ChimeidiyLogo` variant=`header` → `/branding/chimeidiy-app-header-logo.png`
- Empty / Desktop prompt：`compact`
- Manifest / Apple icon：`/branding/chimeidiy-app-icon.png`

## 7. AppShell

- 外層 `bg-cream-soft`；內層 `md:max-w-[960px]` 置中 App Container
- Sticky AppHeader + main（底部 `88px + safe-area`）+ BottomNav
- 無傳統桌機 Header / Mega Menu / 大型 Footer

## 8. App Header

- `home`：Logo 左、通知＋購物車右
- `standard` / `detail` / `search`：返回＋標題＋右側操作
- 60px + `safe-area-inset-top`；Icon 44px、caramel 預設

## 9. Bottom Navigation

五項：`/` 首頁、`/shop` 分類、`/group-buy` 團購、`/cart` 購物車、`/member` 會員  
團購選取用 group-buy；購物車 Badge primary；App 寬度內 fixed（含平板）。

## 10. 首頁各區塊

| 區塊 | 狀態 |
|------|------|
| 搜尋列 | ✅ |
| Hero Carousel（3 張） | ✅ |
| 八大入口 4 欄 | ✅ |
| 熱門分類橫滑 | ✅ |
| 新品／熱門商品 | ✅（API + mock fallback） |
| 食譜預覽 | ✅ mock |
| 團購預覽 | ✅ API |
| AI 入口 | ✅ |
| 最新資訊 | ✅ mock |
| 門市服務 | ✅ |
| 簡易條款列 | ✅ |

## 11. 商品卡

- 1:1 `object-contain`、圓角 18、淡陰影
- Badge、價格、原價、快速加入（primary／group-buy）
- 保留 `sticker` 相容既有頁面

## 12. 已修正跑版方向

- 移除桌機 max-w-7xl + 舊 Header 高度佔位
- Bottom nav 改全 App 顯示並預留 padding
- 八大入口 4 欄短標、商品卡 `min-h` + `line-clamp`
- 分類／Chip 區 `overflow-x-auto` + 頁面 `overflow-x-hidden`

## 13. PWA

- name／short_name／theme `#FF6B6B`／bg `#FFF9F5`／portrait-primary
- Icon 指向 branding（192／512／maskable 預留同一檔，後續可換獨立 maskable）

## 14. App Access Guard

- **預設開放網頁**：App 尚未上架，不顯示阻擋／強制提示
- 日後設 `NEXT_PUBLIC_REQUIRE_APP=true` 才啟用桌機安裝提示
- `NEXT_PUBLIC_ALLOW_DESKTOP=true` 可永久關閉提示
- 非正式安全機制；會員安全仍靠 Auth／RLS

## 15. 尚未完成

- 獨立 192／512／Maskable／Splash 素材
- 食譜 CMS、AI 付費 API、門市定位、社群 API、福利發放
- 內頁全面改 `AppHeader` variant=`detail` 標題
- 實機 320–1024 視覺抽檢
- 舊 `Header.tsx` 仍留在 repo（未掛載）

## 16. Mock Data

- `src/lib/mock/consumer-hub.ts`（食譜／新聞）
- `src/lib/mock-data.ts`（商品 fallback）
- Hero 文案內建於 `HeroCarousel`

## 17–18. 手機／平板測試

- 程式層：App container、4 欄入口、2／3–4 欄商品、safe-area、Bottom nav
- 建議部署後實機抽檢 SE／375／390／430／iPad

## 19. lint

✔ No ESLint warnings or errors

## 20. typecheck

`npx tsc --noEmit` → exit 0  
（package.json 無獨立 `typecheck` script，沿用現有指令）

## 21. build

`npm run build` → success
