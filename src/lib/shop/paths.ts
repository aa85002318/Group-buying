/** Public shop storefront paths — /shop is the mall; catalog lives under it. */

export const SHOP_HOME = "/shop";
export const SHOP_CATEGORIES = "/shop/categories";
export const SHOP_SEARCH = "/shop/search";

export function shopCategoryHref(slug: string): string {
  return `/shop/category/${encodeURIComponent(slug)}`;
}

/** Product listing / category browse (not the shop hub). */
export function isShopCatalogPath(pathname: string): boolean {
  return (
    pathname === SHOP_CATEGORIES ||
    pathname.startsWith(`${SHOP_CATEGORIES}/`) ||
    pathname.startsWith("/shop/category/")
  );
}

/** Map legacy /baking-materials URLs to /shop catalog paths. */
export function migrateBakingMaterialsHref(href: string): string {
  if (!href) return href;
  if (href === "/baking-materials" || href.startsWith("/baking-materials?")) {
    return href.replace(/^\/baking-materials/, SHOP_CATEGORIES);
  }
  const cat = href.match(/^\/baking-materials\/([^/?#]+)(.*)$/);
  if (cat) {
    return `/shop/category/${cat[1]}${cat[2] ?? ""}`;
  }
  return href;
}
