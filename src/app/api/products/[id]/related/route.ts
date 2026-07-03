import { NextResponse } from "next/server";
import { isSupabaseConfigured } from "@/lib/config";
import { mockProducts } from "@/lib/mock-data";
import { pickRecommendedProducts } from "@/lib/products";
import { createClient } from "@/lib/supabase/server";
import type { Product } from "@/lib/types/database";

export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const limit = 4;

  if (!isSupabaseConfigured()) {
    const current = mockProducts.find((p) => p.id === id);
    const products = pickRecommendedProducts(id, current?.category_id, mockProducts, limit);
    return NextResponse.json({ products });
  }

  const supabase = await createClient();

  const { data: current } = await supabase
    .from("products")
    .select("id, category_id")
    .eq("id", id)
    .eq("is_active", true)
    .maybeSingle();

  if (!current) {
    return NextResponse.json({ products: [] });
  }

  const { data, error } = await supabase
    .from("products")
    .select("*, product_categories(name, slug)")
    .eq("is_active", true)
    .neq("id", id)
    .order("created_at", { ascending: false })
    .limit(24);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  const products = pickRecommendedProducts(
    id,
    current.category_id,
    (data ?? []) as Product[],
    limit
  );

  return NextResponse.json({ products });
}
