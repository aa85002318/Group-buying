import { NextResponse } from "next/server";
import { isSupabaseConfigured } from "@/lib/config";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

/** Public CMS: banners, homepage blocks, pages, store announcements */
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const type = searchParams.get("type") ?? "home";
  const slug = searchParams.get("slug");

  if (!isSupabaseConfigured()) {
    return NextResponse.json({
      banners: [],
      blocks: [],
      announcements: [],
      page: null,
    });
  }

  const supabase = await createClient();
  const admin = createAdminClient();

  if (type === "page" && slug) {
    const { data } = await supabase
      .from("cms_pages")
      .select("*")
      .eq("slug", slug)
      .eq("is_published", true)
      .maybeSingle();
    return NextResponse.json({ page: data });
  }

  const [banners, blocks, announcements] = await Promise.all([
    admin
      .from("cms_banners")
      .select("*")
      .eq("is_active", true)
      .order("sort_order", { ascending: true }),
    supabase
      .from("homepage_blocks")
      .select("*")
      .eq("is_visible", true)
      .order("sort_order", { ascending: true }),
    supabase
      .from("store_announcements")
      .select("*")
      .eq("is_active", true)
      .order("created_at", { ascending: false })
      .limit(10),
  ]);

  return NextResponse.json({
    banners: banners.data ?? [],
    blocks: blocks.data ?? [],
    announcements: announcements.data ?? [],
  });
}
