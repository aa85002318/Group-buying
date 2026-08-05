import { NextResponse } from "next/server";
import { requireContentAdmin, logAudit } from "@/lib/auth";
import { isSupabaseConfigured } from "@/lib/config";
import { createAdminClient } from "@/lib/supabase/admin";
import { MOCK_RECIPE_CATEGORIES, MOCK_RECIPES_DB } from "@/lib/mock/recipes";
import { slugifyTitle } from "@/lib/videos/embed";
import { sanitizeAuditPayload } from "@/lib/services/auditService";

export async function GET() {
  const { error } = await requireContentAdmin();
  if (error) return error;

  if (!isSupabaseConfigured()) {
    return NextResponse.json({
      recipes: MOCK_RECIPES_DB,
      categories: MOCK_RECIPE_CATEGORIES,
    });
  }

  const admin = createAdminClient();
  const [{ data: recipes, error: fetchError }, { data: categories }] = await Promise.all([
    admin
      .from("recipes")
      .select("*, recipe_categories(id, name, slug)")
      .order("updated_at", { ascending: false }),
    admin.from("recipe_categories").select("*").order("sort_order"),
  ]);

  if (fetchError) return NextResponse.json({ error: fetchError.message }, { status: 500 });
  return NextResponse.json({ recipes: recipes ?? [], categories: categories ?? [] });
}

export async function POST(request: Request) {
  const { error, auth } = await requireContentAdmin();
  if (error) return error;

  const body = await request.json();
  const title = String(body.title ?? "").trim();
  if (!title) return NextResponse.json({ error: "請填寫標題" }, { status: 400 });

  const slug = String(body.slug ?? "").trim() || slugifyTitle(title);
  const status = body.status ?? "draft";
  const payload = {
    title,
    slug,
    summary: body.summary ?? null,
    cover_image: body.cover_image ?? null,
    category_id: body.category_id || null,
    difficulty: body.difficulty ?? "easy",
    prep_time: body.prep_time != null ? Number(body.prep_time) : null,
    cook_time: body.cook_time != null ? Number(body.cook_time) : null,
    total_time: body.total_time != null ? Number(body.total_time) : null,
    servings: body.servings ?? null,
    content: body.content ?? null,
    tips: body.tips ?? null,
    storage_method: body.storage_method ?? null,
    status,
    published_at:
      status === "published" ? body.published_at ?? new Date().toISOString() : body.published_at ?? null,
    seo_title: body.seo_title ?? null,
    seo_description: body.seo_description ?? null,
    related_video_id: body.related_video_id || null,
    sort_order: Number(body.sort_order ?? 0),
    is_featured: Boolean(body.is_featured),
    reading_mode_default: body.reading_mode_default === "full" ? "full" : "flip",
    flip_mode_enabled: body.flip_mode_enabled !== false,
    full_reading_enabled: body.full_reading_enabled !== false,
    is_smart_recipe: Boolean(body.is_smart_recipe),
    ingredient_scaling_enabled: body.ingredient_scaling_enabled !== false,
    discussion_enabled: body.discussion_enabled !== false,
    submission_enabled: body.submission_enabled !== false,
    ai_enabled: body.ai_enabled !== false,
    product_recommendation_enabled: body.product_recommendation_enabled !== false,
    demo_key: body.demo_key ?? null,
    is_demo: Boolean(body.is_demo),
    author_label: body.author_label ?? null,
    tags: Array.isArray(body.tags) ? body.tags : [],
    created_by: auth!.profile.id,
    updated_by: auth!.profile.id,
  };

  if (!isSupabaseConfigured()) {
    const recipe = {
      id: `recipe-${Date.now()}`,
      ...payload,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    MOCK_RECIPES_DB.unshift(recipe as never);
    return NextResponse.json({ recipe }, { status: 201 });
  }

  const admin = createAdminClient();
  const { data, error: insertError } = await admin.from("recipes").insert(payload).select().single();
  if (insertError) return NextResponse.json({ error: insertError.message }, { status: 500 });

  const ingredients = Array.isArray(body.ingredients) ? body.ingredients : [];
  const steps = Array.isArray(body.steps) ? body.steps : [];

  if (ingredients.length) {
    await admin.from("recipe_ingredients").insert(
      ingredients.map((ing: Record<string, unknown>, i: number) => ({
        recipe_id: data.id,
        group_name: ing.group_name ?? null,
        name: String(ing.name ?? ""),
        amount: ing.amount != null ? String(ing.amount) : null,
        unit: ing.unit != null ? String(ing.unit) : null,
        product_id: ing.product_id || null,
        sort_order: Number(ing.sort_order ?? i),
      }))
    );
  }

  if (steps.length) {
    await admin.from("recipe_steps").insert(
      steps.map((step: Record<string, unknown>, i: number) => ({
        recipe_id: data.id,
        step_number: Number(step.step_number ?? i + 1),
        title: step.title ?? null,
        description: String(step.description ?? ""),
        image_url: step.image_url ?? null,
        note: step.note ?? null,
        sort_order: Number(step.sort_order ?? i),
      }))
    );
  }

  await logAudit(
    auth!.profile.id,
    status === "published" ? "publish_recipe" : "create_recipe",
    "recipe",
    data.id,
    null,
    sanitizeAuditPayload(data)
  );

  return NextResponse.json({ recipe: data }, { status: 201 });
}
