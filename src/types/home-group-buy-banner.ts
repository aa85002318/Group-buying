/** Homepage group-buy banner carousel (below ingredient shop) + benefit strip. */

const ASSET = "/images/home/group-buy-banner";

/** Fixed slide frame — all carousel images must match this size. */
export const GROUP_BUY_BANNER_SLIDE_SIZE = {
  /** Design / 1x export */
  width: 1200,
  height: 480,
  /** Retina / 2x export */
  retinaWidth: 2400,
  retinaHeight: 960,
  /** CSS aspect-ratio */
  aspectRatio: "5 / 2",
  /** Human-readable label */
  label: "1200 × 480（比例 5:2）",
  retinaLabel: "2400 × 960（@2x）",
} as const;

export type GroupBuyBannerSlide = {
  id: string;
  title: string;
  /** Full-bleed carousel image (1200×480) */
  imageUrl: string;
  href: string;
  enabled: boolean;
  sortOrder: number;
};

export type GroupBuyBannerBenefit = {
  id: string;
  title: string;
  subtitle: string;
  iconUrl: string;
  enabled: boolean;
  sortOrder: number;
};

export type HomeGroupBuyBannerSettings = {
  enabled: boolean;
  title: string;
  /** Autoplay interval ms; 0 = off */
  autoPlayMs: number;
  slides: GroupBuyBannerSlide[];
  benefits: GroupBuyBannerBenefit[];
};

export const DEFAULT_GROUP_BUY_BANNER_SLIDES: GroupBuyBannerSlide[] = [
  {
    id: "slide-group-buy",
    title: "團購",
    imageUrl: `${ASSET}/slide-group-buy.png`,
    href: "/group-buy",
    enabled: true,
    sortOrder: 10,
  },
  {
    id: "slide-snack",
    title: "零食點心",
    imageUrl: `${ASSET}/slide-snack.png`,
    href: "/group-buy?category=snack",
    enabled: true,
    sortOrder: 20,
  },
  {
    id: "slide-dessert",
    title: "烘焙甜點",
    imageUrl: `${ASSET}/slide-dessert.png`,
    href: "/group-buy?category=dessert",
    enabled: true,
    sortOrder: 30,
  },
  {
    id: "slide-kitchen",
    title: "廚房工具",
    imageUrl: `${ASSET}/slide-kitchen.png`,
    href: "/group-buy?category=kitchen",
    enabled: true,
    sortOrder: 40,
  },
  {
    id: "slide-season",
    title: "季節限定",
    imageUrl: `${ASSET}/slide-season.png`,
    href: "/group-buy?category=seasonal",
    enabled: true,
    sortOrder: 50,
  },
];

export const DEFAULT_GROUP_BUY_BANNER_BENEFITS: GroupBuyBannerBenefit[] = [
  {
    id: "brand",
    title: "精選品牌",
    subtitle: "品質安心",
    iconUrl: `${ASSET}/icon-brand.svg`,
    enabled: true,
    sortOrder: 10,
  },
  {
    id: "offer",
    title: "專屬優惠",
    subtitle: "團購更划算",
    iconUrl: `${ASSET}/icon-offer.svg`,
    enabled: true,
    sortOrder: 20,
  },
  {
    id: "group",
    title: "揪團便利",
    subtitle: "人越多越便宜",
    iconUrl: `${ASSET}/icon-group.svg`,
    enabled: true,
    sortOrder: 30,
  },
  {
    id: "gift",
    title: "好康好禮",
    subtitle: "團購限定回饋",
    iconUrl: `${ASSET}/icon-gift.svg`,
    enabled: true,
    sortOrder: 40,
  },
];

export const DEFAULT_GROUP_BUY_BANNER_SETTINGS: HomeGroupBuyBannerSettings = {
  enabled: true,
  title: "團購 Banner",
  autoPlayMs: 4500,
  slides: DEFAULT_GROUP_BUY_BANNER_SLIDES,
  benefits: DEFAULT_GROUP_BUY_BANNER_BENEFITS,
};

function asRecord(value: unknown): Record<string, unknown> | null {
  return value && typeof value === "object" && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : null;
}

