import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth";
import { isSupabaseConfigured } from "@/lib/config";
import { createAdminClient } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";

export async function GET(
  _request: Request,
  context: { params: Promise<{ jobId: string }> }
) {
  const { error } = await requireAdmin();
  if (error) return error;
  if (!isSupabaseConfigured()) {
    return NextResponse.json({ error: "未設定資料庫" }, { status: 503 });
  }
  const { jobId } = await context.params;
  const admin = createAdminClient();
  const { data: job } = await admin.from("product_batch_jobs").select("*").eq("id", jobId).maybeSingle();
  if (!job) return NextResponse.json({ error: "找不到作業" }, { status: 404 });
  const { data: items } = await admin
    .from("product_batch_job_items")
    .select("*")
    .eq("job_id", jobId)
    .order("created_at");
  return NextResponse.json({ job, items: items ?? [] });
}
