import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { isSupabaseConfigured } from "@/lib/config";
import { getMockProductById } from "@/lib/mock-data";
import {
  resolveContentImages,
  resolveProductGallery,
} from "@/lib/products/product-images";

export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  if (!isSupabaseConfigured()) {
    const product = getMockProductById(id);
    if (!product) return NextResponse.json({ error: "商品不存在" }, { status: 404 });
    return NextResponse.json({
      product,
      gallery: resolveProductGallery(product),
      content_images: [],
      variants: [],
      related_recipes: [],
      related_products: [],
    });
  }

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("products")
    .select("*, product_categories:product_categories!products_primary_category_id_fkey(name, slug)")
    .eq("id", id)
    .eq("is_active", true)
    .single();

  if (error || !data) {
    return NextResponse.json({ error: "商品不存在" }, { status: 404 });
  }

  let productImages: unknown[] = [];
  try {
    const admin = createAdminClient();
    const { data: rows } = await admin
      .from("product_images")
      .select("*")
      .eq("product_id", id)
      .eq("is_active", true)
      .order("sort_order", { ascending: true });
    productImages = rows ?? [];
  } catch {
    productImages = [];
  }

  let variants: unknown[] = [];
  try {
    const { data: vrows } = await supabase
      .from("product_variants")
      .select("*")
      .eq("product_id", id)
      .eq("is_active", true)
      .order("sort_order", { ascending: true });
    variants = vrows ?? [];
  } catch {
    variants = [];
  }

  const gallery = resolveProductGallery({
    image_url: data.image_url,
    images: data.images,
    product_images: productImages as never,
  });
  const content_images = resolveContentImages({
    content_images: (data as { content_images?: unknown }).content_images,
    product_images: productImages as never,
  });

  // Related recipes: manual IDs then ingredient/recommendation soft-fail
  let related_recipes: Array<Record<string, unknown>> = [];
  const manualRecipeIds = Array.isArray((data as { related_recipe_ids?: string[] }).related_recipe_ids)
    ? ((data as { related_recipe_ids: string[] }).related_recipe_ids)
    : [];
  try {
    const admin = createAdminClient();
    if (manualRecipeIds.length > 0) {
      const { data: recipes } = await admin
        .from("recipes")
        .select("id, title, name, cover_image_url, image_url, difficulty, total_minutes, slug, status")
        .in("id", manualRecipeIds.slice(0, 4));
      related_recipes = (recipes ?? []).filter(
        (r) => !r.status || r.status === "published"
      ) as Record<string, unknown>[];
    }
    if (related_recipes.length === 0) {
      const { data: links } = await admin
        .from("recipe_product_recommendations")
        .select("recipe_id")
        .eq("product_id", id)
        .limit(4);
      const ids = (links ?? []).map((l) => l.recipe_id).filter(Boolean);
      if (ids.length) {
        const { data: recipes } = await admin
          .from("recipes")
          .select("id, title, name, cover_image_url, image_url, difficulty, total_minutes, slug, status")
          .in("id", ids);
        related_recipes = (recipes ?? []).filter(
          (r) => !r.status || r.status === "published"
        ) as Record<string, unknown>[];
      }
    }
  } catch {
    related_recipes = [];
  }

  // Related / frequently bought
  let related_products: unknown[] = [];
  const manualProductIds = Array.isArray((data as { related_product_ids?: string[] }).related_product_ids)
    ? ((data as { related_product_ids: string[] }).related_product_ids)
    : [];
  try {
    if (manualProductIds.length > 0) {
      const { data: products } = await supabase
        .from("products")
        .select("id, name, price, original_price, image_url, stock, is_active, status")
        .in("id", manualProductIds.slice(0, 6))
        .eq("is_active", true);
      related_products = products ?? [];
    }
    if (related_products.length === 0 && data.category_id) {
      const { data: products } = await supabase
        .from("products")
        .select("id, name, price, original_price, image_url, stock, is_active, status")
        .eq("category_id", data.category_id)
        .eq("is_active", true)
        .neq("id", id)
        .order("is_hot", { ascending: false })
        .limit(6);
      related_products = (products ?? []).filter(
        (p) => !String(p.name ?? "").includes("[DEMO]")
      );
    }
  } catch {
    related_products = [];
  }

  return NextResponse.json({
    product: data,
    gallery,
    content_images,
    variants,
    related_recipes,
    related_products,
  });
}
