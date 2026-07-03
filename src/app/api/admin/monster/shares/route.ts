import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth";
import { isSupabaseConfigured } from "@/lib/config";
import { monsterMockStore } from "@/lib/monster-mock";
import { createAdminClient } from "@/lib/supabase/admin";

export async function GET(request: Request) {
  const { error } = await requireAdmin();
  if (error) return error;

  const { searchParams } = new URL(request.url);
  const status = searchParams.get("status");

  if (!isSupabaseConfigured()) {
    let shares = [...monsterMockStore.shareRecords];
    if (status) shares = shares.filter((s) => s.status === status);
    return NextResponse.json({ shares: shares.reverse() });
  }

  const admin = createAdminClient();
  let query = admin
    .from("product_share_records")
    .select("*, profiles(full_name, member_code), products(name, image_url)")
    .order("created_at", { ascending: false });

  if (status) query = query.eq("status", status);

  const { data, error: fetchError } = await query;
  if (fetchError) return NextResponse.json({ error: fetchError.message }, { status: 500 });

  return NextResponse.json({ shares: data ?? [] });
}
