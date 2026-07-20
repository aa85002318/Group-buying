import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/config";
import { mockVideos } from "@/lib/mock-data";

export async function GET(request: Request) {
  const category = new URL(request.url).searchParams.get("category");

  if (!isSupabaseConfigured()) {
    let videos = [...mockVideos];
    if (category) videos = videos.filter((v) => (v as { category?: string }).category === category);
    return NextResponse.json({ videos });
  }

  const supabase = await createClient();
  let query = supabase
    .from("videos")
    .select("*")
    .eq("is_active", true)
    .or("status.eq.published,status.is.null")
    .order("sort_order", { ascending: true })
    .order("created_at", { ascending: false });

  if (category) query = query.eq("category", category);

  const { data, error } = await query;
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ videos: data });
}
