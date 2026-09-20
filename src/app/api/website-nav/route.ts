import { NextResponse } from "next/server";
import { isSupabaseConfigured } from "@/lib/config";
import { createAdminClient } from "@/lib/supabase/admin";
import { filterConsumerGroupBuyLinks } from "@/lib/features/group-buy-visibility";
import {
  DEFAULT_WEBSITE_NAV,
  WEBSITE_NAV_SETTING_KEY,
  normalizeWebsiteNav,
} from "@/lib/site-nav";

export const dynamic = "force-dynamic";

/** Public: website header menu (enabled items; group-buy links follow the feature flag). */
export async function GET() {
  let items = DEFAULT_WEBSITE_NAV;
  if (isSupabaseConfigured()) {
    const admin = createAdminClient();
    const { data } = await admin
      .from("site_settings")
      .select("value")
      .eq("key", WEBSITE_NAV_SETTING_KEY)
      .maybeSingle();
    if (data?.value) items = normalizeWebsiteNav(data.value);
  }
  const visible = filterConsumerGroupBuyLinks(items.filter((i) => i.enabled)).map((i) => ({
    ...i,
    children: filterConsumerGroupBuyLinks(i.children ?? []),
  }));
  return NextResponse.json(
    { items: visible },
    { headers: { "Cache-Control": "public, s-maxage=60, stale-while-revalidate=300" } }
  );
}
