import { NextResponse } from "next/server";
import { requireContentAdmin, requireRole } from "@/lib/auth";
import { isSupabaseConfigured } from "@/lib/config";
import { createAdminClient } from "@/lib/supabase/admin";
import {
  RECIPE_VIDEO_BUCKET,
  recipeVideoDirectUploadMaxBytes,
  recipeVideoDirectUploadMaxMb,
} from "@/lib/recipes/video-upload";
import {
  finalizeRecipeVideoUpload,
  initRecipeVideoUpload,
  parseMediaScope,
} from "@/lib/recipes/recipe-media-upload-server";

const IMAGE_MAX_SIZE = 5 * 1024 * 1024;
const ALLOWED_BUCKETS = ["product-images", "recipe-media"] as const;
const ALLOWED_IMAGE_TYPES = ["image/jpeg", "image/png", "image/webp", "image/gif"];

/**
 * Admin file upload.
 * - Default / images: existing behaviour (bucket + folder from form).
 * - purpose=recipe_video: small instructional videos (≤ DIRECT_UPLOAD_MAX) → recipe-media;
 *   path is server-generated; creates/updates recipe_media.
 */
export async function POST(request: Request) {
  if (!isSupabaseConfigured()) {
    return NextResponse.json(
      { error: "未設定 Supabase，請改用圖片網址輸入", fallback: true },
      { status: 503 }
    );
  }

  const formData = await request.formData();
  const purpose = String(formData.get("purpose") ?? "");

  if (purpose === "recipe_video") {
    const { error: authError, auth } = await requireContentAdmin();
    if (authError) return authError;

    const file = formData.get("file");
    if (!(file instanceof File)) {
      return NextResponse.json({ error: "請選擇影片檔案" }, { status: 400 });
    }

    const recipeId = String(formData.get("recipeId") ?? "");
    const scope = parseMediaScope(formData.get("mediaScope") ?? formData.get("scope"));
    if (!recipeId || !scope) {
      return NextResponse.json({ error: "缺少 recipeId 或 mediaScope" }, { status: 400 });
    }

    if (file.size > recipeVideoDirectUploadMaxBytes()) {
      return NextResponse.json(
        {
          error: `檔案超過 ${recipeVideoDirectUploadMaxMb()} MB，請改用大檔 signed upload`,
          code: "USE_SIGNED_UPLOAD",
        },
        { status: 413 }
      );
    }

    const stepId = (formData.get("stepId") as string) || null;
    const chapterId = (formData.get("chapterId") as string) || null;
    const storyPageId = (formData.get("storyPageId") as string) || null;
    const replaceMediaId = (formData.get("replaceMediaId") as string) || null;
    const thumbnailUrl = (formData.get("thumbnailUrl") as string) || null;
    const altText = (formData.get("altText") as string) || null;
    const target =
      String(formData.get("target") ?? "") === "story_page_media"
        ? "story_page_media"
        : "recipe_media";

    const admin = createAdminClient();
    const init = await initRecipeVideoUpload(admin, {
      recipeId,
      scope,
      fileName: file.name,
      mimeType: file.type,
      fileSize: file.size,
      stepId,
      chapterId,
      storyPageId,
      replaceMediaId,
      createDraft: true,
    });

    if ("error" in init && init.error) {
      return NextResponse.json({ error: init.error }, { status: init.status });
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    const { error: uploadError } = await admin.storage
      .from(RECIPE_VIDEO_BUCKET)
      .upload(init.path!, buffer, {
        contentType: init.mimeType,
        upsert: true,
      });

    if (uploadError) {
      await admin
        .from("recipe_media")
        .update({ upload_status: "failed", processing_status: "failed", is_active: false })
        .eq("id", init.mediaId!)
        .eq("recipe_id", recipeId);
      return NextResponse.json({ error: uploadError.message }, { status: 500 });
    }

    const result = await finalizeRecipeVideoUpload(admin, {
      recipeId,
      mediaId: init.mediaId!,
      path: init.path!,
      bucket: RECIPE_VIDEO_BUCKET,
      mimeType: init.mimeType!,
      fileSize: file.size,
      originalFilename: init.originalFilename!,
      scope,
      stepId,
      storyPageId,
      thumbnailUrl,
      altText,
      target,
      activate: true,
    });

    if ("error" in result && result.error) {
      return NextResponse.json({ error: result.error }, { status: result.status });
    }

    void auth;
    return NextResponse.json({
      url: (result.media as { url?: string }).url,
      path: init.path,
      media: result.media,
      kind: result.kind,
      mode: "direct",
    });
  }

  // —— Image / generic upload (unchanged contract) ——
  const { error: authError } = await requireRole([
    "admin",
    "content_editor",
    "customer_service",
    "store_staff",
  ]);
  if (authError) return authError;

  const file = formData.get("file");
  const bucket = (formData.get("bucket") as string) || "product-images";
  const folder = (formData.get("folder") as string) || "";

  if (!(file instanceof File)) {
    return NextResponse.json({ error: "請選擇圖片檔案" }, { status: 400 });
  }

  if (!ALLOWED_BUCKETS.includes(bucket as (typeof ALLOWED_BUCKETS)[number])) {
    return NextResponse.json({ error: "不支援的儲存桶" }, { status: 400 });
  }

  if (!ALLOWED_IMAGE_TYPES.includes(file.type)) {
    return NextResponse.json({ error: "僅支援 JPEG、PNG、WebP、GIF 圖片" }, { status: 400 });
  }

  if (file.size > IMAGE_MAX_SIZE) {
    return NextResponse.json({ error: "圖片大小不可超過 5MB" }, { status: 400 });
  }

  const ext = file.name.split(".").pop()?.toLowerCase() || "jpg";
  const safeName = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;
  const path = folder ? `${folder.replace(/\/$/, "")}/${safeName}` : safeName;

  const admin = createAdminClient();
  const buffer = Buffer.from(await file.arrayBuffer());

  const { error: uploadError } = await admin.storage.from(bucket).upload(path, buffer, {
    contentType: file.type,
    upsert: false,
  });

  if (uploadError) {
    return NextResponse.json({ error: uploadError.message }, { status: 500 });
  }

  const { data: urlData } = admin.storage.from(bucket).getPublicUrl(path);

  return NextResponse.json({ url: urlData.publicUrl, path });
}
