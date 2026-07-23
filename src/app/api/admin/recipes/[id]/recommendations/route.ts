import { NextResponse } from "next/server";
import { requireContentAdmin, logAudit } from "@/lib/auth";
import { isSupabaseConfigured } from "@/lib/config";
import { createAdminClient } from "@/lib/supabase/admin";

type Params = { params: Promise<{ id: string }> };

const TYPES = new Set([
  "ingredient",
  "substitute",
  "tool",
  "decoration",
  "packaging",
  "teacher_choice",
  "upgrade",
]);

/** GET/POST/PATCH/DELETE recipe product recommendations (admin). */
export async function GET(_request: Request, { params }: Params) {
  const { error } = await requireContentAdmin();
  if (error) return error;
  const { id } = await params;
  if (!isSupabaseConfigured()) return NextResponse.json({ recommendations: [] });

  const admin = createAdminClient();
  const { data, error: fetchError } = await admin
    .from("recipe_product_recommendations")
    .select("*, products(id, name, price, sale_price, image_url, is_active, stock)")
    .eq("recipe_id", id)
    .order("priority", { ascending: false });

  if (fetchError) return NextResponse.json({ error: fetchError.message }, { status: 500 });
  return NextResponse.json({ recommendations: data ?? [] });
}

export async function POST(request: Request, { params }: Params) {
  const { error, auth } = await requireContentAdmin();
  if (error) return error;
  const { id } = await params;
  const body = await request.json();

  if (!body.product_id) {
    return NextResponse.json({ error: "缺少 product_id" }, { status: 400 });
  }
  const recommendationType = String(body.recommendation_type ?? "ingredient");
  if (!TYPES.has(recommendationType)) {
    return NextResponse.json({ error: "recommendation_type 無效" }, { status: 400 });
  }

  if (!isSupabaseConfigured()) {
    return NextResponse.json(
      { recommendation: { id: `rec-${Date.now()}`, recipe_id: id, ...body } },
      { status: 201 }
    );
  }

  const admin = createAdminClient();
  const { data, error: insertError } = await admin
    .from("recipe_product_recommendations")
    .insert({
      recipe_id: id,
      step_id: body.step_id || null,
      ingredient_id: body.ingredient_id || null,
      product_id: body.product_id,
      recommendation_type: recommendationType,
      recommendation_reason: body.recommendation_reason ?? null,
      priority: Number(body.priority ?? 0),
      manual_override: Boolean(body.manual_override),
      is_active: body.is_active !== false,
    })
    .select("*, products(id, name, price, sale_price, image_url, is_active, stock)")
    .single();

  if (insertError) return NextResponse.json({ error: insertError.message }, { status: 500 });
  await logAudit(
    auth!.profile.id,
    "create_recipe_product_recommendation",
    "recipe_product_recommendation",
    data.id,
    null,
    data
  );
  return NextResponse.json({ recommendation: data }, { status: 201 });
}

export async function PATCH(request: Request, { params }: Params) {
  const { error, auth } = await requireContentAdmin();
  if (error) return error;
  await params;
  const body = await request.json();
  const recId = String(body.id ?? "");
  if (!recId) return NextResponse.json({ error: "缺少 id" }, { status: 400 });

  if (!isSupabaseConfigured()) {
    return NextResponse.json({ recommendation: body });
  }

  const updates: Record<string, unknown> = {};
  for (const key of [
    "step_id",
    "ingredient_id",
    "product_id",
    "recommendation_type",
    "recommendation_reason",
    "priority",
    "manual_override",
    "is_active",
  ]) {
    if (body[key] !== undefined) updates[key] = body[key];
  }
  if (updates.recommendation_type && !TYPES.has(String(updates.recommendation_type))) {
    return NextResponse.json({ error: "recommendation_type 無效" }, { status: 400 });
  }
  if (updates.priority != null) updates.priority = Number(updates.priority);

  const admin = createAdminClient();
  const { data, error: updateError } = await admin
    .from("recipe_product_recommendations")
    .update(updates)
    .eq("id", recId)
    .select("*, products(id, name, price, sale_price, image_url, is_active, stock)")
    .single();

  if (updateError) return NextResponse.json({ error: updateError.message }, { status: 500 });
  await logAudit(
    auth!.profile.id,
    "update_recipe_product_recommendation",
    "recipe_product_recommendation",
    recId,
    null,
    data
  );
  return NextResponse.json({ recommendation: data });
}

export async function DELETE(request: Request, { params }: Params) {
  const { error, auth } = await requireContentAdmin();
  if (error) return error;
  await params;
  const { searchParams } = new URL(request.url);
  const recId = searchParams.get("id");
  if (!recId) return NextResponse.json({ error: "缺少 id" }, { status: 400 });

  if (!isSupabaseConfigured()) return NextResponse.json({ ok: true });

  const admin = createAdminClient();
  const { error: deleteError } = await admin
    .from("recipe_product_recommendations")
    .delete()
    .eq("id", recId);

  if (deleteError) return NextResponse.json({ error: deleteError.message }, { status: 500 });
  await logAudit(
    auth!.profile.id,
    "delete_recipe_product_recommendation",
    "recipe_product_recommendation",
    recId,
    null,
    null
  );
  return NextResponse.json({ ok: true });
}
