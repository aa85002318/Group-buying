# Supabase Dashboard 設定檢查清單

本文件供 chimeidiy 團購 App 上線／本機開發時，逐項核對 Supabase 後台設定。  
驗證信由 **Supabase Auth** 寄出；訂單／取貨通知由 **Resend** 寄出（見 `docs/EMAIL-SETUP.md`）。

---

## 快速檢查表


| #   | 項目            | 路徑                                                | 預期狀態                        |
| --- | ------------- | ------------------------------------------------- | --------------------------- |
| 1   | Email 登入已開啟   | Authentication → Providers → Email                | ✅ Enable Email provider     |
| 2   | 需驗證 Email     | 同上 → Confirm email                                | ✅ 已勾選                       |
| 3   | Site URL      | Authentication → URL Configuration                | 與 `NEXT_PUBLIC_SITE_URL` 一致 |
| 4   | Redirect URLs | 同上                                                | 含 `…/auth/callback`（見下方清單）  |
| 5   | 驗證信模板         | Authentication → Email Templates → Confirm signup | 已貼上專案模板                     |
| 6   | 自訂 SMTP（建議）   | Project Settings → Authentication → SMTP Settings | ✅ 已啟用 Resend SMTP           |
| 7   | Auth Logs     | Authentication → Logs                             | 註冊後可見 `signup` / 寄信紀錄       |


---



## 一、Authentication → Providers → Email

**導覽：** 左側選單 **Authentication** → **Providers** → 點 **Email**

**應勾選：**

- [ ] **Enable Email provider**（開啟 Email 登入）
- [ ] **Confirm email**（註冊後須點信內連結才能登入／下單）

**勿勾選（除非刻意測試）：**

- [ ] **Secure email change** — 可開，不影響初次註冊

- 確認 **Disable signup** 為關閉（允許註冊）

> **截圖建議：** 拍整頁 Providers → Email，確認 Confirm email 有打勾後存到團隊文件。

---



## 二、Authentication → URL Configuration

**導覽：** **Authentication** → **URL Configuration**

### Site URL

設為使用者**主要**開啟的網址。開發時若 `NEXT_PUBLIC_SITE_URL` 留空，可任選一個本機網址；**Redirect URLs 需涵蓋所有會用到的網址**。


| 環境         | Site URL 範例                       |
| ---------- | --------------------------------- |
| 本機（建議）     | `http://localhost:3003`           |
| 本機 LAN     | `http://192.168.1.109:3003`       |
| Staging    | `https://staging.your-domain.com` |
| Production | `https://shop.chimeidiygroupbuying.com` |


> 開發時 `NEXT_PUBLIC_SITE_URL` 可留空，程式會自動使用瀏覽器當前網址（見 `docs/MOBILE-ACCESS.md`）。



### Redirect URLs（全部加入，每行一個）

```
http://localhost:3000/auth/callback
http://localhost:3003/auth/callback
http://127.0.0.1:3003/auth/callback
http://192.168.1.109:3003/auth/callback
```

若使用 Cloudflare Quick Tunnel，每次重開會變網址，需**重新加入**：

```
https://<你的-subdomain>.trycloudflare.com/auth/callback
```

正式網域：

```
https://staging.your-domain.com/auth/callback
https://shop.chimeidiygroupbuying.com/auth/callback
```

- [ ] Site URL 已設定
- [ ] 所有會用到的 `/auth/callback` 已加入 Redirect URLs
- [ ] 手機／tunnel 測試用的網址已加入

> **常見問題：** 註冊成功但驗證連結點了失敗 → 多半是 Redirect URL 未包含目前網址。  
> 程式註冊時會帶 `emailRedirectTo: {origin}/auth/callback`。

> **截圖建議：** 拍 URL Configuration 整頁（Site URL + Redirect URLs 列表）。

---



## 三、Authentication → Email Templates

**導覽：** **Authentication** → **Email Templates**

### Confirm signup（註冊驗證）

1. 左側選 **Confirm signup**
2. **Subject** 建議：`請驗證您的 chimeidiy 團購帳號`
3. **Body**：開啟專案 `supabase/email-templates/confirm-signup.html`，全選複製貼上
4. 保留 `{{ .ConfirmationURL }}`（勿刪除）
5. 點 **Save**



