import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/config";
import { getMockGroupBuyEventsWithProducts } from "@/lib/mock-data";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const featured = searchParams.get("featured") === "true";

  if (!isSupabaseConfigured()) {
    let events = getMockGroupBuyEventsWithProducts();
    if (featured) {
      events = events
        .filter((e) => e.is_homepage_featured && e.banner_url && e.status === "active")
        .sort((a, b) => (a.homepage_sort_order ?? 0) - (b.homepage_sort_order ?? 0));
    }
    return NextResponse.json({ events });
  }

  const supabase = await createClient();
  let query = supabase
    .from("group_buy_events")
    .select("*, group_buy_products(*, products(*)), stores(name, address)")
    .eq("status", "active");

  if (featured) {
    query = query
      .eq("is_homepage_featured", true)
      .not("banner_url", "is", null)
      .order("homepage_sort_order", { ascending: true });
  } else {
    query = query.order("start_at", { ascending: false });
  }

  const { data, error } = await query;

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ events: data });
}
