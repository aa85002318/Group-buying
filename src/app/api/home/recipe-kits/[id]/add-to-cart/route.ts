import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { isSupabaseConfigured } from "@/lib/config";

type RouteParams = { params: Promise<{ id: string }> };

/** Validate kit products and return cart lines for client-side cart. */
export async function POST(_request: Request, { params }: RouteParams) {
  if (!isSupabaseConfigured()) {
    return NextResponse.json({ error: "尚未設定資料庫" }, { status: 503 });
  }

  const { id } = await params;
  const admin = createAdminClient();

  const { data: kit, error: kitError } = await admin
    .from("home_recipe_kits")
    .select("id, name, is_active, hide_when_oos")
    .eq("id", id)
    .maybeSingle();

  if (kitError || !kit || !kit.is_active) {
    return NextResponse.json({ error: "材料包不存在或已停用" }, { status: 404 });
  }

  const { data: rows, error: itemsError } = await admin
    .from("home_recipe_kit_items")
    .select(
      "product_id, quantity, is_required, is_replaceable, substitute_product_ids, sort_order, products(id, name, price, image_url, stock, is_active, status)"
    )
    .eq("kit_id", id)
    .order("sort_order", { ascending: true });

  if (itemsError) {
    return NextResponse.json({ error: itemsError.message }, { status: 500 });
  }

  const items: Array<{
    productId: string;
    name: string;
    price: number;
    imageUrl: string | null;
    quantity: number;
  }> = [];
  let skipped = 0;
  const problems: string[] = [];

  for (const row of rows ?? []) {
    const product = Array.isArray(row.products) ? row.products[0] : row.products;
    const qty = Math.max(1, Number(row.quantity) || 1);

    const usable = (p: {
      id?: string;
      name?: string;
      price?: number;
      image_url?: string | null;
      stock?: number;
      is_active?: boolean;
      status?: string;
    } | null) => {
      if (!p?.id) return null;
      if (p.is_active === false || (p.status && p.status !== "active")) return null;
      if (Number(p.stock ?? 0) < qty) return null;
      return {
        productId: p.id,
        name: p.name || "商品",
        price: Number(p.price ?? 0),
        imageUrl: p.image_url ?? null,
        quantity: qty,
      };
    };

    let line = usable(product as never);
    if (!line && row.is_replaceable && Array.isArray(row.substitute_product_ids)) {
      for (const subId of row.substitute_product_ids) {
        const { data: sub } = await admin
          .from("products")
          .select("id, name, price, image_url, stock, is_active, status")
          .eq("id", subId)
          .maybeSingle();
        line = usable(sub);
        if (line) break;
      }
    }

    if (!line) {
      skipped += 1;
      if (row.is_required && !kit.hide_when_oos) {
        problems.push(`${(product as { name?: string } | null)?.name || "商品"} 無法加入`);
      }
      continue;
    }
    items.push(line);
  }

  if (items.length === 0) {
    return NextResponse.json(
      {
        error: problems[0] || "材料包目前沒有可加入的商品（可能已下架或缺貨）",
        skipped,
      },
      { status: 400 }
    );
  }

  // Touch public client so RLS path stays warm (optional)
  await createClient();

  return NextResponse.json({
    ok: true,
    kit_id: kit.id,
    kit_name: kit.name,
    items,
    skipped,
    warnings: problems,
  });
}
