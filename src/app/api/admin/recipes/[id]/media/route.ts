import { NextResponse } from "next/server";
import { requireContentAdmin, logAudit } from "@/lib/auth";
import { isSupabaseConfigured } from "@/lib/config";
import { createAdminClient } from "@/lib/supabase/admin";
import { isWritableSourceType } from "@/lib/recipes/video-upload";

type Params = { params: Promise<{ id: string }> };

function rejectEmbedSource(sourceType: unknown): string | null {
  if (sourceType == null || sourceType === "") return null;
  const s = String(sourceType);
  if (s === "youtube" || s === "vimeo" || s === "external_embed") {
    return "不可使用 YouTube／Vimeo 連結，請改為後台上傳影片檔案";
  }
  if (!isWritableSourceType(s)) {
    return "不支援的影片來源";
  }
  return null;
}

export async function GET(_request: Request, { params }: Params) {
  const { error } = await requireContentAdmin();
  if (error) return error;
  const { id } = await params;
  if (!isSupabaseConfigured()) return NextResponse.json({ media: [] });

  const admin = createAdminClient();
  const { data, error: fetchError } = await admin
    .from("recipe_media")
    .select("*, recipe_video_markers(*)")
    .eq("recipe_id", id)
    .order("sort_order");

  if (fetchError) return NextResponse.json({ error: fetchError.message }, { status: 500 });
  return NextResponse.json({ media: data ?? [] });
}

export async function POST(request: Request, { params }: Params) {
  const { error, auth } = await requireContentAdmin();
  if (error) return error;
  const { id } = await params;
  const body = await request.json();

  if (!body.media_type) {
    return NextResponse.json({ error: "缺少 media_type" }, { status: 400 });
  }
  if (body.media_type === "video" && !body.url) {
    return NextResponse.json(
      { error: "請先透過影片上傳 API 上傳檔案" },
      { status: 400 }
    );
  }
  if (!body.url && body.media_type !== "video") {
    return NextResponse.json({ error: "缺少 url" }, { status: 400 });
  }
  const sourceErr = rejectEmbedSource(body.source_type ?? "upload");
  if (sourceErr) return NextResponse.json({ error: sourceErr }, { status: 400 });

  if (!isSupabaseConfigured()) {
    return NextResponse.json({ media: { id: `media-${Date.now()}`, recipe_id: id, ...body } }, { status: 201 });
  }

  const admin = createAdminClient();
  const { data, error: insertError } = await admin
    .from("recipe_media")
    .insert({
      recipe_id: id,
      step_id: body.step_id || null,
      media_type: body.media_type,
      source_type: body.source_type ?? "upload",
      url: body.url ?? null,
      thumbnail_url: body.thumbnail_url ?? null,
      subtitle_url: body.subtitle_url ?? null,
      aspect_ratio: body.aspect_ratio ?? null,
      duration_seconds: body.duration_seconds != null ? Number(body.duration_seconds) : null,
      start_seconds: body.start_seconds != null ? Number(body.start_seconds) : null,
      end_seconds: body.end_seconds != null ? Number(body.end_seconds) : null,
      storage_bucket: body.storage_bucket ?? null,
      storage_path: body.storage_path ?? null,
      original_filename: body.original_filename ?? null,
      mime_type: body.mime_type ?? null,
      file_size_bytes: body.file_size_bytes != null ? Number(body.file_size_bytes) : null,
      upload_status: body.upload_status ?? "completed",
      processing_status: body.processing_status ?? "ready",
      autoplay: Boolean(body.autoplay),
      muted: body.muted !== false,
      loop: Boolean(body.loop),
      allow_slow_playback: body.allow_slow_playback !== false,
      alt_text: body.alt_text ?? null,
      sort_order: Number(body.sort_order ?? 0),
      is_active: body.is_active !== false,
    })
    .select("*, recipe_video_markers(*)")
    .single();

  if (insertError) return NextResponse.json({ error: insertError.message }, { status: 500 });

  const markers = Array.isArray(body.markers) ? body.markers : [];
  if (markers.length && data?.id) {
    await admin.from("recipe_video_markers").insert(
      markers.map((m: Record<string, unknown>, i: number) => ({
        media_id: data.id,
        time_seconds: Number(m.time_seconds ?? 0),
        title: String(m.title ?? `標記 ${i + 1}`),
        description: m.description ?? null,
        ai_context: m.ai_context ?? null,
        sort_order: Number(m.sort_order ?? i),
      }))
    );
    const { data: refreshed } = await admin
      .from("recipe_media")
      .select("*, recipe_video_markers(*)")
      .eq("id", data.id)
      .single();
    await logAudit(auth!.profile.id, "create_recipe_media", "recipe_media", data.id, null, refreshed);
    return NextResponse.json({ media: refreshed }, { status: 201 });
  }

  await logAudit(auth!.profile.id, "create_recipe_media", "recipe_media", data.id, null, data);
  return NextResponse.json({ media: data }, { status: 201 });
}

