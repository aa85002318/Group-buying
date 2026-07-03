import { NextResponse } from "next/server";
import { isSupabaseConfigured } from "@/lib/config";
import { mockStores } from "@/lib/mock-data";
import { createClient } from "@/lib/supabase/server";

export async function GET() {
  if (!isSupabaseConfigured()) {
    return NextResponse.json({ stores: mockStores.filter((s) => s.is_active) });
  }

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("stores")
    .select("id, name, address, phone, is_active, created_at, updated_at")
    .eq("is_active", true)
    .order("name");

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ stores: data ?? [] });
}
