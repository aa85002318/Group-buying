import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth";
import { isSupabaseConfigured } from "@/lib/config";
import { mockStore } from "@/lib/mock-data";
import { createAdminClient } from "@/lib/supabase/admin";

export async function GET() {
  const { error } = await requireAdmin();
  if (error) return error;

  if (!isSupabaseConfigured()) {
    return NextResponse.json({
      tracking: mockStore.shareTracking,
      summary: {
        totalClicks: mockStore.shareTracking.reduce((s, t) => s + (t.click_count ?? 0), 0),
        totalSignups: mockStore.shareTracking.reduce((s, t) => s + (t.signup_count ?? 0), 0),
        totalLinks: mockStore.shareTracking.length,
      },
    });
  }

  const admin = createAdminClient();
  const { data, error: fetchError } = await admin
    .from("share_tracking")
    .select("*, profiles!share_tracking_sharer_user_id_fkey(full_name, email, member_code)")
    .order("click_count", { ascending: false });

  if (fetchError) return NextResponse.json({ error: fetchError.message }, { status: 500 });

  const tracking = data ?? [];
  const summary = {
    totalClicks: tracking.reduce((s, t) => s + Number(t.click_count ?? 0), 0),
    totalSignups: tracking.reduce((s, t) => s + Number(t.signup_count ?? 0), 0),
    totalLinks: tracking.length,
  };

  return NextResponse.json({ tracking, summary });
}
