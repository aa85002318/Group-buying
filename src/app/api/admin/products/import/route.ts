import { NextResponse } from "next/server";
import { requireAdmin, logAudit } from "@/lib/auth";
import { isSupabaseConfigured } from "@/lib/config";
import { createAdminClient } from "@/lib/supabase/admin";
import { syncAllProductRelations } from "@/lib/services/productRelations";

type ImportRow = Record<string, string>;

function pick(row: ImportRow, ...keys: string[]) {
  for (const key of keys) {
    if (row[key]?.trim()) return row[key].trim();
  }
  return "";
}

function parseTemperature(temp: string) {
  return {
    temp_ambient: temp.includes("常溫") || !temp,
    temp_chilled: temp.includes("冷藏"),
    temp_frozen: temp.includes("冷凍"),
  };
}

export async function POST(request: Request) {
  const { error: authError, auth } = await requireAdmin();
  if (authError) return authError;

  const body = await request.json();
  if (!Array.isArray(body.rows) || body.rows.length === 0) {
    return NextResponse.json({ error: "沒有可匯入的資料列" }, { status: 400 });
  }

  const rows = body.rows as ImportRow[];
  const errors: string[] = [];
  let imported = 0;

  if (!isSupabaseConfigured()) {
    return NextResponse.json({ imported: rows.length, errors: [] });
  }

  const admin = createAdminClient();

  const { data: categories } = await admin.from("product_categories").select("id, name");
  const categoryByName = new Map((categories ?? []).map((c) => [c.name, c.id]));

  for (let i = 0; i < rows.length; i++) {
    const row = rows[i];
    const name = pick(row, "名稱", "name", "商品名稱");
    const price = pick(row, "售價", "price", "團購價");

    if (!name || !price) {
      errors.push(`第 ${i + 2} 列：缺少名稱或售價`);
      continue;
    }

    const categoryName = pick(row, "分類", "category");
    const categoryId = categoryName ? categoryByName.get(categoryName) ?? null : null;
    const temp = parseTemperature(pick(row, "溫層", "temperature"));
    const images = pick(row, "圖片", "image", "image_url");
    const batchNumber = pick(row, "批號", "batch");
    const expiry = pick(row, "效期", "expiry");

    const productRow = {
      name,
      sku: pick(row, "SKU", "sku") || null,
      price: Number(price),
      cost_price: pick(row, "成本", "cost") ? Number(pick(row, "成本", "cost")) : null,
      stock: Number(pick(row, "現貨", "stock") || 0),
      preorder_stock: Number(pick(row, "預購", "preorder") || 0),
      description: pick(row, "介紹", "description") || null,
      rich_description: pick(row, "介紹", "description") || null,
      category_id: categoryId,
      status: "draft",
      is_active: false,
      inventory_mode: Number(pick(row, "預購", "preorder") || 0) > 0 ? "both" : "stock",
      ...temp,
      images: images ? [images] : [],
      image_url: images || null,
      tags: [],
    };

    const { data, error: insertError } = await admin
      .from("products")
      .insert(productRow)
      .select("id")
      .single();

    if (insertError) {
      errors.push(`第 ${i + 2} 列：${insertError.message}`);
      continue;
    }

    await syncAllProductRelations(admin, data.id, {
      category_ids: categoryId ? [categoryId] : [],
      batches: batchNumber
        ? [{ id: "batch", batch_number: batchNumber, expiry_date: expiry, arrival_date: "", supplier_id: "", quantity: pick(row, "現貨", "stock") || "0", note: "" }]
        : [],
      variants: [],
      videos: pick(row, "影片", "video")
        ? [{ id: "video", title: name, url: pick(row, "影片", "video"), video_type: "youtube", cover_url: "", sort_order: 0 }]
        : [],
    });

    imported++;
  }

  if (auth?.profile?.id) {
    await logAudit(auth.profile.id, "import_products", "products", "batch", null, { imported }, request as never);
  }

  return NextResponse.json({ imported, errors });
}
