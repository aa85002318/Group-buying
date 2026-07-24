import { NextResponse } from "next/server";
import { getAuthUser } from "@/lib/auth";
import { isSupabaseConfigured } from "@/lib/config";
import { createAdminClient } from "@/lib/supabase/admin";
import type { HomepagePopupEventType } from "@/lib/popups/types";

const ALLOWED: HomepagePopupEventType[] = ["view", "click", "close", "dismiss_today"];

type Params = { params: Promise<{ id: string }> };

const COUNTER: Record<HomepagePopupEventType, string> = {
  view: "view_count",
  click: "click_count",
  close: "close_count",
  dismiss_today: "dismiss_today_count",
};

export async function POST(request: Request, { params }: Params) {
  const { id } = await params;

  let body: { event_type?: string; session_id?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "無效的請求" }, { status: 400 });
  }

  const eventType = body.event_type as HomepagePopupEventType;
  if (!ALLOWED.includes(eventType)) {
    return NextResponse.json({ error: "無效的 event_type" }, { status: 400 });
  }

  if (!isSupabaseConfigured()) {
    return NextResponse.json({ ok: true });
  }

  const admin = createAdminClient();
  const auth = await getAuthUser();
  const userId = auth?.profile?.id ?? null;
  const sessionId = body.session_id?.slice(0, 80) || null;

  const { error: insertError } = await admin.from("homepage_popup_events").insert({
    popup_id: id,
    user_id: userId,
    session_id: sessionId,
    event_type: eventType,
  });

  if (insertError) {
    console.error("[popup event]", insertError.message);
  }

  const counterCol = COUNTER[eventType];
  const { data: row } = await admin
    .from("homepage_popups")
    .select("view_count, click_count, close_count, dismiss_today_count")
    .eq("id", id)
    .maybeSingle();

  if (row) {
    const current = Number((row as Record<string, unknown>)[counterCol] ?? 0);
    await admin
      .from("homepage_popups")
      .update({ [counterCol]: current + 1 })
      .eq("id", id);
  }

  return NextResponse.json({ ok: true });
}
