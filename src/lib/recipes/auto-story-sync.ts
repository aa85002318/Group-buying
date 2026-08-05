import type { createAdminClient } from "@/lib/supabase/admin";
import type { RecipeStoryLayoutType, RecipeStoryPageType } from "@/lib/recipes/story-types";

type Admin = ReturnType<typeof createAdminClient>;

export type AutoSyncRecipe = {
  id: string;
  title: string;
  summary: string | null;
  cover_image: string | null;
  tips: string | null;
  storage_method: string | null;
  difficulty: string | null;
  servings: string | null;
  prep_time: number | null;
  cook_time: number | null;
  bake_time?: number | null;
  total_time: number | null;
  product_recommendation_enabled?: boolean | null;
  submission_enabled?: boolean | null;
  story_layout_mode?: string | null;
};

export type AutoSyncStep = {
  id: string;
  step_number: number;
  title: string | null;
  description: string;
  image_url: string | null;
  video_url?: string | null;
  note: string | null;
  chef_notes?: string | null;
  duration_seconds?: number | null;
  temperature_value?: number | null;
  temperature_unit?: string | null;
  timer_enabled?: boolean | null;
  ai_enabled?: boolean | null;
  ai_context?: string | null;
};

export type AutoSyncTool = { id: string; name: string };

type AutoPageDraft = {
  seed_key: string;
  page_type: RecipeStoryPageType;
  layout_type: RecipeStoryLayoutType;
  title: string;
  subtitle?: string | null;
  body?: string | null;
  eyebrow?: string | null;
  alignment?: string;
  step_id?: string | null;
  content_config?: Record<string, unknown>;
  completion_config?: Record<string, unknown>;
  ai_context?: string | null;
  media?: Array<{
    media_type: "image" | "video";
    url: string;
    caption?: string | null;
    sort_order?: number;
  }>;
};

const AUTO_PREFIX = "auto:";

export function isAutoSeedKey(seedKey: string | null | undefined): boolean {
  return Boolean(seedKey && seedKey.startsWith(AUTO_PREFIX));
}

function infoBody(recipe: AutoSyncRecipe): string {
  const bits = [
    recipe.summary?.trim(),
    recipe.difficulty ? `難易度：${recipe.difficulty}` : null,
    recipe.servings ? `份量：${recipe.servings}` : null,
    recipe.prep_time != null ? `準備 ${recipe.prep_time} 分` : null,
    recipe.cook_time != null ? `製作 ${recipe.cook_time} 分` : null,
    recipe.bake_time != null ? `烘烤 ${recipe.bake_time} 分` : null,
    recipe.total_time != null ? `總時間約 ${recipe.total_time} 分` : null,
  ].filter(Boolean);
  return bits.join("\n") || "CHIMEIDIY 烘焙食譜";
}

