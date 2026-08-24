import { NextResponse } from "next/server";
import { requireAdmin, logAudit } from "@/lib/auth";
import { isSupabaseConfigured } from "@/lib/config";
import { createAdminClient } from "@/lib/supabase/admin";
import { syncProductCategories } from "@/lib/services/productRelations";
import { hasEnabledPatch, type ProductBatchPatch } from "@/lib/admin/product-batch";
import { previewBatch, productBatchBodySchema } from "@/lib/admin/product-batch-preview";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  const { error, auth } = await requireAdmin();
  if (error) return error;
  if (!isSupabaseConfigured()) {
    return NextResponse.json({ error: "未設定資料庫" }, { status: 503 });
  }

  try {
    const parsed = productBatchBodySchema.parse(await request.json());
    const runMode = parsed.runMode ?? "all_or_nothing";
    const patch = parsed.patch as ProductBatchPatch;
    if (!hasEnabledPatch(patch)) {
      return NextResponse.json({ error: "請至少啟用一個修改欄位" }, { status: 400 });
    }

    const preview = await previewBatch(parsed.productIds, patch);
    if (runMode === "all_or_nothing" && preview.errorCount > 0) {
      return NextResponse.json(
        { error: "有商品驗證失敗，已中止（全部成功才執行）", preview },
        { status: 422 }
      );
    }

    const toRun = preview.items.filter((i) => i.ok);
    const admin = createAdminClient();
    const { data: job, error: jobErr } = await admin
      .from("product_batch_jobs")
      .insert({
        job_type: "product_update",
        status: "writing",
        operation_mode: runMode,
        total_items: toRun.length,
        created_by: auth!.profile.id,
        started_at: new Date().toISOString(),
        metadata: { patch, productIds: parsed.productIds },
      })
      .select("*")
      .single();
    if (jobErr || !job) {
      return NextResponse.json({ error: jobErr?.message ?? "建立作業失敗" }, { status: 500 });
    }

    let success = 0;
    let failed = 0;
    for (const item of toRun) {
      const db = item.db as Record<string, unknown>;
      if (!db || Object.keys(db).length === 0) {
        failed += 1;
        await admin.from("product_batch_job_items").insert({
          job_id: job.id,
          product_id: item.productId,
          status: "skipped",
          before_data: item.before,
          after_data: item.after,
          error_message: "沒有可寫入欄位",
        });
        continue;
      }
      const { error: updErr } = await admin.from("products").update(db).eq("id", item.productId);
      if (updErr) {
        failed += 1;
        await admin.from("product_batch_job_items").insert({
          job_id: job.id,
          product_id: item.productId,
          status: "error",
          before_data: item.before,
          after_data: item.after,
          error_message: updErr.message,
        });
        continue;
      }
      if (item.categoryIds) {
        try {
          await syncProductCategories(admin, item.productId, item.categoryIds);
        } catch (e) {
          failed += 1;
          await admin.from("product_batch_job_items").insert({
            job_id: job.id,
            product_id: item.productId,
            status: "error",
            before_data: item.before,
            after_data: item.after,
            error_message: e instanceof Error ? e.message : "分類更新失敗",
          });
          continue;
        }
      }
      success += 1;
      await admin.from("product_batch_job_items").insert({
        job_id: job.id,
        product_id: item.productId,
        status: "ok",
        before_data: item.before,
        after_data: item.after,
      });
    }

    const status = failed === 0 ? "completed" : success === 0 ? "failed" : "partial";
    await admin
      .from("product_batch_jobs")
      .update({
        status,
        success_items: success,
        failed_items: failed,
        completed_at: new Date().toISOString(),
      })
      .eq("id", job.id);

    await logAudit(
      auth!.profile.id,
      "update",
      "product_batch_jobs",
      job.id,
      null,
      { success, failed, runMode },
      request as never
    );

    return NextResponse.json({
      jobId: job.id,
      status,
      success,
      failed,
      preview,
    });
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "執行失敗" },
      { status: 400 }
    );
  }
}
