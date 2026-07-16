# App 設計與上架流程（CHIMEIDIY 團購）

目前路線：**Capacitor WebView 包殼** — App 開啟後載入正式站  
`https://shop.chimeidiygroupbuying.com`  
（網站改版即時生效，多數內容不必重送審）

| 項目 | 值 |
|------|-----|
| App 顯示名稱 | CHIMEIDIY 團購 |
| Bundle / Application ID | `com.chimeidiy.groupbuy` |
| 設定檔 | `capacitor.config.ts` |
| iOS / Android 專案 | `ios/`、`android/` |

---

## 一、App 設計規格（建議）

### 1. 產品定位

- **名稱：** CHIMEIDIY 團購  
- **副標／品牌：** 棋美點心屋  
- **一句話：** 線上團購、門市取貨、訂單與會員一站完成  
- **核心流程：** 瀏覽 → 下單 → 付款／取貨 → 訂單／條碼 →（選用）LINE 通知

### 2. 視覺與品牌

| 項目 | 建議 |
|------|------|
| 主色 | `#E53935`（品牌紅） |
| 強調色 | `#FF6B00`（橘） |
| 狀態列 | 淺色文字 + 紅色底（已設定） |
| Splash | 紅底 + Logo／角色圖 |
| App Icon | 1024×1024（無透明、無圓角；系統會裁切） |
| 頁首 | Logo 圖 +「CHIMEIDIY 團購」／「棋美點心屋」 |

後台可調頁首導覽：`/admin/site-header`（可新增項目與連結）。

### 3. 畫面與資訊架構（App 內＝網站）

```
啟動 Splash
  └─ WebView 首頁
       ├─ 商品 / 團購 / 直播 / 影音 / 文章（頁首可自訂）
       ├─ 購物車 → 結帳
       ├─ 會員中心（資料、條碼、LINE 社群）
       ├─ 我的訂單（取貨 QR）
       └─ 門市掃碼（僅 staff／admin）
```

**設計原則：**

- 維持現有響應式網頁，不另做一套原生 UI  
- 手機優先：觸控區塊夠大、底部導覽可用  
- Safe Area：瀏海／底部橫條留白（已用 `viewport-fit=cover`）  
- 外部連結（LINE 社群等）用系統瀏覽器或新分頁開啟

### 4. 權限與原生能力

| 能力 | 用途 | 狀態 |
|------|------|------|
| 網路 | 載入網站 | 必要 |
| 相機 | 門市掃碼 `/staff/pickup-scan` | iOS／Android 已申請說明 |
| 推播 | 到貨／付款提醒 | 可後期（FCM + APNs） |
| LINE | 登入綁定、訂單通知 | 程式已預留，需填 Channel Token |

### 5. 審核用「設計說明」可這樣寫

> 本 App 為 CHIMEIDIY 團購官方客戶端，提供實體商品團購瀏覽、下單、門市取貨與會員服務。內容透過安全 HTTPS 連線載入官方網站；付款為實體商品／線下取貨情境，非數位內容訂閱。

---

## 二、上架前必備清單

### 帳號與金流

- [ ] **Apple Developer**（年費）  
- [ ] **Google Play Console**（一次性註冊費）  
- [ ] Vercel：`NEXT_PUBLIC_SITE_URL=https://shop.chimeidiygroupbuying.com`  
- [ ] Supabase Site URL + Redirect：`…/auth/callback`

### 法務與帳號（商店常擋）

- [x] **隱私權政策**公開網址：`https://shop.chimeidiygroupbuying.com/privacy`  
- [x] **服務條款**：`https://shop.chimeidiygroupbuying.com/terms`  
- [x] **刪除帳號說明**（商店填寫用）：`https://shop.chimeidiygroupbuying.com/account-deletion`  
- [x] **App 內刪除入口**：會員中心 → 刪除帳號（`/profile/delete`）  
- [ ] 若有第三方登入：Apple 常要求 **Sign in with Apple**  
- [ ] 審核用**測試帳號**（一般會員 + 可選門市帳號）

