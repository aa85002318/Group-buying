import { randomUUID } from "crypto";
import type { SupabaseClient } from "@supabase/supabase-js";
import {
  RECIPE_VIDEO_BUCKET,
  buildRecipeVideoStoragePath,
  recipeVideoDirectUploadMaxBytes,
  validateRecipeVideoFile,
  type RecipeVideoMediaScope,
} from "@/lib/recipes/video-upload";

export const SCOPES = new Set<RecipeVideoMediaScope>([
  "recipe_full",
  "chapter",
  "step",
  "story_page",
]);

export function parseMediaScope(value: unknown): RecipeVideoMediaScope | null {
  if (typeof value !== "string") return null;
  return SCOPES.has(value as RecipeVideoMediaScope)
    ? (value as RecipeVideoMediaScope)
    : null;
}

export async function assertRecipeOwned(
  admin: SupabaseClient,
  recipeId: string
): Promise<boolean> {
  const { data } = await admin.from("recipes").select("id").eq("id", recipeId).maybeSingle();
  return Boolean(data);
}

export async function assertStepOwned(
  admin: SupabaseClient,
  recipeId: string,
  stepId: string
): Promise<boolean> {
  const { data } = await admin
    .from("recipe_steps")
    .select("id")
    .eq("id", stepId)
    .eq("recipe_id", recipeId)
    .maybeSingle();
  return Boolean(data);
}

export async function assertStoryPageOwned(
  admin: SupabaseClient,
  recipeId: string,
  storyPageId: string
): Promise<boolean> {
  const { data } = await admin
    .from("recipe_story_pages")
    .select("id")
    .eq("id", storyPageId)
    .eq("recipe_id", recipeId)
    .maybeSingle();
  return Boolean(data);
}

export async function assertChapterOwned(
  admin: SupabaseClient,
  recipeId: string,
  chapterId: string
): Promise<boolean> {
  const { data } = await admin
    .from("recipe_story_chapters")
    .select("id")
    .eq("id", chapterId)
    .eq("recipe_id", recipeId)
    .maybeSingle();
  return Boolean(data);
}

export async function storageObjectExists(
  admin: SupabaseClient,
  bucket: string,
  path: string
): Promise<boolean> {
  const folder = path.includes("/") ? path.slice(0, path.lastIndexOf("/")) : "";
  const fileNameOnly = path.slice(path.lastIndexOf("/") + 1);
  const { data: listed } = await admin.storage.from(bucket).list(folder, {
    search: fileNameOnly,
    limit: 20,
  });
  if ((listed ?? []).some((f) => f.name === fileNameOnly)) return true;
  const { error } = await admin.storage.from(bucket).createSignedUrl(path, 30);
  return !error;
}

export type InitUploadContext = {
  recipeId: string;
  scope: RecipeVideoMediaScope;
  fileName: string;
  mimeType: string;
  fileSize: number;
  stepId?: string | null;
  chapterId?: string | null;
  storyPageId?: string | null;
  replaceMediaId?: string | null;
  /** Create inactive draft row so finalize can match path. */
  createDraft?: boolean;
};

