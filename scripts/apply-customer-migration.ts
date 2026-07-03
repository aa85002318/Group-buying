/**
 * Ensure profiles.birthday column exists (idempotent check)
 * Full trigger SQL: supabase/migrations/20250703110000_customer_profiles.sql
 */
import { createClient } from "@supabase/supabase-js";
import { loadEnvLocal } from "./load-env";

loadEnvLocal();

const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

async function main() {
  const admin = createClient(url, serviceKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  const { error } = await admin.from("profiles").select("birthday").limit(1);
  if (!error) {
    console.log("profiles.birthday 欄位已存在");
    return;
  }

  console.error("profiles.birthday 欄位尚未建立。請至 Supabase SQL Editor 執行：");
  console.error("supabase/migrations/20250703110000_customer_profiles.sql");
  process.exit(1);
}

main();
