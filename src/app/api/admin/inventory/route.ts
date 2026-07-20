import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth";
import { isSupabaseConfigured } from "@/lib/config";
import { mockProducts } from "@/lib/mock-data";
import { createAdminClient } from "@/lib/supabase/admin";

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
  const { data, error: fetchError } = await admin
    .from("products")
    .select("id, name, sku, stock, preorder_stock, safety_stock, min_stock_alert, inventory_mode, is_active, expected_arrival_date, product_categories(name)")
    .order("name");

  if (fetchError) return NextResponse.json({ error: fetchError.message }, { status: 500 });

  let items = (data ?? []).map((p) => ({
    ...p,
    category_name: (p.product_categories as { name?: string } | null)?.name ?? null,
    brand_name: null as string | null,
  }));

  if (search) {
    items = items.filter(
      (p) =>
        p.name.includes(search) ||
        (p.sku && p.sku.includes(search)) ||
        (p.brand_name && p.brand_name.includes(search)) ||
        (p.category_name && p.category_name.includes(search))
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

  if (summary) {
    const all = data ?? [];
    return NextResponse.json({
      summary: {
        total: all.length,
        active: all.filter((p) => p.is_active).length,
        lowStock: all.filter((p) => p.stock <= (p.min_stock_alert ?? 5)).length,
        outOfStock: all.filter((p) => p.stock <= 0).length,
      },
    });
  }

  return NextResponse.json({ items });
}