export async function initRecipeVideoUpload(
  admin: SupabaseClient,
  ctx: InitUploadContext
) {
  const validated = validateRecipeVideoFile({
    fileName: ctx.fileName,
    mimeType: ctx.mimeType,
    fileSize: ctx.fileSize,
    scope: ctx.scope,
  });
  if (!validated.ok) {
    return { error: validated.error, status: 400 as const };
  }

  if (!(await assertRecipeOwned(admin, ctx.recipeId))) {
    return { error: "食譜不存在", status: 404 as const };
  }
  if (ctx.scope === "step") {
    if (!ctx.stepId || !(await assertStepOwned(admin, ctx.recipeId, ctx.stepId))) {
      return { error: "步驟不存在或不屬於此食譜", status: 400 as const };
    }
  }
  if (ctx.scope === "story_page" && ctx.storyPageId) {
    if (!(await assertStoryPageOwned(admin, ctx.recipeId, ctx.storyPageId))) {
      return { error: "Story 頁不存在或不屬於此食譜", status: 400 as const };
    }
  }
  if (ctx.scope === "chapter") {
    if (!ctx.chapterId || !(await assertChapterOwned(admin, ctx.recipeId, ctx.chapterId))) {
      return { error: "章節不存在或不屬於此食譜", status: 400 as const };
    }
  }

  let mediaId = ctx.replaceMediaId || randomUUID();
  if (ctx.replaceMediaId) {
    const { data: existing } = await admin
      .from("recipe_media")
      .select("id, storage_path, storage_bucket")
      .eq("id", ctx.replaceMediaId)
      .eq("recipe_id", ctx.recipeId)
      .maybeSingle();
    if (!existing) {
      return { error: "要替換的媒體不存在", status: 404 as const };
    }
  }

  const path = buildRecipeVideoStoragePath({
    recipeId: ctx.recipeId,
    mediaId,
    scope: ctx.scope,
    ext: validated.ext,
    stepId: ctx.stepId,
    chapterId: ctx.chapterId,
    storyPageId: ctx.storyPageId,
  });

  if (ctx.createDraft !== false) {
    const draftPayload = {
      recipe_id: ctx.recipeId,
      step_id: ctx.stepId ?? null,
      story_page_id: ctx.storyPageId ?? null,
      media_type: "video" as const,
      source_type: "upload" as const,
      url: null,
      thumbnail_url: null,
      alt_text: validated.safeOriginal,
      sort_order: 0,
      is_active: false,
      autoplay: false,
      muted: true,
      loop: false,
      allow_slow_playback: true,
      storage_bucket: RECIPE_VIDEO_BUCKET,
      storage_path: path,
      original_filename: validated.safeOriginal,
      mime_type: validated.mime,
      file_size_bytes: ctx.fileSize,
      upload_status: "uploading",
      processing_status: "processing",
      upload_metadata: {
        init_at: new Date().toISOString(),
        scope: ctx.scope,
        expected_path: path,
      },
    };

    if (ctx.replaceMediaId) {
      const { error } = await admin
        .from("recipe_media")
        .update(draftPayload)
        .eq("id", mediaId)
        .eq("recipe_id", ctx.recipeId);
      if (error) return { error: error.message, status: 500 as const };
    } else {
      const { data, error } = await admin
        .from("recipe_media")
        .insert({ id: mediaId, ...draftPayload })
        .select("id")
        .single();
      if (error) return { error: error.message, status: 500 as const };
      mediaId = data.id as string;
    }
  }

  return {
    mediaId,
    bucket: RECIPE_VIDEO_BUCKET,
    path,
    mimeType: validated.mime,
    originalFilename: validated.safeOriginal,
    movHint: validated.movHint,
    fileSize: ctx.fileSize,
    useSigned: ctx.fileSize > recipeVideoDirectUploadMaxBytes(),
  };
}

export type FinalizeInput = {
  recipeId: string;
  mediaId: string;
  path: string;
  bucket?: string;
  mimeType: string;
  fileSize: number;
  originalFilename: string;
  scope: RecipeVideoMediaScope;
  stepId?: string | null;
  storyPageId?: string | null;
  thumbnailUrl?: string | null;
  altText?: string | null;
  startSeconds?: number | null;
  endSeconds?: number | null;
  sortOrder?: number;
  target?: "recipe_media" | "story_page_media";
  activate?: boolean;
};