### 其他模板（建議一併設定）


| 模板             | 專案檔案                                           |
| -------------- | ---------------------------------------------- |
| Reset password | `supabase/email-templates/reset-password.html` |
| Magic link     | `supabase/email-templates/magic-link.html`     |
| Change email   | `supabase/email-templates/change-email.html`   |


- [ ] Confirm signup 已儲存且含 `{{ .ConfirmationURL }}`

> **注意：** 模板貼在 **Email Templates**，不是 SQL Editor。

---



## 四、自訂 SMTP — 解決「收不到驗證信」



### 4A. Gmail / Google Workspace（`smtp.gmail.com`）

適用：`aa85002318@diychimei.page` 等 Google Workspace 網域信箱。

**Supabase 路徑：** Project Settings → Authentication → **SMTP Settings**


| Supabase 欄位   | 正確填法                                | 常見錯誤                         |
| ------------- | ----------------------------------- | ---------------------------- |
| Sender email  | 與 SMTP 登入帳號**完全相同**                 | 寄件人填 `noreply@...` 但登入用另一個帳號 |
| SMTP Username | 完整信箱，例如 `aa85002318@diychimei.page` | 填一般密碼而非 App Password         |
| SMTP Password | Google **應用程式密碼**（16 碼）             | 使用 Gmail 登入密碼                |
| Host          | `smtp.gmail.com`                    | —                            |
| Port          | `587`（TLS）或 `465`（SSL）              | —                            |


**產生 App Password（必做）：**

