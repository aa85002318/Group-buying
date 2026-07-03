import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { isSupabaseConfigured } from "@/lib/config";
import { mockVideos } from "@/lib/mock-data";

export async function POST(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  if (!isSupabaseConfigured()) {
    const video = mockVideos.find((v) => v.id === id);
    if (video) video.view_count += 1;
    return NextResponse.json({ viewCount: video?.view_count ?? 0 });
  }

  const admin = createAdminClient();
  const { data: video } = await admin.from("videos").select("view_count").eq("id", id).single();
  if (!video) return NextResponse.json({ error: "影片不存在" }, { status: 404 });

  const newCount = Number(video.view_count) + 1;
  await admin.from("videos").update({ view_count: newCount }).eq("id", id);
  return NextResponse.json({ viewCount: newCount });
}
