import { NextResponse } from "next/server";
import type { SupabaseClient } from "@supabase/supabase-js";
import { requireAdmin, logAudit } from "@/lib/auth";
import { isSupabaseConfigured } from "@/lib/config";
import { createAdminClient } from "@/lib/supabase/admin";
import { syncAllProductRelations } from "@/lib/services/productRelations";

type ImportRow = Record<string, string>;
type ImportError = { row: number; message: string };

const MAX_ROWS = 500;
const CHUNK_SIZE = 50;

function pick(row: ImportRow, ...keys: string[]): string {
  for (const key of keys) {
    const val = row[key]?.trim();
    if (val) return val;
  }
  return "";
}

function parseTags(raw: string): string[] {
  if (!raw.trim()) return [];
  return raw
    .split(/[,，|]/)
    .map((t) => t.trim())
    .filter(Boolean);
}

function parseKeywords(raw: string): string[] {
  return parseTags(raw);
}

function parseStorageType(raw: string): "ambient" | "chilled" | "frozen" {
  const v = raw.toLowerCase();
  if (v.includes("frozen") || raw.includes("冷凍")) return "frozen";
  if (v.includes("chilled") || raw.includes("冷藏")) return "chilled";
  return "ambient";
}

function parseStatus(raw: string): { status: string; is_active: boolean } {
  const v = raw.toLowerCase();
  if (v === "active" || raw === "上架") return { status: "active", is_active: true };
  if (v === "inactive" || raw === "下架") return { status: "inactive", is_active: false };
  if (v === "sold_out" || raw === "售完") return { status: "sold_out", is_active: false };
  return { status: "draft", is_active: false };
}

type CategoryNode = {
  id: string;
  name: string;
  parent_id: string | null;
  catalog_root_id: string | null;
};

async function loadBakingCategories(admin: SupabaseClient): Promise<{
  rootId: string | null;
  categories: CategoryNode[];
}> {
  const { data: root } = await admin
    .from("catalog_roots")
    .select("id")
    .eq("slug", "baking-materials")
    .maybeSingle();

  if (!root?.id) return { rootId: null, categories: [] };

  const { data: categories } = await admin
    .from("product_categories")
    .select("id, name, parent_id, catalog_root_id")
    .eq("catalog_root_id", root.id);

  return { rootId: root.id as string, categories: (categories ?? []) as CategoryNode[] };
}

function resolveCategoryPath(
  path: string,
  categories: CategoryNode[],
  rootId: string | null
): string | null {
  if (!path.trim()) return null;
  const segments = path.split(">").map((s) => s.trim()).filter(Boolean);
  if (segments.length === 0) return null;

  let parentId: string | null = null;
  let resolvedId: string | null = null;

  for (const segment of segments) {
    const match = categories.find(
      (c) =>
        c.name === segment &&
        c.parent_id === parentId &&
        (rootId ? c.catalog_root_id === rootId : true)
    );
    if (!match) {
      const fallback = categories.find((c) => c.name === segment);
      if (!fallback) return null;
      resolvedId = fallback.id;
      parentId = fallback.id;
      continue;
    }
    resolvedId = match.id;
    parentId = match.id;
  }

  return resolvedId;
}

async function resolveBrandId(
  admin: SupabaseClient,
  brandName: string,
  cache: Map<string, string>
): Promise<string | null> {
  if (!brandName) return null;
  if (cache.has(brandName)) return cache.get(brandName) ?? null;

  const { data: existing } = await admin
    .from("brands")
    .select("id")
    .eq("name", brandName)
    .maybeSingle();

  if (existing?.id) {
    cache.set(brandName, existing.id as string);
    return existing.id as string;
  }

  const { data: created } = await admin
    .from("brands")
    .insert({ name: brandName, is_active: true })
    .select("id")
    .single();

  if (created?.id) {
    cache.set(brandName, created.id as string);
    return created.id as string;
  }

  return null;
}

type PreparedRow = {
  rowNum: number;
  productRow: Record<string, unknown>;
  categoryIds: string[];
  variant?: { name: string; sku: string; price: number; stock: number };
  sku: string;
};

