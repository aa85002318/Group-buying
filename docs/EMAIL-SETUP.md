# Email 與驗證設定指南

本專案使用兩套 Email 機制：

| 類型 | 寄送方式 | 用途 |
|------|----------|------|
| Auth 驗證信 | Supabase Dashboard 內建 | 註冊 Email 驗證 |
| 交易通知信 | Resend API（程式寄送） | 訂單成立、取貨完成 |

---

## 一、會員註冊 Email 驗證（Supabase）

### 1. 開啟 Confirm email

Supabase Dashboard → **Authentication** → **Providers** → **Email**

- 勾選 **Confirm email**（註冊後須驗證才能登入）
- 儲存

### 2. Site URL 與 Redirect URLs

**Authentication** → **URL Configuration**

| 環境 | Site URL | Redirect URLs |
|------|----------|---------------|
| 本機 | `http://localhost:3000` | `http://localhost:3000/auth/callback` |
| Staging | `https://staging.your-domain.com` | `https://staging.your-domain.com/auth/callback` |
| Production | `https://your-domain.com` | `https://your-domain.com/auth/callback` |

### 3. 驗證信模板

> **注意：這是 HTML，請勿貼到 SQL Editor。**  
> 請到 **Authentication → Email Templates**，不是 SQL Editor。

**Authentication** → **Email Templates** → **Confirm signup**

1. 開啟 `supabase/email-templates/confirm-signup.html`，全選複製
2. 貼到 Email Templates 的 **Body** 欄位
3. 點 **Save**

變數 `{{ .ConfirmationURL }}` 由 Supabase 自動替換，請勿刪除。

### 4. 程式行為

- 註冊後顯示「請查收驗證信」，並自動登出（避免未驗證 session）
- 未驗證帳號登入會被拒絕，可點「重新寄送驗證信」
- 未驗證會員無法下單（API 回傳 `email_not_confirmed`）
- 驗證成功導向 `/auth/callback` → 首頁

---

## 二、訂單／取貨通知信（Resend）

### 1. 申請 Resend

1. 至 [resend.com](https://resend.com) 註冊
2. 新增並驗證寄件網域（或使用測試網域 `onboarding@resend.dev` 開發用）
3. 建立 API Key

### 2. 環境變數

在 `.env.local`（本機）與 Vercel/Netlify 後台加入：

```env
RESEND_API_KEY=re_xxxxxxxx
EMAIL_FROM=chimeidiy 團購 <noreply@your-domain.com>
SUPPORT_EMAIL=support@your-domain.com
```

未設定 `RESEND_API_KEY` 時，開發環境會在終端機 log 郵件內容，不會實際寄出。

### 3. 觸發時機

| 事件 | 觸發點 | 模板 |
|------|--------|------|
| 訂單成立 | `POST /api/orders` 成功後 | `src/lib/email/templates/order-confirmation.ts` |
| 取貨完成 | 門市 `confirm-pickup` 成功後 | `src/lib/email/templates/pickup-confirmation.ts` |

HTML 參考版型見 `supabase/email-templates/order-confirmation.html`、`pickup-confirmation.html`。

---

## 三、測試流程

1. 註冊新帳號 → 收驗證信 → 點連結 → 登入
2. 下單 → 收「訂單成立」信（含商品明細、取貨門市、訂單連結）
3. 門市掃碼確認收款 → 確認取貨 → 收「取貨完成」信

---

## 四、常見問題

**驗證信沒收到**
- 檢查 Supabase Auth 是否開啟 Confirm email
- 檢查 Redirect URL 是否包含本機/staging/production 網址
- 查看垃圾郵件匣

**訂單信沒收到**
- 確認 `RESEND_API_KEY` 與 `EMAIL_FROM` 已設定
- 確認 Resend 網域已驗證
- 開發環境未設定 key 時僅 console log，不會寄信

**已登入但無法下單**
- 帳號可能尚未驗證 Email，至登入頁重寄驗證信
