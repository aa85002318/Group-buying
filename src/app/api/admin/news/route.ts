import { NextResponse } from "next/server";
import { requireAdmin, logAudit } from "@/lib/auth";
import { isSupabaseConfigured } from "@/lib/config";
import { createAdminClient } from "@/lib/supabase/admin";
import { MOCK_NEWS_CATEGORIES, MOCK_NEWS_POSTS } from "@/lib/mock/news";
import { slugifyTitle } from "@/lib/videos/embed";
import { isSafeLinkUrl, sanitizeCmsHtml } from "@/lib/cms/safeHtml";
import { sanitizeAuditPayload } from "@/lib/services/auditService";

export async function GET() {
  const { error } = await requireAdmin();
  if (error) return error;

  if (!isSupabaseConfigured()) {
    return NextResponse.json({
      posts: MOCK_NEWS_POSTS,
      categories: MOCK_NEWS_CATEGORIES,
    });
  }

  const admin = createAdminClient();
  const [{ data: posts, error: fetchError }, { data: categories }] = await Promise.all([
    admin
      .from("news_posts")
      .select("*, news_categories(id, name, slug)")
      .order("updated_at", { ascending: false }),
    admin.from("news_categories").select("*").order("sort_order"),
  ]);

  if (fetchError) return NextResponse.json({ error: fetchError.message }, { status: 500 });
  return NextResponse.json({ posts: posts ?? [], categories: categories ?? [] });
}

export async function POST(request: Request) {
  const { error, auth } = await requireAdmin();
  if (error) return error;

  const body = await request.json();
  const title = String(body.title ?? "").trim();
  if (!title) return NextResponse.json({ error: "請填寫標題" }, { status: 400 });

  if (body.related_url && !isSafeLinkUrl(body.related_url)) {
    return NextResponse.json({ error: "相關連結不合法" }, { status: 400 });
  }

  const status = body.status ?? "draft";
  const payload = {
    title,
    slug: String(body.slug ?? "").trim() || slugifyTitle(title),
    summary: body.summary ?? null,
    cover_image: body.cover_image ?? null,
    category_id: body.category_id || null,
    content: sanitizeCmsHtml(body.content ?? null),
    is_featured: Boolean(body.is_featured),
    is_important: Boolean(body.is_important),
    status,
    published_at:
      status === "published" ? body.published_at ?? new Date().toISOString() : body.published_at ?? null,
    starts_at: body.starts_at || null,
    ends_at: body.ends_at || null,
    related_url: body.related_url || null,
    seo_title: body.seo_title ?? null,
    seo_description: body.seo_description ?? null,
    sort_order: Number(body.sort_order ?? 0),
    created_by: auth!.profile.id,
    updated_by: auth!.profile.id,
  };

  if (!isSupabaseConfigured()) {
    const post = { id: `news-${Date.now()}`, ...payload, created_at: new Date().toISOString(), updated_at: new Date().toISOString() };
    MOCK_NEWS_POSTS.unshift(post as never);
    return NextResponse.json({ post }, { status: 201 });
  }

  const admin = createAdminClient();
  const { data, error: insertError } = await admin.from("news_posts").insert(payload).select().single();
  if (insertError) return NextResponse.json({ error: insertError.message }, { status: 500 });

  await logAudit(
    auth!.profile.id,
    status === "published" ? "publish_news" : "create_news",
    "news_post",
    data.id,
    null,
    sanitizeAuditPayload(data)
  );
  return NextResponse.json({ post: data }, { status: 201 });
}
