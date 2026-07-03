import { NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth";
import { isSupabaseConfigured } from "@/lib/config";
import { mockStore } from "@/lib/mock-data";
import { createClient } from "@/lib/supabase/server";

export async function GET(request: Request) {
  const { error, auth } = await requireAuth();
  if (error) return error;

  const { searchParams } = new URL(request.url);
  const status = searchParams.get("status");

  if (!isSupabaseConfigured()) {
    let records = mockStore.commissions.filter((r) => r.referrer_user_id === auth!.profile.id);
    if (status) records = records.filter((r) => r.status === status);
    return NextResponse.json({ commissions: records });
  }

  const supabase = await createClient();
  let query = supabase
    .from("commission_records")
    .select("*")
    .eq("referrer_user_id", auth!.profile.id)
    .order("created_at", { ascending: false });

  if (status) query = query.eq("status", status);

  const { data, error: fetchError } = await query;
  if (fetchError) return NextResponse.json({ error: fetchError.message }, { status: 500 });
  return NextResponse.json({ commissions: data });
}
