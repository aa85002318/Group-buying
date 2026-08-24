import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth";
import { isSupabaseConfigured } from "@/lib/config";
import { createAdminClient } from "@/lib/supabase/admin";
import { cleanupExpiredImportFolders } from "@/lib/admin/product-image-batch-server";

export const dynamic = "force-dynamic";

export async function POST() {
  const { error, auth } = await requireAdmin();
  if (error) return error;
  if (!isSupabaseConfigured()) return NextResponse.json({ error: "未設定資料庫" }, { status: 503 });
  const admin = createAdminClient();
  void cleanupExpiredImportFolders(admin).catch(() => {});
  const { data, error: insErr } = await admin
    .from("product_batch_jobs")
    .insert({
      job_type: "image_upload",
      status: "uploading",
      operation_mode: "fill_missing",
      created_by: auth!.profile.id,
      started_at: new Date().toISOString(),
      metadata: { files: [], matches: [] },
    })
    .select("*")
    .single();
  if (insErr) return NextResponse.json({ error: insErr.message }, { status: 500 });
  return NextResponse.json({ job: data });
}
