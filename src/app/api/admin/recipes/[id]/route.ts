import { NextResponse } from "next/server";
import { requireContentAdmin, logAudit } from "@/lib/auth";
import { isSupabaseConfigured } from "@/lib/config";
import { createAdminClient } from "@/lib/supabase/admin";
import { getMockRecipeBySlug, MOCK_RECIPES_DB } from "@/lib/mock/recipes";
import { sanitizeAuditPayload } from "@/lib/services/auditService";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { error } = await requireContentAdmin();
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
      `*,
      recipe_categories(id, name, slug),
      recipe_ingredients(*),
      recipe_steps(*, recipe_step_ai_prompts(*)),
      recipe_tools(*),
      recipe_preparations(*),
      recipe_faq(*),
      recipe_media(*, recipe_video_markers(*))`
    )
    .eq("id", id)
    .single();

  if (fetchError || !data) {
    return NextResponse.json({ error: "食譜不存在" }, { status: 404 });
  }

  const recipe = data as Record<string, unknown> & {
    recipe_ingredients?: { sort_order?: number }[];
    recipe_steps?: { sort_order?: number; recipe_step_ai_prompts?: { sort_order?: number }[] }[];
    recipe_tools?: { sort_order?: number }[];
    recipe_preparations?: { sort_order?: number }[];
    recipe_faq?: { sort_order?: number }[];
    recipe_media?: { sort_order?: number; recipe_video_markers?: { sort_order?: number }[] }[];
  };

  recipe.recipe_ingredients = [...(recipe.recipe_ingredients ?? [])].sort(
    (a, b) => (a.sort_order ?? 0) - (b.sort_order ?? 0)
  );
  recipe.recipe_steps = [...(recipe.recipe_steps ?? [])]
    .sort((a, b) => (a.sort_order ?? 0) - (b.sort_order ?? 0))
    .map((step) => ({
      ...step,
      recipe_step_ai_prompts: [...(step.recipe_step_ai_prompts ?? [])].sort(
        (a, b) => (a.sort_order ?? 0) - (b.sort_order ?? 0)
      ),
    }));
  recipe.recipe_tools = [...(recipe.recipe_tools ?? [])].sort(
    (a, b) => (a.sort_order ?? 0) - (b.sort_order ?? 0)
  );
  recipe.recipe_preparations = [...(recipe.recipe_preparations ?? [])].sort(
    (a, b) => (a.sort_order ?? 0) - (b.sort_order ?? 0)
  );
  recipe.recipe_faq = [...(recipe.recipe_faq ?? [])].sort(
    (a, b) => (a.sort_order ?? 0) - (b.sort_order ?? 0)
  );
  recipe.recipe_media = [...(recipe.recipe_media ?? [])]
    .sort((a, b) => (a.sort_order ?? 0) - (b.sort_order ?? 0))
    .map((media) => ({
      ...media,
      recipe_video_markers: [...(media.recipe_video_markers ?? [])].sort(
        (a, b) => (a.sort_order ?? 0) - (b.sort_order ?? 0)
      ),
    }));

  return NextResponse.json({ recipe });
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { error, auth } = await requireContentAdmin();
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
    "reading_mode_default",
    "flip_mode_enabled",
    "full_reading_enabled",
    "is_smart_recipe",
    "ingredient_scaling_enabled",
    "discussion_enabled",
    "submission_enabled",
    "ai_enabled",
    "product_recommendation_enabled",
    "demo_key",
    "is_demo",
    "author_label",
    "tags",
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
          is_required: ing.is_required !== false,
          substitution_notes: ing.substitution_notes ?? null,
          quantity_numeric:
            ing.quantity_numeric != null && ing.quantity_numeric !== ""
              ? Number(ing.quantity_numeric)
              : null,
          used_in_step_ids: Array.isArray(ing.used_in_step_ids) ? ing.used_in_step_ids : [],
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
          description: String(step.description ?? step.content ?? ""),
          image_url: step.image_url ?? null,
          note: step.note ?? null,
          duration_seconds:
            step.duration_seconds != null && step.duration_seconds !== ""
              ? Number(step.duration_seconds)
              : null,
          temperature_value:
            step.temperature_value != null && step.temperature_value !== ""
              ? Number(step.temperature_value)
              : null,
          temperature_unit: step.temperature_unit ?? "C",
          timer_enabled: Boolean(step.timer_enabled),
          chef_notes: step.chef_notes ?? null,
          safety_notes: step.safety_notes ?? null,
          common_failures: Array.isArray(step.common_failures) ? step.common_failures : [],
          recovery_actions: Array.isArray(step.recovery_actions) ? step.recovery_actions : [],
          prohibited_actions: Array.isArray(step.prohibited_actions)
            ? step.prohibited_actions
            : [],
          ai_enabled: step.ai_enabled !== false,
          ai_context: step.ai_context ?? null,
          ai_keywords: Array.isArray(step.ai_keywords) ? step.ai_keywords : [],
          sort_order: Number(step.sort_order ?? i),
        }))
      );
    }
  }

  if (Array.isArray(body.tools)) {
    await admin.from("recipe_tools").delete().eq("recipe_id", id);
    if (body.tools.length) {
      await admin.from("recipe_tools").insert(
        body.tools.map((tool: Record<string, unknown>, i: number) => ({
          recipe_id: id,
          name: String(tool.name ?? ""),
          notes: tool.notes ?? null,
          product_id: tool.product_id || null,
          sort_order: Number(tool.sort_order ?? i),
        }))
      );
    }
  }

  if (Array.isArray(body.preparations)) {
    await admin.from("recipe_preparations").delete().eq("recipe_id", id);
    if (body.preparations.length) {
      await admin.from("recipe_preparations").insert(
        body.preparations.map((prep: Record<string, unknown>, i: number) => ({
          recipe_id: id,
          title: prep.title ?? null,
          content: String(prep.content ?? ""),
          sort_order: Number(prep.sort_order ?? i),
        }))
      );
    }
  }

  if (Array.isArray(body.faq)) {
    await admin.from("recipe_faq").delete().eq("recipe_id", id);
    if (body.faq.length) {
      await admin.from("recipe_faq").insert(
        body.faq.map((item: Record<string, unknown>, i: number) => ({
          recipe_id: id,
          question: String(item.question ?? ""),
          answer: String(item.answer ?? ""),
          sort_order: Number(item.sort_order ?? i),
          is_active: item.is_active !== false,
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
  const { error, auth } = await requireContentAdmin();
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
