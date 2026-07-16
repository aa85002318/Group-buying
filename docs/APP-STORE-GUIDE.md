# App 上架注意事項（chimeidiy 團購）

目前網站是 **Next.js 響應式網頁**，手機瀏覽器已可完整使用。若要上架 **App Store / Google Play**，有三條常見路線，建議依預算與時程選擇。

---

## 路線比較

| 方案 | 說明 | 上架難度 | 適合時機 |
|------|------|----------|----------|
| **A. PWA** | 使用者「加入主畫面」，像 App 一樣開啟 | 不需商店審核 | 先驗證市場、內部測試 |
| **B. WebView 包殼**（Capacitor / Expo WebView） | 現有網站包進原生殼 | 中 | 要快上架、功能以網頁為主 |
| **C. 原生 / React Native** | 重做或部分原生畫面 | 高 | 需要相機、推播、離線等深度整合 |

**建議：** 先上線 **HTTPS 正式網域** + 手機版網頁穩定，再決定是否包殼或做原生 App。

---

## 不論哪條路，上線前必備

### 1. 正式 HTTPS 網域

- App Store / Play 審核與金流、登入回調都要求 **HTTPS**
- 設定 `NEXT_PUBLIC_SITE_URL=https://你的網域`
- Supabase **Site URL** 與 **Redirect URLs** 改為 `https://你的網域/auth/callback`

### 2. 隱私權與服務條款

- 需有**隱私權政策**網址（收集：姓名、電話、Email、訂單、生日）
- 建議加上**服務條款**、退換貨說明
- App 商店表單會要求填 Privacy Policy URL

### 3. 帳號與登入

- **Apple**：若提供 Google / Email 登入，通常還需提供 **Sign in with Apple**（Guideline 4.8）
- **Google Play**：資料安全表單需說明收集哪些資料、是否加密傳輸
- 刪除帳號：兩平台 increasingly 要求提供**刪除帳號**方式（可在會員中心或客服流程）

### 4. 金流（若 App 內付款）

- **實體商品團購**：一般可用綠界 / 藍新等網頁金流，**不必**走 Apple IAP
- **數位內容或訂閱**：可能觸發 Apple 30% IAP 規定，需個案評估
- 本專案為團購取貨，多屬實體商品，但仍建議在審核說明中寫清楚「線下取貨、實體商品」

### 5. 推播通知（選用）

- 網頁：Web Push（需 HTTPS + Service Worker）
- 原生殼：Firebase Cloud Messaging（FCM）+ APNs（iOS）
- 訂單狀態、取貨提醒可之後再加

### 6. 深層連結（Deep Link）

若用 WebView 或原生殼，需設定：

- iOS：**Universal Links**（`apple-app-site-association`）
- Android：**App Links**（`assetlinks.json`）
- 驗證信、分享連結要能開回 App 或網頁

目前網頁路徑如 `/auth/callback`、`/orders/[id]` 可沿用。

### 7. 商店素材

| 項目 | Apple App Store | Google Play |
|------|-----------------|-------------|
| 開發者帳號 | Apple Developer（年費） | Google Play Console（一次性） |
| 截圖 | 多種 iPhone 尺寸 | 手機 + 可選平板 |
| 說明 | 繁中描述、關鍵字 | 簡短 / 完整說明 |
| 分級 | 問卷 | IARC 分級 |
| 測試 | TestFlight | 內部 / 封閉測試軌道 |

### 8. 本專案技術檢查

- [ ] Migration 已在 Supabase 執行（會員、商品欄位）
- [ ] Resend 驗證信 / 訂單信可正常寄送
- [ ] 後台 `/admin` 僅 staff / admin 可進
- [ ] 門市掃碼 `/staff/pickup-scan` 在手機相機可運作
- [ ] 會員條碼 `/profile` QR 可被門市掃描

---

## 方案 A：PWA（最快）

1. 新增 `manifest.json`（名稱、圖示、theme color）
2. 可選 Service Worker（離線快取、推播）
3. 使用者用 Safari / Chrome「加入主畫面」

**優點：** 無審核、改版即時  
**缺點：** iOS 推播與部分 API 有限制；不會出現在 App Store 搜尋

---

## 方案 B：Capacitor 包殼（推薦給現有 Next.js）

本專案已設定 Capacitor，App 以 WebView 載入正式站 `https://shop.chimeidiygroupbuying.com`（改版網站即時生效，無需重新送審每次小改）。

### 專案設定

| 項目 | 值 |
|------|-----|
| App ID | `com.chimeidiy.groupbuy` |
| 顯示名稱 | 棋美團購 |
| 設定檔 | `capacitor.config.ts` |
| 本機占位 | `www/`（實際載入遠端網址） |

### 常用指令

```bash
# 同步原生專案（改 capacitor.config 或 www 後執行）
npm run cap:sync

# 用 Xcode / Android Studio 開啟
npm run cap:ios
npm run cap:android
```

### 本機開發（可選）

若要 App 連本機 Next.js（例如 `http://192.168.x.x:3003`）：

```bash
CAPACITOR_SERVER_URL=http://192.168.x.x:3003 npm run cap:sync
npm run cap:ios   # 或 cap:android
```

測完記得改回正式網址再 sync。

### 實機測試清單

- [ ] 註冊 / 登入 / 驗證信回調 `/auth/callback`
- [ ] 購物車、結帳、訂單列表
- [ ] 會員條碼 `/profile`
- [ ] 門市掃碼 `/staff/pickup-scan`（已申請相機權限）
- [ ] Android 返回鍵行為

### 上架前

1. 在 Xcode 設定 Signing、Bundle ID、App 圖示與截圖
2. 在 Android Studio 設定簽章、應用圖示
3. 部署含 `CapacitorShell` 的 Next.js 至正式網域（狀態列、Splash、返回鍵）
4. 隱私權政策 URL、測試帳號（見上文「不論哪條路，上線前必備」）

**注意：**

- WebView 內登入、Cookie、Supabase session 要實機測
- 相機掃碼需申請相機權限說明（Info.plist / AndroidManifest）
- 審核時提供測試帳號給 Apple / Google

---

## 方案 C：React Native / Expo

適合長期要做推播、原生 UX、離線購物車。可共用 Supabase API 與部分 TypeScript 邏輯，但 UI 需重做。

---

## 建議時程

```
Phase 1  正式 HTTPS 網域 + 手機版網頁穩定（現在）
Phase 2  隱私權 / 條款頁、刪除帳號流程
Phase 3  PWA 或 TestFlight 內測
Phase 4  Capacitor 包殼上架（若需要商店曝光）
```

相關文件：

- 部署：`docs/APP-DEPLOYMENT-GUIDE.md`
- 多裝置開發：`docs/MOBILE-ACCESS.md`
- Supabase：`docs/SUPABASE-DASHBOARD-CHECKLIST.md`
