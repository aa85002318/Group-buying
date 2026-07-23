import { NextResponse } from "next/server";
import { requireContentAdmin, logAudit } from "@/lib/auth";
import { isSupabaseConfigured } from "@/lib/config";
import { nestChaptersWithPages } from "@/lib/recipes/storybook";
import { createAdminClient } from "@/lib/supabase/admin";
import type {
  RecipeStoryChapter,
  RecipeStoryPage,
  RecipeStoryPageMedia,
} from "@/lib/types/database";

type Params = { params: Promise<{ id: string }> };

async function loadStories(recipeId: string) {
  const admin = createAdminClient();
  const [chRes, pageRes, mediaRes] = await Promise.all([
    admin
      .from("recipe_story_chapters")
      .select("*")
      .eq("recipe_id", recipeId)
      .order("sort_order"),
    admin
      .from("recipe_story_pages")
      .select("*")
      .eq("recipe_id", recipeId)
      .order("sort_order"),
    admin
      .from("recipe_story_page_media")
      .select("*")
      .order("sort_order"),
  ]);

  if (chRes.error) throw new Error(chRes.error.message);
  if (pageRes.error) throw new Error(pageRes.error.message);
  if (mediaRes.error) throw new Error(mediaRes.error.message);

  const pageIds = new Set((pageRes.data ?? []).map((p) => p.id));
  const media = (mediaRes.data ?? []).filter((m) => pageIds.has(m.story_page_id));

  const chapters = nestChaptersWithPages(
    (chRes.data ?? []) as RecipeStoryChapter[],
    (pageRes.data ?? []) as RecipeStoryPage[],
    media as RecipeStoryPageMedia[]
  );

  return { chapters, pages: pageRes.data ?? [], media };
}

/** GET full story tree for admin */
export async function GET(_request: Request, { params }: Params) {
  const { error } = await requireContentAdmin();
  if (error) return error;
  const { id } = await params;

  if (!isSupabaseConfigured()) {
    return NextResponse.json({ chapters: [] });
  }

  try {
    const data = await loadStories(id);
    return NextResponse.json(data);
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "載入失敗" },
      { status: 500 }
    );
  }
}

/**
 * POST actions:
 * - create_chapter | update_chapter | delete_chapter
 * - create_page | update_page | delete_page | duplicate_page
 * - reorder ({ chapters: [{id,sort_order}], pages: [{id,chapter_id,sort_order}] })
 * - upsert_media | delete_media
 * - replace_tree (full chapters+pages+media for seed/admin bulk)
 */