export async function finalizeRecipeVideoUpload(
  admin: SupabaseClient,
  input: FinalizeInput
) {
  const bucket = input.bucket || RECIPE_VIDEO_BUCKET;
  if (bucket !== RECIPE_VIDEO_BUCKET) {
    return { error: "不支援的 bucket", status: 400 as const };
  }
  if (!input.path.startsWith(`recipes/${input.recipeId}/`)) {
    return { error: "非法 Storage 路徑", status: 400 as const };
  }

  const validated = validateRecipeVideoFile({
    fileName: input.originalFilename || "video.mp4",
    mimeType: input.mimeType,
    fileSize: input.fileSize,
    scope: input.scope,
  });
  if (!validated.ok) {
    return { error: validated.error, status: 400 as const };
  }

  const exists = await storageObjectExists(admin, bucket, input.path);
  if (!exists) {
    await admin
      .from("recipe_media")
      .update({
        upload_status: "failed",
        processing_status: "failed",
        is_active: false,
      })
      .eq("id", input.mediaId)
      .eq("recipe_id", input.recipeId);
    return { error: "找不到已上傳檔案，請重新上傳", status: 400 as const };
  }

  const { data: pub } = admin.storage.from(bucket).getPublicUrl(input.path);

  if (input.target === "story_page_media") {
    if (!input.storyPageId) {
      return { error: "缺少 storyPageId", status: 400 as const };
    }
    const { data, error } = await admin
      .from("recipe_story_page_media")
      .insert({
        story_page_id: input.storyPageId,
        media_type: "video",
        source_type: "upload",
        url: pub.publicUrl,
        thumbnail_url: input.thumbnailUrl ?? null,
        alt_text: input.altText ?? validated.safeOriginal,
        caption: input.altText ?? validated.safeOriginal,
        sort_order: input.sortOrder ?? 0,
        active: input.activate !== false,
        storage_bucket: bucket,
        storage_path: input.path,
        original_filename: validated.safeOriginal,
        mime_type: validated.mime,
        file_size_bytes: input.fileSize,
        start_seconds: input.startSeconds ?? null,
        end_seconds: input.endSeconds ?? null,
        source_media_id: input.mediaId,
        upload_status: "completed",
        processing_status: "ready",
        upload_metadata: { finalized_at: new Date().toISOString() },
        metadata: {
          start_seconds: input.startSeconds ?? null,
          end_seconds: input.endSeconds ?? null,
        },
      })
      .select("*")
      .single();
    if (error) return { error: error.message, status: 500 as const };

    // Also mark recipe_media draft ready if present
    await admin
      .from("recipe_media")
      .update({
        url: pub.publicUrl,
        storage_bucket: bucket,
        storage_path: input.path,
        mime_type: validated.mime,
        file_size_bytes: input.fileSize,
        original_filename: validated.safeOriginal,
        upload_status: "completed",
        processing_status: "ready",
        is_active: input.activate !== false,
        is_demo: false,
        seed_key: null,
        upload_metadata: { finalized_at: new Date().toISOString() },
      })
      .eq("id", input.mediaId)
      .eq("recipe_id", input.recipeId);

    return { media: data, kind: "story_page_media" as const };
  }

  const { data: old } = await admin
    .from("recipe_media")
    .select("*")
    .eq("id", input.mediaId)
    .eq("recipe_id", input.recipeId)
    .maybeSingle();

  if (!old) {
    return { error: "媒體草稿不存在，請重新取得上傳權限", status: 404 as const };
  }

  if (old.storage_path && old.storage_path !== input.path) {
    // Path must match init
    if (
      old.upload_metadata &&
      typeof old.upload_metadata === "object" &&
      (old.upload_metadata as { expected_path?: string }).expected_path &&
      (old.upload_metadata as { expected_path?: string }).expected_path !== input.path
    ) {
      return { error: "Storage path 與初始化紀錄不一致", status: 400 as const };
    }
  }

  const previousPath =
    old.storage_path && old.storage_path !== input.path ? old.storage_path : null;
  const previousBucket = old.storage_bucket || RECIPE_VIDEO_BUCKET;

  const { data, error } = await admin
    .from("recipe_media")
    .update({
      step_id: input.stepId ?? old.step_id,
      story_page_id: input.storyPageId ?? old.story_page_id,
      media_type: "video",
      source_type: "upload",
      url: pub.publicUrl,
      thumbnail_url: input.thumbnailUrl ?? old.thumbnail_url,
      alt_text: input.altText ?? old.alt_text ?? validated.safeOriginal,
      storage_bucket: bucket,
      storage_path: input.path,
      original_filename: validated.safeOriginal,
      mime_type: validated.mime,
      file_size_bytes: input.fileSize,
      start_seconds: input.startSeconds ?? old.start_seconds,
      end_seconds: input.endSeconds ?? old.end_seconds,
      upload_status: "completed",
      processing_status: "ready",
      is_active: input.activate !== false,
      is_demo: false,
      seed_key: null,
      upload_metadata: {
        ...(typeof old.upload_metadata === "object" && old.upload_metadata
          ? old.upload_metadata
          : {}),
        finalized_at: new Date().toISOString(),
      },
    })
    .eq("id", input.mediaId)
    .eq("recipe_id", input.recipeId)
    .select("*, recipe_video_markers(*)")
    .single();

  if (error) return { error: error.message, status: 500 as const };

  if (previousPath) {
    await admin.storage.from(previousBucket).remove([previousPath]);
  }

  return { media: data, kind: "recipe_media" as const };
}
