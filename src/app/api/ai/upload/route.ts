import { requireAuth } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/admin";
import { isSupabaseConfigured } from "@/lib/config";
import { rateLimit } from "@/lib/security/rateLimit";
import { getAISettings } from "@/lib/ai/settings";
import { aiError, aiOk } from "@/lib/ai/response";

const BUCKET = "ai-failure-photos";
const ALLOWED = ["image/jpeg", "image/png", "image/webp"];

/** Private upload — returns a short-lived signed URL, never a public permalink. */
export async function POST(request: Request) {
  const ip = request.headers.get("x-forwarded-for") ?? "anon";
  const rl = rateLimit(`ai-upload:${ip}`, 10, 60_000);
  if (!rl.ok) {
    return aiError("VALIDATION", "圖片上傳過於頻繁，請稍後再試。", { status: 429, retryable: true });
  }

  const { error, auth } = await requireAuth();
  if (error) {
    return aiError("UNAUTHORIZED", "請先登入後再上傳失敗照片。", { status: 401 });
  }
  if (!isSupabaseConfigured()) {
    return aiError("AI_UNAVAILABLE", "圖片上傳失敗，請改以文字描述症狀。", {
      status: 503,
      retryable: true,
    });
  }

  const settings = await getAISettings();
  const form = await request.formData();
  const file = form.get("file");
  if (!(file instanceof File)) {
    return aiError("VALIDATION", "請選擇圖片檔案", { status: 400 });
  }
  if (!ALLOWED.includes(file.type)) {
    return aiError("VALIDATION", "僅支援 JPEG、PNG、WebP", { status: 400 });
  }
  if (file.size > settings.maxImageBytes) {
    return aiError("VALIDATION", "圖片太大，請壓縮後再上傳。", { status: 400 });
  }

  const ext = file.name.split(".").pop()?.toLowerCase() || "jpg";
  const path = `${auth!.profile.id}/${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;
  const admin = createAdminClient();
  const buffer = Buffer.from(await file.arrayBuffer());
  const { error: uploadError } = await admin.storage.from(BUCKET).upload(path, buffer, {
    contentType: file.type,
    upsert: false,
  });
  if (uploadError) {
    return aiError("AI_UNAVAILABLE", "圖片上傳失敗，請改以文字描述症狀。", {
      status: 500,
      retryable: true,
    });
  }

  const { data: signed } = await admin.storage.from(BUCKET).createSignedUrl(path, 60 * 60);
  return aiOk({
    path,
    previewUrl: signed?.signedUrl ?? null,
    expiresIn: 3600,
  });
}
