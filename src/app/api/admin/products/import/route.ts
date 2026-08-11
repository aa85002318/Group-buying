import { NextResponse } from "next/server";
import { requireAdmin, logAudit } from "@/lib/auth";
import { isSupabaseConfigured } from "@/lib/config";
import { createAdminClient } from "@/lib/supabase/admin";
import { normalizeSku, pickImportValue, toIsoDate } from "@/lib/admin/import-cells";
import { syncAllProductRelations } from "@/lib/services/productRelations";
import { slugifyTitle } from "@/lib/videos/embed";

type ImportRow = Record<string, unknown>;

function parseTemperature(temp: string) {
  return {
    temp_ambient: temp.includes("常溫") || !temp,
    temp_chilled: temp.includes("冷藏"),
    temp_frozen: temp.includes("冷凍"),
    storage_type: temp.includes("冷凍")
      ? "frozen"
      : temp.includes("冷藏")
        ? "chilled"
        : "ambient",
  };
}

export async function POST(request: Request) {
  const { error: authError, auth } = await requireAdmin();
  if (authError) return authError;

  let body: { rows?: unknown };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "無法解析匯入資料" }, { status: 400 });
  }

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
  const categoryByName = new Map((categories ?? []).map((c) => [c.name.trim(), c.id]));

  for (let i = 0; i < rows.length; i++) {
    const row = rows[i] ?? {};
    const label = `第 ${i + 2} 列`;

    try {
      const name = pickImportValue(row, "商品名稱", "名稱", "name");
      const price =
        pickImportValue(row, "售價", "price", "團購價") ||
        pickImportValue(row, "成本", "cost");

      if (!name || !price) {
        errors.push(`${label}：缺少名稱或售價（售價欄空白時可用成本欄）`);
        continue;
      }

      const parsedPrice = Number(price);
      if (!Number.isFinite(parsedPrice)) {
        errors.push(`${label}：售價格式無效（${price}）`);
        continue;
      }

      const categoryName = pickImportValue(row, "分類", "category");
      const categoryId = categoryName ? categoryByName.get(categoryName) ?? null : null;
      if (categoryName && !categoryId) {
        errors.push(`${label}：找不到分類「${categoryName}」，請填後台既有分類名稱`);
        continue;
      }

      const tempRaw =
        pickImportValue(row, "溫層", "temperature") ||
        (/常溫|冷藏|冷凍/.test(pickImportValue(row, "影片", "video"))
          ? pickImportValue(row, "影片", "video")
          : "");
      const { storage_type, ...temp } = parseTemperature(tempRaw);
      const videoUrl = /常溫|冷藏|冷凍/.test(pickImportValue(row, "影片", "video"))
        ? ""
        : pickImportValue(row, "影片", "video");
      const images = pickImportValue(row, "圖片", "image", "image_url");
      const batchNumber = pickImportValue(row, "批號", "batch");
      const expiry = toIsoDate(pickImportValue(row, "效期", "expiry"));
      const spec = pickImportValue(row, "規格", "spec", "unit");
      const barcode = pickImportValue(row, "條碼", "barcode");
      const safetyStock = pickImportValue(row, "安全庫存", "safety_stock");
      const sku = normalizeSku(pickImportValue(row, "商品編號", "SKU", "sku"));
      const stock = Number(pickImportValue(row, "現貨", "stock") || 0);
      const preorder = Number(pickImportValue(row, "預購", "preorder") || 0);

      const productRow = {
        name,
        sku: sku || null,
        barcode: barcode || (/^\d{8,14}$/.test(sku) ? sku : null),
        unit: spec || "件",
        price: parsedPrice,
        cost_price: pickImportValue(row, "成本", "cost")
          ? Number(pickImportValue(row, "成本", "cost"))
          : null,
        safety_stock: safetyStock ? Number(safetyStock) : 0,
        stock: Number.isFinite(stock) ? stock : 0,
        preorder_stock: Number.isFinite(preorder) ? preorder : 0,
        description: pickImportValue(row, "介紹", "description") || null,
        rich_description: pickImportValue(row, "介紹", "description") || null,
        category_id: categoryId,
        primary_category_id: categoryId,
        slug: slugifyTitle(name),
        status: "draft",
        is_active: false,
        inventory_mode: preorder > 0 ? "both" : "stock",
        product_scope: "baking",
        storage_type,
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

      if (insertError || !data?.id) {
        errors.push(`${label}：${insertError?.message ?? "寫入商品失敗"}`);
        continue;
      }

      await syncAllProductRelations(admin, data.id, {
        category_ids: categoryId ? [categoryId] : [],
        batches: batchNumber
          ? [
              {
                id: "batch",
                batch_number: batchNumber,
                expiry_date: expiry ?? "",
                arrival_date: "",
                supplier_id: "",
                quantity: pickImportValue(row, "現貨", "stock") || "0",
                note: "",
              },
            ]
          : [],
        variants: [],
        videos: videoUrl
          ? [
              {
                id: "video",
                title: name,
                url: videoUrl,
                video_type: "youtube",
                cover_url: "",
                sort_order: 0,
              },
            ]
          : [],
      });

      imported++;
    } catch (e) {
      errors.push(`${label}：${e instanceof Error ? e.message : "匯入失敗"}`);
    }
  }

  if (auth?.profile?.id) {
    await logAudit(
      auth.profile.id,
      "import_products",
      "products",
      "batch",
      null,
      { imported },
      request as never
    );
  }

  return NextResponse.json({ imported, errors });
}
