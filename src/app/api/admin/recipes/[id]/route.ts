import { NextResponse } from "next/server";
import { requireAdmin, logAudit } from "@/lib/auth";
import { isSupabaseConfigured } from "@/lib/config";
import { createAdminClient } from "@/lib/supabase/admin";
import { getMockRecipeBySlug, MOCK_RECIPES_DB } from "@/lib/mock/recipes";
import { sanitizeAuditPayload } from "@/lib/services/auditService";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { error } = await requireAdmin();
  if (error) return error;

  const { id } = await params;

  if (!isSupabaseConfigured()) {
    const recipe =
      MOCK_RECIPES_DB.find((r) => r.id === id) ??
      getMockRecipeBySlug(id);
    if (!recipe) return NextResponse.json({ error: "食譜不存在" }, { status: 404 });
    return NextResponse.json({ recipe: getMockRecipeBySlug(recipe.slug) ?? recipe });
  }

  const admin = createAdminClient();
  const { data, error: fetchError } = await admin
    .from("recipes")
    .select(
      "*, recipe_categories(id, name, slug), recipe_ingredients(*), recipe_steps(*)"
    )
    .eq("id", id)
    .single();

  if (fetchError || !data) {
    return NextResponse.json({ error: "食譜不存在" }, { status: 404 });
  }
  return NextResponse.json({ recipe: data });
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { error, auth } = await requireAdmin();
  if (error) return error;

  const { id } = await params;
  const body = await request.json();

  if (!isSupabaseConfigured()) {
    return NextResponse.json({ recipe: { id, ...body } });
  }

  const admin = createAdminClient();
  const { data: old } = await admin.from("recipes").select("*").eq("id", id).single();
  if (!old) return NextResponse.json({ error: "食譜不存在" }, { status: 404 });

  const updates: Record<string, unknown> = { updated_by: auth!.profile.id };
  const fields = [
    "title",
    "slug",
    "summary",
    "cover_image",
    "category_id",
    "difficulty",
    "prep_time",
    "cook_time",
    "total_time",
    "servings",
    "content",
    "tips",
    "storage_method",
    "status",
    "published_at",
    "seo_title",
    "seo_description",
    "related_video_id",
    "sort_order",
    "is_featured",
  ] as const;

  for (const key of fields) {
    if (body[key] !== undefined) {
      updates[key] = body[key] === "" ? null : body[key];
    }
  }

  if (body.status === "published" && !body.published_at && !old.published_at) {
    updates.published_at = new Date().toISOString();
  }

  const { data, error: updateError } = await admin
    .from("recipes")
    .update(updates)
    .eq("id", id)
    .select()
    .single();

  if (updateError) return NextResponse.json({ error: updateError.message }, { status: 500 });

  if (Array.isArray(body.ingredients)) {
    await admin.from("recipe_ingredients").delete().eq("recipe_id", id);
    if (body.ingredients.length) {
      await admin.from("recipe_ingredients").insert(
        body.ingredients.map((ing: Record<string, unknown>, i: number) => ({
          recipe_id: id,
          group_name: ing.group_name ?? null,
          name: String(ing.name ?? ""),
          amount: ing.amount != null ? String(ing.amount) : null,
          unit: ing.unit != null ? String(ing.unit) : null,
          product_id: ing.product_id || null,
          sort_order: Number(ing.sort_order ?? i),
        }))
      );
    }
  }

  if (Array.isArray(body.steps)) {
    await admin.from("recipe_steps").delete().eq("recipe_id", id);
    if (body.steps.length) {
      await admin.from("recipe_steps").insert(
        body.steps.map((step: Record<string, unknown>, i: number) => ({
          recipe_id: id,
          step_number: Number(step.step_number ?? i + 1),
          title: step.title ?? null,
          description: String(step.description ?? ""),
          image_url: step.image_url ?? null,
          note: step.note ?? null,
          sort_order: Number(step.sort_order ?? i),
        }))
      );
    }
  }

  const action =
    body.status === "published" && old.status !== "published"
      ? "publish_recipe"
      : body.status === "archived" && old.status !== "archived"
        ? "archive_recipe"
        : "update_recipe";

  await logAudit(
    auth!.profile.id,
    action,
    "recipe",
    id,
    sanitizeAuditPayload(old),
    sanitizeAuditPayload(data)
  );

  return NextResponse.json({ recipe: data });
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { error, auth } = await requireAdmin();
  if (error) return error;

  const { id } = await params;

  if (!isSupabaseConfigured()) {
    return NextResponse.json({ ok: true });
  }

  const admin = createAdminClient();
  const { error: deleteError } = await admin.from("recipes").delete().eq("id", id);
  if (deleteError) return NextResponse.json({ error: deleteError.message }, { status: 500 });

  await logAudit(auth!.profile.id, "delete_recipe", "recipe", id, null, null);
  return NextResponse.json({ ok: true });
}
