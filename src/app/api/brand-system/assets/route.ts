import { NextResponse } from "next/server";
import { isSupabaseConfigured } from "@/lib/config";
import { createAdminClient } from "@/lib/supabase/admin";

export async function GET(request: Request) {
  const type = new URL(request.url).searchParams.get("type");

  if (!isSupabaseConfigured()) {
    return NextResponse.json({ assets: [], source: "fallback" });
  }

  try {
    const admin = createAdminClient();
    let query = admin
      .from("brand_assets")
      .select("id, name, asset_type, file_url, alt_text, tags, usage_locations")
      .eq("enabled", true)
      .order("created_at", { ascending: false });
    if (type) query = query.eq("asset_type", type);

    const { data, error } = await query.limit(100);
    if (error) throw error;
    return NextResponse.json({ assets: data ?? [], source: "cms" });
  } catch {
    return NextResponse.json({ assets: [], source: "fallback" });
  }
}
