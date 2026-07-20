import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/config";
import { MOCK_NEWS_CATEGORIES, MOCK_NEWS_POSTS } from "@/lib/mock/news";
import type { NewsItem, NewsCategory } from "@/lib/consumer-hub";
import type { NewsPost } from "@/lib/types/database";
import { formatDate } from "@/lib/utils";

function toNewsItem(post: NewsPost): NewsItem {
  const slug = (post.news_categories?.slug ?? "system") as NewsCategory;
  return {
    id: post.id,
    title: post.title,
    summary: post.summary ?? "",
    category: slug === "all" ? "system" : slug,
    publishedAt: post.published_at ? formatDate(post.published_at) : formatDate(post.created_at),
    imageUrl: post.cover_image,
    pinned: post.is_featured,
    important: post.is_important,
    href: `/news/${post.slug}`,
  };
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const category = searchParams.get("category");
  const q = searchParams.get("q")?.trim().toLowerCase() ?? "";

  if (!isSupabaseConfigured()) {
    let list = [...MOCK_NEWS_POSTS];
    if (category && category !== "all") {
      list = list.filter((n) => n.news_categories?.slug === category);
    }
    if (q) {
      list = list.filter(
        (n) =>
          n.title.toLowerCase().includes(q) ||
          (n.summary ?? "").toLowerCase().includes(q)
      );
    }
    list.sort((a, b) => Number(b.is_featured) - Number(a.is_featured));
    return NextResponse.json({
      news: list.map(toNewsItem),
      categories: MOCK_NEWS_CATEGORIES,
    });
  }

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("news_posts")
    .select("*, news_categories(id, name, slug)")
    .eq("status", "published")
    .order("is_featured", { ascending: false })
    .order("published_at", { ascending: false });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  let posts = (data ?? []) as NewsPost[];
  if (category && category !== "all") {
    posts = posts.filter((n) => n.news_categories?.slug === category);
  }
  if (q) {
    posts = posts.filter(
      (n) =>
        n.title.toLowerCase().includes(q) ||
        (n.summary ?? "").toLowerCase().includes(q)
    );
  }

  const { data: categories } = await supabase
    .from("news_categories")
    .select("*")
    .eq("is_active", true)
    .order("sort_order");

  return NextResponse.json({
    news: posts.map(toNewsItem),
    categories: categories ?? [],
  });
}
