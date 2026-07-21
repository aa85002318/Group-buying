import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth";
import { isSupabaseConfigured } from "@/lib/config";
import { createAdminClient } from "@/lib/supabase/admin";

const LIST_FIELDS =
  "id, name, sku, slug, price, sale_price, stock, safety_stock, status, is_active, image_url, images, updated_at, brand_id, primary_category_id, category_id, brands(id, name), primary_category:product_categories!products_primary_category_id_fkey(id, name, path)";

type BakingStats = {
  total: number;
  active: number;
  inactive: number;
  outOfStock: number;
  lowStock: number;
  categoryCount: number;
  brandCount: number;
};

async function getBakingCategoryIds(admin: ReturnType<typeof createAdminClient>): Promise<string[]> {
  const { data: root } = await admin
    .from("catalog_roots")
    .select("id")
    .eq("slug", "baking-materials")
    .maybeSingle();

  if (!root?.id) return [];

  const { data: categories } = await admin
    .from("product_categories")
    .select("id")
    .eq("catalog_root_id", root.id);

  return (categories ?? []).map((c) => c.id as string);
}

async function getBakingProductIds(
  admin: ReturnType<typeof createAdminClient>,
  categoryIds: string[]
): Promise<Set<string>> {
  const ids = new Set<string>();
  if (categoryIds.length === 0) return ids;

  const [{ data: primaryProducts }, { data: linkedProducts }] = await Promise.all([
    admin.from("products").select("id").in("primary_category_id", categoryIds),
    admin.from("product_category_links").select("product_id").in("category_id", categoryIds),
  ]);

  for (const row of primaryProducts ?? []) ids.add(row.id as string);
  for (const row of linkedProducts ?? []) ids.add(row.product_id as string);

  return ids;
}

function computeStats(
  products: Array<{
    status?: string | null;
    is_active?: boolean | null;
    stock?: number | null;
    safety_stock?: number | null;
    brand_id?: string | null;
    primary_category_id?: string | null;
    category_id?: string | null;
  }>,
  categoryIds: string[]
): BakingStats {
  const brandIds = new Set<string>();
  const usedCategoryIds = new Set<string>();

  let active = 0;
  let inactive = 0;
  let outOfStock = 0;
  let lowStock = 0;

  for (const p of products) {
    const status = p.status ?? (p.is_active ? "active" : "inactive");
    if (status === "active") active++;
    else inactive++;

    const stock = p.stock ?? 0;
    const safety = p.safety_stock ?? 5;
    if (stock <= 0) outOfStock++;
    else if (stock <= safety) lowStock++;

    if (p.brand_id) brandIds.add(p.brand_id);
    const catId = p.primary_category_id ?? p.category_id;
    if (catId && categoryIds.includes(catId)) usedCategoryIds.add(catId);
  }

  return {
    total: products.length,
    active,
    inactive,
    outOfStock,
    lowStock,
    categoryCount: usedCategoryIds.size || categoryIds.length,
    brandCount: brandIds.size,
  };
}

export async function GET(request: Request) {
  const { error } = await requireAdmin();
  if (error) return error;

  const { searchParams } = new URL(request.url);
  const q = searchParams.get("q")?.trim() ?? "";
  const category = searchParams.get("category") ?? "";
  const brand = searchParams.get("brand") ?? "";
  const status = searchParams.get("status") ?? "";
  const page = Math.max(1, Number(searchParams.get("page") ?? 1));
  const pageSize = Math.min(100, Math.max(1, Number(searchParams.get("pageSize") ?? 20)));

  const emptyStats: BakingStats = {
    total: 0,
    active: 0,
    inactive: 0,
    outOfStock: 0,
    lowStock: 0,
    categoryCount: 0,
    brandCount: 0,
  };

  if (!isSupabaseConfigured()) {
    return NextResponse.json({
      products: [],
      total: 0,
      stats: emptyStats,
      categories: [],
      brands: [],
    });
  }

  const admin = createAdminClient();
  const categoryIds = await getBakingCategoryIds(admin);
  const bakingProductIds = await getBakingProductIds(admin, categoryIds);

  if (bakingProductIds.size === 0) {
    const [{ data: categories }, { data: brands }] = await Promise.all([
      admin
        .from("product_categories")
        .select("id, name, path, level")
        .in("id", categoryIds.length ? categoryIds : ["00000000-0000-0000-0000-000000000000"])
        .order("path"),
      admin.from("brands").select("id, name").eq("is_active", true).order("name"),
    ]);

    return NextResponse.json({
      products: [],
      total: 0,
      stats: { ...emptyStats, categoryCount: categoryIds.length },
      categories: categories ?? [],
      brands: brands ?? [],
    });
  }

  const allIds = Array.from(bakingProductIds);

  let query = admin
    .from("products")
    .select(LIST_FIELDS, { count: "exact" })
    .in("id", allIds)
    .order("updated_at", { ascending: false });

  if (q) {
    query = query.or(`name.ilike.%${q}%,sku.ilike.%${q}%`);
  }
  if (category) {
    query = query.or(`primary_category_id.eq.${category},category_id.eq.${category}`);
  }
  if (brand) {
    query = query.eq("brand_id", brand);
  }
  if (status === "active") {
    query = query.eq("status", "active");
  } else if (status === "inactive") {
    query = query.in("status", ["inactive", "draft"]);
  } else if (status === "out_of_stock") {
    query = query.lte("stock", 0);
  } else if (status === "low_stock") {
    query = query.gt("stock", 0).lte("stock", 5);
  }

  const from = (page - 1) * pageSize;
  const to = from + pageSize - 1;
  query = query.range(from, to);

  const [{ data: pageProducts, count }, { data: allForStats }, { data: categories }, { data: brands }, { data: variantCounts }] =
    await Promise.all([
      query,
      admin
        .from("products")
        .select("id, status, is_active, stock, safety_stock, brand_id, primary_category_id, category_id")
        .in("id", allIds),
      admin
        .from("product_categories")
        .select("id, name, path, level")
        .in("id", categoryIds)
        .order("path"),
      admin.from("brands").select("id, name").eq("is_active", true).order("name"),
      admin.from("product_variants").select("product_id").in("product_id", allIds),
    ]);

  const variantCountByProduct = new Map<string, number>();
  for (const row of variantCounts ?? []) {
    const pid = row.product_id as string;
    variantCountByProduct.set(pid, (variantCountByProduct.get(pid) ?? 0) + 1);
  }

  const products = (pageProducts ?? []).map((p) => {
    const row = p as Record<string, unknown>;
    const primaryCat = row.primary_category as { id?: string; name?: string; path?: string } | null;
    const brandRow = row.brands as { id?: string; name?: string } | null;
    return {
      id: row.id,
      name: row.name,
      sku: row.sku,
      slug: row.slug,
      price: row.price,
      sale_price: row.sale_price,
      stock: row.stock,
      status: row.status ?? (row.is_active ? "active" : "inactive"),
      image_url: row.image_url ?? (Array.isArray(row.images) ? row.images[0] : null),
      category_name: primaryCat?.name ?? null,
      category_path: primaryCat?.path ?? null,
      brand_name: brandRow?.name ?? null,
      brand_id: row.brand_id,
      primary_category_id: row.primary_category_id ?? row.category_id,
      variant_count: variantCountByProduct.get(row.id as string) ?? 0,
      updated_at: row.updated_at,
    };
  });

  return NextResponse.json({
    products,
    total: count ?? 0,
    stats: computeStats(allForStats ?? [], categoryIds),
    categories: categories ?? [],
    brands: brands ?? [],
  });
}
