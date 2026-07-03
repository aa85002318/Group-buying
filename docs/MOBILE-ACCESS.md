# 手機與電腦皆可開啟（多網址開發）

本專案已改為**不依賴單一固定 IP**。開發時只要用同一台 Wi‑Fi，電腦與手機都能開啟。

## 本機開發

### 1. 啟動伺服器（監聽所有網路介面）

```bash
npm run dev:lan
```

預設 port：**3003**（`0.0.0.0`，區網內任何裝置可連）。

### 2. 環境變數（`.env.local`）

```env
# 開發時建議留空，自動使用瀏覽器當前網址
# NEXT_PUBLIC_SITE_URL=
# NEXT_PUBLIC_APP_URL=

# 你的電腦 LAN IP（換網路時更新這行即可）
ALLOWED_DEV_ORIGINS=localhost,127.0.0.1,192.168.1.109
```

查詢電腦 IP（macOS）：

```bash
ipconfig getifaddr en0
```

### 3. 開啟方式

| 裝置 | 網址範例 |
|------|----------|
| 本機電腦 | `http://localhost:3003` |
| 手機（同一 Wi‑Fi） | `http://192.168.x.x:3003`（換成你的 IP） |

註冊、登入、驗證信回調會自動帶**你當下使用的網址**，不需再改程式。

### 4. Supabase Redirect URLs（必做）

到 **Authentication → URL Configuration**，把會用到的網址都加進 **Redirect URLs**：

```
http://localhost:3003/auth/callback
http://127.0.0.1:3003/auth/callback
http://192.168.1.109:3003/auth/callback
```

IP 變了只要加新的一行，不必重 deploy。完整清單見 `docs/SUPABASE-DASHBOARD-CHECKLIST.md`。

### 5. 若手機開不了

- 確認手機與電腦在**同一 Wi‑Fi**（勿用行動數據）
- macOS 防火牆：系統設定 → 網路 → 防火牆 → 允許 Node / Terminal
- 重啟 dev：`npm run dev:restart`
- 健康檢查：手機開 `http://192.168.x.x:3003/api/health`

## 正式環境（給所有人用）

要讓**不在你家 Wi‑Fi 的人**也能開，需要：

1. **HTTPS 網域**（例如 `https://shop.chimeidiy.com`）
2. 部署到 Vercel / Netlify（見 `docs/APP-DEPLOYMENT-GUIDE.md`）
3. 設定 `NEXT_PUBLIC_SITE_URL=https://shop.chimeidiy.com`
4. Supabase Site URL 與 Redirect URL 改為正式網域

可選：Cloudflare Tunnel 暫時對外，但每次網址可能變，需更新 Supabase Redirect URLs。
