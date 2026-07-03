/**
 * 手動將指定 Email 標記為已驗證（SMTP 除錯期間暫用）
 * 使用方式：CONFIRM_EMAIL=aa85002318@diychimei.page npm run confirm-email
 */
import { createClient } from "@supabase/supabase-js";
import { loadEnvLocal } from "./load-env";

loadEnvLocal();

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const confirmEmail = process.env.CONFIRM_EMAIL?.trim();

if (!url || !serviceKey) {
  console.error("請設定 NEXT_PUBLIC_SUPABASE_URL 與 SUPABASE_SERVICE_ROLE_KEY");
  process.exit(1);
}

if (!confirmEmail) {
  console.error("請設定 CONFIRM_EMAIL，例如：CONFIRM_EMAIL=user@example.com npm run confirm-email");
  process.exit(1);
}

const supabase = createClient(url, serviceKey, {
  auth: { autoRefreshToken: false, persistSession: false },
});

async function confirmUserEmail() {
  console.log(`正在將 ${confirmEmail} 標記為 Email 已驗證…`);

  const { data: list, error: listError } = await supabase.auth.admin.listUsers();
  if (listError) {
    console.error("無法列出使用者：", listError.message);
    process.exit(1);
  }

  const email = confirmEmail!;
  const user = list.users.find((u) => u.email?.toLowerCase() === email.toLowerCase());
  if (!user) {
    console.error(`找不到使用者：${email}。請先完成註冊。`);
    process.exit(1);
  }

  if (user.email_confirmed_at) {
    console.log(`✓ ${confirmEmail} 已是驗證狀態 (${user.email_confirmed_at})`);
    return;
  }

  const { data, error } = await supabase.auth.admin.updateUserById(user.id, {
    email_confirm: true,
  });

  if (error) {
    console.error("更新失敗：", error.message);
    process.exit(1);
  }

  console.log(`✓ ${confirmEmail} 已手動驗證 (id: ${data.user.id})`);
  console.log("  現在可以登入與下單。請仍須修復 Supabase SMTP，讓其他會員能收到驗證信。");
}

confirmUserEmail();
