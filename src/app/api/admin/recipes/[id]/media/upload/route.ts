import { NextResponse } from "next/server";
import { requireContentAdmin } from "@/lib/auth";
import { isSupabaseConfigured } from "@/lib/config";
import { createAdminClient } from "@/lib/supabase/admin";
import { RECIPE_VIDEO_BUCKET } from "@/lib/recipes/video-upload";
import {
  finalizeRecipeVideoUpload,
  initRecipeVideoUpload,
  parseMediaScope,
} from "@/lib/recipes/recipe-media-upload-server";

type Params = { params: Promise<{ id: string }> };

/**
 * @deprecated Prefer:
 * - small: POST /api/admin/upload (purpose=recipe_video)
 * - large: POST …/media/signed-upload then …/media/finalize
 *
 * Kept as a thin compatibility wrapper for older admin clients.
 */
export async function POST(request: Request, { params }: Params) {
  const { error } = await requireContentAdmin();
  if (error) return error;
  const { id: recipeId } = await params;

  if (!isSupabaseConfigured()) {
    return NextResponse.json({ error: "未設定 Supabase，無法上傳影片" }, { status: 503 });
  }

  const body = await request.json().catch(() => null);
  if (!body || typeof body !== "object") {
    return NextResponse.json({ error: "無效請求" }, { status: 400 });
  }

  const action = String((body as { action?: string }).action ?? "");
  const admin = createAdminClient();

  if (action === "init") {
    const scope = parseMediaScope((body as { mediaScope?: string }).mediaScope);
    if (!scope) return NextResponse.json({ error: "無效的 mediaScope" }, { status: 400 });

    const init = await initRecipeVideoUpload(admin, {
      recipeId,
      scope,
      fileName: String((body as { fileName?: string }).fileName ?? ""),
      mimeType: String((body as { mimeType?: string }).mimeType ?? ""),
      fileSize: Number((body as { fileSize?: number }).fileSize ?? 0),
      stepId: ((body as { stepId?: string | null }).stepId as string | null) || null,
      chapterId: ((body as { chapterId?: string | null }).chapterId as string | null) || null,
      storyPageId:
        ((body as { storyPageId?: string | null }).storyPageId as string | null) || null,
      replaceMediaId:
        ((body as { replaceMediaId?: string | null }).replaceMediaId as string | null) ||
        null,
      createDraft: true,
    });
    if ("error" in init && init.error) {
      return NextResponse.json({ error: init.error }, { status: init.status });
    }

    const { data: signed, error: signError } = await admin.storage
      .from(RECIPE_VIDEO_BUCKET)
      .createSignedUploadUrl(init.path!);
    if (signError || !signed) {
      return NextResponse.json(
        { error: signError?.message ?? "無法建立上傳連結" },
        { status: 500 }
      );
    }
    const { data: pub } = admin.storage.from(RECIPE_VIDEO_BUCKET).getPublicUrl(init.path!);
    return NextResponse.json({
      mediaId: init.mediaId,
      bucket: RECIPE_VIDEO_BUCKET,
      path: init.path,
      token: signed.token,
      signedUrl: signed.signedUrl,
      publicUrl: pub.publicUrl,
      mimeType: init.mimeType,
      originalFilename: init.originalFilename,
      movHint: init.movHint,
    });
  }

  if (action === "complete") {
    const scope = parseMediaScope((body as { mediaScope?: string }).mediaScope);
    if (!scope) return NextResponse.json({ error: "無效的 mediaScope" }, { status: 400 });
    const result = await finalizeRecipeVideoUpload(admin, {
      recipeId,
      mediaId: String((body as { mediaId?: string }).mediaId ?? ""),
      path: String((body as { path?: string }).path ?? ""),
      bucket: String((body as { bucket?: string }).bucket ?? RECIPE_VIDEO_BUCKET),
      mimeType: String((body as { mimeType?: string }).mimeType ?? ""),
      fileSize: Number((body as { fileSize?: number }).fileSize ?? 0),
      originalFilename: String(
        (body as { originalFilename?: string }).originalFilename ?? ""
      ),
      scope,
      stepId: ((body as { stepId?: string | null }).stepId as string | null) || null,
      storyPageId:
        ((body as { storyPageId?: string | null }).storyPageId as string | null) || null,
      thumbnailUrl:
        ((body as { thumbnailUrl?: string | null }).thumbnailUrl as string | null) || null,
      altText: ((body as { altText?: string | null }).altText as string | null) || null,
      target:
        ((body as { target?: string }).target as string) === "story_page_media"
          ? "story_page_media"
          : "recipe_media",
      sortOrder: Number((body as { sortOrder?: number }).sortOrder ?? 0),
      activate: true,
    });
    if ("error" in result && result.error) {
      return NextResponse.json({ error: result.error }, { status: result.status });
    }
    return NextResponse.json({ media: result.media, kind: result.kind }, { status: 201 });
  }

  if (action === "abort") {
    const path = String((body as { path?: string }).path ?? "");
    if (path.startsWith(`recipes/${recipeId}/`)) {
      await admin.storage.from(RECIPE_VIDEO_BUCKET).remove([path]);
    }
    return NextResponse.json({ ok: true });
  }

  return NextResponse.json(
    {
      error:
        "請改用 /media/signed-upload + /media/finalize，或 /api/admin/upload?purpose=recipe_video",
    },
    { status: 400 }
  );
}
