/** Homepage group-buy 4-tile chalk banner (below ingredient shop). */

const ASSET = "/images/home/group-buy-banner";

export type GroupBuyBannerSeason = "spring" | "summer" | "autumn" | "winter" | "auto";

export type GroupBuyBannerTile = {
  id: string;
  title: string;
  subtitle: string;
  backgroundColor: string;
  /** Chalk texture / fill image behind art */
  backgroundImageUrl: string;
  /** Illustration overlay (SVG/PNG). Season tile may use seasonal map instead. */
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

export type GroupBuyBannerIpSettings = {
  enabled: boolean;
  imageUrl: string;
  /** Horizontal center as % of tiles row (50 = between tile 2 & 3). */
  positionPercent: number;
  /** Height relative to tile height. */
  heightPercent: number;
};

export type HomeGroupBuyBannerSettings = {
  enabled: boolean;
  title: string;
  tiles: GroupBuyBannerTile[];
  benefits: GroupBuyBannerBenefit[];
  ip: GroupBuyBannerIpSettings;
  /** When "auto", pick art by current month; else force season art for season tile. */
  seasonMode: GroupBuyBannerSeason;
  seasonImages: Record<"spring" | "summer" | "autumn" | "winter", string>;
};

export const DEFAULT_GROUP_BUY_BANNER_TILES: GroupBuyBannerTile[] = [
  {
    id: "snack",
    title: "零食點心",
    subtitle: "美味零食，隨時享受",
    backgroundColor: "#9FD36F",
    backgroundImageUrl: `${ASSET}/bg-snack.png`,
    imageUrl: `${ASSET}/art-snack.svg`,
    href: "/group-buy?category=snack",
    enabled: true,
    sortOrder: 10,
  },
  {
    id: "dessert",
    title: "烘焙甜點",
    subtitle: "手作烘焙，甜蜜幸福",
    backgroundColor: "#F7A9B8",
    backgroundImageUrl: `${ASSET}/bg-dessert.png`,
    imageUrl: `${ASSET}/art-dessert.svg`,
    href: "/group-buy?category=dessert",
    enabled: true,
    sortOrder: 20,
  },
  {
    id: "kitchen",
    title: "廚房工具",
    subtitle: "好用工具，輕鬆料理",
    backgroundColor: "#FFD454",
    backgroundImageUrl: `${ASSET}/bg-kitchen.png`,
    imageUrl: `${ASSET}/art-kitchen.svg`,
    href: "/group-buy?category=kitchen",
    enabled: true,
    sortOrder: 30,
  },
  {
    id: "season",
    title: "季節限定",
    subtitle: "限定好物，錯過不再",
    backgroundColor: "#79C7E8",
    backgroundImageUrl: `${ASSET}/bg-season.png`,
    imageUrl: `${ASSET}/art-season-spring.svg`,
    href: "/group-buy?category=seasonal",
    enabled: true,
    sortOrder: 40,
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

export const DEFAULT_GROUP_BUY_BANNER_SEASON_IMAGES: Record<
  "spring" | "summer" | "autumn" | "winter",
  string
> = {
  spring: `${ASSET}/art-season-spring.svg`,
  summer: `${ASSET}/art-season-summer.svg`,
  autumn: `${ASSET}/art-season-autumn.svg`,
  winter: `${ASSET}/art-season-winter.svg`,
};

export const DEFAULT_GROUP_BUY_BANNER_SETTINGS: HomeGroupBuyBannerSettings = {
  enabled: true,
  title: "團購分類",
  tiles: DEFAULT_GROUP_BUY_BANNER_TILES,
  benefits: DEFAULT_GROUP_BUY_BANNER_BENEFITS,
  ip: {
    enabled: true,
    imageUrl: `${ASSET}/ip-angel.svg`,
    positionPercent: 50,
    heightPercent: 58,
  },
  seasonMode: "auto",
  seasonImages: DEFAULT_GROUP_BUY_BANNER_SEASON_IMAGES,
};

export function resolveSeasonKey(
  mode: GroupBuyBannerSeason,
  date = new Date()
): "spring" | "summer" | "autumn" | "winter" {
  if (mode !== "auto") return mode;
  const month = date.getMonth() + 1;
  if (month >= 3 && month <= 5) return "spring";
  if (month >= 6 && month <= 8) return "summer";
  if (month >= 9 && month <= 11) return "autumn";
  return "winter";
}

function asRecord(value: unknown): Record<string, unknown> | null {
  return value && typeof value === "object" && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : null;
}

function parseTile(raw: unknown, index: number, fallback?: GroupBuyBannerTile): GroupBuyBannerTile | null {
  const row = asRecord(raw);
  if (!row) return null;
  const title = String(row.title ?? fallback?.title ?? "").trim();
  if (!title) return null;
  const id = String(row.id ?? fallback?.id ?? `tile-${index}`).trim() || `tile-${index}`;
  return {
    id,
    title,
    subtitle: String(row.subtitle ?? fallback?.subtitle ?? "").trim(),
    backgroundColor: String(row.backgroundColor ?? row.background_color ?? fallback?.backgroundColor ?? "#9FD36F"),
    backgroundImageUrl: String(
      row.backgroundImageUrl ?? row.background_image_url ?? fallback?.backgroundImageUrl ?? ""
    ),
    imageUrl: String(row.imageUrl ?? row.image_url ?? fallback?.imageUrl ?? ""),
    href: String(row.href ?? fallback?.href ?? "/group-buy").trim() || "/group-buy",
    enabled: row.enabled !== false,
    sortOrder: Number(row.sortOrder ?? row.sort_order ?? fallback?.sortOrder ?? (index + 1) * 10) || (index + 1) * 10,
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
    sortOrder: Number(row.sortOrder ?? row.sort_order ?? fallback?.sortOrder ?? (index + 1) * 10) || (index + 1) * 10,
  };
}

export function parseGroupBuyBannerSettings(
  config: Record<string, unknown> | null | undefined
): HomeGroupBuyBannerSettings {
  const cfg = config ?? {};
  const defaults = DEFAULT_GROUP_BUY_BANNER_SETTINGS;

  const tilesRaw = Array.isArray(cfg.tiles) ? cfg.tiles : null;
  const tiles = (
    tilesRaw
      ? tilesRaw.map((item, i) =>
          parseTile(item, i, defaults.tiles[i] ?? defaults.tiles[defaults.tiles.length - 1])
        )
      : defaults.tiles
  )
    .filter(Boolean)
    .sort((a, b) => a!.sortOrder - b!.sortOrder) as GroupBuyBannerTile[];

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

  const ipRaw = asRecord(cfg.ip) ?? {};
  const seasonImagesRaw = asRecord(cfg.seasonImages ?? cfg.season_images) ?? {};
  const seasonModeRaw = String(cfg.seasonMode ?? cfg.season_mode ?? "auto");
  const seasonMode: GroupBuyBannerSeason = (
    ["spring", "summer", "autumn", "winter", "auto"] as const
  ).includes(seasonModeRaw as GroupBuyBannerSeason)
    ? (seasonModeRaw as GroupBuyBannerSeason)
    : "auto";

  return {
    enabled: cfg.enabled !== false,
    title: String(cfg.title ?? defaults.title).trim() || defaults.title,
    tiles: tiles.length > 0 ? tiles : defaults.tiles,
    benefits: benefits.length > 0 ? benefits : defaults.benefits,
    ip: {
      enabled: ipRaw.enabled !== false,
      imageUrl: String(ipRaw.imageUrl ?? ipRaw.image_url ?? defaults.ip.imageUrl),
      positionPercent: Number(ipRaw.positionPercent ?? ipRaw.position_percent ?? defaults.ip.positionPercent) || 50,
      heightPercent: Number(ipRaw.heightPercent ?? ipRaw.height_percent ?? defaults.ip.heightPercent) || 58,
    },
    seasonMode,
    seasonImages: {
      spring: String(seasonImagesRaw.spring ?? defaults.seasonImages.spring),
      summer: String(seasonImagesRaw.summer ?? defaults.seasonImages.summer),
      autumn: String(seasonImagesRaw.autumn ?? defaults.seasonImages.autumn),
      winter: String(seasonImagesRaw.winter ?? defaults.seasonImages.winter),
    },
  };
}

export function resolveTileArtUrl(
  tile: GroupBuyBannerTile,
  settings: HomeGroupBuyBannerSettings
): string {
  if (tile.id === "season") {
    const key = resolveSeasonKey(settings.seasonMode);
    return settings.seasonImages[key] || tile.imageUrl;
  }
  return tile.imageUrl;
}
