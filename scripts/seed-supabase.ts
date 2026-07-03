/**
 * Supabase 種子資料腳本（僅在資料表為空時寫入）
 * 使用方式：npm run seed-supabase
 */
import { createClient, SupabaseClient } from "@supabase/supabase-js";
import { loadEnvLocal } from "./load-env";

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

async function tableExists(table: string): Promise<boolean> {
  const { count, error } = await supabase.from(table).select("*", { count: "exact", head: true });
  if (!error) return true;
  const code = (error as { code?: string }).code;
  const msg = error.message ?? "";
  if (code === "PGRST205" || msg.includes("Could not find the table") || msg.includes("schema cache")) return false;
  throw new Error(`${table}: ${msg}`);
}

async function countRows(table: string): Promise<number> {
  const { count, error } = await supabase.from(table).select("*", { count: "exact", head: true });
  if (error) throw new Error(`${table}: ${error.message}`);
  return count ?? 0;
}

async function seedCategories(sb: SupabaseClient) {
  if (!(await tableExists("product_categories"))) return { skipped: true, reason: "table missing" };
  const n = await countRows("product_categories");
  if (n > 0) return { inserted: 0, existing: n };

  const { data, error } = await sb
    .from("product_categories")
    .upsert(
      [
        { name: "食品團購", slug: "food-group", sort_order: 1, is_active: true },
        { name: "生活用品", slug: "daily-goods", sort_order: 2, is_active: true },
        { name: "保健食品", slug: "health", sort_order: 3, is_active: true },
        { name: "美妝保養", slug: "beauty", sort_order: 4, is_active: true },
        { name: "寢具家居", slug: "home", sort_order: 5, is_active: true },
      ],
      { onConflict: "slug" }
    )
    .select();
  if (error) throw new Error(error.message);
  return { inserted: data?.length ?? 0 };
}

async function seedStores(sb: SupabaseClient) {
  if (!(await tableExists("stores"))) return { skipped: true, reason: "table missing" };
  const n = await countRows("stores");
  if (n > 0) return { inserted: 0, existing: n };

  const { data, error } = await sb
    .from("stores")
    .insert([
      { name: "暖陽門市", address: "台北市大安區復興南路一段100號", phone: "02-1234-5678", business_hours: "週一至週六 09:00–21:00", is_active: true },
      { name: "焦糖門市", address: "新北市板橋區文化路二段50號", phone: "02-8765-4321", business_hours: "週一至週日 10:00–20:00", is_active: true },
      { name: "晨光門市", address: "桃園市中壢區中央西路120號", phone: "03-422-8899", business_hours: "週二至週日 09:30–20:30", is_active: true },
    ])
    .select();
  if (error) throw new Error(error.message);
  return { inserted: data?.length ?? 0 };
}

async function seedProducts(sb: SupabaseClient) {
  if (!(await tableExists("products"))) return { skipped: true, reason: "table missing" };
  const n = await countRows("products");
  if (n > 0) return { inserted: 0, existing: n };

  const { data: categories } = await sb.from("product_categories").select("id, slug").order("sort_order");
  const catMap = Object.fromEntries((categories ?? []).map((c) => [c.slug, c.id]));
  const catId = (slug: string) => catMap[slug] ?? categories?.[0]?.id;

  const placeholder = "https://placehold.co/400x400/e2e8f0/64748b?text=Product";
  const { data, error } = await sb
    .from("products")
    .insert([
      { category_id: catId("food-group"), name: "有機高麗菜", description: "產地直送，新鮮脆甜", price: 89, original_price: 120, stock: 50, image_url: placeholder, is_active: true },
      { category_id: catId("daily-goods"), name: "天然洗碗精", description: "環保配方，溫和不傷手", price: 159, original_price: 199, stock: 100, image_url: placeholder, is_active: true },
      { category_id: catId("health"), name: "維他命C", description: "日常營養補充", price: 450, original_price: 550, stock: 60, image_url: placeholder, is_active: true },
      { category_id: catId("beauty"), name: "保濕面膜組", description: "深層補水，舒緩肌膚", price: 299, original_price: 399, stock: 40, image_url: placeholder, is_active: true },
      { category_id: catId("home"), name: "純棉床包組", description: "親膚透氣，雙人尺寸", price: 890, original_price: 1200, stock: 25, image_url: placeholder, is_active: true },
    ])
    .select();
  if (error) throw new Error(error.message);
  return { inserted: data?.length ?? 0 };
}

async function seedGroupBuy(sb: SupabaseClient) {
  if (!(await tableExists("group_buy_events"))) return { skipped: true, reason: "table missing" };
  const n = await countRows("group_buy_events");
  if (n > 0) return { inserted: 0, existing: n };

  const { data: stores } = await sb.from("stores").select("id").limit(1);
  const { data: products } = await sb.from("products").select("id").limit(1);
  const storeId = stores?.[0]?.id;
  const productId = products?.[0]?.id;

  const now = new Date();
  const weekLater = new Date(now.getTime() + 7 * 86400000);

  const { data: events, error } = await sb
    .from("group_buy_events")
    .insert([
      {
        title: "春季團購特賣",
        description: "產地直送，滿額免運",
        banner_url: "https://images.unsplash.com/photo-1542838132-92c53300491e?w=800",
        start_at: now.toISOString(),
        end_at: weekLater.toISOString(),
        status: "active",
        store_id: storeId,
      },
    ])
    .select();
  if (error) throw new Error(error.message);

  if (events?.[0] && productId) {
    await sb.from("group_buy_products").upsert(
      { group_buy_event_id: events[0].id, product_id: productId, group_price: 69, min_quantity: 1, max_quantity: 10 },
      { onConflict: "group_buy_event_id,product_id" }
    );
  }
  return { inserted: events?.length ?? 0 };
}

