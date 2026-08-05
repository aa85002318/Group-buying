/**
 * Idempotent flipbook recipe seed — upsert 5 published smart recipes by slug.
 */
import { createAdminClient } from "@/lib/supabase/admin";
import { isSupabaseConfigured } from "@/lib/config";
import {
  AUTHOR_LABEL,
  FLIPBOOK_CATEGORIES,
  FLIPBOOK_RECIPES,
  type FlipbookRecipeSeed,
  type FlipbookStepSeed,
} from "@/lib/recipes/flipbook-seed-data";

export type FlipbookSeedRecipeResult = {
  id: string;
  slug: string;
  title: string;
};

export type FlipbookSeedResult = {
  recipes: FlipbookSeedRecipeResult[];
};

function throwIf(error: { message: string } | null | undefined, label: string): void {
  if (error) throw new Error(`${label}: ${error.message}`);
}

function mapDifficulty(value: string): "easy" | "medium" | "hard" {
  if (value === "easy" || value === "medium" || value === "hard") return value;
  throw new Error(`未知難易度: ${value}`);
}

function parseTemperature(temp?: string | null): {
  temperature_value: number | null;
  temperature_unit: string | null;
} {
  if (!temp) return { temperature_value: null, temperature_unit: null };
  const match = temp.match(/(\d+(?:\.\d+)?)\s*°?\s*([CF])?/i);
  if (!match) return { temperature_value: null, temperature_unit: "C" };
  return {
    temperature_value: Number(match[1]),
    temperature_unit: (match[2] || "C").toUpperCase(),
  };
}

function commonFailuresFrom(step: FlipbookStepSeed): string[] {
  if (!step.common_mistakes) return [];
  return Array.isArray(step.common_mistakes)
    ? step.common_mistakes
    : [step.common_mistakes];
}

async function ensureCategories(
  admin: ReturnType<typeof createAdminClient>
): Promise<Map<string, string>> {
  const map = new Map<string, string>();

  for (const cat of FLIPBOOK_CATEGORIES) {
    const { data: existing, error: findErr } = await admin
      .from("recipe_categories")
      .select("id, name, slug")
      .eq("slug", cat.slug)
      .maybeSingle();
    throwIf(findErr, `lookup category ${cat.slug}`);

    if (existing) {
      const { error: updErr } = await admin
        .from("recipe_categories")
        .update({
          name: cat.name,
          is_active: true,
          sort_order: cat.sort_order,
        })
        .eq("id", existing.id);
      throwIf(updErr, `update category ${cat.slug}`);
      map.set(cat.slug, existing.id as string);
      continue;
    }

    const { data: inserted, error: insErr } = await admin
      .from("recipe_categories")
      .insert({
        name: cat.name,
        slug: cat.slug,
        sort_order: cat.sort_order,
        is_active: true,
      })
      .select("id")
      .single();
    throwIf(insErr, `insert category ${cat.slug}`);
    map.set(cat.slug, inserted!.id as string);
  }

  return map;
}

