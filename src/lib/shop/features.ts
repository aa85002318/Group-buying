/** Shop home feature highlight blocks (fixed 3 slots — banner images). */

export type ShopFeatureIconKey = "truck" | "shield" | "gift" | "package" | "star" | "heart";

export type ShopFeature = {
  id: string;
  icon?: ShopFeatureIconKey | string;
  title?: string;
  subtitle?: string;
  image_url?: string | null;
  link_type: "internal" | "external";
  link_url: string;
  background_color?: string;
  sort_order: number;
  is_active: boolean;
};

export const SHOP_FEATURE_ICON_OPTIONS: {
  value: ShopFeatureIconKey;
  label: string;
}[] = [
  { value: "truck", label: "貨車／配送" },
  { value: "shield", label: "盾牌／安心" },
  { value: "gift", label: "禮物／會員" },
  { value: "package", label: "包裹" },
  { value: "star", label: "星星" },
  { value: "heart", label: "愛心" },
];

export const DEFAULT_SHOP_FEATURES: ShopFeature[] = [
  {
    id: "feat-1",
    icon: "truck",
    title: "滿額 $1500 免運",
    subtitle: "全程冷鏈配送",
    image_url: null,
    link_type: "internal",
    link_url: "/shop/categories",
    background_color: "#F1F6FF",
    sort_order: 1,
    is_active: true,
  },
  {
    id: "feat-2",
    icon: "shield",
    title: "快速出貨",
    subtitle: "天天出貨更安心",
    image_url: null,
    link_type: "internal",
    link_url: "/support/shipping",
    background_color: "#FFF6E6",
    sort_order: 2,
    is_active: true,
  },
  {
    id: "feat-3",
    icon: "gift",
    title: "會員專屬優惠",
    subtitle: "點數回饋折抵",
    image_url: null,
    link_type: "internal",
    link_url: "/member/benefits",
    background_color: "#FFF1F3",
    sort_order: 3,
    is_active: true,
  },
];

export function isExternalShopFeatureLink(url: string, linkType?: string) {
  if (linkType === "external") return true;
  return /^https?:\/\//i.test(url) || url.startsWith("//");
}
