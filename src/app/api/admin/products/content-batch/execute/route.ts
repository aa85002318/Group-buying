import { NextResponse } from "next/server";
import { z } from "zod";
import { requireAdmin, logAudit } from "@/lib/auth";
import { isSupabaseConfigured } from "@/lib/config";
import { createAdminClient } from "@/lib/supabase/admin";
import {
  computeProductPatch,
  contentPatchForItem,
  type ProductBatchRow,
} from "@/lib/admin/product-batch";

export const dynamic = "force-dynamic";

const itemSchema = z.object({
  productId: z.string().uuid(),
  name: z.string().optional(),
  rich_description: z.string().nullable().optional(),
  product_info: z.string().nullable().optional(),
  specifications: z.string().nullable().optional(),
});

const bodySchema = z.object({
  items: z.array(itemSchema).min(1).max(500),
  runMode: z.enum(["all_or_nothing", "skip_errors"]).optional(),
  dryRun: z.boolean().optional(),
});

async function loadProducts(admin: ReturnType<typeof createAdminClient>, ids: string[]) {
  const { data, error } = await admin.from("products").select("*").in("id", ids);
  if (error) throw new Error(error.message);
  const byId = new Map((data ?? []).map((p) => [p.id, p as ProductBatchRow]));
  return ids.map((id) => byId.get(id)).filter(Boolean) as ProductBatchRow[];
}

export async function POST(request: Request) {
  const { error, auth } = await requireAdmin();
  if (error) return error;
  if (!isSupabaseConfigured()) {
    return NextResponse.json({ error: "未設定資料庫" }, { status: 503 });
  }

  try {
    const parsed = bodySchema.parse(await request.json());
    const runMode = parsed.runMode ?? "all_or_nothing";
    const dryRun = Boolean(parsed.dryRun);
    const ids = parsed.items.map((i) => i.productId);
    const admin = createAdminClient();
    const products = await loadProducts(admin, ids);
    const productById = new Map(products.map((p) => [p.id, p]));

    const previewItems = parsed.items.map((item, index) => {
      const product = productById.get(item.productId);
      if (!product) {
        return {
          productId: item.productId,
          name: "（找不到商品）",
          sku: null as string | null,
          ok: false,
          errors: ["商品不存在"],
          before: {},
          after: {},
          db: {} as Record<string, unknown>,
        };
      }
      const patch = contentPatchForItem(item);
      if (!patch) {
        return {
          productId: product.id,
          name: product.name,
          sku: product.sku ?? null,
          ok: false,
          errors: ["沒有可寫入的內容欄位"],
          before: {
            name: product.name ?? null,
            rich_description: product.rich_description ?? product.description ?? null,
            product_info: product.product_info ?? null,
            specifications: product.specifications ?? null,
          },
          after: {},
          db: {} as Record<string, unknown>,
        };
      }
      const result = computeProductPatch(product, patch, { index, templates: {} });
      return {
        productId: product.id,
        name: product.name,
        sku: product.sku ?? null,
        ok: result.errors.length === 0,
        errors: result.errors,
        before: {
          name: product.name ?? null,
          rich_description: product.rich_description ?? product.description ?? null,
          product_info: product.product_info ?? null,
          specifications: product.specifications ?? null,
        },
        after: {
          name: result.after.name,
          rich_description: result.after.rich_description,
          product_info: result.after.product_info,
          specifications: result.after.specifications,
        },
        db: result.db,
      };
    });

    const executable = previewItems.filter((i) => i.ok && Object.keys(i.db).length > 0);
    const preview = {
      total: previewItems.length,
      executableCount: executable.length,
      errorCount: previewItems.length - executable.length,
      items: previewItems,
    };

    if (dryRun) {
      return NextResponse.json({ preview });
    }

    if (runMode === "all_or_nothing" && preview.errorCount > 0) {
      return NextResponse.json(
        { error: "有商品驗證失敗，已中止（全部成功才執行）", preview },
        { status: 422 }
      );
    }

    const { data: job, error: jobErr } = await admin
      .from("product_batch_jobs")
      .insert({
        job_type: "product_update",
        status: "writing",
        operation_mode: runMode,
        total_items: executable.length,
        created_by: auth!.profile.id,
        started_at: new Date().toISOString(),
        metadata: { kind: "content_batch", productIds: ids },
      })
      .select("*")
      .single();
    if (jobErr || !job) {
      return NextResponse.json({ error: jobErr?.message ?? "建立作業失敗" }, { status: 500 });
    }

    let success = 0;
    let failed = 0;
    for (const item of executable) {
      const { error: updErr } = await admin.from("products").update(item.db).eq("id", item.productId);
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
      { kind: "content_batch", success, failed, runMode },
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
