import { NextResponse } from "next/server";
import { z } from "zod";
import { requireAdmin } from "@/lib/auth";
import { isSupabaseConfigured } from "@/lib/config";
import { createAdminClient } from "@/lib/supabase/admin";
import { planImageUpdate, type ImageUpdateMode } from "@/lib/admin/product-image-batch";

export const dynamic = "force-dynamic";

const bodySchema = z.object({
  jobId: z.string().uuid(),
  mode: z.enum(["fill_missing", "main_only", "append_gallery", "replace_all"]),
});

export async function POST(request: Request) {
  const { error } = await requireAdmin();
  if (error) return error;
  if (!isSupabaseConfigured()) return NextResponse.json({ error: "未設定資料庫" }, { status: 503 });
  const { jobId, mode } = bodySchema.parse(await request.json());
  const admin = createAdminClient();
  const { data: job } = await admin.from("product_batch_jobs").select("*").eq("id", jobId).maybeSingle();
  if (!job) return NextResponse.json({ error: "找不到作業" }, { status: 404 });
  const allMatches = ((job.metadata as { matches?: Array<Record<string, unknown>> })?.matches ?? []);
  const matches = allMatches.filter((m) => m.status === "matched" && m.productId);

  const byProduct = new Map<string, Array<{ url: string; sequence: number; fileName: string }>>();
  for (const m of matches) {
    const pid = String(m.productId);
    const list = byProduct.get(pid) ?? [];
    list.push({
      url: String(m.url),
      sequence: Number(m.sequence ?? 99),
      fileName: String(m.fileName),
    });
    byProduct.set(pid, list);
  }

  const ids = Array.from(byProduct.keys());
  const { data: products } = ids.length
    ? await admin.from("products").select("id, name, sku, image_url, images").in("id", ids)
    : { data: [] };

  const rows = (products ?? []).map((p) => {
    const incoming = byProduct.get(p.id) ?? [];
    const images = Array.isArray(p.images) ? (p.images as string[]) : [];
    const plan = planImageUpdate({ image_url: p.image_url, images }, incoming, mode as ImageUpdateMode);
    return {
      productId: p.id,
      name: p.name,
      sku: p.sku,
      incomingCount: incoming.length,
      ...plan,
    };
  });

  const summary = {
    uploaded: ((job.metadata as { files?: unknown[] })?.files ?? []).length,
    matched: matches.length,
    pending: allMatches.filter((m) => m.status === "pending" || m.status === "bad_name").length,
    errors: allMatches.filter((m) => ["sku_missing", "duplicate", "too_small"].includes(String(m.status))).length,
    products: rows.length,
    addedMain: rows.reduce((s, r) => s + r.addedMain, 0),
    addedGallery: rows.reduce((s, r) => s + r.addedGallery, 0),
    replaced: rows.reduce((s, r) => s + r.replaced, 0),
    mode,
  };

  await admin
    .from("product_batch_jobs")
    .update({
      status: "previewed",
      operation_mode: mode,
      metadata: { ...(job.metadata as object), preview: { summary, rows } },
    })
    .eq("id", jobId);

  return NextResponse.json({ summary, rows });
}