function prepareRow(
  row: ImportRow,
  rowNum: number,
  categories: CategoryNode[],
  rootId: string | null,
  brandResolver: (name: string) => Promise<string | null>
): Promise<{ prepared?: PreparedRow; error?: string }> {
  return (async () => {
    const name = pick(row, "product_name", "名稱", "name", "商品名稱");
    const price = pick(row, "price", "售價", "團購價");
    const sku = pick(row, "product_sku", "variant_sku", "SKU", "sku");

    if (!name) return { error: "缺少 product_name" };
    if (!price || Number.isNaN(Number(price))) return { error: "缺少或無效的 price" };
    if (!sku) return { error: "缺少 product_sku 或 variant_sku" };

    const categoryPath = pick(row, "category_path", "分類", "category");
    const primaryCategoryId = resolveCategoryPath(categoryPath, categories, rootId);

    const additionalRaw = pick(row, "additional_categories");
    const additionalIds = additionalRaw
      .split(/[,，|]/)
      .map((p) => p.trim())
      .filter(Boolean)
      .map((p) => resolveCategoryPath(p, categories, rootId))
      .filter((id): id is string => Boolean(id));

    const categoryIds = [
      ...(primaryCategoryId ? [primaryCategoryId] : []),
      ...additionalIds.filter((id) => id !== primaryCategoryId),
    ];

    const brandName = pick(row, "brand", "品牌");
    const brandId = brandName ? await brandResolver(brandName) : null;

    const statusRaw = pick(row, "status", "狀態");
    const { status, is_active } = statusRaw ? parseStatus(statusRaw) : { status: "draft", is_active: false };

    const stock = Number(pick(row, "stock", "現貨") || 0);
    const safetyStock = Number(pick(row, "safety_stock", "安全庫存") || 0);
    const salePrice = pick(row, "sale_price", "特價");
    const imageUrl = pick(row, "image_url", "圖片", "image");
    const slug = pick(row, "product_slug", "slug");
    const storageType = parseStorageType(pick(row, "storage_type", "溫層"));
    const tags = parseTags(pick(row, "tags", "標籤"));
    const searchKeywords = parseKeywords(pick(row, "search_keywords", "搜尋關鍵字"));

    const variantName = pick(row, "variant_name", "規格");
    const variantSku = pick(row, "variant_sku");

    const productRow: Record<string, unknown> = {
      name,
      sku,
      slug: slug || null,
      price: Number(price),
      sale_price: salePrice ? Number(salePrice) : Number(price),
      stock,
      safety_stock: safetyStock,
      storage_type: storageType,
      status,
      is_active,
      brand_id: brandId,
      category_id: primaryCategoryId,
      primary_category_id: primaryCategoryId,
      image_url: imageUrl || null,
      images: imageUrl ? [imageUrl] : [],
      tags,
      search_keywords: searchKeywords,
      temp_ambient: storageType === "ambient",
      temp_chilled: storageType === "chilled",
      temp_frozen: storageType === "frozen",
    };

    const prepared: PreparedRow = {
      rowNum,
      productRow,
      categoryIds,
      sku,
    };

    if (variantName || variantSku) {
      prepared.variant = {
        name: variantName || "預設",
        sku: variantSku || sku,
        price: salePrice ? Number(salePrice) : Number(price),
        stock,
      };
    }

    return { prepared };
  })();
}

async function upsertProduct(
  admin: SupabaseClient,
  prepared: PreparedRow
): Promise<{ ok: boolean; message?: string }> {
  const { data: existing } = await admin
    .from("products")
    .select("id")
    .eq("sku", prepared.sku)
    .maybeSingle();

  let productId: string;

  if (existing?.id) {
    const { error: updateError } = await admin
      .from("products")
      .update(prepared.productRow)
      .eq("id", existing.id);
    if (updateError) return { ok: false, message: updateError.message };
    productId = existing.id as string;
  } else {
    const { data: inserted, error: insertError } = await admin
      .from("products")
      .insert(prepared.productRow)
      .select("id")
      .single();
    if (insertError) return { ok: false, message: insertError.message };
    productId = inserted.id as string;
  }

  await syncAllProductRelations(admin, productId, {
    category_ids: prepared.categoryIds,
    batches: [],
    variants: prepared.variant
      ? [
          {
            id: "variant",
            name: prepared.variant.name,
            value: prepared.variant.name,
            price_adjustment: "0",
            stock: String(prepared.variant.stock),
            sort_order: 0,
          },
        ]
      : [],
    videos: [],
  });

  return { ok: true };
}

export async function POST(request: Request) {
  const { error: authError, auth } = await requireAdmin();
  if (authError) return authError;

  const body = await request.json();
  if (!Array.isArray(body.rows) || body.rows.length === 0) {
    return NextResponse.json({ error: "沒有可匯入的資料列" }, { status: 400 });
  }

  const rows = body.rows as ImportRow[];
  if (rows.length > MAX_ROWS) {
    return NextResponse.json({ error: `單次最多匯入 ${MAX_ROWS} 筆` }, { status: 400 });
  }

  if (!isSupabaseConfigured()) {
    return NextResponse.json({ success: rows.length, failed: 0, errors: [] });
  }

  const admin = createAdminClient();
  const { rootId, categories } = await loadBakingCategories(admin);
  const brandCache = new Map<string, string>();

  const brandResolver = (name: string) => resolveBrandId(admin, name, brandCache);

  const preparedRows: PreparedRow[] = [];
  const errors: ImportError[] = [];

  for (let i = 0; i < rows.length; i++) {
    const result = await prepareRow(rows[i], i + 2, categories, rootId, brandResolver);
    if (result.error) {
      errors.push({ row: i + 2, message: result.error });
    } else if (result.prepared) {
      preparedRows.push(result.prepared);
    }
  }

  let success = 0;
  let failed = errors.length;

  for (let i = 0; i < preparedRows.length; i += CHUNK_SIZE) {
    const chunk = preparedRows.slice(i, i + CHUNK_SIZE);
    for (const prepared of chunk) {
      const result = await upsertProduct(admin, prepared);
      if (result.ok) {
        success++;
      } else {
        failed++;
        errors.push({ row: prepared.rowNum, message: result.message ?? "匯入失敗" });
      }
    }
  }

  if (auth?.profile?.id && success > 0) {
    await logAudit(
      auth.profile.id,
      "import_products",
      "products",
      "batch",
      null,
      { success, failed },
      request as never
    );
  }

  return NextResponse.json({ success, failed, errors });
}
