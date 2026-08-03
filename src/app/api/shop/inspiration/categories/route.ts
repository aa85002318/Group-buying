import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/config";
import {
  INSPIRATION_SYSTEM_CATEGORIES,
  INSPIRATION_WALL_CATEGORIES,
  type InspirationCategoryItem,
} from "@/lib/shop/inspiration-wall";

/** GET /api/shop/inspiration/categories — DB wall categories + system hot/all */
export async function GET() {
  if (!isSupabaseConfigured()) {
    return NextResponse.json({ categories: INSPIRATION_WALL_CATEGORIES });
  }

  try {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from("recipe_categories")
      .select("id, name, slug, image_url, inspiration_sort_order, show_on_inspiration_wall, is_active")
      .eq("is_active", true)
      .eq("show_on_inspiration_wall", true)
      .order("inspiration_sort_order", { ascending: true })
      .order("sort_order", { ascending: true });

    if (error || !data?.length) {
      return NextResponse.json({ categories: INSPIRATION_WALL_CATEGORIES });
    }

    const mid: InspirationCategoryItem[] = data.map((row) => ({
      id: String(row.id),
      label: String(row.name),
      slug: String(row.slug),
      icon: "🧁",
      image_url: row.image_url ? String(row.image_url) : null,
    }));

    const categories = [
      INSPIRATION_SYSTEM_CATEGORIES[0],
      ...mid,
      INSPIRATION_SYSTEM_CATEGORIES[1],
    ];

    return NextResponse.json({ categories });
  } catch {
    return NextResponse.json({ categories: INSPIRATION_WALL_CATEGORIES });
  }
}
