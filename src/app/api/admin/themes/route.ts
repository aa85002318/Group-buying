import { NextResponse } from "next/server";
import { requireAdmin, logAudit } from "@/lib/auth";
import { isSupabaseConfigured } from "@/lib/config";
import { createAdminClient } from "@/lib/supabase/admin";

export async function GET() {
  const { error } = await requireAdmin();
  if (error) return error;

  if (!isSupabaseConfigured()) {
    return NextResponse.json({ themes: [] });
  }

  const admin = createAdminClient();
  const { data, error: fetchError } = await admin
    .from("seasonal_themes")
    .select("*")
    .order("sort_order", { ascending: true });

  if (fetchError) return NextResponse.json({ error: fetchError.message }, { status: 500 });
  return NextResponse.json({ themes: data ?? [] });
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
    mobile_cover_image_url:
      typeof body.mobile_cover_image_url === "string" ? body.mobile_cover_image_url.trim() || null : null,
    description: typeof body.description === "string" ? body.description.trim() || null : null,
    theme_color: typeof body.theme_color === "string" ? body.theme_color.trim() || null : null,
    starts_at: body.starts_at || null,
    ends_at: body.ends_at || null,
    status: body.status ?? "draft",
    featured_on_home: Boolean(body.featured_on_home),
    sort_order: Number(body.sort_order) || 0,
  };

  if (!isSupabaseConfigured()) {
    return NextResponse.json({ theme: { id: `theme-${Date.now()}`, ...payload } }, { status: 201 });
  }

  const admin = createAdminClient();
  const { data, error: insertError } = await admin
    .from("seasonal_themes")
    .insert(payload)
    .select()
    .single();

  if (insertError) return NextResponse.json({ error: insertError.message }, { status: 500 });
  await logAudit(auth!.profile.id, "create_seasonal_theme", "seasonal_themes", data.id, null, data);
  return NextResponse.json({ theme: data }, { status: 201 });
}
