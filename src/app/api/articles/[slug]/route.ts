import { NextResponse } from "next/server";
import { isSupabaseConfigured } from "@/lib/config";
import { mockArticles } from "@/lib/mock-data";
import { createClient } from "@/lib/supabase/server";

export async function GET(_request: Request, { params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;

  if (!isSupabaseConfigured()) {
    const article = mockArticles.find((a) => a.slug === slug && a.status === "published");
    if (!article) return NextResponse.json({ error: "文章不存在" }, { status: 404 });
    return NextResponse.json({ article });
  }

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("articles")
    .select("*")
    .eq("slug", slug)
    .eq("status", "published")
    .single();

  if (error) return NextResponse.json({ error: "文章不存在" }, { status: 404 });
  return NextResponse.json({ article: data });
}
