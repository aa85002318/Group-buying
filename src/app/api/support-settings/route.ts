import { NextResponse } from "next/server";
import { isSupabaseConfigured } from "@/lib/config";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import type { SupportSettings } from "@/lib/types/database";

const FALLBACK: Partial<SupportSettings> = {
  phone: "02-2737-5508",
  line_url: "https://line.me/R/ti/p/@diy_chimei",
  business_hours: "請以門市實際營業時間為準",
  support_info: "僅處理 CHIMEIDIY App 訂單與會員服務，不含門市 POS 現場消費查詢。",
};

export async function GET() {
  if (!isSupabaseConfigured()) {
    return NextResponse.json({ settings: FALLBACK });
  }

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("support_settings")
    .select("*")
    .eq("settings_key", "default")
    .maybeSingle();

  if (error) {
    if (error.code === "42P01") return NextResponse.json({ settings: FALLBACK });
    // try admin
    const admin = createAdminClient();
    const { data: adminData } = await admin
      .from("support_settings")
      .select("*")
      .eq("settings_key", "default")
      .maybeSingle();
    return NextResponse.json({ settings: adminData ?? FALLBACK });
  }

  return NextResponse.json({ settings: data ?? FALLBACK });
}
