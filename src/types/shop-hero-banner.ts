/** Shop hero banner — CMS-backed carousel slides. */

export type ShopHeroBanner = {
  id: string;
  title: string;
  subtitle?: string;
  desktop_image: string;
  mobile_image?: string;
  link?: string;
  button_text?: string;
  sort_order: number;
  is_active: boolean;
  type: "shop_hero";
};

export const SHOP_HERO_BANNER_TYPE = "shop_hero" as const;

export const DEFAULT_SHOP_HERO_BANNERS: ShopHeroBanner[] = [
  {
    id: "default-shop-hero",
    title: "烘焙好物商城",
    subtitle: "精選超過 4,000 項商品，材料、器具、包裝一次購足",
    desktop_image: "/images/shop/hero-default.jpg",
    mobile_image: "/images/shop/hero-default.jpg",
    link: "/baking-materials",
    button_text: "立即逛商城",
    sort_order: 0,
    is_active: true,
    type: "shop_hero",
  },
];

export function mapCmsRowToShopHero(row: Record<string, unknown>): ShopHeroBanner | null {
  const desktop =
    String(row.desktop_image ?? row.image_url ?? row.desktopImage ?? "").trim() || "";
  if (!desktop && !row.title) return null;
  const mobile = String(row.mobile_image ?? row.mobile_image_url ?? row.mobileImage ?? "").trim();
  return {
    id: String(row.id ?? cryptoRandomId()),
    title: String(row.title ?? "商城活動").trim() || "商城活動",
    subtitle: row.subtitle ? String(row.subtitle) : undefined,
    desktop_image: desktop || DEFAULT_SHOP_HERO_BANNERS[0].desktop_image,
    mobile_image: mobile || undefined,
    link: row.link
      ? String(row.link)
      : row.link_url
        ? String(row.link_url)
        : undefined,
    button_text: row.button_text
      ? String(row.button_text)
      : row.buttonText
        ? String(row.buttonText)
        : undefined,
    sort_order: Number(row.sort_order ?? row.sortOrder ?? 0) || 0,
    is_active: row.is_active !== false && row.isActive !== false,
    type: "shop_hero",
  };
}

function cryptoRandomId() {
  return `shop-hero-${Math.random().toString(36).slice(2, 10)}`;
}

export function normalizeShopHeroList(raw: unknown): ShopHeroBanner[] {
  if (!Array.isArray(raw) || raw.length === 0) return DEFAULT_SHOP_HERO_BANNERS;
  const mapped = raw
    .map((item) =>
      item && typeof item === "object"
        ? mapCmsRowToShopHero(item as Record<string, unknown>)
        : null
    )
    .filter((b): b is ShopHeroBanner => Boolean(b && b.is_active && b.desktop_image))
    .sort((a, b) => a.sort_order - b.sort_order);
  return mapped.length > 0 ? mapped : DEFAULT_SHOP_HERO_BANNERS;
}
