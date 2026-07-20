import { NextResponse } from "next/server";
import { isSupabaseConfigured } from "@/lib/config";
import { createClient } from "@/lib/supabase/server";

export async function GET() {
  if (!isSupabaseConfigured()) {
    return NextResponse.json({ faqs: [] });
  }

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("faqs")
    .select("id, category, question, answer, sort_order")
    .eq("is_active", true)
    .order("sort_order")
    .order("created_at");

  if (error) {
    if (error.code === "42P01") return NextResponse.json({ faqs: [] });
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ faqs: data ?? [] });
}
