import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth";
import { isSupabaseConfigured } from "@/lib/config";
import { mockProducts } from "@/lib/mock-data";
import { createAdminClient } from "@/lib/supabase/admin";
import { fetchAllSupabaseRows } from "@/lib/supabase/fetch-all";

type InventoryRow = {
  id: string;
  name: string;
  sku: string | null;
  stock: number;
  preorder_stock: number | null;
  safety_stock: number | null;
  min_stock_alert: number | null;
  inventory_mode: string | null;
  is_active: boolean | null;
  expected_arrival_date: string | null;
  product_categories?: { name?: string } | null;
};

export async function GET(request: Request) {
  const { error } = await requireAdmin();
  if (error) return error;

  const { searchParams } = new URL(request.url);
  const summary = searchParams.get("summary") === "true";
  const search = searchParams.get("search")?.trim();
  const filter = searchParams.get("filter") ?? "all";

  if (!isSupabaseConfigured()) {
    const products = mockProducts.map((p) => ({
      ...p,
      min_stock_alert: 5,
      safety_stock: 10,
      preorder_stock: 0,
      inventory_mode: "stock",
      brand_name: null,
      category_name: null,
    }));

    if (summary) {
      return NextResponse.json({
        summary: {
          total: products.length,
          active: products.filter((p) => p.is_active).length,
          lowStock: products.filter((p) => p.stock <= 5).length,
          outOfStock: products.filter((p) => p.stock <= 0).length,
        },
      });
    }

    return NextResponse.json({ items: products });
  }

  const admin = createAdminClient();
  const selectWithCat =
    "id, name, sku, stock, preorder_stock, safety_stock, min_stock_alert, inventory_mode, is_active, expected_arrival_date, product_categories:product_categories!products_category_id_fkey(name)";
  const selectPlain =
    "id, name, sku, stock, preorder_stock, safety_stock, min_stock_alert, inventory_mode, is_active, expected_arrival_date";

  const loadAll = async (columns: string) =>
    fetchAllSupabaseRows<InventoryRow>(async (from, to) => {
      const page = await admin
        .from("products")
        .select(columns)
        .order("name")
        .range(from, to);
      return {
        data: (page.data as unknown as InventoryRow[] | null) ?? null,
        error: page.error,
      };
    });

  let raw = await loadAll(selectWithCat);
  if (raw.error) {
    raw = await loadAll(selectPlain);
  }
  if (raw.error) {
    return NextResponse.json({ error: raw.error.message }, { status: 500 });
  }

  let items = raw.data.map((p) => ({
    ...p,
    product_categories: p.product_categories ?? null,
    category_name: p.product_categories?.name ?? null,
    brand_name: null as string | null,
  }));

  if (summary) {
    return NextResponse.json({
      summary: {
        total: items.length,
        active: items.filter((p) => p.is_active).length,
        lowStock: items.filter((p) => p.stock <= (p.min_stock_alert ?? 5)).length,
        outOfStock: items.filter((p) => p.stock <= 0).length,
      },
    });
  }

  if (search) {
    const q = search.toLowerCase();
    items = items.filter(
      (p) =>
        p.name.toLowerCase().includes(q) ||
        (p.sku && p.sku.toLowerCase().includes(q)) ||
        (p.brand_name && p.brand_name.toLowerCase().includes(q)) ||
        (p.category_name && p.category_name.toLowerCase().includes(q))
    );
  }

  if (filter === "low") {
    items = items.filter((p) => p.stock <= (p.min_stock_alert ?? 5));
  } else if (filter === "out") {
    items = items.filter((p) => p.stock <= 0);
  } else if (filter === "preorder") {
    items = items.filter((p) => (p.preorder_stock ?? 0) > 0);
  } else if (filter === "arriving") {
    items = items.filter((p) => p.expected_arrival_date);
  }

  return NextResponse.json({ items });
}
