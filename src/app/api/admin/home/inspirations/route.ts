import { NextResponse } from "next/server";
import { requireAdmin, logAudit } from "@/lib/auth";
import { isSupabaseConfigured } from "@/lib/config";
import { createAdminClient } from "@/lib/supabase/admin";

export async function GET() {
  const { error } = await requireAdmin();
  if (error) return error;

  if (!isSupabaseConfigured()) {
    return NextResponse.json({ inspirations: [] });
  }

  const admin = createAdminClient();
  const { data, error: fetchError } = await admin
    .from("home_inspirations")
    .select("*")
    .order("sort_order", { ascending: true });

  if (fetchError) return NextResponse.json({ error: fetchError.message }, { status: 500 });
  return NextResponse.json({ inspirations: data ?? [] });
}

export async function POST(request: Request) {
  const { error, auth } = await requireAdmin();
  if (error) return error;

  const body = await request.json();
  const title = typeof body.title === "string" ? body.title.trim() : "";
  if (!title) {
    return NextResponse.json({ error: "請填寫標題" }, { status: 400 });
  }

  const payload = {
    title,
    subtitle: typeof body.subtitle === "string" ? body.subtitle.trim() || null : null,
    image_url: typeof body.image_url === "string" ? body.image_url.trim() || null : null,
    link_type: typeof body.link_type === "string" ? body.link_type.trim() || null : null,
    target_url: typeof body.target_url === "string" ? body.target_url.trim() || null : null,
    button_label: typeof body.button_label === "string" ? body.button_label.trim() || "去看看" : "去看看",
    sort_order: Number(body.sort_order) || 0,
    is_active: body.is_active !== false,
    start_at: body.start_at || null,
    end_at: body.end_at || null,
  };

  if (!isSupabaseConfigured()) {
    return NextResponse.json({ inspiration: { id: `insp-${Date.now()}`, ...payload } }, { status: 201 });
  }

  const admin = createAdminClient();
  const { data, error: insertError } = await admin
    .from("home_inspirations")
    .insert(payload)
    .select()
    .single();

  if (insertError) return NextResponse.json({ error: insertError.message }, { status: 500 });
  await logAudit(auth!.profile.id, "create_home_inspiration", "home_inspirations", data.id, null, data);
  return NextResponse.json({ inspiration: data }, { status: 201 });
}
