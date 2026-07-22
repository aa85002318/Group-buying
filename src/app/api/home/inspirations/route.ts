import { NextResponse } from "next/server";
import { isSupabaseConfigured } from "@/lib/config";
import { createClient } from "@/lib/supabase/server";
import type { HomeInspiration } from "@/lib/types/database";

const MOCK_INSPIRATIONS: HomeInspiration[] = [
  {
    id: "mock-insp-1",
    title: "夏日水果塔",
    subtitle: "清爽水果與酥皮的相遇",
    image_url: null,
    link_type: "recipe",
    target_url: "/recipes",
    button_label: "去看看",
    sort_order: 10,
    is_active: true,
    start_at: null,
    end_at: null,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: "mock-insp-2",
    title: "北海道吐司",
    subtitle: "柔軟拉絲的經典吐司",
    image_url: null,
    link_type: "recipe",
    target_url: "/recipes",
    button_label: "去看看",
    sort_order: 20,
    is_active: true,
    start_at: null,
    end_at: null,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
];

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const limit = Math.min(20, Math.max(1, Number(searchParams.get("limit") ?? 8) || 8));

  if (!isSupabaseConfigured()) {
    return NextResponse.json({ inspirations: MOCK_INSPIRATIONS.slice(0, limit) });
  }

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("home_inspirations")
    .select("*")
    .eq("is_active", true)
    .order("sort_order", { ascending: true });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  const now = Date.now();
  const inspirations = ((data ?? []) as HomeInspiration[])
    .filter((row) => {
      if (row.start_at && new Date(row.start_at).getTime() > now) return false;
      if (row.end_at && new Date(row.end_at).getTime() < now) return false;
      return true;
    })
    .slice(0, limit);

  return NextResponse.json({ inspirations });
}
