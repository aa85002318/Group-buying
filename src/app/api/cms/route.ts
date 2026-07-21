import { NextResponse } from "next/server";
import { isSupabaseConfigured } from "@/lib/config";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import type { CmsBanner } from "@/lib/types/database";

function isBannerLive(b: CmsBanner, now: Date): boolean {
  if (!b.is_active) return false;
  if (b.status && b.status !== "active") return false;
  if (b.starts_at && new Date(b.starts_at) > now) return false;
  if (b.ends_at && new Date(b.ends_at) < now) return false;
  return true;
}

/** Public CMS: banners, homepage blocks, pages, store announcements */
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const type = searchParams.get("type") ?? "home";
  const slug = searchParams.get("slug");
  const placement = searchParams.get("placement");

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

  if (type === "banners" || placement) {
    let query = admin.from("cms_banners").select("*").eq("is_active", true).order("sort_order", {
      ascending: true,
    });
    if (placement) query = query.eq("placement", placement);
    const { data } = await query;
    const now = new Date();
    const banners = ((data ?? []) as CmsBanner[]).filter((b) => isBannerLive(b, now));
    return NextResponse.json({ banners });
  }

  const [bannersRes, blocks, announcements] = await Promise.all([
    admin.from("cms_banners").select("*").eq("is_active", true).order("sort_order", { ascending: true }),
    // Return all blocks (incl. hidden) so the home page can honor is_visible / display_count
    supabase.from("homepage_blocks").select("*").order("sort_order", { ascending: true }),
    supabase
      .from("store_announcements")
      .select("*")
      .eq("is_active", true)
      .order("created_at", { ascending: false })
      .limit(10),
  ]);

  const now = new Date();
  const banners = ((bannersRes.data ?? []) as CmsBanner[]).filter((b) => isBannerLive(b, now));

  return NextResponse.json({
    banners,
    blocks: blocks.data ?? [],
    announcements: announcements.data ?? [],
  });
}
