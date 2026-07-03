import { NextResponse } from "next/server";
import { requireAdmin, logAudit } from "@/lib/auth";
import { isSupabaseConfigured } from "@/lib/config";
import { mockArticles } from "@/lib/mock-data";
import { createAdminClient } from "@/lib/supabase/admin";

export async function GET(request: Request) {
  const { error } = await requireAdmin();
  if (error) return error;

  const { searchParams } = new URL(request.url);
  const search = searchParams.get("search");

  if (!isSupabaseConfigured()) {
    let articles = [...mockArticles];
    if (search) {
      articles = articles.filter((a) => a.title.includes(search) || a.slug.includes(search));
    }
    return NextResponse.json({ articles });
  }

  const admin = createAdminClient();
  let query = admin
    .from("articles")
    .select("*, product_categories(name, slug)")
    .order("sort_order", { ascending: true })
    .order("created_at", { ascending: false });

  if (search) query = query.or(`title.ilike.%${search}%,slug.ilike.%${search}%`);

  const { data, error: fetchError } = await query;
  if (fetchError) return NextResponse.json({ error: fetchError.message }, { status: 500 });
  return NextResponse.json({ articles: data });
}

export async function POST(request: Request) {
  const { error: authError, auth } = await requireAdmin();
  if (authError) return authError;

  const body = await request.json();

  if (!isSupabaseConfigured()) {
    const article = {
      id: `art-${Date.now()}`,
      title: body.title,
      slug: body.slug ?? body.title.toLowerCase().replace(/\s+/g, "-"),
      content: body.content ?? "",
      cover_image: body.cover_image ?? null,
      category_id: body.category_id ?? null,
      status: body.status ?? "draft",
      sort_order: body.sort_order ?? 0,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    mockArticles.push(article);
    return NextResponse.json({ article }, { status: 201 });
  }

  const admin = createAdminClient();
  const { data, error: insertError } = await admin
    .from("articles")
    .insert({
      title: body.title,
      slug: body.slug ?? body.title.toLowerCase().replace(/\s+/g, "-"),
      content: body.content ?? "",
      cover_image: body.cover_image ?? null,
      category_id: body.category_id || null,
      status: body.status ?? "draft",
      sort_order: body.sort_order ?? 0,
    })
    .select()
    .single();

  if (insertError) return NextResponse.json({ error: insertError.message }, { status: 500 });
  await logAudit(auth!.profile.id, "create", "article", data.id, null, data, request as never);
  return NextResponse.json({ article: data }, { status: 201 });
}
