# Email 模板說明

## ⚠️ 請勿貼到 SQL Editor

此資料夾內的 `.html` 檔案是 **Email 郵件版型**，不是 SQL。

若在 SQL Editor 執行會出現：

```
ERROR: 42601: syntax error at or near "<!"
```

---

## confirm-signup.html（註冊驗證信）

**正確位置：** Supabase Dashboard → **Authentication** → **Email Templates** → **Confirm signup**

步驟：
1. 開啟專案中 `confirm-signup.html`，全選複製
2. 到上述 Email Templates 頁面
3. 將內容貼到 **Body**（或 Message body）欄位
4. 點 **Save**

保留 `{{ .ConfirmationURL }}`，Supabase 會自動替換成驗證連結。

同時確認：
- **Authentication** → **Providers** → **Email** → 勾選 **Confirm email**
- **Authentication** → **URL Configuration** → Redirect URLs 加入 `http://localhost:3000/auth/callback`

---

## 其他 Supabase Auth 模板（同風格）

以下檔案皆可到 **Authentication → Email Templates** 對應項目貼上：

- `invite-user.html` → Invite user
- `magic-link-or-otp.html` → Magic link or OTP
- `change-email-address.html` → Change email address
- `reset-password.html` → Reset password
- `reauthentication.html` → Reauthentication

> 提醒：`{{ .ConfirmationURL }}`、`{{ .Token }}` 這些變數請保留，Supabase 會在寄信時自動替換。

---

## order-confirmation.html / pickup-confirmation.html

這兩份是 **參考版型**，實際寄信由程式透過 Resend 發送（見 `src/lib/email/templates/`）。

不需貼到 Supabase。
