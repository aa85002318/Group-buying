import { NextResponse } from "next/server";
import { isSupabaseConfigured } from "@/lib/config";
import { createAdminClient } from "@/lib/supabase/admin";
import {
  DEFAULT_HOME_LAYOUT_SETTINGS,
  HOME_LAYOUT_SETTING_KEY,
  normalizeHomeLayoutSettings,
} from "@/lib/home/layout-device";

export const dynamic = "force-dynamic";

/** Public: page-wide spacing for the homepage (phone + website). */
export async function GET() {
  if (!isSupabaseConfigured()) {
    return NextResponse.json({ settings: DEFAULT_HOME_LAYOUT_SETTINGS });
  }
  const admin = createAdminClient();
  const { data } = await admin
    .from("site_settings")
    .select("value")
    .eq("key", HOME_LAYOUT_SETTING_KEY)
    .maybeSingle();
  return NextResponse.json({
    settings: data?.value
      ? normalizeHomeLayoutSettings(data.value)
      : DEFAULT_HOME_LAYOUT_SETTINGS,
  });
}
