# 部署指南（Vercel / Netlify）

本專案為 **Next.js 14 App Router**，API 與頁面同一專案部署，無需額外 rewrite 即可避免重新整理 404。

## 環境變數

| 變數 | 說明 |
|------|------|
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase Project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | anon public key |
| `SUPABASE_SERVICE_ROLE_KEY` | 僅伺服器／腳本使用 |
| `NEXT_PUBLIC_SITE_URL` | 站台完整網址（正式必填；開發可留空自動偵測） |
| `ALLOWED_DEV_ORIGINS` | 本機開發允許的 host，逗號分隔 |
| `NEXT_PUBLIC_APP_ENV` | `development` / `staging` / `production` |
| `SUPPORT_EMAIL` | 客服信箱（驗證信、錯誤頁） |

**切勿**將 Service Role Key 或金流 Hash Key 暴露於 `NEXT_PUBLIC_*`。

### Staging 範例

```
NEXT_PUBLIC_SITE_URL=https://staging.chimeidiy.com
NEXT_PUBLIC_APP_ENV=staging
```

### Production 範例

```
NEXT_PUBLIC_SITE_URL=https://shop.chimeidiy.com
NEXT_PUBLIC_APP_ENV=production
```

## Vercel 部署

1. 連接 GitHub 儲存庫
2. Framework Preset：**Next.js**
3. 於 **Settings → Environment Variables** 分別設定 Preview（staging）與 Production
4. Preview 分支建議設 `NEXT_PUBLIC_APP_ENV=staging`
5. Production 設 `NEXT_PUBLIC_APP_ENV=production`
6. Deploy

`vercel.json` 已包含基本建置設定。

## Netlify 部署

1. 連接儲存庫，使用 `@netlify/plugin-nextjs`（見 `netlify.toml`）
2. 於 Site settings → Environment variables 設定同上
3. Deploy

## Supabase 設定

### 1. 執行 Migration

新專案：執行 `supabase/complete-schema.sql` 後，依序執行 `supabase/migrations/` 內所有檔案。

既有專案：至少執行 `20250703000000_production_phase1.sql`。

### 2. Auth — Email Confirmation

Supabase Dashboard → **Authentication → Providers → Email**：

- 開啟 **Confirm email**
- Site URL：`NEXT_PUBLIC_SITE_URL`（例如 `https://shop.chimeidiy.com`）
- Redirect URLs 新增：
  - `https://shop.chimeidiy.com/auth/callback`
  - `https://staging.chimeidiy.com/auth/callback`（staging）
  - `http://localhost:3000/auth/callback`（本機）

### 3. Email 模板

於 **Authentication → Email Templates → Confirm signup**，可貼上 `supabase/email-templates/confirm-signup.html` 內容。

## 上線檢查清單

- [ ] `NEXT_PUBLIC_SITE_URL` 已設定為正式網域
- [ ] Supabase Redirect URL 已包含 `/auth/callback`
- [ ] Migration `20250703000000_production_phase1.sql` 已執行
- [ ] 管理員：`npm run set-admin`
- [ ] 門市資料已建立（`stores` 表）
- [ ] 門市人員已指派（後台 `/admin/staff`）
- [ ] 手機瀏覽器開啟首頁、結帳、訂單 QR、門市掃碼 `/staff/pickup-scan`

## 門市掃碼流程

1. 客戶下單後於訂單詳情取得 **取貨 QR Code**（僅含 `pickup_token`）
2. 門市人員登入後開啟 `/staff/pickup-scan`
3. 掃描 QR 或輸入取貨碼 → 確認收款 → 確認取貨

## 金流（預留）

- `POST /api/payment/create` — 建立付款意圖
- `POST /api/payment/callback` — 金流回呼（ECPay / NewebPay）

Phase 1 以門市收款（`paid_store`）與銀行轉帳回報為主。
