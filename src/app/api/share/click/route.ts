import { NextResponse } from "next/server";
import { isSupabaseConfigured } from "@/lib/config";
import { mockStore } from "@/lib/mock-data";
import { createAdminClient } from "@/lib/supabase/admin";

export async function POST(request: Request) {
  const body = await request.json();
  const now = new Date().toISOString();
  const refCode = body.refCode ?? `ref-${Date.now()}`;

  if (!isSupabaseConfigured()) {
    mockStore.shareClicks.unshift({
      id: `sc-${Date.now()}`,
      sharer_user_id: body.sharerUserId,
      share_type: body.shareType,
      target_id: body.targetId,
      ref_code: refCode,
      visitor_id: body.visitorId ?? `visitor-${Date.now()}`,
      clicked_at: now,
    });
    return NextResponse.json({ success: true, refCode });
  }

  const admin = createAdminClient();
  await admin.from("share_clicks").insert({
    sharer_user_id: body.sharerUserId,
    share_type: body.shareType,
    target_id: body.targetId,
    ref_code: refCode,
    visitor_id: body.visitorId,
    share_tracking_id: body.shareTrackingId,
  });

  return NextResponse.json({ success: true, refCode });
}
