import { NextResponse } from "next/server";
import { isSupabaseConfigured } from "@/lib/config";
import { createClient } from "@/lib/supabase/server";

export async function GET(_request: Request, { params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;

  if (!isSupabaseConfigured()) {
    return NextResponse.json({ error: "主題不存在" }, { status: 404 });
  }

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("seasonal_themes")
    .select("*")
    .eq("slug", slug)
    .eq("status", "published")
    .maybeSingle();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  if (!data) return NextResponse.json({ error: "主題不存在" }, { status: 404 });

  return NextResponse.json({ theme: data });
}
