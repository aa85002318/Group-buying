import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth";
import { isSupabaseConfigured } from "@/lib/config";
import { createAdminClient } from "@/lib/supabase/admin";
import {
  IMAGE_BATCH_MAX_BYTES,
  ZIP_MAX_BYTES,
  parseSkuImageName,
} from "@/lib/admin/product-image-batch";
import {
  detectImageMime,
  extractZipImages,
  uploadTempImage,
} from "@/lib/admin/product-image-batch-server";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";
export const maxDuration = 60;

type FileEntry = Record<string, unknown>;

export async function POST(request: Request) {
  const { error } = await requireAdmin();
  if (error) return error;
  if (!isSupabaseConfigured()) return NextResponse.json({ error: "未設定資料庫" }, { status: 503 });

  const form = await request.formData();
  const jobId = String(form.get("jobId") ?? "");
  const file = form.get("file");
  if (!jobId || !(file instanceof File)) {
    return NextResponse.json({ error: "缺少作業或檔案" }, { status: 400 });
  }

  const admin = createAdminClient();
  const { data: job } = await admin.from("product_batch_jobs").select("*").eq("id", jobId).maybeSingle();
  if (!job || job.job_type !== "image_upload") {
    return NextResponse.json({ error: "找不到圖片作業" }, { status: 404 });
  }

  const isZip = file.name.toLowerCase().endsWith(".zip") || file.type === "application/zip" || file.type === "application/x-zip-compressed";
  if (isZip && file.size > ZIP_MAX_BYTES) {
    return NextResponse.json({ error: "ZIP 超過部署上限（32MB）" }, { status: 413 });
  }
  if (!isZip && file.size > IMAGE_BATCH_MAX_BYTES) {
    return NextResponse.json({ error: "單張圖片不可超過 10MB" }, { status: 413 });
  }

  const buffer = Buffer.from(await file.arrayBuffer());
  const meta = (job.metadata ?? {}) as { files?: FileEntry[] };
  const files = [...(meta.files ?? [])];

  try {
    const sources = isZip
      ? await extractZipImages(buffer)
      : [{ fileName: file.name, buffer }];

    const uploaded = [];
    const rejected: Array<{ fileName: string; error: string }> = [];
    for (const src of sources) {
      try {
        const mime = detectImageMime(src.buffer);
        if (!mime) {
          rejected.push({ fileName: src.fileName, error: "不是有效圖片" });
          continue;
        }
        const entry = await uploadTempImage(admin, jobId, src.fileName, src.buffer);
        const parsed = parseSkuImageName(src.fileName);
        const row = { ...entry, parsed, status: parsed ? "pending" : "bad_name" };
        files.push(row);
        uploaded.push(row);
      } catch (err) {
        rejected.push({ fileName: src.fileName, error: err instanceof Error ? err.message : "處理失敗" });
      }
    }

    await admin
      .from("product_batch_jobs")
      .update({ status: "uploading", metadata: { ...meta, files } })
      .eq("id", jobId);

    return NextResponse.json({ files: uploaded, rejected });
  } catch (e) {
    return NextResponse.json({ error: e instanceof Error ? e.message : "上傳失敗" }, { status: 400 });
  }
}