### 素材

| 素材 | Apple | Google |
|------|-------|--------|
| App Icon | 1024×1024 | 512×512 |
| 截圖 | 6.7"／6.1" 等 iPhone | 手機（可選平板） |
| 說明文案 | 繁中短述 + 關鍵字 | 短述 + 完整說明 |
| 分級 | 問卷 | IARC |

### 技術實測（實機）

```bash
npm run cap:sync
npm run cap:ios      # 或 cap:android
```

- [ ] 註冊／登入／Email 驗證回調  
- [ ] 下單、購物車、訂單列表、取貨 QR  
- [ ] 會員條碼  
- [ ] 門市掃碼（相機權限）  
- [ ] Android 返回鍵  
- [ ] Cookie／Session 不會異常登出  

---

## 三、上架流程（逐步）

### Phase A — 準備（約 1–2 週）

1. 補齊隱私權、條款、刪除帳號說明頁  
   - 已就緒：`/privacy`、`/terms`、`/account-deletion`、`/profile/delete`
2. 產出 App Icon、Splash、商店截圖（用實機或模擬器截正式站）  
3. 確認正式站穩定：`https://shop.chimeidiygroupbuying.com`  
4. 準備審核測試帳號與操作說明（下單路徑寫清楚）

### Phase B — iOS（App Store）

1. 開啟 `ios` 專案：`npm run cap:ios`  
2. Xcode → Signing & Capabilities（Team、Bundle ID）  
3. 設定 App Icon／Launch Screen  
4. Archive → 上傳至 App Store Connect  
5. 填寫：名稱、描述、關鍵字、隱私權 URL、截圖、年齡分級  
6. **App Privacy** 問卷（Email、電話、訂單等）  
7. 送審前用 **TestFlight** 內部測試  
8. Submit for Review  

**審核備註建議：** 說明為實體團購／門市取貨；附測試帳號；標註主要流程路徑。

### Phase C — Android（Google Play）

1. 開啟 `android`：`npm run cap:android`  
2. 建立簽章 keystore（妥善備份）  
3. 產出 AAB（Play 要 App Bundle）  
4. Play Console → 建立應用程式  
5. 填商店資訊、圖示、截圖、內容分級  
6. **資料安全**表單  
7. 先走**內部測試** → 再封閉／開放測試 → 正式發布  

### Phase D — 上架後維運

- **網站小改**：直接部署 Vercel，App 通常不必重送審  
- **改 Bundle ID、權限、原生殼**：需新版 App 送審  
- 監控：登入失敗、白屏、相機權限拒絕率  
- 可選下一階段：推播、Universal Links／App Links、LINE 正式開通  

---

## 四、建議時程總覽

```
現在     正式站已上線 + Capacitor 專案已建立
週 1–2   隱私權／條款／刪除帳號 + Icon／截圖 + 實機測試
週 2–3   TestFlight + Play 內部測試
週 3–5   送審、依退件修正、正式上架
之後     推播／深度連結／LINE 通知（選用）
```

---

## 五、其他路線（對照）

| 方案 | 說明 | 適合 |
|------|------|------|
| **PWA** | 加入主畫面，不經商店 | 最快驗證，但無商店搜尋 |
| **Capacitor（現行）** | 網站包進 App | 要上架、功能以網頁為主 |
| **React Native** | 重做 UI | 要強原生體驗／離線 |

---

## 六、常用指令

```bash
npm run cap:sync
npm run cap:ios
npm run cap:android

# 本機除錯（測完改回正式網址再 sync）
CAPACITOR_SERVER_URL=http://192.168.x.x:3003 npm run cap:sync
```

相關文件：

- 部署：`docs/APP-DEPLOYMENT-GUIDE.md`  
- 多裝置開發：`docs/MOBILE-ACCESS.md`  
- Supabase：`docs/SUPABASE-DASHBOARD-CHECKLIST.md`  
