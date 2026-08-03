/** Shop order-guide + corporate 5:2 info banners (cms_banners placements). */

export const SHOP_ORDER_GUIDE_PLACEMENT = "shop_order_guide";
export const SHOP_CORPORATE_PLACEMENT = "shop_corporate";

export type ShopInfoBannerSlot = "order_guide" | "corporate";

export type ShopInfoBanner = {
  id: string;
  slot: ShopInfoBannerSlot;
  title: string;
  image_url: string;
  mobile_image_url?: string | null;
  link_url: string;
  link_type?: string | null;
  button_text?: string | null;
  alt_text?: string | null;
};

export const DEFAULT_SHOP_INFO_BANNERS: Record<ShopInfoBannerSlot, ShopInfoBanner> = {
  order_guide: {
    id: "default-order-guide",
    slot: "order_guide",
    title: "商品訂購須知",
    image_url: "/images/shop/banners/order-guide.jpg",
    link_url: "/help/order-guide",
    link_type: "page",
    button_text: "了解更多",
    alt_text: "商品訂購須知",
  },
  corporate: {
    id: "default-corporate",
    slot: "corporate",
    title: "企業訂購詢問",
    image_url: "/images/shop/banners/corporate.jpg",
    link_url: "/contact/business",
    link_type: "page",
    button_text: "立即聯繫",
    alt_text: "企業訂購詢問",
  },
};

export function placementForSlot(slot: ShopInfoBannerSlot) {
  return slot === "order_guide" ? SHOP_ORDER_GUIDE_PLACEMENT : SHOP_CORPORATE_PLACEMENT;
}

export function slotForPlacement(placement: string): ShopInfoBannerSlot | null {
  if (placement === SHOP_ORDER_GUIDE_PLACEMENT) return "order_guide";
  if (placement === SHOP_CORPORATE_PLACEMENT) return "corporate";
  return null;
}

export function mapCmsToInfoBanner(
  row: Record<string, unknown>,
  slot: ShopInfoBannerSlot
): ShopInfoBanner {
  const fallback = DEFAULT_SHOP_INFO_BANNERS[slot];
  return {
    id: String(row.id ?? fallback.id),
    slot,
    title: String(row.title ?? fallback.title),
    image_url: String(row.image_url ?? fallback.image_url),
    mobile_image_url: row.mobile_image_url
      ? String(row.mobile_image_url)
      : null,
    link_url: String(row.link_url ?? fallback.link_url),
    link_type: row.link_type ? String(row.link_type) : "page",
    button_text: row.button_text ? String(row.button_text) : fallback.button_text,
    alt_text: row.alt_text ? String(row.alt_text) : fallback.alt_text,
  };
}
