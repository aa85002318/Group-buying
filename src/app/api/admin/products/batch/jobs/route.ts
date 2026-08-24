import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth";
import { isSupabaseConfigured } from "@/lib/config";
import { createAdminClient } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";

export async function GET() {
  const { error } = await requireAdmin();
  if (error) return error;
  if (!isSupabaseConfigured()) return NextResponse.json({ jobs: [] });
  const admin = createAdminClient();
  const { data, error: qErr } = await admin
    .from("product_batch_jobs")
    .select("id, job_type, status, operation_mode, total_items, success_items, failed_items, created_by, created_at, completed_at, metadata")
    .order("created_at", { ascending: false })
    .limit(80);
  if (qErr) return NextResponse.json({ error: qErr.message }, { status: 500 });
  return NextResponse.json({ jobs: data ?? [] });
}
