import { NextResponse } from "next/server";
import { requireAdmin, logAudit } from "@/lib/auth";
import { isSupabaseConfigured } from "@/lib/config";
import { createAdminClient } from "@/lib/supabase/admin";

export async function GET() {
  const { error } = await requireAdmin();
  if (error) return error;

  if (!isSupabaseConfigured()) {
    return NextResponse.json({ challenges: [] });
  }

  const admin = createAdminClient();
  const { data, error: fetchError } = await admin
    .from("baking_challenges")
    .select("*")
    .order("sort_order", { ascending: true });

  if (fetchError) return NextResponse.json({ error: fetchError.message }, { status: 500 });
  return NextResponse.json({ challenges: data ?? [] });
}

export async function POST(request: Request) {
  const { error, auth } = await requireAdmin();
  if (error) return error;

  const body = await request.json();
  const title = typeof body.title === "string" ? body.title.trim() : "";
  const slug = typeof body.slug === "string" ? body.slug.trim() : "";
  if (!title || !slug) {
    return NextResponse.json({ error: "請填寫標題與 slug" }, { status: 400 });
  }

  const payload = {
    title,
    slug,
    cover_image_url: typeof body.cover_image_url === "string" ? body.cover_image_url.trim() || null : null,
    description: typeof body.description === "string" ? body.description.trim() || null : null,
    rules: typeof body.rules === "string" ? body.rules.trim() || null : null,
    starts_at: body.starts_at || null,
    ends_at: body.ends_at || null,
    status: body.status ?? "draft",
    participant_count: Number(body.participant_count) || 0,
    featured_on_home: Boolean(body.featured_on_home),
    sort_order: Number(body.sort_order) || 0,
  };

  if (!isSupabaseConfigured()) {
    return NextResponse.json({ challenge: { id: `challenge-${Date.now()}`, ...payload } }, { status: 201 });
  }

  const admin = createAdminClient();
  const { data, error: insertError } = await admin
    .from("baking_challenges")
    .insert(payload)
    .select()
    .single();

  if (insertError) return NextResponse.json({ error: insertError.message }, { status: 500 });
  await logAudit(auth!.profile.id, "create_baking_challenge", "baking_challenges", data.id, null, data);
  return NextResponse.json({ challenge: data }, { status: 201 });
}
