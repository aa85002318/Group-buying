import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/config";
import {
  DEFAULT_SHOP_PAGE_SETTINGS,
  parseShopPageSettings,
} from "@/lib/shop/page-settings";

export const dynamic = "force-dynamic";

/** GET /api/shop/page-settings */
export async function GET() {
  if (!isSupabaseConfigured()) {
    return NextResponse.json({ settings: DEFAULT_SHOP_PAGE_SETTINGS });
  }

  try {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from("shop_page_settings")
      .select("*")
      .eq("singleton_key", "main")
      .maybeSingle();

    if (error || !data) {
      return NextResponse.json({ settings: DEFAULT_SHOP_PAGE_SETTINGS });
    }

    return NextResponse.json({
      settings: parseShopPageSettings(data as Record<string, unknown>),
    });
  } catch {
    return NextResponse.json({ settings: DEFAULT_SHOP_PAGE_SETTINGS });
  }
}
