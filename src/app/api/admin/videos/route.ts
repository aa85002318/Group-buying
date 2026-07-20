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
      description: body.description ?? body.summary ?? null,
      summary: body.summary ?? null,
      video_url: body.video_url,
      thumbnail_url: body.thumbnail_url ?? null,
      slug: body.slug ?? null,
      video_type: body.video_type ?? null,
      duration_seconds: body.duration_seconds ?? null,
      category: body.category ?? null,
      status: body.status ?? "published",
      published_at: body.published_at ?? (body.status === "published" ? new Date().toISOString() : null),
      is_active: body.is_active ?? body.status !== "archived",
      sort_order: body.sort_order ?? 0,
      seo_title: body.seo_title ?? null,
      seo_description: body.seo_description ?? null,
      created_by: auth!.profile.id,
      updated_by: auth!.profile.id,
    })
    .select()
    .single();

  if (insertError) return NextResponse.json({ error: insertError.message }, { status: 500 });
  await logAudit(auth!.profile.id, "create_video", "video", data.id, null, data);
  return NextResponse.json({ video: data }, { status: 201 });
}
