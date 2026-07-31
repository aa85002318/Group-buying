import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/config";
import {
  DEFAULT_SHOP_CATEGORIES,
  type ShopCategoryItem,
} from "@/lib/shop/categories";

/**
 * GET /api/shop/home-categories
 * Returns up to 8 product categories flagged for shop home menu.
 * 「全部分類」 is appended on the client — never returned from DB.
 */
export async function GET() {
  if (!isSupabaseConfigured()) {
    return NextResponse.json({ categories: DEFAULT_SHOP_CATEGORIES });
  }

  try {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from("product_categories")
      .select(
        "id, name, slug, shop_home_icon, shop_home_bg_color, shop_home_sort_order, icon_url"
      )
      .eq("show_on_shop_home", true)
      .eq("is_active", true)
      .order("shop_home_sort_order", { ascending: true })
      .limit(8);

    if (error || !data?.length) {
      return NextResponse.json({ categories: DEFAULT_SHOP_CATEGORIES });
    }

    const categories: ShopCategoryItem[] = data.map((row) => ({
      id: String(row.id),
      name: String(row.name),
      href: `/baking-materials/${row.slug}`,
      image:
        (row.shop_home_icon as string) ||
        (row.icon_url as string) ||
        undefined,
      bgColor: (row.shop_home_bg_color as string) || "#F1F2F7",
    }));

    return NextResponse.json({ categories });
  } catch {
    return NextResponse.json({ categories: DEFAULT_SHOP_CATEGORIES });
  }
}
