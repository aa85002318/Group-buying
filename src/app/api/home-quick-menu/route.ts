import { NextResponse } from "next/server";
import { isSupabaseConfigured } from "@/lib/config";
import { createAdminClient } from "@/lib/supabase/admin";
import {
  DEFAULT_HOME_QUICK_MENU_ITEMS,
  normalizeQuickMenuItem,
  type HomeQuickMenuItem,
} from "@/lib/home/quick-menu";

/** Public: active items only, sorted by sort_order ASC */
export async function GET() {
  if (!isSupabaseConfigured()) {
    return NextResponse.json({ items: DEFAULT_HOME_QUICK_MENU_ITEMS });
  }

  try {
    const admin = createAdminClient();
    const { data, error } = await admin
      .from("home_quick_menu_items")
      .select("*")
      .eq("is_active", true)
      .order("sort_order", { ascending: true });

    if (error) {
      console.error("[home-quick-menu]", error.message);
      return NextResponse.json({ items: DEFAULT_HOME_QUICK_MENU_ITEMS });
    }

    const items = ((data ?? []) as HomeQuickMenuItem[]).map(normalizeQuickMenuItem);
    return NextResponse.json({
      items: items.length > 0 ? items : DEFAULT_HOME_QUICK_MENU_ITEMS,
    });
  } catch (e) {
    console.error("[home-quick-menu]", e);
    return NextResponse.json({ items: DEFAULT_HOME_QUICK_MENU_ITEMS });
  }
}
