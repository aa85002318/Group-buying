import { NextResponse } from "next/server";
import { isSupabaseConfigured } from "@/lib/config";
import { mockStore } from "@/lib/mock-data";
import { createAdminClient } from "@/lib/supabase/admin";

export async function POST(request: Request) {
  const body = await request.json();

  if (!isSupabaseConfigured()) {
    const tracking = mockStore.shareTracking.find((s) => s.ref_code === body.refCode);
    if (tracking) tracking.signup_count += 1;
    return NextResponse.json({ success: true });
  }

  const admin = createAdminClient();
  const { data: tracking } = await admin
    .from("share_tracking")
    .select("id, signup_count")
    .eq("ref_code", body.refCode)
    .single();

  if (tracking) {
    await admin
      .from("share_tracking")
      .update({ signup_count: Number(tracking.signup_count) + 1 })
      .eq("id", tracking.id);
  }

  if (body.userId && body.refCode) {
    await admin
      .from("share_clicks")
      .update({ converted_user_id: body.userId })
      .eq("ref_code", body.refCode)
      .is("converted_user_id", null);
  }

  return NextResponse.json({ success: true });
}
