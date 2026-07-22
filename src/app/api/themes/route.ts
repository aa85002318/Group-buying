import { NextResponse } from "next/server";
import { isSupabaseConfigured } from "@/lib/config";
import { createClient } from "@/lib/supabase/server";
import type { SeasonalTheme } from "@/lib/types/database";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const featured = searchParams.get("featured") === "1";
  const limit = Math.min(20, Math.max(1, Number(searchParams.get("limit") ?? 12) || 12));

  if (!isSupabaseConfigured()) {
    return NextResponse.json({ themes: [] as SeasonalTheme[] });
  }

  const supabase = await createClient();
  let query = supabase
    .from("seasonal_themes")
    .select("*")
    .eq("status", "published")
    .order("sort_order", { ascending: true })
    .order("starts_at", { ascending: false })
    .limit(limit);

  if (featured) query = query.eq("featured_on_home", true);

  const { data, error } = await query;
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ themes: data ?? [] });
}
