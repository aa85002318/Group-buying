import { NextResponse } from "next/server";
import { isSupabaseConfigured } from "@/lib/config";
import { createAdminClient } from "@/lib/supabase/admin";
import {
  DEFAULT_HOME_FEATURE_DUO_ITEMS,
  normalizeFeatureDuoItem,
  type HomeFeatureDuoItem,
} from "@/lib/home/feature-duo";

/** Public: active feature duo cards, sorted by sort_order ASC */
export async function GET() {
  if (!isSupabaseConfigured()) {
    return NextResponse.json({ items: DEFAULT_HOME_FEATURE_DUO_ITEMS });
  }

  try {
    const admin = createAdminClient();
    const { data, error } = await admin
      .from("home_feature_duo_items")
      .select("*")
      .eq("is_active", true)
      .order("sort_order", { ascending: true });

    if (error) {
      console.error("[home-feature-duo]", error.message);
      return NextResponse.json({ items: DEFAULT_HOME_FEATURE_DUO_ITEMS });
    }

    const items = ((data ?? []) as HomeFeatureDuoItem[]).map(normalizeFeatureDuoItem);
    return NextResponse.json({
      items: items.length > 0 ? items : DEFAULT_HOME_FEATURE_DUO_ITEMS,
    });
  } catch (e) {
    console.error("[home-feature-duo]", e);
    return NextResponse.json({ items: DEFAULT_HOME_FEATURE_DUO_ITEMS });
  }
}
