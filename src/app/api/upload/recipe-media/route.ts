import { NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth";
import { isSupabaseConfigured } from "@/lib/config";
import { rateLimit } from "@/lib/security/rateLimit";
import { createAdminClient } from "@/lib/supabase/admin";

const MAX_SIZE = 10 * 1024 * 1024;
const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp"];

/** Member upload for recipe discussion / submission images → recipe-media bucket */
export async function POST(request: Request) {
  const ip = request.headers.get("x-forwarded-for") ?? "anon";
  const rl = rateLimit(`recipe-upload:${ip}`, 30, 60_000);
  if (!rl.ok) {
    return NextResponse.json({ error: "請求過於頻繁，請稍後再試" }, { status: 429 });
  }

  const { error: authError, auth } = await requireAuth();
  if (authError) return authError;

  if (!isSupabaseConfigured()) {
    return NextResponse.json(
      { error: "未設定儲存空間，請改用圖片網址", fallback: true },
      { status: 503 }
    );
  }

  const formData = await request.formData();
  const file = formData.get("file");
  const folderRaw = String(formData.get("folder") ?? "submissions");
  const folder = folderRaw === "discussions" ? "discussions" : "submissions";

  if (!(file instanceof File)) {
    return NextResponse.json({ error: "請選擇圖片檔案" }, { status: 400 });
  }
  if (!ALLOWED_TYPES.includes(file.type)) {
    return NextResponse.json({ error: "僅支援 JPEG、PNG、WebP" }, { status: 400 });
  }
  if (file.size > MAX_SIZE) {
    return NextResponse.json({ error: "圖片不可超過 10MB" }, { status: 400 });
  }

  const ext = file.name.split(".").pop()?.toLowerCase() || "jpg";
  const safeName = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;
  const path = `${folder}/${auth!.profile.id}/${safeName}`;

  const admin = createAdminClient();
  const buffer = Buffer.from(await file.arrayBuffer());
  const { error: uploadError } = await admin.storage.from("recipe-media").upload(path, buffer, {
    contentType: file.type,
    upsert: false,
  });

  if (uploadError) {
    return NextResponse.json({ error: uploadError.message }, { status: 500 });
  }

  const { data: urlData } = admin.storage.from("recipe-media").getPublicUrl(path);
  return NextResponse.json({ url: urlData.publicUrl, path });
}
