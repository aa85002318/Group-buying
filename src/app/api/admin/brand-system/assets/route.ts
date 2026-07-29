import { NextResponse } from "next/server";
import { isSupabaseConfigured } from "@/lib/config";
import { createAdminClient } from "@/lib/supabase/admin";
import { requireContentAdmin } from "@/lib/auth";

export async function GET(request: Request) {
  const { error } = await requireContentAdmin();
  if (error) return error;

  const type = new URL(request.url).searchParams.get("type");

  if (!isSupabaseConfigured()) {
    return NextResponse.json({ assets: [] });
  }

  const admin = createAdminClient();
  let query = admin.from("brand_assets").select("*").order("created_at", { ascending: false });
  if (type) query = query.eq("asset_type", type);

  const { data, error: dbError } = await query.limit(100);
  if (dbError) return NextResponse.json({ error: dbError.message }, { status: 500 });
  return NextResponse.json({ assets: data ?? [] });
}
