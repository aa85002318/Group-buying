/** Shop home 16:9 promo banner (cms_banners.placement = shop_promo). */

export type ShopPromoLinkType =
  | "product"
  | "category"
  | "page"
  | "article"
  | "external";

export type ShopPromoBanner = {
  id: string;
  title: string;
  desktop_image_url: string;
  mobile_image_url?: string;
  link_type: ShopPromoLinkType;
  link_url?: string;
  button_text?: string;
  sort_order: number;
  is_active: boolean;
  starts_at?: string;
  ends_at?: string;
  subtitle?: string | null;
};

export const SHOP_PROMO_PLACEMENT = "shop_promo";

export const SHOP_PROMO_LINK_TYPES: { value: ShopPromoLinkType; label: string }[] = [
  { value: "product", label: "商品" },
  { value: "category", label: "商品分類" },
  { value: "page", label: "站內頁面" },
  { value: "article", label: "文章" },
  { value: "external", label: "外部連結" },
];

export function inferShopPromoLinkType(url: string | null | undefined): ShopPromoLinkType {
  const href = (url ?? "").trim();
  if (!href) return "page";
  if (/^https?:\/\//i.test(href)) return "external";
  if (href.startsWith("/products/")) return "product";
  if (href.startsWith("/shop/category") || href.startsWith("/baking-materials/")) {
    return "category";
  }
  if (href.startsWith("/articles/") || href.startsWith("/news/")) return "article";
  return "page";
}

export function isShopPromoBannerLive(
  banner: Pick<ShopPromoBanner, "is_active" | "starts_at" | "ends_at">,
  now = new Date()
): boolean {
  if (!banner.is_active) return false;
  if (banner.starts_at && new Date(banner.starts_at) > now) return false;
  if (banner.ends_at && new Date(banner.ends_at) < now) return false;
  return true;
}

export function isExternalHref(href: string): boolean {
  return /^https?:\/\//i.test(href.trim());
}
