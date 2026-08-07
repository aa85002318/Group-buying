import { shopCategoryHref } from "@/lib/shop/paths";
import type { SideMenuCategory, SideMenuCategorySource } from "@/types/navigation";

type RawCategoryRow = {
  id: string;
  name: string;
  slug: string;
  description?: string | null;
  icon_url?: string | null;
  shop_home_icon?: string | null;
  image_url?: string | null;
  cover_image?: string | null;
  parent_id?: string | null;
  sort_order?: number | null;
  is_active?: boolean | null;
  child_count?: number | null;
};

export function mapProductCategoryRow(
  row: RawCategoryRow,
  childCount = 0
): SideMenuCategory {
  return {
    id: String(row.id),
    name: String(row.name),
    slug: String(row.slug),
    description: row.description?.trim() || undefined,
    iconUrl: row.shop_home_icon || row.icon_url || undefined,
    imageUrl: row.shop_home_icon || row.icon_url || undefined,
    parentId: row.parent_id ?? null,
    childCount: Number(row.child_count ?? childCount) || 0,
    enabled: row.is_active !== false,
    order: Number(row.sort_order ?? 0),
    route: shopCategoryHref(String(row.slug)),
  };
}

export function mapRecipeCategoryRow(
  row: RawCategoryRow,
  childCount = 0
): SideMenuCategory {
  return {
    id: String(row.id),
    name: String(row.name),
    slug: String(row.slug),
    description: row.description?.trim() || undefined,
    iconUrl: row.icon_url || row.cover_image || row.image_url || undefined,
    imageUrl: row.cover_image || row.image_url || row.icon_url || undefined,
    parentId: row.parent_id ?? null,
    childCount: Number(row.child_count ?? childCount) || 0,
    enabled: row.is_active !== false,
    order: Number(row.sort_order ?? 0),
    route: `/recipes?category=${encodeURIComponent(String(row.slug))}`,
  };
}

export function mapGroupBuyCategoryRow(
  row: RawCategoryRow,
  childCount = 0
): SideMenuCategory {
  return {
    id: String(row.id),
    name: String(row.name),
    slug: String(row.slug),
    description: row.description?.trim() || undefined,
    iconUrl: row.icon_url || row.image_url || undefined,
    imageUrl: row.image_url || row.icon_url || undefined,
    parentId: row.parent_id ?? null,
    childCount: Number(row.child_count ?? childCount) || 0,
    enabled: row.is_active !== false,
    order: Number(row.sort_order ?? 0),
    route: `/group-buy?category=${encodeURIComponent(String(row.slug))}`,
  };
}

export function mapCategoryBySource(
  source: SideMenuCategorySource,
  row: RawCategoryRow,
  childCount = 0
): SideMenuCategory {
  if (source === "recipes") return mapRecipeCategoryRow(row, childCount);
  if (source === "group_buy") return mapGroupBuyCategoryRow(row, childCount);
  return mapProductCategoryRow(row, childCount);
}