export async function PATCH(request: Request, { params }: Params) {
  const { error, auth } = await requireContentAdmin();
  if (error) return error;
  const { id: recipeId } = await params;
  const body = await request.json();
  const mediaId = body.id as string | undefined;
  if (!mediaId) return NextResponse.json({ error: "缺少 media id" }, { status: 400 });

  if (!isSupabaseConfigured()) {
    return NextResponse.json({ media: body });
  }

  const admin = createAdminClient();
  if (body.source_type !== undefined) {
    const sourceErr = rejectEmbedSource(body.source_type);
    if (sourceErr) return NextResponse.json({ error: sourceErr }, { status: 400 });
  }

  const updates: Record<string, unknown> = {};
  for (const key of [
    "step_id",
    "media_type",
    "source_type",
    "url",
    "thumbnail_url",
    "subtitle_url",
    "aspect_ratio",
    "duration_seconds",
    "start_seconds",
    "end_seconds",
    "autoplay",
    "muted",
    "loop",
    "allow_slow_playback",
    "alt_text",
    "sort_order",
    "is_active",
    "processing_status",
    "upload_status",
  ]) {
    if (body[key] !== undefined) updates[key] = body[key] === "" ? null : body[key];
  }

  const { data: old } = await admin.from("recipe_media").select("*").eq("id", mediaId).eq("recipe_id", recipeId).single();
  if (!old) return NextResponse.json({ error: "媒體不存在" }, { status: 404 });

  const { data, error: updateError } = await admin
    .from("recipe_media")
    .update(updates)
    .eq("id", mediaId)
    .eq("recipe_id", recipeId)
    .select("*, recipe_video_markers(*)")
    .single();

  if (updateError) return NextResponse.json({ error: updateError.message }, { status: 500 });

  if (Array.isArray(body.markers)) {
    await admin.from("recipe_video_markers").delete().eq("media_id", mediaId);
    if (body.markers.length) {
      await admin.from("recipe_video_markers").insert(
        body.markers.map((m: Record<string, unknown>, i: number) => ({
          media_id: mediaId,
          time_seconds: Number(m.time_seconds ?? 0),
          title: String(m.title ?? `標記 ${i + 1}`),
          description: m.description ?? null,
          ai_context: m.ai_context ?? null,
          sort_order: Number(m.sort_order ?? i),
        }))
      );
    }
    const { data: refreshed } = await admin
      .from("recipe_media")
      .select("*, recipe_video_markers(*)")
      .eq("id", mediaId)
      .single();
    await logAudit(auth!.profile.id, "update_recipe_media", "recipe_media", mediaId, old, refreshed);
    return NextResponse.json({ media: refreshed });
  }

  await logAudit(auth!.profile.id, "update_recipe_media", "recipe_media", mediaId, old, data);
  return NextResponse.json({ media: data });
}

export async function DELETE(request: Request, { params }: Params) {
  const { error, auth } = await requireContentAdmin();
  if (error) return error;
  const { id: recipeId } = await params;
  const { searchParams } = new URL(request.url);
  const mediaId = searchParams.get("mediaId");
  const force = searchParams.get("force") === "1";
  if (!mediaId) return NextResponse.json({ error: "缺少 mediaId" }, { status: 400 });

  if (!isSupabaseConfigured()) return NextResponse.json({ ok: true });

  const admin = createAdminClient();
  const { data: old } = await admin
    .from("recipe_media")
    .select("*")
    .eq("id", mediaId)
    .eq("recipe_id", recipeId)
    .maybeSingle();
  if (!old) return NextResponse.json({ error: "媒體不存在" }, { status: 404 });

  const { count } = await admin
    .from("recipe_story_page_media")
    .select("id", { count: "exact", head: true })
    .eq("source_media_id", mediaId);

  if ((count ?? 0) > 0 && !force) {
    return NextResponse.json(
      {
        code: "MEDIA_IN_USE",
        error: `這支影片目前被 ${count} 個翻頁頁面使用，請先替換或解除引用。`,
        referenceCount: count,
      },
      { status: 409 }
    );
  }

  if (force && (count ?? 0) > 0) {
    await admin
      .from("recipe_story_page_media")
      .update({ source_media_id: null, active: false })
      .eq("source_media_id", mediaId);
  }

  await admin.from("recipe_video_markers").delete().eq("media_id", mediaId);

  const { error: deleteError } = await admin
    .from("recipe_media")
    .delete()
    .eq("id", mediaId)
    .eq("recipe_id", recipeId);

  if (deleteError) return NextResponse.json({ error: deleteError.message }, { status: 500 });

  if (old.storage_bucket && old.storage_path) {
    await admin.storage.from(old.storage_bucket).remove([old.storage_path]);
  }

  await logAudit(auth!.profile.id, "delete_recipe_media", "recipe_media", mediaId, old, null);
  return NextResponse.json({ ok: true });
}