async function upsertRecipe(
  admin: ReturnType<typeof createAdminClient>,
  recipe: FlipbookRecipeSeed,
  categoryId: string
): Promise<string> {
  const now = new Date().toISOString();
  const payload = {
    title: recipe.title,
    slug: recipe.slug,
    summary: recipe.summary,
    content: recipe.content,
    cover_image: null as string | null,
    category_id: categoryId,
    difficulty: mapDifficulty(recipe.difficulty),
    prep_time: recipe.prep_time,
    cook_time: recipe.cook_time,
    total_time: recipe.total_time,
    servings: recipe.servings,
    tips: recipe.tips,
    storage_method: recipe.storage_method,
    status: "published" as const,
    access_permission: "public" as const,
    allergens: recipe.allergens,
    tags: recipe.tags,
    author_label: AUTHOR_LABEL,
    published_at: now,
    seo_title: recipe.title,
    seo_description: recipe.summary,
    is_featured: false,
    reading_mode_default: "flip" as const,
    flip_mode_enabled: true,
    full_reading_enabled: true,
    is_smart_recipe: true,
    ingredient_scaling_enabled: true,
    discussion_enabled: true,
    submission_enabled: true,
    product_recommendation_enabled: true,
    ai_enabled: true,
    reader_settings: {
      showToc: true,
      showProgress: true,
      rememberProgress: true,
      swipeEnabled: true,
      keyboardEnabled: true,
      showProducts: true,
      showGallery: true,
      showChallenge: true,
      showAskTeacher: true,
      showCautionPopup: true,
    },
  };

  const { data: existing, error: findErr } = await admin
    .from("recipes")
    .select("id")
    .eq("slug", recipe.slug)
    .maybeSingle();
  throwIf(findErr, `lookup recipe ${recipe.slug}`);

  if (existing) {
    const { error: updErr } = await admin
      .from("recipes")
      .update(payload)
      .eq("id", existing.id);
    throwIf(updErr, `update recipe ${recipe.slug}`);
    return existing.id as string;
  }

  const { data: inserted, error: insErr } = await admin
    .from("recipes")
    .insert(payload)
    .select("id")
    .single();
  throwIf(insErr, `insert recipe ${recipe.slug}`);
  return inserted!.id as string;
}

async function upsertIngredient(
  admin: ReturnType<typeof createAdminClient>,
  recipeId: string,
  ing: FlipbookRecipeSeed["ingredients"][number]
): Promise<void> {
  const row = {
    recipe_id: recipeId,
    seed_key: ing.seed_key,
    group_name: ing.group_name,
    name: ing.name,
    amount: ing.amount,
    unit: ing.unit,
    quantity_numeric: ing.quantity_numeric,
    substitution_notes: ing.note ?? null,
    product_id: null as string | null,
    is_required: true,
    sort_order: ing.sort_order,
  };

  const { data: existing, error: findErr } = await admin
    .from("recipe_ingredients")
    .select("id")
    .eq("recipe_id", recipeId)
    .eq("seed_key", ing.seed_key)
    .maybeSingle();
  throwIf(findErr, `lookup ingredient ${ing.seed_key}`);

  if (existing) {
    const { error } = await admin
      .from("recipe_ingredients")
      .update(row)
      .eq("id", existing.id);
    throwIf(error, `update ingredient ${ing.seed_key}`);
    return;
  }

  const { error } = await admin.from("recipe_ingredients").insert(row);
  throwIf(error, `insert ingredient ${ing.seed_key}`);
}

async function upsertTool(
  admin: ReturnType<typeof createAdminClient>,
  recipeId: string,
  tool: FlipbookRecipeSeed["tools"][number]
): Promise<void> {
  const row = {
    recipe_id: recipeId,
    seed_key: tool.seed_key,
    name: tool.name,
    notes: tool.notes ?? null,
    product_id: null as string | null,
    sort_order: tool.sort_order,
  };

  const { data: existing, error: findErr } = await admin
    .from("recipe_tools")
    .select("id")
    .eq("recipe_id", recipeId)
    .eq("seed_key", tool.seed_key)
    .maybeSingle();
  throwIf(findErr, `lookup tool ${tool.seed_key}`);

  if (existing) {
    const { error } = await admin.from("recipe_tools").update(row).eq("id", existing.id);
    throwIf(error, `update tool ${tool.seed_key}`);
    return;
  }

  const { error } = await admin.from("recipe_tools").insert(row);
  throwIf(error, `insert tool ${tool.seed_key}`);
}

