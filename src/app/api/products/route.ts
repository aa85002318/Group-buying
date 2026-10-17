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
  // Additive: optional channel filter (website | group_buy | store_only)
  const channel = searchParams.get("channel");
  const scope = searchParams.get("scope");

  if (!isSupabaseConfigured()) {
    let products = filterProducts(mockProducts, { search, category, tag });
    if (scope === "baking" || scope === "chime_select") {
      products = products.filter((p) => (p.product_scope ?? "baking") === scope);
    }
    return NextResponse.json({ products });
  }

  const supabase = await createClient();
  let query = supabase
    .from("products")
    // product_category_links 是既有的多對多關聯：首頁「商品展示區域」指定分類時
    // 要靠它判斷商品屬於哪些分類（商品可以同時掛在多個分類底下）。
    .select(
      "*, product_categories:product_categories!products_primary_category_id_fkey(name, slug), product_category_links(category_id)"
    )
    .eq("is_active", true)
    .order("created_at", { ascending: false });

  if (category && /^[0-9a-f-]{36}$/i.test(category)) {
    query = query.eq("category_id", category);
  }

  if (search) {
    query = query.or(`name.ilike.%${search}%,description.ilike.%${search}%`);
  }

  if (channel === "website") {
    query = query.eq("publish_website", true);
  } else if (channel === "group_buy") {
    query = query.eq("publish_group_buy", true);
  } else if (channel === "store_only") {
    query = query.eq("publish_store", true);
  }

  if (scope === "baking" || scope === "chime_select") {
    query = query.eq("product_scope", scope);
  }

  const { data, error } = await query;
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  // 把關聯攤平成 category_ids，前台挑商品時直接用，不用再多打一支 API。
  let products = ((data ?? []) as Array<Record<string, unknown>>).map((row) => {
    const links = Array.isArray(row.product_category_links)
      ? (row.product_category_links as Array<{ category_id?: string }>)
      : [];
    const ids = links.map((l) => l?.category_id).filter((id): id is string => Boolean(id));
    const rest = { ...row };
    delete rest.product_category_links;
    return { ...rest, category_ids: ids } as Product;
  });

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