1. 至 [myaccount.google.com](https://myaccount.google.com) 登入**該信箱帳號**
2. **安全性** → 開啟 **兩步驟驗證**（未開啟無法產生應用程式密碼）
3. 搜尋「應用程式密碼」→ 選 Mail → 名稱填 `Supabase` → 產生
4. 複製 16 碼密碼貼到 Supabase SMTP Password（不含空格）

**寄件人與登入帳號必須一致：**

- 若 SMTP 登入為 `aa85002318@diychimei.page` → Sender email 也填 `aa85002318@diychimei.page`
- 若 SMTP 登入為 `aa85002318@gmail.com` → Sender email 也填 `aa85002318@gmail.com`
- 不能登入 gmail.com、寄件人填 diychimei.page（除非 Gmail 已設定「以此身分寄件」別名）

**⚠️ 驗證信寄到「寄件人信箱」而非註冊者信箱**

這是 Gmail / Google Workspace SMTP 常見問題，**不是**註冊表單 bug。  
原因：Supabase 透過 Gmail SMTP 寄信時，Google 可能將驗證信留在寄件人收件匣／僅內部投遞。

**建議作法（本專案已實作）：**

1. Supabase → SMTP Settings → **關閉 Enable Custom SMTP**（停用 Gmail SMTP）
2. `.env` 設定 `RESEND_API_KEY` 與 `EMAIL_FROM`
3. 註冊／重寄驗證信改由程式經 Resend 寄到**註冊者填寫的 Email**

**驗證是否真的有寄出：**

1. Supabase → **Authentication** → **Logs**
2. 註冊後找 `user.signup` / 寄信事件
3. 若有 `535`、`authentication failed`、`relay denied` → SMTP 帳密或寄件人不符

**暫時無法修 SMTP 時（僅開發／管理員自用）：**

```bash
CONFIRM_EMAIL=aa85002318@diychimei.page npm run confirm-email
```

---



### 4B. Resend（建議正式環境）

Supabase 內建寄信器送達率低，**強烈建議**設定自訂 SMTP。可用已申請的 Resend 帳號。

### 4.1 在 Resend 準備

1. 登入 [resend.com](https://resend.com)
2. **Domains** → 新增網域（例如 `chimeidiy.com`）→ 依指示設定 DNS（SPF、DKIM）
3. 或使用開發用 `onboarding@resend.dev`（僅能寄到 Resend 帳號綁定的信箱）
4. **API Keys** → 建立 Key（訂單信程式用；SMTP 用下面帳密）

Resend SMTP 參數（官方文件）：


| 欄位           | 值                                     |
| ------------ | ------------------------------------- |
| Host         | `smtp.resend.com`                     |
| Port         | `465`（SSL）或 `587`（TLS）                |
| Username     | `resend`                              |
| Password     | 你的 Resend API Key（`re_…`）             |
| Sender email | 已驗證網域的信箱，例如 `noreply@your-domain.com` |




### 4.2 在 Supabase 啟用 SMTP

**導覽：** 左側 **Project Settings**（齒輪）→ **Authentication** → 捲到 **SMTP Settings**

- [ ] **Enable Custom SMTP** 打開
- [ ] **Sender email**：`noreply@your-domain.com`（須為 Resend 已驗證網域）
- [ ] **Sender name**：`chimeidiy 團購`
- [ ] **Host**：`smtp.resend.com`
- [ ] **Port**：`465` 或 `587`
- [ ] **Username**：`resend`
- [ ] **Password**：Resend API Key
- [ ] 點 **Save**
- [ ] 使用 **Send test email**（若有）寄到自己的 Gmail 測試

> **截圖建議（共 3 張）：**  
>
> 1. Resend Domains 頁（顯示 Verified）
> 2. Supabase SMTP Settings 填完後（密碼欄可馬賽克）
> 3. 收到測試信或 Gmail 收件匣



### 4.3 驗證是否生效

1. **Authentication** → **Logs** → 註冊一組測試帳號
2. 應看到 signup 相關事件；若 SMTP 錯誤會顯示失敗原因
3. 至信箱（含垃圾郵件）確認收到信

---



## 五、Authentication → Logs（除錯用）

註冊或重寄驗證信後：

- [ ] 有 **user signed up** / **email sent** 類似紀錄
- [ ] 若失敗，查看錯誤訊息（SMTP、rate limit、redirect）

常見錯誤：


| 訊息                                 | 處理方式                   |
| ---------------------------------- | ---------------------- |
| `over_email_send_rate_limit`       | 等 7 秒～數分鐘再重寄           |
| SMTP / 535 / authentication failed | 檢查 Resend API Key、寄件網域 |
| `redirect_to` / URL not allowed    | 補 Redirect URLs        |


---



## 六、Authentication → Users

- [ ] 測試帳號存在
- [ ] **Confirmed at** 在點信前為空；點信後有時間戳
- [ ] 未驗證帳號無法登入（符合預期）

---



## 七、與本專案環境變數對照

`.env.local` 至少需有：

```env
NEXT_PUBLIC_SUPABASE_URL=https://xxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...
SUPABASE_SERVICE_ROLE_KEY=eyJ...
NEXT_PUBLIC_SITE_URL=http://192.168.1.109:3003
```

訂單信（與驗證信無關，但建議一併設定）：

```env
RESEND_API_KEY=re_...
EMAIL_FROM=chimeidiy 團購 <noreply@your-domain.com>
```

---



## 八、本機開發注意事項

1. **優先使用** `npm run dev`，不要用殘留的 `next start`（避免環境／DNS 異常）
2. 手機測試請用 **LAN IP**（如 `http://192.168.1.109:3003`），並把該網址加入 Redirect URLs
3. Cloudflare Quick Tunnel 網址會變，每次重開需更新 Supabase Redirect URLs
4. 登入頁「重新寄送驗證信」已改為**瀏覽器直接呼叫 Supabase**，不依賴伺服器 API



### 驗證 API 是否正常

```bash
curl http://127.0.0.1:3003/api/stores
```

應回傳 `{"stores":[...]}`，而非 `{"error":"fetch failed"}`。

---



## 九、上線前最終勾選

- [ ] Migration 已執行（`20250703000000_production_phase1.sql` 或 `DEPLOY-FULL.sql`）
- [ ] `npm run set-admin` 已設定管理員
- [ ] Site URL / Redirect URLs 為 **https** 正式網域
- [ ] 自訂 SMTP 已啟用且測試信可收到
- [ ] 完整流程：註冊 → 驗證信 → 登入 → 下單

---



## 相關文件

- `docs/EMAIL-SETUP.md` — 驗證信 vs 訂單信分工
- `docs/APP-DEPLOYMENT-GUIDE.md` — Vercel / Netlify 部署
- `docs/ADMIN-GUIDE.md` — 管理後台操作

