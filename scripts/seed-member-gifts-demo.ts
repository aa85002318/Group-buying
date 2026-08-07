/**
 * 以 service role 建立會員禮示範活動（冪等）
 * 用法：npm run seed:member-gifts-demo
 * 選項：PUBLISH=false 只建草稿
 */
import { loadEnvLocal } from "./load-env";

async function main() {
  loadEnvLocal();
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim();
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY?.trim();
  if (!url || !key) {
    console.error("缺少 NEXT_PUBLIC_SUPABASE_URL 或 SUPABASE_SERVICE_ROLE_KEY");
    process.exit(1);
  }

  const { seedDemoMemberGifts } = await import("../src/lib/gifts/seed-demo");
  const publish = process.env.PUBLISH !== "false";
  console.log("Target:", url.replace(/^https?:\/\//, "").split(".")[0]);
  console.log("Publish:", publish);

  const result = await seedDemoMemberGifts({ publish, actorId: null });
  console.log("Month:", result.month);
  console.log("Stores:", result.stores.map((s) => s.name).join(", ") || "(none)");
  console.log(
    "Created:",
    result.created.length
      ? result.created.map((c) => `${c.campaign_type}:${c.name}`).join(" | ")
      : "(none)"
  );
  console.log("Skipped codes:", result.skipped.length ? result.skipped.join(", ") : "(none)");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
