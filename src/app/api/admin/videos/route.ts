import { NextResponse } from "next/server";
import { requireAdmin, logAudit } from "@/lib/auth";
import { isSupabaseConfigured } from "@/lib/config";
import { mockVideos } from "@/lib/mock-data";
import { createAdminClient } from "@/lib/supabase/admin";

export async function GET() {
  const { error } = await requireAdmin();
  if (error) return error;

  if (!isSupabaseConfigured()) {
    return NextResponse.json({ videos: mockVideos });
  }

  const admin = createAdminClient();
  const { data, error: fetchError } = await admin
    .from("videos")
    .select("*")
    .order("created_at", { ascending: false });

  if (fetchError) return NextResponse.json({ error: fetchError.message }, { status: 500 });
  return NextResponse.json({ videos: data });
}

export async function POST(request: Request) {
  const { error, auth } = await requireAdmin();
  if (error) return error;

  const body = await request.json();

  if (!isSupabaseConfigured()) {
    const video = {
      id: `vid-${Date.now()}`,
      view_count: 0,
      is_active: true,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      ...body,
    };
    mockVideos.push(video);
    return NextResponse.json({ video }, { status: 201 });
  }

  const admin = createAdminClient();
  const { data, error: insertError } = await admin
    .from("videos")
    .insert({
      title: body.title,
      description: body.description,
      video_url: body.video_url,
      thumbnail_url: body.thumbnail_url,
      is_active: body.is_active ?? true,
    })
    .select()
    .single();

  if (insertError) return NextResponse.json({ error: insertError.message }, { status: 500 });
  await logAudit(auth!.profile.id, "create_video", "video", data.id, null, data);
  return NextResponse.json({ video: data }, { status: 201 });
}
