/** Shop hero banner — CMS-backed carousel slides (cms_banners.placement = shop_hero). */

export type ShopHeroBanner = {
  id: string;
  title: string;
  alt_text?: string;
  subtitle?: string;
  desktop_image: string;
  mobile_image?: string;
  link?: string;
  link_target?: "_self" | "_blank";
  button_text?: string;
  sort_order: number;
  is_active: boolean;
  starts_at?: string | null;
  ends_at?: string | null;
  type: "shop_hero";
};

export const SHOP_HERO_BANNER_TYPE = "shop_hero" as const;

export const DEFAULT_SHOP_HERO_BANNERS: ShopHeroBanner[] = [
  {
    id: "default-shop-hero",
    title: "烘焙好物商城",
    alt_text: "烘焙好物 · 一站購足",
    subtitle: "嚴選烘焙材料與生活好物，讓美味更簡單！",
    desktop_image: "/images/shop/hero-desktop.jpg",
    mobile_image: "/images/shop/hero-mobile.jpg",
    link: "/shop/categories",
    link_target: "_self",
    button_text: "探索更多好物",
    sort_order: 0,
    is_active: true,
    type: "shop_hero",
  },
];

function isWithinSchedule(row: Record<string, unknown>, now = Date.now()) {
  const starts = row.starts_at ? new Date(String(row.starts_at)).getTime() : null;
  const ends = row.ends_at ? new Date(String(row.ends_at)).getTime() : null;
  if (starts != null && !Number.isNaN(starts) && starts > now) return false;
  if (ends != null && !Number.isNaN(ends) && ends < now) return false;
  return true;
}

export function mapCmsRowToShopHero(row: Record<string, unknown>): ShopHeroBanner | null {
  let desktop =
    String(row.desktop_image ?? row.image_url ?? row.desktopImage ?? "").trim() || "";
  if (!desktop && !row.title) return null;
  let mobile = String(row.mobile_image ?? row.mobile_image_url ?? row.mobileImage ?? "").trim();

  // Legacy mall asset had baked-in rounded white corners — remap to square-edge shop heroes.
  if (desktop.includes("/images/mall/hero-banner")) {
    desktop = DEFAULT_SHOP_HERO_BANNERS[0].desktop_image;
  }
  if (mobile.includes("/images/mall/hero-banner")) {
    mobile = DEFAULT_SHOP_HERO_BANNERS[0].mobile_image || "";
  }

  const linkTargetRaw = String(row.link_target ?? "_self").trim();
  const link_target: "_self" | "_blank" =
    linkTargetRaw === "_blank" ? "_blank" : "_self";
  return {
    id: String(row.id ?? cryptoRandomId()),
    title: String(row.title ?? "商城活動").trim() || "商城活動",
    alt_text: row.alt_text
      ? String(row.alt_text)
      : row.subtitle
        ? String(row.subtitle)
        : undefined,
    subtitle: row.subtitle ? String(row.subtitle) : undefined,
    desktop_image: desktop || DEFAULT_SHOP_HERO_BANNERS[0].desktop_image,
    mobile_image: mobile || undefined,
    link: row.link
      ? String(row.link)
      : row.link_url
        ? String(row.link_url)
        : undefined,
    link_target,
    button_text: row.button_text
      ? String(row.button_text)
      : row.buttonText
        ? String(row.buttonText)
        : undefined,
    sort_order: Number(row.sort_order ?? row.sortOrder ?? 0) || 0,
    is_active: row.is_active !== false && row.isActive !== false,
    starts_at: row.starts_at ? String(row.starts_at) : null,
    ends_at: row.ends_at ? String(row.ends_at) : null,
    type: "shop_hero",
  };
}

function cryptoRandomId() {
  return `shop-hero-${Math.random().toString(36).slice(2, 10)}`;
}

export function normalizeShopHeroList(raw: unknown): ShopHeroBanner[] {
  if (!Array.isArray(raw) || raw.length === 0) return DEFAULT_SHOP_HERO_BANNERS;
  const now = Date.now();
  const mapped = raw
    .map((item) =>
      item && typeof item === "object"
        ? mapCmsRowToShopHero(item as Record<string, unknown>)
        : null
    )
    .filter(
      (b): b is ShopHeroBanner =>
        Boolean(
          b &&
            b.is_active &&
            b.desktop_image &&
            isWithinSchedule(b as unknown as Record<string, unknown>, now)
        )
    )
    .sort((a, b) => a.sort_order - b.sort_order);
  return mapped.length > 0 ? mapped : DEFAULT_SHOP_HERO_BANNERS;
}
