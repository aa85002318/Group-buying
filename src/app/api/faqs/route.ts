import { NextResponse } from "next/server";
import { isSupabaseConfigured } from "@/lib/config";
import { createClient } from "@/lib/supabase/server";
import { stripHtmlToText } from "@/lib/cms/safeHtml";

export async function GET(request: Request) {
  const category = new URL(request.url).searchParams.get("category");

  if (!isSupabaseConfigured()) {
    return NextResponse.json({ faqs: [], featured: [] });
  }

  const supabase = await createClient();
  let query = supabase
    .from("faqs")
    .select("*")
    .eq("is_active", true)
    .order("sort_order")
    .order("created_at");

  if (category) query = query.eq("category", category);

  const { data, error } = await query;

  if (error) {
    if (error.code === "42P01") return NextResponse.json({ faqs: [], featured: [] });
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const faqs = (data ?? []).map((f) => ({
    id: f.id,
    category: f.category,
    question: stripHtmlToText(f.question),
    answer: stripHtmlToText(f.answer),
    sort_order: f.sort_order,
    is_featured: Boolean(f.is_featured),
  }));

  return NextResponse.json({
    faqs,
    featured: faqs.filter((f) => f.is_featured),
  });
}
