/**
 * 同步商品分類圖示至 Supabase
 * 使用方式：npm run update-category-icons
 */
import { createClient } from "@supabase/supabase-js";
import { loadEnvLocal } from "./load-env";
import { CATEGORY_IMAGE_DEFAULTS, CATEGORY_IMAGE_PATHS } from "../src/lib/category-assets";

loadEnvLocal();

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!url || !serviceKey) {
  console.error("請設定 NEXT_PUBLIC_SUPABASE_URL 與 SUPABASE_SERVICE_ROLE_KEY");
  process.exit(1);
}

const supabase = createClient(url, serviceKey, {
  auth: { autoRefreshToken: false, persistSession: false },
});

async function main() {
  const slugs = CATEGORY_IMAGE_DEFAULTS.map((c) => c.slug);
  const rows = CATEGORY_IMAGE_DEFAULTS.map(({ slug, name, sort_order }) => ({
    name,
    slug,
    sort_order,
    is_active: true,
    icon_url: CATEGORY_IMAGE_PATHS[slug],
    icon_emoji: null,
  }));

  const { data, error } = await supabase
    .from("product_categories")
    .upsert(rows, { onConflict: "slug" })
    .select("id, name, slug, icon_url");

  if (error) {
    console.error("更新失敗:", error.message);
    process.exit(1);
  }

  const { error: deactivateError } = await supabase
    .from("product_categories")
    .update({ is_active: false })
    .not("slug", "in", `(${slugs.join(",")})`);

  if (deactivateError) {
    console.warn("停用舊分類時發生錯誤:", deactivateError.message);
  }

  console.log(`已更新 ${data?.length ?? 0} 個商品分類圖示：`);
  for (const row of data ?? []) {
    console.log(`  - ${row.name} (${row.slug}): ${row.icon_url}`);
  }
}

main();
