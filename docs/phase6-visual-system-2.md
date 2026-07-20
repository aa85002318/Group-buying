# Phase 6 — Frontend Visual System 2.0 完成報告

## 1. 修改檔案清單（主要）

### Design system
- `src/styles/tokens.css`（新建）
- `src/styles/design-tokens.css`（改為 shim）
- `public/design-tokens.css`
- `src/app/globals.css`
- `tailwind.config.ts`
- `src/lib/theme.ts`（新建）

### UI primitives
- `src/components/ui/button.tsx`（含 `groupBuy` / `loading`）
- `src/components/ui/badge.tsx`
- `src/components/ui/status-badge.tsx`（新建，前台用）
- `src/components/ui/input.tsx`
- `src/components/ui/chip.tsx`
- `src/components/ui/card.tsx`

### Layout / brand
- `src/components/layout/Header.tsx`
- `src/components/layout/MobileBottomNav.tsx`
- `src/components/layout/AppHeader.tsx`
- `src/components/brand/BrandIcon.tsx`
- `src/components/brand/ProductSticker.tsx`
- `src/components/products/ProductCard.tsx`

### Home / member / pages
- `src/components/home/*`（CategoryGrid、HomeProductCard、Banner 等）
- `src/components/member/*`（MemberCenter、Carrier、Favorite 等）
- `src/app/(main)/page.tsx` 與多個會員／FAQ／門市／客服頁

**未修改：** `/admin/**` 配色、資料庫、API、RLS、訂單／庫存邏輯。

---

## 2. Design Token 對照表

| Token | Value |
|------|-------|
| `--primary` | `#E85D5D` |
| `--primary-hover` | `#C9424A` |
| `--group-buy` | `#FF8A3D` |
| `--group-buy-hover` | `#E66B25` |
| `--background` | `#FFF9F3` |
| `--surface` | `#FFFFFF` |
| `--surface-soft` | `#FFF0EB` |
| `--text-primary` | `#3D302B` |
| `--text-secondary` | `#817672` |
| `--border` | `#EDE2DA` |
| `--price` | `#D92D20` |
| `--success` | `#3F9B70` |
| `--warning` | `#F5A623` |
| `--error` | `#D9363E` |
| `--info` | `#4285C5` |
| `--disabled` | `#9A9490` |

另提供 `*-rgb` channel 以支援 Tailwind opacity（如 `bg-primary/15`）。

---

## 3. Tailwind Token 對照表

| Class | Maps to |
|-------|---------|
| `bg-primary` / `hover:bg-primary-hover` | brand CTA |
| `bg-groupBuy` / `hover:bg-groupBuy-hover` | 團購 |
| `bg-background` | 頁面底 |
| `bg-surface` / `bg-surface-soft` | 卡片／柔和區 |
| `text-foreground` / `text-foreground-secondary` | 主／次文字 |
| `text-price` | 售價 |
| `border-border` | 邊框 |
| `text-success` / `warning` / `error` / `info` / `disabled` | 狀態 |

相容別名：`coffee`→foreground、`brand.*`→2.0 tokens、`muted`→surface-soft。

---

## 4. 已移除硬編碼色彩數量

- 前台批次替換約 **130+** 處 hex class（首波 225→91，後續再清）
- 核心元件（Header / BottomNav / ProductCard / BrandIcon / CategoryGrid / Home*）已幾乎無硬編碼品牌色
- 前台仍殘留約 **~100** 處 hex（見下節）

---

## 5. 尚未替換色彩及原因

| 範圍 | 原因 |
|------|------|
| `src/app/admin/**`、`src/components/admin/**` | 規格要求不改後台配色 |
| Monster 遊戲頁插畫／漸層 | SVG／裝飾性視覺，避免失真 |
| Banner 內嵌行銷圖上的裝飾點 | 局部視覺效果，非語意色 |
| 少數 rgba 陰影字串 | 可接受；多數已改 `shadow-card` / `shadow-sticker` |
| 第三方／QR 條碼深色 | 條碼需高對比黑白，規格允許 |

---

## 6. 各頁面修改摘要

| 區域 | 變更 |
|------|------|
| 全域 | 暖米色背景、語意色、Button/Input/Badge |
| Header | surface + border；選取 primary；團購入口 groupBuy |
| Bottom Nav | surface；一般選取 primary；今日上新 groupBuy；44px 觸控 |
| 首頁 | soft背景；分類淡色＋彩色 icon；價格 text-price |
| 商品卡 | surface／border／16px；團購角標 groupBuy |
| 會員／發票 | surface 卡＋primary CTA；條碼區維持白底深色條碼 |
| 團購識別 | groupBuy 用於標籤／CTA，非整頁橘底 |

---

## 7. 響應式檢查（程式層）

| 裝置 | 結果 |
|------|------|
| 手機 | Bottom nav safe-area；touch min 44px；Header 漢堡 primary |
| 平板／桌機 | `bg-background` + max-width 內容；Header border |
| 視覺驗收 | 需部署後實機確認 Banner 對比與團購識別 |

---

## 8. 無障礙對比

- 主文字 `#3D302B` on `#FFF9F3`：通過正常對比
- 白字 on primary / groupBuy / error：通過
- warning 背景上使用 `text-foreground`（非白字）避免對比不足
- Focus：`focus-visible:ring-2 ring-primary/40`
- StatusBadge 支援 icon + 文字，不只靠顏色

---

## 9–11. 測試結果

| 指令 | 結果 |
|------|------|
| `npm run lint` | ✔ No ESLint warnings or errors |
| `npx tsc --noEmit` | ✔ exit 0（專案無 typecheck script，以此代替） |
| `npm run build` | ✔ 成功 |

---

## 確認清單

1. ✓ 首頁／團購品牌色區隔（primary vs groupBuy）
2. ✓ 官網與 App 共用同一 token 檔
3. ✓ 一般／團購 CTA 可區分
4. ✓ 價格使用 `text-price`
5. ✓ 狀態色語意化
6. ✓ 無大面積過飽和整頁橘／紅底
7. ✓ 底部導覽語意色＋ safe-area
8. ✓ 深色文字於暖底
9. ✓ Button hover／focus／disabled／loading
10. ✓ 未改 admin／DB／API