async function seedCommissionRules(sb: SupabaseClient) {
  if (!(await tableExists("commission_rules"))) return { skipped: true, reason: "table missing" };
  const n = await countRows("commission_rules");
  if (n > 0) return { inserted: 0, existing: n };

  const { data, error } = await sb.from("commission_rules").insert([
    { name: "一般會員分享分潤", rule_type: "percentage", target_role: "member", calculation_base: "after_discount", percentage_rate: 5, max_commission_amount: 500, monthly_cap_amount: 5000, settlement_wait_days: 7, is_multilevel_enabled: true, level_1_rate: 100, level_2_rate: 20, priority: 10, status: "active" },
    { name: "團購主分潤", rule_type: "percentage", target_role: "group_leader", calculation_base: "product_subtotal", percentage_rate: 3, max_commission_amount: 1000, monthly_cap_amount: 10000, settlement_wait_days: 7, is_multilevel_enabled: false, priority: 20, status: "active" },
    { name: "直播主帶貨分潤", rule_type: "percentage", target_role: "livestream_host", calculation_base: "order_paid_amount", percentage_rate: 8, max_commission_amount: 2000, monthly_cap_amount: 20000, settlement_wait_days: 14, is_multilevel_enabled: false, priority: 30, status: "active" },
  ]).select();
  if (error) throw new Error(error.message);
  return { inserted: data?.length ?? 0 };
}

async function seedVideos(sb: SupabaseClient) {
  if (!(await tableExists("videos"))) return { skipped: true, reason: "table missing" };
  const n = await countRows("videos");
  if (n > 0) return { inserted: 0, existing: n };

  const { data, error } = await sb.from("videos").insert([
    { title: "高麗菜挑選小撇步", video_url: "https://www.youtube.com/embed/dQw4w9WgXcQ", thumbnail_url: "https://placehold.co/400x225/e2e8f0/64748b?text=Video+1", is_active: true },
    { title: "團購下單教學", video_url: "https://www.youtube.com/embed/dQw4w9WgXcQ", thumbnail_url: "https://placehold.co/400x225/e2e8f0/64748b?text=Video+2", is_active: true },
  ]).select();
  if (error) throw new Error(error.message);
  return { inserted: data?.length ?? 0 };
}

async function seedMonsterGame(sb: SupabaseClient) {
  try {
    const hasSettings = await tableExists("monster_game_settings");
    const hasRules = await tableExists("reward_rules");
    if (!hasSettings || !hasRules) {
      return { skipped: true, reason: "monster tables missing — run migrations/20250701000000_monster_game.sql" };
    }

  const settingsCount = await countRows("monster_game_settings");
  const rulesCount = await countRows("reward_rules");

  let settingsInserted = 0;
  if (settingsCount === 0) {
    const { data, error } = await sb.from("monster_game_settings").insert({
      share_kg: 0.5, min_chars: 10, bonus_chars: 30, bonus_kg: 0.5, photo_kg: 1, daily_limit: 3,
    }).select();
    if (error) throw new Error(error.message);
    settingsInserted = data?.length ?? 0;
  }

  let rulesInserted = 0;
  if (rulesCount === 0) {
    const { data, error } = await sb.from("reward_rules").upsert(
      [
        { id: "m7000001-0000-4000-8000-000000000001", threshold_kg: 5, reward_type: "store_credit", reward_name: "儲值金 20 元", reward_value: "20", is_active: true },
        { id: "m7000001-0000-4000-8000-000000000002", threshold_kg: 10, reward_type: "coupon", reward_name: "折價券 50 元", reward_value: "50", is_active: true },
        { id: "m7000001-0000-4000-8000-000000000003", threshold_kg: 20, reward_type: "free_shipping", reward_name: "免運券", is_active: true },
        { id: "m7000001-0000-4000-8000-000000000004", threshold_kg: 30, reward_type: "mystery_gift", reward_name: "神秘禮物", is_active: true },
      ],
      { onConflict: "id" }
    ).select();
    if (error) throw new Error(error.message);
    rulesInserted = data?.length ?? 0;
  }

  return { settingsInserted, rulesInserted, existingSettings: settingsCount, existingRules: rulesCount };
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    if (msg.includes("Could not find the table") || msg.includes("schema cache")) {
      return { skipped: true, reason: "monster tables missing — run migrations/20250701000000_monster_game.sql" };
    }
    throw e;
  }
}

async function main() {
  console.log("檢查並寫入種子資料（僅空表）...\n");

  const results: Record<string, unknown> = {
    categories: await seedCategories(supabase),
    stores: await seedStores(supabase),
    products: await seedProducts(supabase),
    groupBuy: await seedGroupBuy(supabase),
    commissionRules: await seedCommissionRules(supabase),
    videos: await seedVideos(supabase),
    monsterGame: await seedMonsterGame(supabase),
  };

  console.log(JSON.stringify(results, null, 2));
  console.log("\n完成。");
}

main().catch((e) => {
  console.error(e instanceof Error ? e.message : e);
  process.exit(1);
});
