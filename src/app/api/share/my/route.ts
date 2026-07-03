import { NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth";
import { isSupabaseConfigured } from "@/lib/config";
import { mockStore } from "@/lib/mock-data";
import { createClient } from "@/lib/supabase/server";

export async function GET() {
  const { error, auth } = await requireAuth();
  if (error) return error;

  if (!isSupabaseConfigured()) {
    const tracking = mockStore.shareTracking.filter((s) => s.sharer_user_id === auth!.profile.id);
    const total = tracking.reduce(
      (acc, t) => ({
        click_count: acc.click_count + (t.click_count ?? 0),
        signup_count: acc.signup_count + (t.signup_count ?? 0),
      }),
      { click_count: 0, signup_count: 0 }
    );
    return NextResponse.json({
      stats: {
        ref_code: auth!.profile.member_code,
        click_count: total.click_count,
        signup_count: total.signup_count,
      },
      shareStats: tracking,
    });
  }

  const supabase = await createClient();
  const { data, error: fetchError } = await supabase
    .from("share_tracking")
    .select("*")
    .eq("sharer_user_id", auth!.profile.id)
    .order("created_at", { ascending: false });

  if (fetchError) return NextResponse.json({ error: fetchError.message }, { status: 500 });
  return NextResponse.json({ shareStats: data });
}
