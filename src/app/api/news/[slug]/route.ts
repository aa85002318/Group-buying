import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/config";
import { getMockNewsBySlug, MOCK_NEWS_POSTS } from "@/lib/mock/news";
import { sanitizeCmsHtml } from "@/lib/cms/safeHtml";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params;

  if (!isSupabaseConfigured()) {
    const post = getMockNewsBySlug(slug);
    if (!post) return NextResponse.json({ error: "找不到資訊" }, { status: 404 });
    const related = MOCK_NEWS_POSTS.filter((n) => n.id !== post.id).slice(0, 3);
    return NextResponse.json({
      post: { ...post, content: sanitizeCmsHtml(post.content) },
      related,
    });
  }

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("news_posts")
    .select("*, news_categories(id, name, slug)")
    .eq("slug", slug)
    .eq("status", "published")
    .maybeSingle();

  if (error || !data) {
    return NextResponse.json({ error: "找不到資訊或尚未發布" }, { status: 404 });
  }

  const { data: related } = await supabase
    .from("news_posts")
    .select("id, title, slug, summary, is_featured, is_important, published_at, news_categories(name, slug)")
    .eq("status", "published")
    .neq("id", data.id)
    .order("published_at", { ascending: false })
    .limit(4);

  return NextResponse.json({
    post: { ...data, content: sanitizeCmsHtml(data.content) },
    related: related ?? [],
  });
}
