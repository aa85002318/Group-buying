import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/config";
import {
  DEFAULT_SHOP_QUICK_LINKS,
  liveShopQuickLinks,
  parseShopQuickLinks,
} from "@/lib/shop/quick-links";

export const dynamic = "force-dynamic";

/** GET /api/shop/quick-links — live tiles for shop home (max 4). */
export async function GET() {
  if (!isSupabaseConfigured()) {
    return NextResponse.json({ links: liveShopQuickLinks(DEFAULT_SHOP_QUICK_LINKS) });
  }

  try {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from("shop_quick_links")
      .select("*")
      .eq("is_active", true)
      .order("sort_order", { ascending: true })
      .limit(4);

    if (error || !data?.length) {
      return NextResponse.json({
        links: error ? liveShopQuickLinks(DEFAULT_SHOP_QUICK_LINKS) : [],
      });
    }
    return NextResponse.json({ links: liveShopQuickLinks(parseShopQuickLinks(data)) });
  } catch {
    return NextResponse.json({ links: liveShopQuickLinks(DEFAULT_SHOP_QUICK_LINKS) });
  }
}