export function buildAutoPageDrafts(
  recipe: AutoSyncRecipe,
  steps: AutoSyncStep[],
  tools: AutoSyncTool[]
): AutoPageDraft[] {
  const pages: AutoPageDraft[] = [
    {
      seed_key: `${AUTO_PREFIX}cover`,
      page_type: "cover",
      layout_type: "full_bleed",
      title: recipe.title,
      subtitle: recipe.summary?.slice(0, 80) || "CHIMEIDIY 翻頁食譜",
      eyebrow: "棋美點心屋",
      alignment: "bottom_left",
      content_config: {
        overlayOpacity: 0.35,
        ctaPrimary: "開始閱讀",
        chapterAccent: "#153E73",
      },
      media: recipe.cover_image
        ? [{ media_type: "image", url: recipe.cover_image, sort_order: 0 }]
        : undefined,
    },
    {
      seed_key: `${AUTO_PREFIX}info`,
      page_type: "introduction",
      layout_type: "list",
      title: "食譜資訊",
      subtitle: recipe.title,
      body: infoBody(recipe),
      content_config: { ctaPrimary: "查看材料" },
    },
    {
      seed_key: `${AUTO_PREFIX}ingredients`,
      page_type: "ingredients",
      layout_type: "list",
      title: "材料",
      subtitle: "請依份量秤重備料",
      content_config: {
        ctaPrimary: "材料已備齊",
        ctaSecondary: "稍後再看",
      },
    },
  ];

  if (tools.length > 0) {
    pages.push({
      seed_key: `${AUTO_PREFIX}tools`,
      page_type: "tools",
      layout_type: "list",
      title: "器具",
      subtitle: "製作前請確認器具齊全",
      content_config: { ctaPrimary: "器具已備齊" },
    });
  }

  const orderedSteps = [...steps].sort((a, b) => a.step_number - b.step_number);
  for (const step of orderedSteps) {
    const media: AutoPageDraft["media"] = [];
    if (step.image_url) {
      media.push({ media_type: "image", url: step.image_url, sort_order: 0 });
    }
    if (step.video_url) {
      media.push({ media_type: "video", url: step.video_url, sort_order: media.length });
    }

    pages.push({
      // Prefer step_number for stable upsert across delete+reinsert step saves.
      seed_key: `${AUTO_PREFIX}step:${step.step_number}`,
      page_type: step.video_url ? "step_video" : "step",
      layout_type: step.video_url ? "video_lead" : "split_image_text",
      title: step.title?.trim() || `步驟 ${step.step_number}`,
      subtitle: `步驟 ${step.step_number}`,
      body: step.description,
      step_id: step.id,
      content_config: {
        splitDirection: "image_top",
        ...(step.timer_enabled && step.duration_seconds
          ? {
              timerSeconds: step.duration_seconds,
              timerLabel: step.title || `步驟 ${step.step_number}`,
            }
          : {}),
        ...(step.temperature_value != null
          ? {
              temperatureLabel: "溫度",
              temperatureValue: step.temperature_value,
              temperatureUnit: step.temperature_unit === "F" ? "F" : "C",
            }
          : {}),
        ctaPrimary: "完成本步驟",
      },
      ai_context: step.ai_enabled
        ? step.ai_context || step.chef_notes || step.note || null
        : null,
      media: media.length ? media : undefined,
    });
  }

  const tipsBody = [recipe.tips?.trim(), recipe.storage_method?.trim()]
    .filter(Boolean)
    .join("\n\n");
  if (tipsBody) {
    pages.push({
      seed_key: `${AUTO_PREFIX}tips`,
      page_type: "storage",
      layout_type: "list",
      title: "製作重點與保存",
      body: tipsBody,
      content_config: { ctaPrimary: "繼續" },
    });
  }

  if (recipe.product_recommendation_enabled !== false) {
    pages.push({
      seed_key: `${AUTO_PREFIX}recommendations`,
      page_type: "recommendations",
      layout_type: "embed",
      title: "商品推薦",
      subtitle: "材料與器具對應商品",
      body: "尚未綁定商品時會顯示空狀態，可於材料列選擇商城商品。",
      content_config: { ctaPrimary: "分享作品" },
    });
  }

  if (recipe.submission_enabled !== false) {
    pages.push({
      seed_key: `${AUTO_PREFIX}submissions`,
      page_type: "submissions",
      layout_type: "embed",
      title: "分享作品",
      subtitle: "可略過",
      body: "完成後歡迎上傳成品照片與製作心得；也可設為僅自己查看。",
      content_config: { ctaPrimary: "繼續", skipAllowed: true },
    });
  }

  pages.push({
    seed_key: `${AUTO_PREFIX}completion`,
    page_type: "completion",
    layout_type: "full_bleed",
    title: "恭喜完成！",
    subtitle: "為自己的烘焙作品留下紀錄吧。",
    body: "你可以上傳成品照片、分享製作心得，或繼續探索其他食譜。",
    content_config: { ctaPrimary: "完成", chapterAccent: "#79C7E8" },
  });

  return pages;
}

export type AutoSyncResult =
  | { ok: true; mode: "auto"; pageCount: number; skipped?: false }
  | { ok: true; mode: "manual"; skipped: true; needsConfirm: true; pageCount: number }
  | { ok: false; error: string };

async function ensureAutoChapter(admin: Admin, recipeId: string): Promise<string> {
  const { data: existing, error: findErr } = await admin
    .from("recipe_story_chapters")
    .select("id")
    .eq("recipe_id", recipeId)
    .eq("title", "食譜內容")
    .maybeSingle();
  if (findErr) throw new Error(findErr.message);
  if (existing?.id) return existing.id as string;

  const { data: inserted, error } = await admin
    .from("recipe_story_chapters")
    .insert({
      recipe_id: recipeId,
      title: "食譜內容",
      subtitle: null,
      chapter_number: 1,
      sort_order: 0,
      active: true,
    })
    .select("id")
    .single();
  if (error) throw new Error(error.message);
  return inserted!.id as string;
}

