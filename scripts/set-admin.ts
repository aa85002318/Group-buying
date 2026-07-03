/**
 * 將指定 Email 的使用者設為管理員
 * 使用方式：npm run set-admin
 */
import { createClient } from "@supabase/supabase-js";
import { loadEnvLocal } from "./load-env";

loadEnvLocal();

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const adminEmail = process.env.ADMIN_EMAIL ?? "aa85002318@gmail.com";

if (!url || !serviceKey) {
  console.error("請設定 NEXT_PUBLIC_SUPABASE_URL 與 SUPABASE_SERVICE_ROLE_KEY");
  process.exit(1);
}

const supabase = createClient(url, serviceKey, {
  auth: { autoRefreshToken: false, persistSession: false },
});

async function setAdmin() {
  console.log(`正在將 ${adminEmail} 設為管理員…`);

  const { data: users, error: listError } = await supabase.auth.admin.listUsers();
  if (listError) {
    console.error("無法列出使用者：", listError.message);
    process.exit(1);
  }

  const user = users.users.find((u) => u.email?.toLowerCase() === adminEmail.toLowerCase());
  if (!user) {
    console.error(`找不到使用者：${adminEmail}。請先註冊帳號後再執行此腳本。`);
    process.exit(1);
  }

  const { error: profileError } = await supabase
    .from("profiles")
    .upsert({
      id: user.id,
      email: user.email,
      role: "admin",
      full_name: user.user_metadata?.full_name ?? "管理員",
    })
    .select()
    .single();

  if (profileError) {
    console.error("更新 profiles 失敗：", profileError.message);
    process.exit(1);
  }

  console.log(`✓ ${adminEmail} 已設為管理員 (id: ${user.id})`);
}

setAdmin();
