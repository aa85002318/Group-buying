import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/config";
import {
  DEFAULT_SHOP_CATEGORIES,
  type ShopCategoryItem,
} from "@/lib/shop/categories";
import { shopCategoryHref } from "@/lib/shop/paths";

export const dynamic = "force-dynamic";

/**
 * GET /api/shop/main-categories
 * Active main categories flagged for shop home (max 8).
 * 「全部分類」 is appended on the client — never returned from DB.
 */
export async function GET() {
  if (!isSupabaseConfigured()) {
    return NextResponse.json({ categories: DEFAULT_SHOP_CATEGORIES });
  }

  try {
    const supabase = await createClient();
    let { data, error } = await supabase
      .from("product_categories")
      .select(
        "id, name, slug, shop_home_icon, shop_home_bg_color, shop_home_sort_order, icon_url, custom_link"
      )
      .eq("show_on_shop_home", true)
      .eq("is_active", true)
      .eq("is_main_category", true)
      .order("shop_home_sort_order", { ascending: true })
      .limit(8);

    if (error || !data?.length) {
      const fallback = await supabase
        .from("product_categories")
        .select(
          "id, name, slug, shop_home_icon, shop_home_bg_color, shop_home_sort_order, icon_url, custom_link"
        )
        .eq("show_on_shop_home", true)
        .eq("is_active", true)
        .order("shop_home_sort_order", { ascending: true })
        .limit(8);

      data = fallback.data;
      error = fallback.error;
    }

    if (error || !data?.length) {
      return NextResponse.json({ categories: DEFAULT_SHOP_CATEGORIES });
    }

    const categories: ShopCategoryItem[] = data.map((row) => ({
      id: String(row.id),
      name: String(row.name),
      href: row.custom_link?.trim()
        ? String(row.custom_link).trim()
        : shopCategoryHref(String(row.slug)),
      image:
        (row.shop_home_icon as string) ||
        (row.icon_url as string) ||
        undefined,
      bgColor: (row.shop_home_bg_color as string) || "#FFF4CC",
    }));

    return NextResponse.json({ categories });
  } catch {
    return NextResponse.json({ categories: DEFAULT_SHOP_CATEGORIES });
  }
}
