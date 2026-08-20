/** Shop home quick-entry tiles (max 4 on storefront). */

export const SHOP_QUICK_LINK_ICON_KEYS = [
  "percent",
  "bag",
  "flame",
  "gift",
  "star",
  "tag",
] as const;

export type ShopQuickLinkIconKey = (typeof SHOP_QUICK_LINK_ICON_KEYS)[number];

export type ShopQuickLinkTargetType =
  | "category"
  | "product"
  | "article"
  | "internal_page"
  | "external_url";

export type ShopQuickLink = {
  id: string;
  title: string;
  subtitle: string | null;
  icon_type: "system_icon" | "custom_image";
  icon_key: ShopQuickLinkIconKey;
  icon_image_url: string | null;
  icon_image_path: string | null;
  background_color: string;
  text_color: string;
  badge_text: string | null;
  badge_color: string | null;
  target_type: ShopQuickLinkTargetType;
  target_url: string;
  sort_order: number;
  is_active: boolean;
};

export const DEFAULT_SHOP_QUICK_LINKS: ShopQuickLink[] = [
  {
    id: "ql-sale",
    title: "本週優惠",
    subtitle: null,
    icon_type: "system_icon",
    icon_key: "percent",
    icon_image_url: null,
    icon_image_path: null,
    background_color: "#FFFFFF",
    text_color: "#153E73",
    badge_text: "HOT",
    badge_color: "#F16458",
    target_type: "internal_page",
    target_url: "/group-buy",
    sort_order: 10,
    is_active: true,
  },
  {
    id: "ql-new",
    title: "新品上架",
    subtitle: null,
    icon_type: "system_icon",
    icon_key: "bag",
    icon_image_url: null,
    icon_image_path: null,
    background_color: "#FFFFFF",
    text_color: "#153E73",
    badge_text: null,
    badge_color: null,
    target_type: "internal_page",
    target_url: "/shop/new-arrivals",
    sort_order: 20,
    is_active: true,
  },
  {
    id: "ql-hot",
    title: "熱銷排行",
    subtitle: null,
    icon_type: "system_icon",
    icon_key: "flame",
    icon_image_url: null,
    icon_image_path: null,
    background_color: "#FFFFFF",
    text_color: "#153E73",
    badge_text: null,
    badge_color: null,
    target_type: "internal_page",
    target_url: "/shop/popular",
    sort_order: 30,
    is_active: true,
  },
  {
    id: "ql-bundle",
    title: "組合優惠",
    subtitle: null,
    icon_type: "system_icon",
    icon_key: "gift",
    icon_image_url: null,
    icon_image_path: null,
    background_color: "#FFFFFF",
    text_color: "#153E73",
    badge_text: null,
    badge_color: null,
    target_type: "internal_page",
    target_url: "/group-buy",
    sort_order: 40,
    is_active: true,
  },
];

const HEX = /^#[0-9A-Fa-f]{6}$/;

function hex(value: unknown, fallback: string) {
  const v = String(value ?? "").trim().toUpperCase();
  return HEX.test(v) ? v : fallback;
}

function iconKey(value: unknown): ShopQuickLinkIconKey {
  const v = String(value ?? "");
  return (SHOP_QUICK_LINK_ICON_KEYS as readonly string[]).includes(v)
    ? (v as ShopQuickLinkIconKey)
    : "percent";
}

export function parseShopQuickLink(row: Record<string, unknown>, index = 0): ShopQuickLink {
  const title = String(row.title ?? "").trim() || "快捷入口";
  const targetType = (
    ["category", "product", "article", "internal_page", "external_url"] as const
  ).includes(row.target_type as ShopQuickLinkTargetType)
    ? (row.target_type as ShopQuickLinkTargetType)
    : "internal_page";
  return {
    id: String(row.id ?? `ql-${index}`),
    title,
    subtitle: String(row.subtitle ?? "").trim() || null,
    icon_type: row.icon_type === "custom_image" ? "custom_image" : "system_icon",
    icon_key: iconKey(row.icon_key),
    icon_image_url: String(row.icon_image_url ?? "").trim() || null,
    icon_image_path: String(row.icon_image_path ?? "").trim() || null,
    background_color: hex(row.background_color, "#FFFFFF"),
    text_color: hex(row.text_color, "#153E73"),
    badge_text: String(row.badge_text ?? "").trim() || null,
    badge_color: row.badge_color ? hex(row.badge_color, "#F16458") : null,
    target_type: targetType,
    target_url: String(row.target_url ?? "").trim() || "/",
    sort_order: Number(row.sort_order ?? (index + 1) * 10) || (index + 1) * 10,
    is_active: row.is_active !== false,
  };
}

export function parseShopQuickLinks(rows: unknown): ShopQuickLink[] {
  if (!Array.isArray(rows)) return [];
  return rows
    .map((item, i) =>
      item && typeof item === "object"
        ? parseShopQuickLink(item as Record<string, unknown>, i)
        : null
    )
    .filter((x): x is ShopQuickLink => Boolean(x))
    .sort((a, b) => a.sort_order - b.sort_order);
}

export function liveShopQuickLinks(rows: ShopQuickLink[], limit = 4): ShopQuickLink[] {
  return rows.filter((r) => r.is_active && r.title.trim()).slice(0, limit);
}
