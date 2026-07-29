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

export async function POST(request: Request) {
  const { error } = await requireContentAdmin();
  if (error) return error;

  if (!isSupabaseConfigured()) {
    return NextResponse.json({ error: "Supabase not configured" }, { status: 503 });
  }

  const body = await request.json();
  const name = String(body.name ?? "").trim();
  const file_url = String(body.file_url ?? "").trim();
  if (!name || !file_url) {
    return NextResponse.json({ error: "name and file_url required" }, { status: 400 });
  }

  const admin = createAdminClient();
  const { data, error: dbError } = await admin
    .from("brand_assets")
    .insert({
      name,
      asset_type: String(body.asset_type ?? "Hero 背景"),
      file_url,
      alt_text: body.alt_text ? String(body.alt_text) : null,
      enabled: true,
    })
    .select()
    .single();

  if (dbError) return NextResponse.json({ error: dbError.message }, { status: 500 });
  return NextResponse.json({ asset: data });
}
