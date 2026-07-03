import { NextResponse } from "next/server";
import { requireRole } from "@/lib/auth";
import { isSupabaseConfigured } from "@/lib/config";
import { mockStore } from "@/lib/mock-data";
import { createAdminClient } from "@/lib/supabase/admin";

export async function GET(request: Request) {
  const { error } = await requireRole("admin");
  if (error) return error;

  const { searchParams } = new URL(request.url);
  const status = searchParams.get("status");

  if (!isSupabaseConfigured()) {
    let records = [...mockStore.commissions];
    if (status) records = records.filter((r) => r.status === status);
    return NextResponse.json({ records });
  }

  const admin = createAdminClient();
  let query = admin
    .from("commission_records")
    .select("*, profiles!commission_records_referrer_user_id_fkey(full_name, member_code)")
    .order("created_at", { ascending: false });

  if (status) query = query.eq("status", status);

  const { data, error: fetchError } = await query;
  if (fetchError) return NextResponse.json({ error: fetchError.message }, { status: 500 });
  return NextResponse.json({ records: data });
}
