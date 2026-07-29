import { NextResponse } from "next/server";
import { requireContentAdmin, logAudit } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/admin";
import { isSupabaseConfigured } from "@/lib/config";

export async function GET() {
  const { error: authError } = await requireContentAdmin();
  if (authError) return authError;

  if (!isSupabaseConfigured()) {
    return NextResponse.json({ kits: [] });
  }

  const admin = createAdminClient();
  const { data, error } = await admin
    .from("home_recipe_kits")
    .select(
      "*, recipes(id, title, slug), home_recipe_kit_items(id, product_id, quantity, is_required, is_replaceable, substitute_product_ids, sort_order, products(id, name))"
    )
    .order("sort_order", { ascending: true });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ kits: data ?? [] });
}

export async function POST(request: Request) {
  const { error: authError, auth } = await requireContentAdmin();
  if (authError) return authError;

  const body = await request.json();
  if (!isSupabaseConfigured()) {
    return NextResponse.json({ kit: { id: "mock", ...body } }, { status: 201 });
  }

  const admin = createAdminClient();
  const { data: kit, error } = await admin
    .from("home_recipe_kits")
    .insert({
      name: String(body.name ?? "").trim() || "未命名材料包",
      cover_image_url: body.cover_image_url || null,
      recipe_id: body.recipe_id || null,
      kit_price: body.kit_price != null ? Number(body.kit_price) : null,
      button_text: body.button_text || "全部加入購物車",
      sort_order: Number(body.sort_order ?? 0) || 0,
      is_active: body.is_active !== false,
      hide_when_oos: body.hide_when_oos !== false,
      created_by: auth!.profile.id,
      updated_by: auth!.profile.id,
    })
    .select()
    .single();

  if (error || !kit) {
    return NextResponse.json({ error: error?.message ?? "建立失敗" }, { status: 500 });
  }

  const items = Array.isArray(body.items) ? body.items : [];
  if (items.length > 0) {
    const rows = items
      .filter((it: { product_id?: string }) => it.product_id)
      .map((it: Record<string, unknown>, index: number) => ({
        kit_id: kit.id,
        product_id: String(it.product_id),
        quantity: Math.max(1, Number(it.quantity ?? 1) || 1),
        is_required: it.is_required !== false,
        is_replaceable: it.is_replaceable === true,
        substitute_product_ids: Array.isArray(it.substitute_product_ids)
          ? it.substitute_product_ids
          : [],
        sort_order: Number(it.sort_order ?? (index + 1) * 10) || (index + 1) * 10,
      }));
    if (rows.length) {
      const { error: itemsError } = await admin.from("home_recipe_kit_items").insert(rows);
      if (itemsError) {
        return NextResponse.json({ error: itemsError.message, kit }, { status: 500 });
      }
    }
  }

  await logAudit(auth!.profile.id, "create", "home_recipe_kits", kit.id, null, kit, request as never);
  return NextResponse.json({ kit }, { status: 201 });
}
