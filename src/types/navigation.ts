export type SideMenuSectionKey =
  | "home"
  | "materials"
  | "group_buy"
  | "recipes"
  | "search"
  | "member";

export type SideMenuCategorySource = "materials" | "recipes" | "group_buy";

export interface SideMenuCategory {
  id: string;
  name: string;
  slug: string;
  description?: string;
  iconUrl?: string;
  imageUrl?: string;
  parentId?: string | null;
  childCount: number;
  enabled: boolean;
  order: number;
  route: string;
}

export interface SideMenuPanelState {
  id: string;
  level: number;
  section: SideMenuSectionKey;
  title: string;
  categoryId?: string;
  parentCategoryId?: string;
  /** When true, panel is the search UI */
  isSearch?: boolean;
}

export interface SideMenuPrimaryItem {
  id: string;
  label: string;
  icon?: string;
  route?: string;
  section?: SideMenuSectionKey;
  requiresAuth?: boolean;
  enabled: boolean;
  comingSoon?: boolean;
  order: number;
}

export interface SideMenuSearchProduct {
  id: string;
  name: string;
  sku?: string | null;
  price?: number | null;
  imageUrl?: string | null;
  categoryName?: string | null;
  href: string;
}

export interface SideMenuSearchCategory {
  id: string;
  name: string;
  level?: number | null;
  parentName?: string | null;
  href: string;
}

export interface SideMenuSearchRecipe {
  id: string;
  name: string;
  imageUrl?: string | null;
  categoryName?: string | null;
  href: string;
}

export interface SideMenuSearchBrand {
  id: string;
  name: string;
  href: string;
}

export interface SideMenuSearchResponse {
  query: string;
  page: number;
  limit: number;
  hasMore: boolean;
  products: SideMenuSearchProduct[];
  categories: SideMenuSearchCategory[];
  recipes: SideMenuSearchRecipe[];
  brands: SideMenuSearchBrand[];
}

export type RecentBrowseItem = {
  id: string;
  label: string;
  href: string;
  at: number;
};
