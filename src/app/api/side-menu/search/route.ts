import { NextResponse } from "next/server";
import { isSupabaseConfigured } from "@/lib/config";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { shopCategoryHref } from "@/lib/shop/paths";
import type { SideMenuSearchResponse } from "@/types/navigation";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const q = url.searchParams.get("q")?.trim() ?? "";
  const page = Math.max(1, Number(url.searchParams.get("page") ?? "1") || 1);
  const limit = Math.min(
    20,
    Math.max(1, Number(url.searchParams.get("limit") ?? "20") || 20)
  );

  const empty: SideMenuSearchResponse = {
    query: q,
    page,
    limit,
    hasMore: false,
    products: [],
    categories: [],
    recipes: [],
    brands: [],
  };

  if (!q || q.length < 2) {
    return NextResponse.json(empty);
  }

  if (!isSupabaseConfigured()) {
    return NextResponse.json(empty);
  }

  const pattern = `%${q}%`;
  const supabase = await createClient();
  const admin = createAdminClient();
  const from = (page - 1) * limit;

  const productsRes = await supabase
    .from("products")
    .select(
      "id, name, sku, price, image_url, product_categories:product_categories!products_primary_category_id_fkey(name)",
      { count: "exact" }
    )
    .eq("is_active", true)
    .or(`name.ilike.${pattern},sku.ilike.${pattern}`)
    .range(from, from + limit - 1);

  const categoriesRes = await supabase
    .from("product_categories")
    .select("id, name, slug, level, parent_id, is_active")
    .eq("is_active", true)
    .or(`name.ilike.${pattern},slug.ilike.${pattern}`)
    .limit(10);

  let recipes: Array<{
    id: string;
    title: string;
    slug?: string | null;
    cover_image?: string | null;
    recipe_categories?: { name?: string; slug?: string } | null;
  }> = [];
  try {
    const recipesRes = await admin
      .from("recipes")
      .select("id, title, slug, cover_image, recipe_categories(name, slug)")
      .ilike("title", pattern)
      .limit(10);
    recipes = (recipesRes.data ?? []) as typeof recipes;
  } catch {
    recipes = [];
  }

  const brandsRes = await admin
    .from("brands")
    .select("id, name, slug")
    .eq("is_active", true)
    .ilike("name", pattern)
    .limit(10);

  const products = ((productsRes.data ?? []) as unknown as Array<{
    id: string;
    name: string;
    sku?: string | null;
    price?: number | null;
    image_url?: string | null;
    product_categories?: { name?: string } | { name?: string }[] | null;
  }>).map((p) => {
    const cat = Array.isArray(p.product_categories)
      ? p.product_categories[0]
      : p.product_categories;
    return {
      id: String(p.id),
      name: String(p.name),
      sku: p.sku ?? null,
      price: typeof p.price === "number" ? p.price : Number(p.price) || null,
      imageUrl: p.image_url ?? null,
      categoryName: cat?.name ?? null,
      href: `/products/${p.id}`,
    };
  });

  const categories = ((categoriesRes.data ?? []) as unknown as Array<{
    id: string;
    name: string;
    slug: string;
    level?: number | null;
  }>).map((c) => ({
    id: String(c.id),
    name: String(c.name),
    level: c.level ?? null,
    parentName: null as string | null,
    href: shopCategoryHref(String(c.slug)),
  }));

  try {
    const recipeCats = await admin
      .from("recipe_categories")
      .select("id, name, slug")
      .eq("is_active", true)
      .ilike("name", pattern)
      .limit(5);
    for (const c of recipeCats.data ?? []) {
      categories.push({
        id: `recipe-cat-${c.id}`,
        name: String(c.name),
        level: 1,
        parentName: "食譜分類",
        href: `/recipes?category=${encodeURIComponent(String(c.slug))}`,
      });
    }
  } catch {
    // ignore
  }

  const recipeHits = recipes.map((r) => ({
    id: String(r.id),
    name: String(r.title),
    imageUrl: r.cover_image ?? null,
    categoryName: r.recipe_categories?.name ?? null,
    href: r.slug ? `/recipes/${r.slug}` : `/recipes/${r.id}`,
  }));

  const brands = (brandsRes.data ?? []).map(
    (b: { id: string; name: string; slug?: string | null }) => ({
      id: String(b.id),
      name: String(b.name),
      href: `/shop?brand=${encodeURIComponent(String(b.slug ?? b.id))}`,
    })
  );

  const totalProducts = productsRes.count ?? products.length;
  const hasMore = from + products.length < totalProducts;

  const body: SideMenuSearchResponse = {
    query: q,
    page,
    limit,
    hasMore,
    products,
    categories: categories.slice(0, 10),
    recipes: recipeHits,
    brands,
  };

  return NextResponse.json(body);
}