async function upsertStep(
  admin: ReturnType<typeof createAdminClient>,
  recipeId: string,
  step: FlipbookStepSeed
): Promise<string> {
  const temp = parseTemperature(step.temperature);
  const failures = commonFailuresFrom(step);
  const row = {
    recipe_id: recipeId,
    seed_key: step.seed_key,
    step_number: step.step_number,
    title: step.title,
    description: step.description,
    image_url: null as string | null,
    note: step.chef_notes ?? null,
    chef_notes: step.chef_notes ?? null,
    duration_seconds: step.timer_seconds ?? null,
    timer_enabled: Boolean(step.timer_seconds && step.timer_seconds > 0),
    temperature_value: temp.temperature_value,
    temperature_unit: temp.temperature_unit,
    common_failures: failures,
    recovery_actions: [] as string[],
    prohibited_actions: [] as string[],
    ai_enabled: true,
    ai_context: step.chef_notes ?? null,
    ai_keywords: [] as string[],
    sort_order: step.step_number,
  };

  const { data: existing, error: findErr } = await admin
    .from("recipe_steps")
    .select("id")
    .eq("recipe_id", recipeId)
    .eq("seed_key", step.seed_key)
    .maybeSingle();
  throwIf(findErr, `lookup step ${step.seed_key}`);

  if (existing) {
    const { error } = await admin.from("recipe_steps").update(row).eq("id", existing.id);
    throwIf(error, `update step ${step.seed_key}`);
    return existing.id as string;
  }

  const { data: inserted, error } = await admin
    .from("recipe_steps")
    .insert(row)
    .select("id")
    .single();
  throwIf(error, `insert step ${step.seed_key}`);
  return inserted!.id as string;
}

async function upsertPreparations(
  admin: ReturnType<typeof createAdminClient>,
  recipeId: string,
  items: string[]
): Promise<void> {
  const { data: existingRows, error: listErr } = await admin
    .from("recipe_preparations")
    .select("id, title, sort_order")
    .eq("recipe_id", recipeId)
    .order("sort_order");
  throwIf(listErr, "list preparations");

  const bySort = new Map(
    (existingRows ?? []).map((r) => [r.sort_order as number, r])
  );
  const byTitle = new Map(
    (existingRows ?? []).map((r) => [(r.title as string) || "", r])
  );

  for (let i = 0; i < items.length; i++) {
    const title = items[i]!;
    const sort_order = i + 1;
    const row = {
      recipe_id: recipeId,
      title,
      content: title,
      sort_order,
    };
    const hit = bySort.get(sort_order) ?? byTitle.get(title);
    if (hit) {
      const { error } = await admin
        .from("recipe_preparations")
        .update(row)
        .eq("id", hit.id);
      throwIf(error, `update preparation ${sort_order}`);
    } else {
      const { error } = await admin.from("recipe_preparations").insert(row);
      throwIf(error, `insert preparation ${sort_order}`);
    }
  }
}

async function upsertChapter(
  admin: ReturnType<typeof createAdminClient>,
  recipeId: string,
  chapter: FlipbookRecipeSeed["chapters"][number]
): Promise<string> {
  const row = {
    recipe_id: recipeId,
    title: chapter.title,
    subtitle: chapter.subtitle,
    chapter_number: chapter.chapter_number,
    cover_image: null as string | null,
    sort_order: chapter.sort_order,
    active: true,
  };

  const { data: byTitle, error: tErr } = await admin
    .from("recipe_story_chapters")
    .select("id")
    .eq("recipe_id", recipeId)
    .eq("title", chapter.title)
    .maybeSingle();
  throwIf(tErr, `lookup chapter title ${chapter.title}`);

  let existing = byTitle;
  if (!existing) {
    const { data: byOrder, error: oErr } = await admin
      .from("recipe_story_chapters")
      .select("id")
      .eq("recipe_id", recipeId)
      .eq("sort_order", chapter.sort_order)
      .maybeSingle();
    throwIf(oErr, `lookup chapter sort ${chapter.sort_order}`);
    existing = byOrder;
  }

  if (existing) {
    const { error } = await admin
      .from("recipe_story_chapters")
      .update(row)
      .eq("id", existing.id);
    throwIf(error, `update chapter ${chapter.title}`);
    return existing.id as string;
  }

  const { data: inserted, error } = await admin
    .from("recipe_story_chapters")
    .insert(row)
    .select("id")
    .single();
  throwIf(error, `insert chapter ${chapter.title}`);
  return inserted!.id as string;
}

