import { NextResponse } from "next/server";
import { getAuthUser } from "@/lib/auth";
import { isSupabaseConfigured } from "@/lib/config";
import { createAdminClient } from "@/lib/supabase/admin";
import {
  isEligibleActivePopup,
  type HomepagePopup,
  type HomepagePopupAudience,
} from "@/lib/popups/types";

/**
 * Public: return the single highest-priority eligible homepage popup.
 * Query: ?audience=guest|member (optional; default inferred from session)
 */
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const audienceParam = searchParams.get("audience") as HomepagePopupAudience | null;

  if (!isSupabaseConfigured()) {
    return NextResponse.json({ popup: null });
  }

  const admin = createAdminClient();
  const { data, error } = await admin
    .from("homepage_popups")
    .select(
      "id, internal_name, title, description, desktop_image_url, mobile_image_url, button_text, link_type, link_url, linked_resource_id, display_scope, audience_type, priority, priority_rank, allow_close, allow_close_on_backdrop, allow_dismiss_today, dismiss_after_click, starts_at, ends_at, status"
    )
    .eq("status", "active")
    .order("priority_rank", { ascending: false })
    .order("starts_at", { ascending: false })
    .order("created_at", { ascending: false })
    .limit(20);

  if (error) {
    console.error("[popups/active]", error.message);
    return NextResponse.json({ popup: null });
  }

  const now = new Date();
  let audience: HomepagePopupAudience = "all";
  if (audienceParam === "guest" || audienceParam === "member") {
    audience = audienceParam;
  } else {
    const auth = await getAuthUser();
    audience = auth ? "member" : "guest";
  }

  const eligible = ((data as HomepagePopup[] | null) ?? []).filter((p) => {
    if (!isEligibleActivePopup(p, now)) return false;
    if (p.display_scope !== "home_only" && p.display_scope !== "site_first_open") return false;
    if (p.audience_type === "all") return true;
    return p.audience_type === audience;
  });

  const popup = eligible[0] ?? null;
  return NextResponse.json({ popup });
}
