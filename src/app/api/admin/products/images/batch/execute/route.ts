import { NextResponse } from "next/server";
import { z } from "zod";
import { requireAdmin, logAudit } from "@/lib/auth";
import { isSupabaseConfigured } from "@/lib/config";
import { createAdminClient } from "@/lib/supabase/admin";
import { defaultAlt, planImageUpdate, type ImageUpdateMode } from "@/lib/admin/product-image-batch";
import { promoteToProductPath } from "@/lib/admin/product-image-batch-server";
import { syncProductImagesTable } from "@/lib/products/sync-product-images";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";
export const maxDuration = 60;

const CHUNK = 8;

const bodySchema = z.object({
  jobId: z.string().uuid(),
  mode: z.enum(["fill_missing", "main_only", "append_gallery", "replace_all"]),
});

export async function POST(request: Request) {
  const { error, auth } = await requireAdmin();
  if (error) return error;
  if (!isSupabaseConfigured()) return NextResponse.json({ error: "未設定資料庫" }, { status: 503 });
  const { jobId, mode } = bodySchema.parse(await request.json());
  const admin = createAdminClient();
  const { data: job } = await admin.from("product_batch_jobs").select("*").eq("id", jobId).maybeSingle();
  if (!job) return NextResponse.json({ error: "找不到作業" }, { status: 404 });

  const matches = ((job.metadata as { matches?: Array<Record<string, unknown>> })?.matches ?? []).filter(
    (m) => m.status === "matched" && m.productId
  );
  const byProduct = new Map<string, Array<{ url: string; sequence: number; fileName: string; path?: string; alt?: string }>>();
  for (const m of matches) {
    const pid = String(m.productId);
    const list = byProduct.get(pid) ?? [];
    list.push({
      url: String(m.url),
      sequence: Number(m.sequence ?? 99),
      fileName: String(m.fileName),
      path: typeof m.path === "string" ? m.path : undefined,
      alt: typeof m.alt === "string" ? m.alt : undefined,
    });
    byProduct.set(pid, list);
  }
  const ids = Array.from(byProduct.keys());
  const cursor = Number((job.metadata as { executeCursor?: number })?.executeCursor ?? 0);
  const slice = ids.slice(cursor, cursor + CHUNK);
  const { data: products } = slice.length
    ? await admin.from("products").select("id, name, sku, image_url, images").in("id", slice)
    : { data: [] };

  await admin.from("product_batch_jobs").update({ status: "writing" }).eq("id", jobId);

  let success = Number(job.success_items ?? 0);
  let failed = Number(job.failed_items ?? 0);
  for (const p of products ?? []) {
    const incoming = byProduct.get(p.id) ?? [];
    const promoted: typeof incoming = [];
    const createdPaths: string[] = [];
    try {
      for (const item of incoming) {
        if (!item.path) {
          promoted.push(item);
          continue;
        }
        const next = await promoteToProductPath(admin, p.id, item.path);
        createdPaths.push(next.path);
        promoted.push({ ...item, url: next.url });
      }
    } catch (e) {
      if (createdPaths.length) await admin.storage.from("product-images").remove(createdPaths);
      failed += 1;
      await admin.from("product_batch_job_items").insert({
        job_id: jobId,
        product_id: p.id,
        status: "error",
        error_message: e instanceof Error ? e.message : "圖片轉檔失敗",
      });
      continue;
    }

    const images = Array.isArray(p.images) ? (p.images as string[]) : [];
    const previous = { image_url: p.image_url, images };
    const plan = planImageUpdate(previous, promoted, mode as ImageUpdateMode);
    const nextImages = [plan.nextMain, ...plan.nextGallery].filter(Boolean) as string[];
    const { error: updErr } = await admin
      .from("products")
      .update({ image_url: plan.nextMain, images: nextImages })
      .eq("id", p.id);
    if (updErr) {
      if (createdPaths.length) await admin.storage.from("product-images").remove(createdPaths);
      failed += 1;
      await admin.from("product_batch_job_items").insert({
        job_id: jobId,
        product_id: p.id,
        status: "error",
        before_data: previous,
        after_data: plan,
        error_message: updErr.message,
      });
      continue;
    }
    const alts = promoted.sort((a, b) => a.sequence - b.sequence);
    await syncProductImagesTable(admin, p.id, {
      mainUrl: plan.nextMain,
      galleryUrls: plan.nextGallery,
      content: [],
      mainAlt: alts.find((a) => a.url === plan.nextMain)?.alt ?? defaultAlt(p.name, 1),
      galleryAlts: plan.nextGallery.map((url, i) => alts.find((a) => a.url === url)?.alt ?? defaultAlt(p.name, i + 2)),
    });
    await admin.from("product_image_versions").insert({
      product_id: p.id,
      batch_job_id: jobId,
      previous_images: previous,
      new_images: { image_url: plan.nextMain, images: nextImages },
    });
    await admin.from("product_batch_job_items").insert({
      job_id: jobId,
      product_id: p.id,
      status: "ok",
      before_data: previous,
      after_data: { image_url: plan.nextMain, images: nextImages },
    });
    success += 1;
  }

  const nextCursor = cursor + slice.length;
  const done = nextCursor >= ids.length;
  const status = done ? (failed === 0 ? "completed" : success === 0 ? "failed" : "partial") : "writing";
  await admin
    .from("product_batch_jobs")
    .update({
      status,
      success_items: success,
      failed_items: failed,
      total_items: ids.length,
      operation_mode: mode,
      completed_at: done ? new Date().toISOString() : null,
      metadata: { ...(job.metadata as object), executeCursor: nextCursor },
    })
    .eq("id", jobId);

  if (done) {
    await logAudit(auth!.profile.id, "update", "product_batch_jobs", jobId, null, { success, failed, mode }, request as never);
  }
  return NextResponse.json({
    jobId,
    status,
    success,
    failed,
    done,
    processed: nextCursor,
    total: ids.length,
  });
}