async function upsertAutoPage(
  admin: Admin,
  recipeId: string,
  chapterId: string,
  page: AutoPageDraft,
  sortOrder: number
): Promise<string> {
  const row = {
    recipe_id: recipeId,
    chapter_id: chapterId,
    step_id: page.step_id ?? null,
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
  if (findErr) throw new Error(findErr.message);

  let pageId: string;
  if (existing?.id) {
    const { error } = await admin.from("recipe_story_pages").update(row).eq("id", existing.id);
    if (error) throw new Error(error.message);
    pageId = existing.id as string;
  } else {
    const { data: inserted, error } = await admin
      .from("recipe_story_pages")
      .insert(row)
      .select("id")
      .single();
    if (error) throw new Error(error.message);
    pageId = inserted!.id as string;
  }

  // Replace media for this auto page when provided (cover / step assets)
  if (page.media) {
    await admin.from("recipe_story_page_media").delete().eq("story_page_id", pageId);
    if (page.media.length) {
      const { error: mediaErr } = await admin.from("recipe_story_page_media").insert(
        page.media.map((m, i) => ({
          story_page_id: pageId,
          media_type: m.media_type,
          source_type: "cdn",
          url: m.url,
          caption: m.caption ?? null,
          sort_order: m.sort_order ?? i,
          active: true,
          metadata: {},
        }))
      );
      if (mediaErr) throw new Error(mediaErr.message);
    }
  }

  return pageId;
}

/**
 * Sync auto-managed flipbook pages from recipe content.
 * Non-auto pages are left intact unless force=true (full replace of auto pages only).
 */
export async function syncRecipeStoryFromContent(
  admin: Admin,
  recipeId: string,
  options: { force?: boolean } = {}
): Promise<AutoSyncResult> {
  const { data: recipe, error: recipeErr } = await admin
    .from("recipes")
    .select(
      "id, title, summary, cover_image, tips, storage_method, difficulty, servings, prep_time, cook_time, bake_time, total_time, product_recommendation_enabled, submission_enabled, story_layout_mode"
    )
    .eq("id", recipeId)
    .single();
  if (recipeErr || !recipe) {
    return { ok: false, error: recipeErr?.message ?? "食譜不存在" };
  }

  const mode = (recipe.story_layout_mode as string) || "auto";

  const [{ data: steps, error: stepsErr }, { data: tools, error: toolsErr }, { data: existingPages, error: pagesErr }] =
    await Promise.all([
      admin
        .from("recipe_steps")
        .select(
          "id, step_number, title, description, image_url, video_url, note, chef_notes, duration_seconds, temperature_value, temperature_unit, timer_enabled, ai_enabled, ai_context"
        )
        .eq("recipe_id", recipeId)
        .order("sort_order"),
      admin.from("recipe_tools").select("id, name").eq("recipe_id", recipeId).order("sort_order"),
      admin.from("recipe_story_pages").select("id, seed_key").eq("recipe_id", recipeId),
    ]);

  if (stepsErr) return { ok: false, error: stepsErr.message };
  if (toolsErr) return { ok: false, error: toolsErr.message };
  if (pagesErr) return { ok: false, error: pagesErr.message };

  const pages = existingPages ?? [];
  const hasAuto = pages.some((p) => isAutoSeedKey(p.seed_key as string | null));
  const hasNonAuto = pages.some((p) => !isAutoSeedKey(p.seed_key as string | null));

  // Manual mode, or legacy/manual pages without auto keys → confirm before overwrite
  if ((mode === "manual" || (hasNonAuto && !hasAuto)) && !options.force) {
    return {
      ok: true,
      mode: "manual",
      skipped: true,
      needsConfirm: true,
      pageCount: pages.length,
    };
  }

  try {
    if (options.force && (mode === "manual" || hasNonAuto)) {
      await admin.from("recipes").update({ story_layout_mode: "auto" }).eq("id", recipeId);
      if (hasNonAuto) {
        // Remove legacy/manual pages so auto template owns the flipbook
        await admin.from("recipe_story_pages").delete().eq("recipe_id", recipeId);
      }
    }

    const drafts = buildAutoPageDrafts(
      recipe as AutoSyncRecipe,
      (steps ?? []) as AutoSyncStep[],
      (tools ?? []) as AutoSyncTool[]
    );
    const chapterId = await ensureAutoChapter(admin, recipeId);
    const keepKeys = new Set(drafts.map((d) => d.seed_key));

    for (let i = 0; i < drafts.length; i++) {
      await upsertAutoPage(admin, recipeId, chapterId, drafts[i], i);
    }

    // Remove obsolete auto pages (e.g. deleted steps / hidden tools)
    const { data: afterPages } = await admin
      .from("recipe_story_pages")
      .select("id, seed_key")
      .eq("recipe_id", recipeId);
    const toDelete = (afterPages ?? []).filter(
      (p) => isAutoSeedKey(p.seed_key as string | null) && !keepKeys.has(p.seed_key as string)
    );
    if (toDelete.length) {
      await admin
        .from("recipe_story_pages")
        .delete()
        .in(
          "id",
          toDelete.map((p) => p.id)
        );
    }

    return { ok: true, mode: "auto", pageCount: drafts.length };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "翻頁同步失敗" };
  }
}

export async function markRecipeStoryManual(admin: Admin, recipeId: string): Promise<void> {
  await admin.from("recipes").update({ story_layout_mode: "manual" }).eq("id", recipeId);
}
