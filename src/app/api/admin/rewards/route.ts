import { NextResponse } from "next/server";
import { requireRole } from "@/lib/auth";
import { isSupabaseConfigured } from "@/lib/config";
import { mockStore } from "@/lib/mock-data";
import { createClient } from "@/lib/supabase/server";

export async function GET(request: Request) {
  const { error } = await requireRole("admin");
  if (error) return error;

  const { searchParams } = new URL(request.url);
  const status = searchParams.get("status");

  if (!isSupabaseConfigured()) {
    let rewards = [...mockStore.rewards];
    if (status) rewards = rewards.filter((r) => r.status === status);
    return NextResponse.json({ rewards });
  }

  const supabase = await createClient();
  let query = supabase
    .from("reward_records")
    .select("*, profiles(full_name, member_code)")
    .order("created_at", { ascending: false });

  if (status) query = query.eq("status", status);

  const { data, error: fetchError } = await query;
  if (fetchError) return NextResponse.json({ error: fetchError.message }, { status: 500 });
  return NextResponse.json({ rewards: data });
}
