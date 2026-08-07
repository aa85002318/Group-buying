import { NextResponse } from "next/server";
import { isSupabaseConfigured } from "@/lib/config";
import { createClient } from "@/lib/supabase/server";
import { GROUP_BUY_CONSUMER_VISIBLE } from "@/lib/features/group-buy-visibility";
import { mapCategoryBySource } from "@/lib/navigation/side-menu-adapter";
import type { SideMenuCategory, SideMenuCategorySource } from "@/types/navigation";

export const dynamic = "force-dynamic";

const SOURCES = new Set<SideMenuCategorySource>([
  "materials",
  "recipes",
  "group_buy",
]);

type RawRow = {
  id: string;
  name: string;
  slug: string;
  description?: string | null;
  icon_url?: string | null;
  shop_home_icon?: string | null;
  parent_id?: string | null;
  sort_order?: number | null;
  is_active?: boolean | null;
  is_main_category?: boolean | null;
};

function tableFor(source: SideMenuCategorySource): string {
  if (source === "recipes") return "recipe_categories";
  if (source === "group_buy") return "group_buy_categories";
  return "product_categories";
}

async function countChildren(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  supabase: any,
  table: string,
  parentId: string
): Promise<number> {
  const { count } = await supabase
    .from(table)
    .select("id", { count: "exact", head: true })
    .eq("parent_id", parentId)
    .eq("is_active", true);
  return count ?? 0;
}

async function mapRows(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  supabase: any,
  source: SideMenuCategorySource,
  table: string,
  rows: RawRow[]
): Promise<SideMenuCategory[]> {
  return Promise.all(
    rows.map(async (row) => {
      const childCount = await countChildren(supabase, table, String(row.id)).catch(
        () => 0
      );
      return mapCategoryBySource(source, row, childCount);
    })
  );
}

export async function GET(request: Request) {
  const url = new URL(request.url);
  const source = url.searchParams.get("source") as SideMenuCategorySource | null;
  const parentId = url.searchParams.get("parentId")?.trim() || null;

  if (!source || !SOURCES.has(source)) {
    return NextResponse.json(
      { error: "source 必須為 materials、recipes 或 group_buy" },
      { status: 400 }
    );
  }

  const cacheHeaders = {
    "Cache-Control": "s-maxage=60, stale-while-revalidate=300",
  };

  if (source === "group_buy" && !GROUP_BUY_CONSUMER_VISIBLE) {
    return NextResponse.json(
      { categories: [] as SideMenuCategory[], comingSoon: true },
      { headers: cacheHeaders }
    );
  }

  if (!isSupabaseConfigured()) {
    return NextResponse.json({ categories: [] as SideMenuCategory[] });
  }

  try {
    const supabase = await createClient();
    const table = tableFor(source);

    const selectCols = "*";

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let q: any = supabase
      .from(table)
      .select(selectCols)
      .eq("is_active", true)
      .order("sort_order", { ascending: true });

    if (parentId) {
      q = q.eq("parent_id", parentId);
    } else if (source === "materials") {
      q = q.eq("is_main_category", true);
    } else {
      q = q.is("parent_id", null);
    }

    let { data, error } = await q.limit(80);

    if (
      !parentId &&
      source === "materials" &&
      !error &&
      (!data || data.length === 0)
    ) {
      const fallback = await supabase
        .from(table)
        .select(selectCols)
        .eq("is_active", true)
        .is("parent_id", null)
        .order("sort_order", { ascending: true })
        .limit(80);
      data = fallback.data;
      error = fallback.error;
    }

    if (error && !parentId && (source === "recipes" || source === "group_buy")) {
      const fallback = await supabase
        .from(table)
        .select(selectCols)
        .eq("is_active", true)
        .order("sort_order", { ascending: true })
        .limit(80);
      if (fallback.error) {
        return NextResponse.json(
          { error: "分類載入失敗", categories: [] },
          { status: 500 }
        );
      }
      const categories = await mapRows(
        supabase,
        source,
        table,
        (fallback.data ?? []) as unknown as RawRow[]
      );
      return NextResponse.json({ categories }, { headers: cacheHeaders });
    }

    if (error) {
      return NextResponse.json(
        { error: error.message, categories: [] },
        { status: 500 }
      );
    }

    const seen = new Set<string>();
    const rows = ((data ?? []) as unknown as RawRow[]).filter((row) => {
      const id = String(row.id);
      if (seen.has(id)) return false;
      seen.add(id);
      return true;
    });

    const categories = await mapRows(supabase, source, table, rows);
    return NextResponse.json({ categories }, { headers: cacheHeaders });
  } catch {
    return NextResponse.json(
      { error: "分類載入失敗", categories: [] },
      { status: 500 }
    );
  }
}
