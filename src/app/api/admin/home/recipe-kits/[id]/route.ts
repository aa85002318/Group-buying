import { NextResponse } from "next/server";
import { requireContentAdmin, logAudit } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/admin";
import { isSupabaseConfigured } from "@/lib/config";

type RouteParams = { params: Promise<{ id: string }> };

export async function PATCH(request: Request, { params }: RouteParams) {
  const { error: authError, auth } = await requireContentAdmin();
  if (authError) return authError;

  const { id } = await params;
  const body = await request.json();

  if (!isSupabaseConfigured()) {
    return NextResponse.json({ kit: { id, ...body } });
  }

  const admin = createAdminClient();
  const updates: Record<string, unknown> = { updated_by: auth!.profile.id };
  for (const key of [
    "name",
    "cover_image_url",
    "recipe_id",
    "kit_price",
    "button_text",
    "sort_order",
    "is_active",
    "hide_when_oos",
  ]) {
    if (key in body) updates[key] = body[key];
  }
  if ("kit_price" in updates && updates.kit_price != null) {
    updates.kit_price = Number(updates.kit_price);
  }
  if ("sort_order" in updates) updates.sort_order = Number(updates.sort_order) || 0;

  const { data: old } = await admin.from("home_recipe_kits").select("*").eq("id", id).single();
  const { data, error } = await admin
    .from("home_recipe_kits")
    .update(updates)
    .eq("id", id)
    .select()
    .single();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  if (Array.isArray(body.items)) {
    await admin.from("home_recipe_kit_items").delete().eq("kit_id", id);
    const rows = body.items
      .filter((it: { product_id?: string }) => it.product_id)
      .map((it: Record<string, unknown>, index: number) => ({
        kit_id: id,
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
      if (itemsError) return NextResponse.json({ error: itemsError.message }, { status: 500 });
    }
  }

  await logAudit(auth!.profile.id, "update", "home_recipe_kits", id, old, data, request as never);
  return NextResponse.json({ kit: data });
}

export async function DELETE(request: Request, { params }: RouteParams) {
  const { error: authError, auth } = await requireContentAdmin();
  if (authError) return authError;

  const { id } = await params;
  if (!isSupabaseConfigured()) return NextResponse.json({ ok: true });

  const admin = createAdminClient();
  const { data: old } = await admin.from("home_recipe_kits").select("*").eq("id", id).single();
  const { error } = await admin.from("home_recipe_kits").delete().eq("id", id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  await logAudit(auth!.profile.id, "delete", "home_recipe_kits", id, old, null, request as never);
  return NextResponse.json({ ok: true });
}
