import { NextResponse } from "next/server";
import { isSupabaseConfigured } from "@/lib/config";
import { mockProducts } from "@/lib/mock-data";
import { filterProducts, matchesCategory, matchesSearch, matchesTag } from "@/lib/products";
import { createClient } from "@/lib/supabase/server";
import type { Product } from "@/lib/types/database";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const category = searchParams.get("category");
  const search = searchParams.get("search");
  const tag = searchParams.get("tag");

  if (!isSupabaseConfigured()) {
    const products = filterProducts(mockProducts, { search, category, tag });
    return NextResponse.json({ products });
  }

  const supabase = await createClient();
  let query = supabase
    .from("products")
    .select("*, product_categories(name, slug)")
    .eq("is_active", true)
    .order("created_at", { ascending: false });

  if (category && /^[0-9a-f-]{36}$/i.test(category)) {
    query = query.eq("category_id", category);
  }

  if (search) {
    query = query.or(`name.ilike.%${search}%,description.ilike.%${search}%`);
  }

  const { data, error } = await query;
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  let products = (data ?? []) as Product[];

  if (category && !/^[0-9a-f-]{36}$/i.test(category)) {
    products = products.filter((product) => matchesCategory(product, category));
  }

  if (search) {
    products = products.filter((product) => matchesSearch(product, search));
  }

  if (tag) {
    products = products.filter((product) => matchesTag(product, tag));
  }

  return NextResponse.json({ products });
}
