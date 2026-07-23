import { NextResponse } from "next/server";
import { requireContentAdmin, logAudit } from "@/lib/auth";
import { isSupabaseConfigured } from "@/lib/config";
import { createAdminClient } from "@/lib/supabase/admin";
import {
  finalizeRecipeVideoUpload,
  parseMediaScope,
} from "@/lib/recipes/recipe-media-upload-server";

type Params = { params: Promise<{ id: string }> };

/**
 * Confirm Storage object exists and mark recipe_media ready.
 * Called after browser finished signed upload (or after small direct upload path).
 */
export async function POST(request: Request, { params }: Params) {
  const { error, auth } = await requireContentAdmin();
  if (error) return error;
  const { id: recipeId } = await params;

  if (!isSupabaseConfigured()) {
    return NextResponse.json({ error: "未設定 Supabase" }, { status: 503 });
  }

  const body = await request.json().catch(() => null);
  if (!body || typeof body !== "object") {
    return NextResponse.json({ error: "無效請求" }, { status: 400 });
  }

  const scope = parseMediaScope((body as { mediaScope?: string }).mediaScope);
  if (!scope) {
    return NextResponse.json({ error: "無效的 mediaScope" }, { status: 400 });
  }

  const mediaId = String((body as { mediaId?: string }).mediaId ?? "");
  const path = String((body as { path?: string }).path ?? "");
  const bucket = String((body as { bucket?: string }).bucket ?? "");
  const mimeType = String((body as { mimeType?: string }).mimeType ?? "");
  const fileSize = Number((body as { fileSize?: number }).fileSize ?? 0);
  const originalFilename = String(
    (body as { originalFilename?: string }).originalFilename ?? ""
  );

  if (!mediaId || !path) {
    return NextResponse.json({ error: "缺少 mediaId 或 path" }, { status: 400 });
  }

  const admin = createAdminClient();
  const result = await finalizeRecipeVideoUpload(admin, {
    recipeId,
    mediaId,
    path,
    bucket: bucket || undefined,
    mimeType,
    fileSize,
    originalFilename,
    scope,
    stepId: ((body as { stepId?: string | null }).stepId as string | null) || null,
    storyPageId:
      ((body as { storyPageId?: string | null }).storyPageId as string | null) || null,
    thumbnailUrl:
      ((body as { thumbnailUrl?: string | null }).thumbnailUrl as string | null) || null,
    altText: ((body as { altText?: string | null }).altText as string | null) || null,
    startSeconds:
      (body as { startSeconds?: number | null }).startSeconds != null
        ? Number((body as { startSeconds?: number }).startSeconds)
        : null,
    endSeconds:
      (body as { endSeconds?: number | null }).endSeconds != null
        ? Number((body as { endSeconds?: number }).endSeconds)
        : null,
    sortOrder: Number((body as { sortOrder?: number }).sortOrder ?? 0),
    target:
      ((body as { target?: string }).target as string) === "story_page_media"
        ? "story_page_media"
        : "recipe_media",
    activate: (body as { activate?: boolean }).activate !== false,
  });

  if ("error" in result && result.error) {
    return NextResponse.json({ error: result.error }, { status: result.status });
  }

  await logAudit(
    auth!.profile.id,
    "finalize_recipe_video",
    result.kind === "story_page_media" ? "recipe_story_page_media" : "recipe_media",
    (result.media as { id: string }).id,
    null,
    result.media
  );

  return NextResponse.json(
    { media: result.media, kind: result.kind },
    { status: result.kind === "story_page_media" ? 201 : 200 }
  );
}
