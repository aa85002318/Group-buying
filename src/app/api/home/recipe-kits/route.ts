import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/config";

export async function GET() {
  if (!isSupabaseConfigured()) {
    return NextResponse.json({ kits: [] });
  }

  const supabase = await createClient();
  const { data: kits, error } = await supabase
    .from("home_recipe_kits")
    .select(
      "id, name, cover_image_url, kit_price, button_text, sort_order, hide_when_oos, recipe_id, recipes(id, title, slug)"
    )
    .eq("is_active", true)
    .order("sort_order", { ascending: true });

  if (error) {
    return NextResponse.json({ error: error.message, kits: [] }, { status: 200 });
  }

  const kitIds = (kits ?? []).map((k) => k.id);
  const { data: items } = kitIds.length
    ? await supabase
        .from("home_recipe_kit_items")
        .select("kit_id, product_id, quantity, is_required, products(id, name, stock, is_active, status)")
        .in("kit_id", kitIds)
    : { data: [] as Array<{ kit_id: string }> };

  const countByKit = new Map<string, number>();
  for (const row of items ?? []) {
    const product = (row as { products?: { is_active?: boolean; status?: string; stock?: number } | null })
      .products;
    const active =
      product &&
      product.is_active !== false &&
      (!product.status || product.status === "active") &&
      Number(product.stock ?? 0) > 0;
    // Always count required structure for display; OOS filtered at add-to-cart
    countByKit.set(row.kit_id, (countByKit.get(row.kit_id) ?? 0) + (active || true ? 1 : 0));
  }

  const mapped = (kits ?? []).map((k) => {
    const recipeRaw = (k as { recipes?: unknown }).recipes;
    const recipe = Array.isArray(recipeRaw) ? recipeRaw[0] : recipeRaw;
    return {
      id: k.id,
      name: k.name,
      cover_image_url: k.cover_image_url,
      kit_price: k.kit_price != null ? Number(k.kit_price) : null,
      button_text: k.button_text || "全部加入購物車",
      recipe: recipe
        ? {
            id: (recipe as { id: string }).id,
            title: (recipe as { title?: string }).title,
            slug: (recipe as { slug?: string }).slug,
          }
        : null,
      item_count: countByKit.get(k.id) ?? 0,
    };
  });

  return NextResponse.json({ kits: mapped });
}
