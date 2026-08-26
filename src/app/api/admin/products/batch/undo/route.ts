import { NextResponse } from "next/server";
import { z } from "zod";
import { requireAdmin, logAudit } from "@/lib/auth";
import { isSupabaseConfigured } from "@/lib/config";
import { createAdminClient } from "@/lib/supabase/admin";
import { syncProductCategories } from "@/lib/services/productRelations";
import { PRODUCT_BATCH_SHIP_KEYS } from "@/lib/admin/product-batch";

export const dynamic = "force-dynamic";

const bodySchema = z.object({ jobId: z.string().uuid() });

const RESTORE_KEYS = [
  "name",
  "subtitle",
  "sku",
  "status",
  "is_active",
  "price",
  "sale_price",
  "cost_price",
  "category_id",
  "rich_description",
  "description",
  "product_info",
  ...PRODUCT_BATCH_SHIP_KEYS,
] as const;

export async function POST(request: Request) {
  const { error, auth } = await requireAdmin();
  if (error) return error;
  if (!isSupabaseConfigured()) {
    return NextResponse.json({ error: "未設定資料庫" }, { status: 503 });
  }

  try {
    const { jobId } = bodySchema.parse(await request.json());
    const admin = createAdminClient();
    const { data: job } = await admin.from("product_batch_jobs").select("*").eq("id", jobId).maybeSingle();
    if (!job || job.job_type !== "product_update") {
      return NextResponse.json({ error: "找不到可復原的批次修改作業" }, { status: 404 });
    }

    const { data: items } = await admin
      .from("product_batch_job_items")
      .select("*")
      .eq("job_id", jobId)
      .eq("status", "ok");

    let restored = 0;
    const diffs: Array<{ productId: string; before: unknown; after: unknown }> = [];
    for (const item of items ?? []) {
      const before = (item.before_data ?? {}) as Record<string, unknown>;
      const patch: Record<string, unknown> = {};
      for (const key of RESTORE_KEYS) {
        if (key === "category_id") continue;
        if ((PRODUCT_BATCH_SHIP_KEYS as readonly string[]).includes(key)) continue;
        if (before[key] !== undefined) patch[key] = before[key];
      }
      const shipping = before.shipping as Record<string, boolean> | undefined;
      if (shipping) {
        for (const k of PRODUCT_BATCH_SHIP_KEYS) patch[k] = Boolean(shipping[k]);
      }
      if (Object.keys(patch).length) {
        await admin.from("products").update(patch).eq("id", item.product_id);
      }
      if (Array.isArray(before.category_ids)) {
        await syncProductCategories(admin, item.product_id, before.category_ids as string[]);
      }
      restored += 1;
      diffs.push({ productId: item.product_id, before: item.after_data, after: item.before_data });
    }

    await admin
      .from("product_batch_jobs")
      .update({
        metadata: { ...(job.metadata as object), undone: true, undone_at: new Date().toISOString() },
      })
      .eq("id", jobId);

    await logAudit(auth!.profile.id, "update", "product_batch_jobs", jobId, job, { restored }, request as never);
    return NextResponse.json({ ok: true, restored, diffs });
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "復原失敗" },
      { status: 400 }
    );
  }
}
