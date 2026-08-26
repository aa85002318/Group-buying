import { NextResponse } from "next/server";
import { z } from "zod";
import { requireAdmin, logAudit } from "@/lib/auth";
import { isSupabaseConfigured } from "@/lib/config";
import { createAdminClient } from "@/lib/supabase/admin";
import { syncProductImagesTable } from "@/lib/products/sync-product-images";

export const dynamic = "force-dynamic";

const bodySchema = z.object({ jobId: z.string().uuid() });

export async function POST(request: Request) {
  const { error, auth } = await requireAdmin();
  if (error) return error;
  if (!isSupabaseConfigured()) return NextResponse.json({ error: "未設定資料庫" }, { status: 503 });
  const { jobId } = bodySchema.parse(await request.json());
  const admin = createAdminClient();
  const { data: versions } = await admin
    .from("product_image_versions")
    .select("*")
    .eq("batch_job_id", jobId)
    .is("restored_at", null);

  let restored = 0;
  for (const row of versions ?? []) {
    const prev = (row.previous_images ?? {}) as { image_url?: string | null; images?: string[] };
    const gallery = (prev.images ?? []).filter((u) => u && u !== prev.image_url);
    await admin
      .from("products")
      .update({ image_url: prev.image_url ?? null, images: prev.images ?? [] })
      .eq("id", row.product_id);
    await syncProductImagesTable(admin, row.product_id, {
      mainUrl: prev.image_url ?? null,
      galleryUrls: gallery,
      content: [],
    });
    await admin
      .from("product_image_versions")
      .update({ restored_at: new Date().toISOString(), restored_by: auth!.profile.id })
      .eq("id", row.id);
    restored += 1;
  }

  await logAudit(auth!.profile.id, "update", "product_image_versions", jobId, null, { restored }, request as never);
  return NextResponse.json({ ok: true, restored });
}
