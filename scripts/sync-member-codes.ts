/**
 * Sync member_code = phone for existing members (service role)
 * Usage: npm run sync-member-codes
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

  const { data: members, error } = await admin
    .from("profiles")
    .select("id, phone, member_code, role")
    .eq("role", "member")
    .not("phone", "is", null);

  if (error) {
    console.error(error.message);
    process.exit(1);
  }

  let updated = 0;
  for (const m of members ?? []) {
    const phone = (m.phone as string).replace(/\D/g, "");
    if (!phone || m.member_code === phone) continue;
    const { error: upErr } = await admin.from("profiles").update({ member_code: phone }).eq("id", m.id);
    if (!upErr) {
      updated += 1;
      console.log(`  ${m.id}: ${m.member_code} → ${phone}`);
    }
  }

  console.log(`已同步 ${updated} 筆會員條碼`);
}

main();
