/**
 * 門市團購 APP - 資料庫種子腳本
 * 使用方式：設定 .env 後執行 npm run seed
 */

import { createClient } from "@supabase/supabase-js";
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

async function seed() {
  console.log("開始種子資料...");

  const { data: stores } = await supabase
    .from("stores")
    .upsert([
      { name: "暖陽門市", address: "台北市大安區復興南路一段100號", phone: "02-1234-5678" },
      { name: "焦糖門市", address: "新北市板橋區文化路二段50號", phone: "02-8765-4321" },
    ], { onConflict: "name" })
    .select();

  const storeId = stores?.[0]?.id;

  const { data: categories } = await supabase
    .from("product_categories")
    .upsert([
      { name: "生鮮蔬果", slug: "fresh", sort_order: 1 },
      { name: "日常用品", slug: "daily", sort_order: 2 },
      { name: "零食飲料", slug: "snacks", sort_order: 3 },
      { name: "保健養生", slug: "health", sort_order: 4 },
    ], { onConflict: "slug" })
    .select();

  const catMap = Object.fromEntries((categories ?? []).map((c) => [c.slug, c.id]));

  const { data: products } = await supabase
    .from("products")
    .insert([
      { category_id: catMap.fresh, name: "有機高麗菜", price: 89, original_price: 120, stock: 50, image_url: "https://images.unsplash.com/photo-1594282486552-05b4d3f6515a?w=400" },
      { category_id: catMap.daily, name: "天然洗碗精", price: 159, original_price: 199, stock: 100, image_url: "https://images.unsplash.com/photo-1563453392213-326e2d4031b0?w=400" },
      { category_id: catMap.snacks, name: "手工餅乾禮盒", price: 299, original_price: 399, stock: 30, image_url: "https://images.unsplash.com/photo-1558961363-fa8fdf82db35?w=400" },
      { category_id: catMap.health, name: "維他命C", price: 450, original_price: 550, stock: 80, image_url: "https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?w=400" },
    ])
    .select();

  const now = new Date();
  const weekLater = new Date(now.getTime() + 7 * 86400000);

  const { data: events } = await supabase
    .from("group_buy_events")
    .insert([
      {
        title: "春季生鮮團購",
        description: "產地直送，滿額免運",
        banner_url: "https://images.unsplash.com/photo-1542838132-92c53300491e?w=800",
        start_at: now.toISOString(),
        end_at: weekLater.toISOString(),
        status: "active",
        store_id: storeId,
      },
    ])
    .select();

  if (events?.[0] && products?.[0]) {
    await supabase.from("group_buy_products").insert({
      group_buy_event_id: events[0].id,
      product_id: products[0].id,
      group_price: 69,
      max_quantity: 10,
    });
  }

  await supabase.from("videos").insert([
    { title: "高麗菜挑選小撇步", video_url: "https://www.youtube.com/embed/dQw4w9WgXcQ", thumbnail_url: "https://images.unsplash.com/photo-1594282486552-05b4d3f6515a?w=400" },
  ]);

  await supabase.from("livestreams").insert([
    { title: "週末生鮮特賣直播", status: "live", stream_url: "https://www.youtube.com/embed/dQw4w9WgXcQ", scheduled_at: now.toISOString() },
  ]);

  await supabase.from("commission_rules").insert({
    name: "一般分享分潤",
    rule_type: "percentage",
    target_role: "member",
    calculation_base: "after_discount",
    percentage_rate: 5,
    max_commission_amount: 500,
    monthly_cap_amount: 5000,
    settlement_wait_days: 7,
    is_multilevel_enabled: true,
    level_1_rate: 100,
    level_2_rate: 20,
    priority: 10,
    status: "active",
  });

  console.log("種子資料完成！");
  console.log(`  門市：${stores?.length ?? 0} 家`);
  console.log(`  商品：${products?.length ?? 0} 項`);
  console.log(`  團購：${events?.length ?? 0} 場`);
}

seed().catch((e) => {
  console.error(e);
  process.exit(1);
});
