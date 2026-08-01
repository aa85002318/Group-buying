import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/config";
import {
  DEFAULT_INSPIRATION_POSTS,
  mapInspirationRow,
} from "@/lib/shop/inspiration";

export const dynamic = "force-dynamic";

/** GET /api/shop/inspiration — active masonry posts */
export async function GET() {
  if (!isSupabaseConfigured()) {
    return NextResponse.json({ posts: DEFAULT_INSPIRATION_POSTS });
  }

  try {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from("shop_inspiration_posts")
      .select("*")
      .eq("is_active", true)
      .order("sort_order", { ascending: true });

    if (error || !data?.length) {
      return NextResponse.json({ posts: DEFAULT_INSPIRATION_POSTS });
    }

    return NextResponse.json({
      posts: data.map((row) => mapInspirationRow(row as Record<string, unknown>)),
    });
  } catch {
    return NextResponse.json({ posts: DEFAULT_INSPIRATION_POSTS });
  }
}
