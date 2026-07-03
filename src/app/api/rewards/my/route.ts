import { NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth";
import { isSupabaseConfigured } from "@/lib/config";
import { mockStore } from "@/lib/mock-data";
import { createClient } from "@/lib/supabase/server";

export async function GET() {
  const { error, auth } = await requireAuth();
  if (error) return error;

  if (!isSupabaseConfigured()) {
    const rewards = mockStore.rewards.filter((r) => r.user_id === auth!.profile.id);
    return NextResponse.json({ rewards });
  }

  const supabase = await createClient();
  const { data, error: fetchError } = await supabase
    .from("reward_records")
    .select("*")
    .eq("user_id", auth!.profile.id)
    .order("created_at", { ascending: false });

  if (fetchError) return NextResponse.json({ error: fetchError.message }, { status: 500 });
  return NextResponse.json({ rewards: data });
}