async function upsertPage(
  admin: ReturnType<typeof createAdminClient>,
  recipeId: string,
  chapterId: string,
  page: FlipbookRecipeSeed["pages"][number],
  sortOrder: number,
  stepIdByNumber: Map<number, string>
): Promise<void> {
  const stepId =
    page.step_number != null
      ? stepIdByNumber.get(page.step_number) ?? null
      : null;

  const row = {
    recipe_id: recipeId,
    chapter_id: chapterId,
    step_id: stepId,
    seed_key: page.seed_key,
    page_type: page.page_type,
    layout_type: page.layout_type,
    title: page.title,
    subtitle: page.subtitle ?? null,
    body: page.body ?? null,
    eyebrow: page.eyebrow ?? null,
    alignment: page.alignment ?? "bottom_left",
    content_config: page.content_config ?? {},
    completion_config: page.completion_config ?? {},
    ai_context: page.ai_context ?? null,
    sort_order: sortOrder,
    active: true,
  };

  const { data: existing, error: findErr } = await admin
    .from("recipe_story_pages")
    .select("id")
    .eq("recipe_id", recipeId)
    .eq("seed_key", page.seed_key)
    .maybeSingle();
  throwIf(findErr, `lookup page ${page.seed_key}`);

  if (existing) {
    const { error } = await admin
      .from("recipe_story_pages")
      .update(row)
      .eq("id", existing.id);
    throwIf(error, `update page ${page.seed_key}`);
    return;
  }

  const { error } = await admin.from("recipe_story_pages").insert(row);
  throwIf(error, `insert page ${page.seed_key}`);
}

async function seedOneRecipe(
  admin: ReturnType<typeof createAdminClient>,
  recipe: FlipbookRecipeSeed,
  categoryIdBySlug: Map<string, string>
): Promise<FlipbookSeedRecipeResult> {
  const categoryId = categoryIdBySlug.get(recipe.category_slug);
  if (!categoryId) {
    throw new Error(`缺少分類 slug=${recipe.category_slug}（${recipe.title}）`);
  }

  const recipeId = await upsertRecipe(admin, recipe, categoryId);

  for (const ing of recipe.ingredients) {
    await upsertIngredient(admin, recipeId, ing);
  }
  for (const tool of recipe.tools) {
    await upsertTool(admin, recipeId, tool);
  }

  const stepIdByNumber = new Map<number, string>();
  for (const step of recipe.steps) {
    const stepId = await upsertStep(admin, recipeId, step);
    stepIdByNumber.set(step.step_number, stepId);
  }

  await upsertPreparations(admin, recipeId, recipe.preparations);

  const chapterIds: string[] = [];
  for (const chapter of recipe.chapters) {
    chapterIds.push(await upsertChapter(admin, recipeId, chapter));
  }

  const pageSortByChapter = [0, 0, 0];
  for (const page of recipe.pages) {
    const chapterId = chapterIds[page.chapter_index];
    if (!chapterId) {
      throw new Error(
        `頁面 ${page.seed_key} 的 chapter_index=${page.chapter_index} 無效`
      );
    }
    const sortOrder = pageSortByChapter[page.chapter_index]!;
    pageSortByChapter[page.chapter_index] = sortOrder + 1;
    await upsertPage(admin, recipeId, chapterId, page, sortOrder, stepIdByNumber);
  }

  return { id: recipeId, slug: recipe.slug, title: recipe.title };
}

/** Seed all flipbook recipes (idempotent by slug / seed_key). */
export async function seedFlipbookRecipes(): Promise<FlipbookSeedResult> {
  if (!isSupabaseConfigured()) {
    throw new Error(
      "Supabase 未正確設定：請檢查 NEXT_PUBLIC_SUPABASE_URL 與 NEXT_PUBLIC_SUPABASE_ANON_KEY"
    );
  }
  if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
    throw new Error("缺少 SUPABASE_SERVICE_ROLE_KEY，無法執行 seed");
  }

  const admin = createAdminClient();
  const categoryIdBySlug = await ensureCategories(admin);
  const recipes: FlipbookSeedRecipeResult[] = [];

  for (const recipe of FLIPBOOK_RECIPES) {
    try {
      const result = await seedOneRecipe(admin, recipe, categoryIdBySlug);
      recipes.push(result);
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      throw new Error(`食譜「${recipe.title}」(${recipe.slug}) seed 失敗：${msg}`);
    }
  }

  return { recipes };
}