export async function POST(request: Request, { params }: Params) {
  const { error, auth } = await requireContentAdmin();
  if (error) return error;
  const { id: recipeId } = await params;
  const body = await request.json();
  const action = String(body.action ?? "");

  if (!isSupabaseConfigured()) {
    return NextResponse.json({ ok: true, mock: true });
  }

  const admin = createAdminClient();

  try {
    switch (action) {
      case "create_chapter": {
        const { data, error: err } = await admin
          .from("recipe_story_chapters")
          .insert({
            recipe_id: recipeId,
            title: String(body.title ?? "新章節"),
            subtitle: body.subtitle ?? null,
            chapter_number: body.chapter_number != null ? Number(body.chapter_number) : null,
            cover_image: body.cover_image ?? null,
            sort_order: Number(body.sort_order ?? 0),
            active: body.active !== false,
          })
          .select("*")
          .single();
        if (err) throw new Error(err.message);
        await logAudit(auth!.profile.id, "create_story_chapter", "recipe_story_chapter", data.id, null, data);
        return NextResponse.json({ chapter: data }, { status: 201 });
      }

      case "update_chapter": {
        const chapterId = String(body.id ?? "");
        if (!chapterId) return NextResponse.json({ error: "缺少 id" }, { status: 400 });
        const updates: Record<string, unknown> = {};
        for (const key of ["title", "subtitle", "chapter_number", "cover_image", "sort_order", "active"]) {
          if (body[key] !== undefined) updates[key] = body[key];
        }
        const { data, error: err } = await admin
          .from("recipe_story_chapters")
          .update(updates)
          .eq("id", chapterId)
          .eq("recipe_id", recipeId)
          .select("*")
          .single();
        if (err) throw new Error(err.message);
        return NextResponse.json({ chapter: data });
      }

      case "delete_chapter": {
        const chapterId = String(body.id ?? "");
        if (!chapterId) return NextResponse.json({ error: "缺少 id" }, { status: 400 });
        const { error: err } = await admin
          .from("recipe_story_chapters")
          .delete()
          .eq("id", chapterId)
          .eq("recipe_id", recipeId);
        if (err) throw new Error(err.message);
        await logAudit(auth!.profile.id, "delete_story_chapter", "recipe_story_chapter", chapterId, null, null);
        return NextResponse.json({ ok: true });
      }

      case "create_page": {
        const { data, error: err } = await admin
          .from("recipe_story_pages")
          .insert({
            recipe_id: recipeId,
            chapter_id: body.chapter_id || null,
            step_id: body.step_id || null,
            page_type: String(body.page_type ?? "introduction"),
            layout_type: String(body.layout_type ?? "split_image_text"),
            title: body.title ?? null,
            subtitle: body.subtitle ?? null,
            body: body.body ?? null,
            eyebrow: body.eyebrow ?? null,
            alignment: body.alignment ?? "bottom_left",
            content_config: body.content_config ?? {},
            completion_config: body.completion_config ?? {},
            ai_context: body.ai_context ?? null,
            sort_order: Number(body.sort_order ?? 0),
            active: body.active !== false,
          })
          .select("*")
          .single();
        if (err) throw new Error(err.message);
        await logAudit(auth!.profile.id, "create_story_page", "recipe_story_page", data.id, null, data);
        return NextResponse.json({ page: data }, { status: 201 });
      }

      case "update_page": {
        const pageId = String(body.id ?? "");
        if (!pageId) return NextResponse.json({ error: "缺少 id" }, { status: 400 });
        const updates: Record<string, unknown> = {};
        for (const key of [
          "chapter_id",
          "step_id",
          "page_type",
          "layout_type",
          "title",
          "subtitle",
          "body",
          "eyebrow",
          "alignment",
          "content_config",
          "completion_config",
          "ai_context",
          "sort_order",
          "active",
        ]) {
          if (body[key] !== undefined) updates[key] = body[key] === "" ? null : body[key];
        }
        const { data, error: err } = await admin
          .from("recipe_story_pages")
          .update(updates)
          .eq("id", pageId)
          .eq("recipe_id", recipeId)
          .select("*")
          .single();
        if (err) throw new Error(err.message);
        return NextResponse.json({ page: data });
      }

      case "delete_page": {
        const pageId = String(body.id ?? "");
        if (!pageId) return NextResponse.json({ error: "缺少 id" }, { status: 400 });
        const { error: err } = await admin
          .from("recipe_story_pages")
          .delete()
          .eq("id", pageId)
          .eq("recipe_id", recipeId);
        if (err) throw new Error(err.message);
        return NextResponse.json({ ok: true });
      }

      case "duplicate_page": {
        const pageId = String(body.id ?? "");
        if (!pageId) return NextResponse.json({ error: "缺少 id" }, { status: 400 });
        const { data: src, error: fetchErr } = await admin
          .from("recipe_story_pages")
          .select("*, recipe_story_page_media(*)")
          .eq("id", pageId)
          .eq("recipe_id", recipeId)
          .single();
        if (fetchErr || !src) throw new Error(fetchErr?.message ?? "頁面不存在");
        const { data: copy, error: insErr } = await admin
          .from("recipe_story_pages")
          .insert({
            recipe_id: recipeId,
            chapter_id: src.chapter_id,
            step_id: src.step_id,
            page_type: src.page_type,
            layout_type: src.layout_type,
            title: src.title ? `${src.title}（複製）` : "複製頁面",
            subtitle: src.subtitle,
            body: src.body,
            eyebrow: src.eyebrow,
            alignment: src.alignment,
            content_config: src.content_config ?? {},
            completion_config: src.completion_config ?? {},
            ai_context: src.ai_context,
            sort_order: Number(src.sort_order ?? 0) + 1,
            active: src.active,
          })
          .select("*")
          .single();
        if (insErr) throw new Error(insErr.message);
        const medias = src.recipe_story_page_media ?? [];
        if (medias.length) {
          await admin.from("recipe_story_page_media").insert(
            medias.map((m: RecipeStoryPageMedia) => ({
              story_page_id: copy.id,
              media_type: m.media_type,
              source_type: m.source_type,
              url: m.url,
              thumbnail_url: m.thumbnail_url,
              subtitle_url: m.subtitle_url,
              caption: m.caption,
              alt_text: m.alt_text,
              duration_seconds: m.duration_seconds,
              focal_point_x: m.focal_point_x,
              focal_point_y: m.focal_point_y,
              sort_order: m.sort_order,
              active: m.active,
              metadata: m.metadata ?? {},
            }))
          );
        }
        return NextResponse.json({ page: copy }, { status: 201 });
      }

      case "reorder": {
        const chapters = Array.isArray(body.chapters) ? body.chapters : [];
        const pages = Array.isArray(body.pages) ? body.pages : [];
        for (const c of chapters) {
          await admin
            .from("recipe_story_chapters")
            .update({ sort_order: Number(c.sort_order ?? 0) })
            .eq("id", c.id)
            .eq("recipe_id", recipeId);
        }
        for (const p of pages) {
          const updates: Record<string, unknown> = {
            sort_order: Number(p.sort_order ?? 0),
          };
          if (p.chapter_id !== undefined) updates.chapter_id = p.chapter_id || null;
          await admin
            .from("recipe_story_pages")
            .update(updates)
            .eq("id", p.id)
            .eq("recipe_id", recipeId);
        }
        return NextResponse.json({ ok: true });
      }

      case "upsert_media": {
        const pageId = String(body.story_page_id ?? "");
        if (!pageId || !body.url || !body.media_type) {
          return NextResponse.json({ error: "缺少 story_page_id / url / media_type" }, { status: 400 });
        }
        const src = String(body.source_type ?? "upload");
        if (src === "youtube" || src === "vimeo" || src === "external_embed") {
          return NextResponse.json(
            { error: "不可使用 YouTube／Vimeo 連結，請改為後台上傳影片檔案" },
            { status: 400 }
          );
        }
        if (body.media_type === "video" && (String(body.url).includes("youtube") || String(body.url).includes("youtu.be"))) {
          return NextResponse.json(
            { error: "不可使用 YouTube 連結作為食譜影片來源" },
            { status: 400 }
          );
        }
        if (body.id) {
          const { data, error: err } = await admin
            .from("recipe_story_page_media")
            .update({
              media_type: body.media_type,
              source_type: body.source_type ?? "upload",
              url: body.url,
              thumbnail_url: body.thumbnail_url ?? null,
              subtitle_url: body.subtitle_url ?? null,
              caption: body.caption ?? null,
              alt_text: body.alt_text ?? null,
              duration_seconds: body.duration_seconds != null ? Number(body.duration_seconds) : null,
              focal_point_x: body.focal_point_x != null ? Number(body.focal_point_x) : null,
              focal_point_y: body.focal_point_y != null ? Number(body.focal_point_y) : null,
              sort_order: Number(body.sort_order ?? 0),
              active: body.active !== false,
              metadata: body.metadata ?? {},
            })
            .eq("id", body.id)
            .select("*")
            .single();
          if (err) throw new Error(err.message);
          return NextResponse.json({ media: data });
        }
        const { data, error: err } = await admin
          .from("recipe_story_page_media")
          .insert({
            story_page_id: pageId,
            media_type: body.media_type,
            source_type: body.source_type ?? "upload",
            url: body.url,
            thumbnail_url: body.thumbnail_url ?? null,
            subtitle_url: body.subtitle_url ?? null,
            caption: body.caption ?? null,
            alt_text: body.alt_text ?? null,
            duration_seconds: body.duration_seconds != null ? Number(body.duration_seconds) : null,
            focal_point_x: body.focal_point_x != null ? Number(body.focal_point_x) : null,
            focal_point_y: body.focal_point_y != null ? Number(body.focal_point_y) : null,
            sort_order: Number(body.sort_order ?? 0),
            active: body.active !== false,
            metadata: body.metadata ?? {},
          })
          .select("*")
          .single();
        if (err) throw new Error(err.message);
        return NextResponse.json({ media: data }, { status: 201 });
      }

      case "delete_media": {
        const mediaId = String(body.id ?? "");
        if (!mediaId) return NextResponse.json({ error: "缺少 id" }, { status: 400 });
        const { error: err } = await admin.from("recipe_story_page_media").delete().eq("id", mediaId);
        if (err) throw new Error(err.message);
        return NextResponse.json({ ok: true });
      }

      case "replace_tree": {
        // Wipe existing story for recipe then insert provided tree
        await admin.from("recipe_story_chapters").delete().eq("recipe_id", recipeId);
        const tree = Array.isArray(body.chapters) ? body.chapters : [];
        for (let ci = 0; ci < tree.length; ci++) {
          const ch = tree[ci];
          const { data: chapter, error: chErr } = await admin
            .from("recipe_story_chapters")
            .insert({
              recipe_id: recipeId,
              title: String(ch.title ?? `Chapter ${ci + 1}`),
              subtitle: ch.subtitle ?? null,
              chapter_number: ch.chapter_number != null ? Number(ch.chapter_number) : ci + 1,
              cover_image: ch.cover_image ?? null,
              sort_order: Number(ch.sort_order ?? ci),
              active: ch.active !== false,
            })
            .select("id")
            .single();
          if (chErr) throw new Error(chErr.message);
          const pages = Array.isArray(ch.pages) ? ch.pages : [];
          for (let pi = 0; pi < pages.length; pi++) {
            const p = pages[pi];
            const { data: page, error: pErr } = await admin
              .from("recipe_story_pages")
              .insert({
                recipe_id: recipeId,
                chapter_id: chapter.id,
                step_id: p.step_id || null,
                page_type: String(p.page_type ?? "introduction"),
                layout_type: String(p.layout_type ?? "full_bleed"),
                title: p.title ?? null,
                subtitle: p.subtitle ?? null,
                body: p.body ?? null,
                eyebrow: p.eyebrow ?? null,
                alignment: p.alignment ?? "bottom_left",
                content_config: p.content_config ?? {},
                completion_config: p.completion_config ?? {},
                ai_context: p.ai_context ?? null,
                sort_order: Number(p.sort_order ?? pi),
                active: p.active !== false,
              })
              .select("id")
              .single();
            if (pErr) throw new Error(pErr.message);
            const medias = Array.isArray(p.media) ? p.media : [];
            if (medias.length) {
              await admin.from("recipe_story_page_media").insert(
                medias.map((m: Record<string, unknown>, mi: number) => ({
                  story_page_id: page.id,
                  media_type: m.media_type ?? "image",
                  source_type: m.source_type ?? "cdn",
                  url: String(m.url ?? ""),
                  thumbnail_url: m.thumbnail_url ?? null,
                  subtitle_url: m.subtitle_url ?? null,
                  caption: m.caption ?? null,
                  alt_text: m.alt_text ?? null,
                  duration_seconds: m.duration_seconds != null ? Number(m.duration_seconds) : null,
                  focal_point_x: m.focal_point_x != null ? Number(m.focal_point_x) : null,
                  focal_point_y: m.focal_point_y != null ? Number(m.focal_point_y) : null,
                  sort_order: Number(m.sort_order ?? mi),
                  active: m.active !== false,
                  metadata: m.metadata ?? {},
                }))
              );
            }
          }
        }
        const data = await loadStories(recipeId);
        await logAudit(auth!.profile.id, "replace_story_tree", "recipe", recipeId, null, {
          chapters: data.chapters.length,
        });
        return NextResponse.json(data);
      }

      default:
        return NextResponse.json({ error: `未知 action: ${action}` }, { status: 400 });
    }
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "操作失敗" },
      { status: 500 }
    );
  }
}
