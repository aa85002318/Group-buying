/** Homepage「最新活動」banner carousel — above 常用服務. */

const ASSET = "/images/home/latest-campaigns";

export const LATEST_CAMPAIGN_SLIDE_SIZE = {
  width: 1000,
  height: 400,
  aspectRatio: "5 / 2",
  label: "1000 × 400（比例 5:2）",
} as const;

export type LatestCampaignSlide = {
  id: string;
  title: string;
  imageUrl: string;
  href: string;
  enabled: boolean;
  sortOrder: number;
};

export type HomeLatestCampaignSettings = {
  enabled: boolean;
  title: string;
  viewAllLabel: string;
  viewAllHref: string;
  /** Autoplay interval ms; 0 = off */
  autoPlayMs: number;
  slides: LatestCampaignSlide[];
};

export const DEFAULT_LATEST_CAMPAIGN_SLIDES: LatestCampaignSlide[] = [
  {
    id: "free-shipping",
    title: "烘焙材料滿 $999 免運",
    imageUrl: `${ASSET}/01-free-shipping.jpg`,
    href: "/products",
    enabled: true,
    sortOrder: 10,
  },
  {
    id: "group-buy",
    title: "揪朋友一起更便宜",
    imageUrl: `${ASSET}/02-group-buy.jpg`,
    href: "/group-buy",
    enabled: true,
    sortOrder: 20,
  },
  {
    id: "live",
    title: "今晚 8:00 烘焙直播",
    imageUrl: `${ASSET}/03-live.jpg`,
    href: "/live",
    enabled: true,
    sortOrder: 30,
  },
];

export const DEFAULT_LATEST_CAMPAIGN_SETTINGS: HomeLatestCampaignSettings = {
  enabled: true,
  title: "最新活動",
  viewAllLabel: "查看更多",
  viewAllHref: "/group-buy",
  autoPlayMs: 4500,
  slides: DEFAULT_LATEST_CAMPAIGN_SLIDES,
};

function asRecord(value: unknown): Record<string, unknown> | null {
  return value && typeof value === "object" && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : null;
}

function parseSlide(
  raw: unknown,
  index: number,
  fallback?: LatestCampaignSlide
): LatestCampaignSlide | null {
  const row = asRecord(raw);
  if (!row) return null;
  const imageUrl = String(
    row.imageUrl ?? row.image_url ?? fallback?.imageUrl ?? ""
  ).trim();
  const title = String(row.title ?? fallback?.title ?? `活動 ${index + 1}`).trim();
  if (!imageUrl && !title) return null;
  return {
    id: String(row.id ?? fallback?.id ?? `campaign-${index}`).trim() || `campaign-${index}`,
    title: title || `活動 ${index + 1}`,
    imageUrl: imageUrl || fallback?.imageUrl || "",
    href: String(row.href ?? fallback?.href ?? "/group-buy").trim() || "/group-buy",
    enabled: row.enabled !== false,
    sortOrder:
      Number(row.sortOrder ?? row.sort_order ?? fallback?.sortOrder ?? (index + 1) * 10) ||
      (index + 1) * 10,
  };
}

export function parseLatestCampaignSettings(
  config: Record<string, unknown> | null | undefined
): HomeLatestCampaignSettings {
  const cfg = config ?? {};
  const defaults = DEFAULT_LATEST_CAMPAIGN_SETTINGS;
  const slidesRaw = Array.isArray(cfg.slides) ? cfg.slides : null;

  let slides: LatestCampaignSlide[];
  if (slidesRaw && slidesRaw.length > 0) {
    slides = slidesRaw
      .map((item, i) =>
        parseSlide(item, i, defaults.slides[i] ?? defaults.slides[defaults.slides.length - 1])
      )
      .filter(Boolean)
      .sort((a, b) => a!.sortOrder - b!.sortOrder) as LatestCampaignSlide[];
  } else {
    slides = defaults.slides;
  }

  const autoPlayMs = Number(cfg.autoPlayMs ?? cfg.auto_play_ms ?? defaults.autoPlayMs);
  return {
    enabled: cfg.enabled !== false,
    title: String(cfg.title ?? defaults.title).trim() || defaults.title,
    viewAllLabel:
      String(cfg.viewAllLabel ?? cfg.view_all_label ?? defaults.viewAllLabel).trim() ||
      defaults.viewAllLabel,
    viewAllHref:
      String(cfg.viewAllHref ?? cfg.view_all_href ?? defaults.viewAllHref).trim() ||
      defaults.viewAllHref,
    autoPlayMs: Number.isFinite(autoPlayMs) && autoPlayMs >= 0 ? autoPlayMs : defaults.autoPlayMs,
    slides: slides.length > 0 ? slides : defaults.slides,
  };
}
