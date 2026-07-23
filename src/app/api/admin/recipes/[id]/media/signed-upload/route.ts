import { NextResponse } from "next/server";
import { requireContentAdmin, logAudit } from "@/lib/auth";
import { isSupabaseConfigured } from "@/lib/config";
import { createAdminClient } from "@/lib/supabase/admin";
import { RECIPE_VIDEO_BUCKET, recipeVideoMaxMb } from "@/lib/recipes/video-upload";
import {
  initRecipeVideoUpload,
  parseMediaScope,
} from "@/lib/recipes/recipe-media-upload-server";

type Params = { params: Promise<{ id: string }> };

/**
 * Initialize signed upload for large recipe videos.
 * Browser uploads bytes directly to Supabase Storage (not through Next.js).
 */
export async function POST(request: Request, { params }: Params) {
  const { error, auth } = await requireContentAdmin();
  if (error) return error;
  const { id: recipeId } = await params;

  if (!isSupabaseConfigured()) {
    return NextResponse.json({ error: "未設定 Supabase，無法上傳影片" }, { status: 503 });
  }

  const body = await request.json().catch(() => null);
  if (!body || typeof body !== "object") {
    return NextResponse.json({ error: "無效請求" }, { status: 400 });
  }

  const scope = parseMediaScope(
    (body as { mediaScope?: string }).mediaScope ??
      (body as { scope?: string }).scope
  );
  if (!scope) {
    return NextResponse.json({ error: "無效的 mediaScope" }, { status: 400 });
  }

  const fileName = String(
    (body as { filename?: string; fileName?: string }).filename ??
      (body as { fileName?: string }).fileName ??
      ""
  );
  const mimeType = String((body as { mimeType?: string }).mimeType ?? "");
  const fileSize = Number((body as { fileSize?: number }).fileSize ?? 0);
  const stepId = ((body as { stepId?: string | null }).stepId as string | null) || null;
  const chapterId =
    ((body as { chapterId?: string | null }).chapterId as string | null) || null;
  const storyPageId =
    ((body as { storyPageId?: string | null }).storyPageId as string | null) || null;
  const replaceMediaId =
    ((body as { replaceMediaId?: string | null }).replaceMediaId as string | null) ||
    null;

  const admin = createAdminClient();
  const init = await initRecipeVideoUpload(admin, {
    recipeId,
    scope,
    fileName,
    mimeType,
    fileSize,
    stepId,
    chapterId,
    storyPageId,
    replaceMediaId,
    createDraft: true,
  });

  if ("error" in init && init.error) {
    return NextResponse.json({ error: init.error }, { status: init.status });
  }

  const { data: signed, error: signError } = await admin.storage
    .from(RECIPE_VIDEO_BUCKET)
    .createSignedUploadUrl(init.path!);

  if (signError || !signed) {
    await admin
      .from("recipe_media")
      .update({ upload_status: "failed", processing_status: "failed", is_active: false })
      .eq("id", init.mediaId!)
      .eq("recipe_id", recipeId);
    return NextResponse.json(
      { error: signError?.message ?? "無法建立上傳連結" },
      { status: 500 }
    );
  }

  const { data: pub } = admin.storage.from(RECIPE_VIDEO_BUCKET).getPublicUrl(init.path!);

  await logAudit(
    auth!.profile.id,
    "init_recipe_video_signed_upload",
    "recipe_media",
    init.mediaId!,
    null,
    { path: init.path, scope, fileSize }
  );

  return NextResponse.json({
    mediaId: init.mediaId,
    mediaDraftId: init.mediaId,
    bucket: RECIPE_VIDEO_BUCKET,
    path: init.path,
    token: signed.token,
    signedUrl: signed.signedUrl,
    publicUrl: pub.publicUrl,
    maxSizeMb: recipeVideoMaxMb(scope),
    mimeType: init.mimeType,
    originalFilename: init.originalFilename,
    movHint: init.movHint,
  });
}
