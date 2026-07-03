import { NextResponse } from "next/server";
import { requireAdmin, logAudit } from "@/lib/auth";
import { isSupabaseConfigured } from "@/lib/config";
import { mockLivestreams } from "@/lib/mock-data";
import { createAdminClient } from "@/lib/supabase/admin";

export async function GET() {
  const { error } = await requireAdmin();
  if (error) return error;

  if (!isSupabaseConfigured()) {
    return NextResponse.json({ livestreams: mockLivestreams });
  }

  const admin = createAdminClient();
  const { data, error: fetchError } = await admin
    .from("livestreams")
    .select("*")
    .order("scheduled_at", { ascending: false });

  if (fetchError) return NextResponse.json({ error: fetchError.message }, { status: 500 });
  return NextResponse.json({ livestreams: data });
}

export async function POST(request: Request) {
  const { error, auth } = await requireAdmin();
  if (error) return error;

  const body = await request.json();

  if (!isSupabaseConfigured()) {
    const livestream = {
      id: `live-${Date.now()}`,
      view_count: 0,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      ...body,
    };
    mockLivestreams.push(livestream);
    return NextResponse.json({ livestream }, { status: 201 });
  }

  const admin = createAdminClient();
  const { data, error: insertError } = await admin
    .from("livestreams")
    .insert({
      title: body.title,
      description: body.description,
      stream_url: body.stream_url,
      thumbnail_url: body.thumbnail_url,
      host_user_id: body.host_user_id,
      status: body.status ?? "scheduled",
      scheduled_at: body.scheduled_at,
    })
    .select()
    .single();

  if (insertError) return NextResponse.json({ error: insertError.message }, { status: 500 });
  await logAudit(auth!.profile.id, "create_livestream", "livestream", data.id, null, data);
  return NextResponse.json({ livestream: data }, { status: 201 });
}