function parseSlide(
  raw: unknown,
  index: number,
  fallback?: GroupBuyBannerSlide
): GroupBuyBannerSlide | null {
  const row = asRecord(raw);
  if (!row) return null;
  const imageUrl = String(
    row.imageUrl ?? row.image_url ?? row.backgroundImageUrl ?? fallback?.imageUrl ?? ""
  ).trim();
  const title = String(row.title ?? fallback?.title ?? `Banner ${index + 1}`).trim();
  if (!imageUrl && !title) return null;
  return {
    id: String(row.id ?? fallback?.id ?? `slide-${index}`).trim() || `slide-${index}`,
    title: title || `Banner ${index + 1}`,
    imageUrl: imageUrl || fallback?.imageUrl || "",
    href: String(row.href ?? fallback?.href ?? "/group-buy").trim() || "/group-buy",
    enabled: row.enabled !== false,
    sortOrder:
      Number(row.sortOrder ?? row.sort_order ?? fallback?.sortOrder ?? (index + 1) * 10) ||
      (index + 1) * 10,
  };
}

function parseBenefit(
  raw: unknown,
  index: number,
  fallback?: GroupBuyBannerBenefit
): GroupBuyBannerBenefit | null {
  const row = asRecord(raw);
  if (!row) return null;
  const title = String(row.title ?? fallback?.title ?? "").trim();
  if (!title) return null;
  return {
    id: String(row.id ?? fallback?.id ?? `benefit-${index}`),
    title,
    subtitle: String(row.subtitle ?? fallback?.subtitle ?? "").trim(),
    iconUrl: String(row.iconUrl ?? row.icon_url ?? fallback?.iconUrl ?? ""),
    enabled: row.enabled !== false,
    sortOrder:
      Number(row.sortOrder ?? row.sort_order ?? fallback?.sortOrder ?? (index + 1) * 10) ||
      (index + 1) * 10,
  };
}

/** Map legacy chalk tiles → carousel slides when `slides` is missing. */
function slidesFromLegacyTiles(raw: unknown[]): GroupBuyBannerSlide[] {
  return raw
    .map((item, i) => {
      const row = asRecord(item);
      if (!row) return null;
      const imageUrl = String(
        row.imageUrl ?? row.image_url ?? row.backgroundImageUrl ?? row.background_image_url ?? ""
      ).trim();
      if (!imageUrl) return null;
      return {
        id: String(row.id ?? `legacy-${i}`),
        title: String(row.title ?? `Banner ${i + 1}`),
        imageUrl,
        href: String(row.href ?? "/group-buy").trim() || "/group-buy",
        enabled: row.enabled !== false,
        sortOrder: Number(row.sortOrder ?? row.sort_order ?? (i + 1) * 10) || (i + 1) * 10,
      } satisfies GroupBuyBannerSlide;
    })
    .filter(Boolean) as GroupBuyBannerSlide[];
}

export function parseGroupBuyBannerSettings(
  config: Record<string, unknown> | null | undefined
): HomeGroupBuyBannerSettings {
  const cfg = config ?? {};
  const defaults = DEFAULT_GROUP_BUY_BANNER_SETTINGS;

  const slidesRaw = Array.isArray(cfg.slides) ? cfg.slides : null;

  let slides: GroupBuyBannerSlide[];
  if (slidesRaw && slidesRaw.length > 0) {
    slides = slidesRaw
      .map((item, i) =>
        parseSlide(item, i, defaults.slides[i] ?? defaults.slides[defaults.slides.length - 1])
      )
      .filter(Boolean)
      .sort((a, b) => a!.sortOrder - b!.sortOrder) as GroupBuyBannerSlide[];
  } else if (Array.isArray(cfg.tiles) && cfg.tiles.length > 0) {
    const legacy = slidesFromLegacyTiles(cfg.tiles);
    slides = legacy.length > 0 ? legacy : defaults.slides;
  } else {
    slides = defaults.slides;
  }

  const benefitsRaw = Array.isArray(cfg.benefits) ? cfg.benefits : null;
  const benefits = (
    benefitsRaw
      ? benefitsRaw.map((item, i) =>
          parseBenefit(item, i, defaults.benefits[i] ?? defaults.benefits[defaults.benefits.length - 1])
        )
      : defaults.benefits
  )
    .filter(Boolean)
    .sort((a, b) => a!.sortOrder - b!.sortOrder) as GroupBuyBannerBenefit[];

  const autoPlayMs = Number(cfg.autoPlayMs ?? cfg.auto_play_ms ?? defaults.autoPlayMs);
  return {
    enabled: cfg.enabled !== false,
    title: String(cfg.title ?? defaults.title).trim() || defaults.title,
    autoPlayMs: Number.isFinite(autoPlayMs) && autoPlayMs >= 0 ? autoPlayMs : defaults.autoPlayMs,
    slides: slides.length > 0 ? slides : defaults.slides,
    benefits: benefits.length > 0 ? benefits : defaults.benefits,
  };
}
