import { NextResponse } from "next/server";
import { requireContentAdmin, logAudit } from "@/lib/auth";
import { isSupabaseConfigured } from "@/lib/config";
import { mockArticles } from "@/lib/mock-data";
import { createAdminClient } from "@/lib/supabase/admin";
import { cleanRichTextHtml } from "@/lib/cms/safeHtml";

export async function GET(request: Request) {
  const { error } = await requireContentAdmin();
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
    .select("*, article_categories(id, name, slug)")
    .order("is_featured", { ascending: false })
    .order("sort_order", { ascending: true })
    .order("created_at", { ascending: false });

  if (search) query = query.or(`title.ilike.%${search}%,slug.ilike.%${search}%`);
  const categorySlug = searchParams.get("category");
  const categoryId = searchParams.get("category_id");
  if (categoryId) {
    query = query.eq("category_id", categoryId);
  } else if (categorySlug) {
    const { data: cat } = await admin
      .from("article_categories")
      .select("id")
      .eq("slug", categorySlug)
      .maybeSingle();
    if (cat?.id) query = query.eq("category_id", cat.id);
    else return NextResponse.json({ articles: [] });
  }

  const { data, error: fetchError } = await query;
  if (fetchError) return NextResponse.json({ error: fetchError.message }, { status: 500 });
  return NextResponse.json({ articles: data });
}

export async function POST(request: Request) {
  const { error: authError, auth } = await requireContentAdmin();
  if (authError) return authError;

  const body = await request.json();

  if (!isSupabaseConfigured()) {
    const article = {
      id: `art-${Date.now()}`,
      title: body.title,
      slug: body.slug ?? body.title.toLowerCase().replace(/\s+/g, "-"),
      content: cleanRichTextHtml(body.content ?? ""),
      cover_image: body.cover_image ?? null,
      category_id: body.category_id ?? null,
      status: body.status ?? "draft",
      sort_order: body.sort_order ?? 0,
      is_featured: Boolean(body.is_featured),
      title_font: body.title_font ?? null,
      body_font: body.body_font ?? null,
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
      content: cleanRichTextHtml(body.content ?? ""),
      cover_image: body.cover_image ?? null,
      category_id: body.category_id || null,
      status: body.status ?? "draft",
      sort_order: body.sort_order ?? 0,
      is_featured: Boolean(body.is_featured),
      title_font: body.title_font || null,
      body_font: body.body_font || null,
    })
    .select()
    .single();

  if (insertError) return NextResponse.json({ error: insertError.message }, { status: 500 });
  await logAudit(auth!.profile.id, "create", "article", data.id, null, data, request as never);
  return NextResponse.json({ article: data }, { status: 201 });
}
