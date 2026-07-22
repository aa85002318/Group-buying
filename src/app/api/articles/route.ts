import { NextResponse } from "next/server";
import { isSupabaseConfigured } from "@/lib/config";
import { mockArticles } from "@/lib/mock-data";
import { createClient } from "@/lib/supabase/server";

export async function GET() {
  if (!isSupabaseConfigured()) {
    const articles = mockArticles.filter((a) => a.status === "published");
    return NextResponse.json({ articles });
  }

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("articles")
    .select("id, title, slug, cover_image, category_id, sort_order, is_featured, created_at")
    .eq("status", "published")
    .order("is_featured", { ascending: false })
    .order("sort_order", { ascending: true })
    .order("created_at", { ascending: false });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ articles: data });
}
