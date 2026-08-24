import { NextResponse } from "next/server";
import { z } from "zod";
import { requireAdmin } from "@/lib/auth";
import { isSupabaseConfigured } from "@/lib/config";
import { createAdminClient } from "@/lib/supabase/admin";
import { parseSkuImageName } from "@/lib/admin/product-image-batch";

export const dynamic = "force-dynamic";

const bodySchema = z.object({
  jobId: z.string().uuid(),
  manual: z
    .array(
      z.object({
        fileName: z.string(),
        productId: z.string().uuid().nullable(),
        sequence: z.number().int().min(1).optional(),
        ignored: z.boolean().optional(),
        unmatched: z.boolean().optional(),
      })
    )
    .optional(),
});

export async function POST(request: Request) {
  const { error } = await requireAdmin();
  if (error) return error;
  if (!isSupabaseConfigured()) return NextResponse.json({ error: "未設定資料庫" }, { status: 503 });
  const parsed = bodySchema.parse(await request.json());
  const admin = createAdminClient();
  const { data: job } = await admin.from("product_batch_jobs").select("*").eq("id", parsed.jobId).maybeSingle();
  if (!job) return NextResponse.json({ error: "找不到作業" }, { status: 404 });

  const files = ((job.metadata as { files?: Array<Record<string, unknown>> })?.files ?? []) as Array<{
    fileName: string;
    url: string;
    path: string;
    width?: number;
    height?: number;
    parsed?: { sku: string; sequence: number; isMain: boolean } | null;
  }>;

  const skus = Array.from(
    new Set(
      files
        .map((f) => f.parsed?.sku ?? parseSkuImageName(f.fileName)?.sku)
        .filter((s): s is string => Boolean(s))
    )
  );
  const { data: products } = skus.length
    ? await admin.from("products").select("id, name, sku, image_url, images").in("sku", skus)
    : { data: [] as Array<{ id: string; name: string; sku: string }> };

  const bySku = new Map((products ?? []).map((p) => [String(p.sku), p]));
  const seqSeen = new Map<string, string>();
  const matches = files.map((file) => {
    const manual = parsed.manual?.find((m) => m.fileName === file.fileName);
    if (manual?.ignored) {
      return { ...file, status: "ignored" as const, productId: null, reason: "已忽略" };
    }
    if (manual?.unmatched) {
      return { ...file, status: "pending" as const, productId: null, reason: "待手動配對" };
    }
    if (manual?.productId) {
      return {
        ...file,
        status: "matched" as const,
        productId: manual.productId,
        sequence: manual.sequence ?? file.parsed?.sequence ?? 99,
      };
    }
    const info = file.parsed ?? parseSkuImageName(file.fileName);
    if (!info) {
      return { ...file, status: "bad_name" as const, productId: null, reason: "檔名格式錯誤" };
    }
    const key = `${info.sku}_${String(info.sequence).padStart(2, "0")}`;
    if (seqSeen.has(key)) {
      return { ...file, status: "duplicate" as const, productId: null, reason: "重複序號圖片" };
    }
    seqSeen.set(key, file.fileName);
    const product = bySku.get(info.sku);
    if (!product) {
      return { ...file, status: "sku_missing" as const, productId: null, reason: "SKU 不存在", sku: info.sku };
    }
    if (file.width && file.height && Number(file.width) < 200 && Number(file.height) < 200) {
      return { ...file, status: "too_small" as const, productId: product.id, productName: product.name, sku: info.sku, reason: "圖片尺寸不足" };
    }
    return {
      ...file,
      status: "matched" as const,
      productId: product.id,
      productName: product.name,
      sku: info.sku,
      sequence: info.sequence,
    };
  });

  await admin
    .from("product_batch_jobs")
    .update({ status: "processing", metadata: { ...(job.metadata as object), files, matches } })
    .eq("id", parsed.jobId);

  return NextResponse.json({ matches, products: products ?? [] });
}
