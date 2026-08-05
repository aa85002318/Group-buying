import { NextResponse } from "next/server";
import { requireContentAdmin } from "@/lib/auth";
import { isSupabaseConfigured } from "@/lib/config";
import { BRAND_FONT_OPTIONS } from "@/lib/branding/fonts";
import { createAdminClient } from "@/lib/supabase/admin";

const BUCKET = "brand-fonts";
const FONT_MAX = 64 * 1024 * 1024;
const ALLOWED_TYPES = new Set([
  "font/ttf",
  "font/otf",
  "font/woff",
  "font/woff2",
  "application/font-sfnt",
  "application/x-font-ttf",
  "application/octet-stream",
]);

const CATALOG_FILES = new Set(
  BRAND_FONT_OPTIONS.map((f) => f.file).filter(Boolean) as string[]
);

export async function GET() {
  const { error } = await requireContentAdmin();
  if (error) return error;

  if (!isSupabaseConfigured()) {
    return NextResponse.json({ fonts: [], configured: false });
  }

  const admin = createAdminClient();
  const { data, error: listError } = await admin.storage.from(BUCKET).list("", {
    limit: 100,
  });
  if (listError) {
    return NextResponse.json({ error: listError.message }, { status: 500 });
  }

  const uploaded = new Set((data ?? []).map((f) => f.name));
  const fonts = BRAND_FONT_OPTIONS.filter((f) => f.file).map((f) => {
    const name = f.file!;
    const { data: urlData } = admin.storage.from(BUCKET).getPublicUrl(name);
    return {
      id: f.id,
      label: f.label,
      file: name,
      uploaded: uploaded.has(name),
      url: uploaded.has(name) ? urlData.publicUrl : null,
      googleFamily: f.googleFamily ?? null,
    };
  });

  return NextResponse.json({ fonts, configured: true });
}

/** Upload one or more catalog font files into brand-fonts (website / APP / PWA). */
export async function POST(request: Request) {
  const { error } = await requireContentAdmin();
  if (error) return error;

  if (!isSupabaseConfigured()) {
    return NextResponse.json({ error: "未設定 Supabase" }, { status: 503 });
  }

  const formData = await request.formData();
  const files = formData.getAll("file").filter((f): f is File => f instanceof File);
  if (!files.length) {
    return NextResponse.json({ error: "請選擇字型檔案（.ttf / .otf）" }, { status: 400 });
  }

  const admin = createAdminClient();
  const results: Array<{ file: string; ok: boolean; url?: string; error?: string }> = [];

  for (const file of files) {
    const name = file.name.replace(/^.*[\\/]/, "");
    if (!CATALOG_FILES.has(name)) {
      results.push({
        file: name,
        ok: false,
        error: `不在品牌字型清單中（允許：${Array.from(CATALOG_FILES).join(", ")}）`,
      });
      continue;
    }
    if (file.size > FONT_MAX) {
      results.push({ file: name, ok: false, error: "檔案超過 64MB" });
      continue;
    }
    const type = file.type || "application/octet-stream";
    if (type && !ALLOWED_TYPES.has(type) && !name.match(/\.(ttf|otf|woff2?)$/i)) {
      results.push({ file: name, ok: false, error: `不支援的類型：${type}` });
      continue;
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    const { error: uploadError } = await admin.storage.from(BUCKET).upload(name, buffer, {
      contentType: name.endsWith(".otf") ? "font/otf" : "font/ttf",
      upsert: true,
    });
    if (uploadError) {
      results.push({ file: name, ok: false, error: uploadError.message });
      continue;
    }
    const { data: urlData } = admin.storage.from(BUCKET).getPublicUrl(name);
    results.push({ file: name, ok: true, url: urlData.publicUrl });
  }

  const failed = results.filter((r) => !r.ok);
  return NextResponse.json(
    { results },
    { status: failed.length && failed.length === results.length ? 400 : 200 }
  );
}
