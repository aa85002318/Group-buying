import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth";
import { isSupabaseConfigured } from "@/lib/config";
import { createAdminClient } from "@/lib/supabase/admin";

export async function GET() {
  const { error } = await requireAdmin();
  if (error) return error;

  if (!isSupabaseConfigured()) {
    return NextResponse.json({ brands: [] });
  }

  const admin = createAdminClient();
  const { data, error: fetchError } = await admin
    .from("brands")
    .select("id, name")
    .eq("is_active", true)
    .order("name");

  if (fetchError) {
    return NextResponse.json({ brands: [] });
  }

  return NextResponse.json({ brands: data ?? [] });
}

export async function POST(request: Request) {
  const { error } = await requireAdmin();
  if (error) return error;

  const body = await request.json();
  if (!body.name?.trim()) {
    return NextResponse.json({ error: "請填寫品牌名稱" }, { status: 400 });
  }

  if (!isSupabaseConfigured()) {
    return NextResponse.json({ brand: { id: `brand-${Date.now()}`, name: body.name.trim() } });
  }

  const admin = createAdminClient();
  const { data, error: insertError } = await admin
    .from("brands")
    .insert({ name: body.name.trim() })
    .select("id, name")
    .single();

  if (insertError) return NextResponse.json({ error: insertError.message }, { status: 500 });
  return NextResponse.json({ brand: data });
}
