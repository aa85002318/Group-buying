import { createAdminClient } from "@/lib/supabase/admin";
import { isSupabaseConfigured } from "@/lib/config";
import { productPath } from "@/lib/site-links";

export type ShopProductCard = {
  id: string;
  name: string;
  href: string;
  image: string | null;
  spec: string | null;
  price: number;
  stock: number;
  inStock: boolean;
  category: string | null;
};

export async function searchShopProducts(keywords: string[]): Promise<ShopProductCard[]> {
  const terms = keywords
    .map((k) => k.trim().replace(/[%_,.()]/g, " "))
    .filter(Boolean)
    .slice(0, 8);
  if (terms.length === 0 || !isSupabaseConfigured()) return [];

  const admin = createAdminClient();
  const or = terms.map((t) => `name.ilike.%${t}%`).join(",");
  const { data } = await admin
    .from("products")
    .select(
      "id, name, slug, image_url, package_spec, specifications, price, sale_price, stock, is_active, status"
    )
    .eq("is_active", true)
    .or(or)
    .limit(16);

  return (data ?? [])
    .filter((p) => p.status !== "inactive" && Number(p.stock ?? 0) >= 0)
    .map((p) => {
      const price = Number(p.sale_price ?? p.price ?? 0);
      const stock = Number(p.stock ?? 0);
      return {
        id: p.id as string,
        name: p.name as string,
        href: productPath(String(p.slug || p.id)),
        image: (p.image_url as string | null) ?? null,
        spec: (p.package_spec as string | null) ?? (p.specifications as string | null) ?? null,
        price,
        stock,
        inStock: stock > 0,
        category: null,
      };
    })
    .filter((p) => p.inStock)
    .slice(0, 8);
}
