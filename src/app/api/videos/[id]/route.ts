import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/config";
import { getMockRelatedProductsForVideo, mockVideos } from "@/lib/mock-data";
import type { Product } from "@/lib/types/database";

async function fetchRelatedProducts(
  video: { id: string; product_id?: string | null; products?: Product | null },
  supabase: Awaited<ReturnType<typeof createClient>>
): Promise<Product[]> {
  const related: Product[] = [];
  const seen = new Set<string>();

  const bound = video.products ?? (video.product_id
    ? (await supabase.from("products").select("*, product_categories(name, slug)").eq("id", video.product_id).single()).data
    : null);

  if (bound) {
    related.push(bound as Product);
    seen.add(bound.id);

    if (bound.category_id) {
      const { data: sameCategory } = await supabase
        .from("products")
        .select("*, product_categories(name, slug)")
        .eq("category_id", bound.category_id)
        .eq("is_active", true)
        .neq("id", bound.id)
        .limit(5);

      for (const p of sameCategory ?? []) {
        if (!seen.has(p.id)) {
          related.push(p as Product);
          seen.add(p.id);
        }
      }
    }
  }

  if (related.length < 4) {
    const { data: fallback } = await supabase
      .from("products")
      .select("*, product_categories(name, slug)")
      .eq("is_active", true)
      .limit(6);

    for (const p of fallback ?? []) {
      if (!seen.has(p.id)) {
        related.push(p as Product);
        seen.add(p.id);
      }
      if (related.length >= 6) break;
    }
  }

  return related.slice(0, 6);
}

export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  if (!isSupabaseConfigured()) {
    const video = mockVideos.find((v) => v.id === id);
    if (!video) return NextResponse.json({ error: "影片不存在" }, { status: 404 });
    const related_products = getMockRelatedProductsForVideo(id);
    return NextResponse.json({ video, related_products });
  }

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("videos")
    .select("*, products(*, product_categories(name, slug))")
    .eq("id", id)
    .single();

  if (error) return NextResponse.json({ error: "影片不存在" }, { status: 404 });

  const related_products = await fetchRelatedProducts(data, supabase);
  return NextResponse.json({ video: data, related_products });
}
