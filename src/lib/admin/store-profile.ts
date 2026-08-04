/** Shared store / pickup-point profile — single source for website, APP, checkout. */

export const STORE_WEEKDAY_KEYS = [
  "mon",
  "tue",
  "wed",
  "thu",
  "fri",
  "sat",
  "sun",
] as const;

export type StoreWeekdayKey = (typeof STORE_WEEKDAY_KEYS)[number];

export const STORE_WEEKDAY_LABELS: Record<StoreWeekdayKey, string> = {
  mon: "星期一",
  tue: "星期二",
  wed: "星期三",
  thu: "星期四",
  fri: "星期五",
  sat: "星期六",
  sun: "星期日",
};

export type StoreDayHours = {
  open: string;
  close: string;
  closed?: boolean;
};

export type StoreWeeklyHours = Partial<Record<StoreWeekdayKey, StoreDayHours>>;

export type StoreHoliday = {
  id: string;
  date: string;
  label: string;
};

export type StoreSocialPlatform =
  | "facebook"
  | "instagram"
  | "threads"
  | "line"
  | "youtube"
  | "tiktok"
  | "website";

export type StoreSocialLink = {
  platform: StoreSocialPlatform;
  url: string;
  icon?: string;
  visible: boolean;
};

export const STORE_SOCIAL_PLATFORMS: Array<{
  platform: StoreSocialPlatform;
  label: string;
}> = [
  { platform: "facebook", label: "Facebook" },
  { platform: "instagram", label: "Instagram" },
  { platform: "threads", label: "Threads" },
  { platform: "line", label: "LINE" },
  { platform: "youtube", label: "YouTube" },
  { platform: "tiktok", label: "TikTok" },
  { platform: "website", label: "官方網站" },
];

export type StoreGalleryCategory =
  | "cover"
  | "exterior"
  | "interior"
  | "parking"
  | "counter";

export const STORE_GALLERY_CATEGORIES: Array<{
  id: StoreGalleryCategory;
  label: string;
  hint: string;
}> = [
  { id: "cover", label: "門市封面", hint: "建議 1500×600" },
  { id: "exterior", label: "門市外觀", hint: "可多張" },
  { id: "interior", label: "店內照片", hint: "可多張" },
  { id: "parking", label: "停車資訊", hint: "可多張" },
  { id: "counter", label: "取貨櫃台", hint: "可多張" },
];

export type StoreGalleryItem = {
  id: string;
  category: StoreGalleryCategory;
  url: string;
  sort_order: number;
  caption?: string;
};

export type StoreAnnouncement = {
  id: string;
  body: string;
  visible: boolean;
  starts_at?: string | null;
  ends_at?: string | null;
};

export type StoreSeo = {
  title?: string;
  description?: string;
  og_image?: string;
  slug?: string;
};

export type StoreServiceFlags = {
  pickup?: boolean;
  frozen?: boolean;
  chilled?: boolean;
  parking?: boolean;
  accessible?: boolean;
  corporate?: boolean;
  classroom?: boolean;
};

export type StoreVisibility = {
  website?: boolean;
  app?: boolean;
  pwa?: boolean;
  show_phone?: boolean;
  show_hours?: boolean;
  show_social?: boolean;
  show_map?: boolean;
  show_gallery?: boolean;
  show_announcements?: boolean;
  show_email?: boolean;
  show_description?: boolean;
};

export type StoreProfile = {
  id: string;
  name: string;
  code: string | null;
  address: string;
  phone: string | null;
  email: string | null;
  line_at: string | null;
  description: string | null;
  notes: string | null;
  business_hours: string | null;
  weekly_hours: StoreWeeklyHours;
  holidays: StoreHoliday[];
  pickup_hours: string | null;
  map_url: string | null;
  navigation_url: string | null;
  latitude: number | null;
  longitude: number | null;
  line_url: string | null;
  logo_url: string | null;
  image_url: string | null;
  cover_image_url: string | null;
  social_links: StoreSocialLink[];
  gallery: StoreGalleryImage[];
  announcements: StoreAnnouncement[];
  seo: StoreSeo;
  service_flags: StoreServiceFlags;
  visibility: StoreVisibility;
  services: unknown;
  daily_highlights: unknown;
  pickup_available: boolean;
  sort_order: number;
  is_default: boolean;
  is_active: boolean;
  created_at?: string;
  updated_at?: string;
  /** Optional list-card metrics */
  today_orders?: number;
  inventory_qty?: number;
};

/** Alias kept for gallery typing clarity */
export type StoreGalleryImage = StoreGalleryItem;

export const DEFAULT_WEEKLY_HOURS: StoreWeeklyHours = {
  mon: { open: "09:00", close: "21:00" },
  tue: { open: "09:00", close: "21:00" },
  wed: { open: "09:00", close: "21:00" },
  thu: { open: "09:00", close: "21:00" },
  fri: { open: "09:00", close: "21:00" },
  sat: { open: "09:00", close: "21:00" },
  sun: { open: "09:00", close: "21:00" },
};

export const DEFAULT_VISIBILITY: StoreVisibility = {
  website: true,
  app: true,
  pwa: true,
  show_phone: true,
  show_hours: true,
  show_social: true,
  show_map: true,
  show_gallery: true,
  show_announcements: true,
  show_email: true,
  show_description: true,
};

export const DEFAULT_SERVICE_FLAGS: StoreServiceFlags = {
  pickup: true,
  frozen: false,
  chilled: false,
  parking: false,
  accessible: false,
  corporate: false,
  classroom: false,
};

export const DEFAULT_SOCIAL_LINKS: StoreSocialLink[] = STORE_SOCIAL_PLATFORMS.map((p) => ({
  platform: p.platform,
  url: "",
  visible: false,
}));

export function newId(): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }
  return `id-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

export function weekdayKeyFromDate(d = new Date()): StoreWeekdayKey {
  const map: StoreWeekdayKey[] = ["sun", "mon", "tue", "wed", "thu", "fri", "sat"];
  return map[d.getDay()]!;
}

export function formatHoursRange(day?: StoreDayHours | null): string {
  if (!day || day.closed) return "公休";
  if (!day.open || !day.close) return "—";
  return `${day.open}~${day.close}`;
}

export function isStoreOpenNow(
  weekly: StoreWeeklyHours | null | undefined,
  holidays: StoreHoliday[] | null | undefined,
  now = new Date()
): boolean {
  const today = now.toISOString().slice(0, 10);
  if ((holidays ?? []).some((h) => h.date === today)) return false;
  const key = weekdayKeyFromDate(now);
  const day = weekly?.[key];
  if (!day || day.closed || !day.open || !day.close) return false;
  const [oh, om] = day.open.split(":").map(Number);
  const [ch, cm] = day.close.split(":").map(Number);
  const mins = now.getHours() * 60 + now.getMinutes();
  const openMins = (oh ?? 0) * 60 + (om ?? 0);
  const closeMins = (ch ?? 0) * 60 + (cm ?? 0);
  return mins >= openMins && mins <= closeMins;
}

export function summarizeTodayHours(
  weekly: StoreWeeklyHours | null | undefined,
  holidays: StoreHoliday[] | null | undefined,
  now = new Date()
): string {
  const today = now.toISOString().slice(0, 10);
  const holiday = (holidays ?? []).find((h) => h.date === today);
  if (holiday) return holiday.label || "特殊公休";
  return formatHoursRange(weekly?.[weekdayKeyFromDate(now)]);
}

export function parseLatLngFromGoogleMapsUrl(url: string): {
  latitude: number | null;
  longitude: number | null;
} {
  const text = url.trim();
  if (!text) return { latitude: null, longitude: null };

  const at = text.match(/@(-?\d+\.\d+),(-?\d+\.\d+)/);
  if (at) {
    return { latitude: Number(at[1]), longitude: Number(at[2]) };
  }
  const q = text.match(/[?&]q=(-?\d+\.\d+),(-?\d+\.\d+)/);
  if (q) {
    return { latitude: Number(q[1]), longitude: Number(q[2]) };
  }
  const ll = text.match(/[?&]ll=(-?\d+\.\d+),(-?\d+\.\d+)/);
  if (ll) {
    return { latitude: Number(ll[1]), longitude: Number(ll[2]) };
  }
  const dest = text.match(/destination=(-?\d+\.\d+)%2C(-?\d+\.\d+)/i);
  if (dest) {
    return { latitude: Number(dest[1]), longitude: Number(dest[2]) };
  }
  return { latitude: null, longitude: null };
}

export function normalizeSocialLinks(raw: unknown): StoreSocialLink[] {
  const byPlatform = new Map<StoreSocialPlatform, StoreSocialLink>();
  for (const d of DEFAULT_SOCIAL_LINKS) byPlatform.set(d.platform, { ...d });
  if (Array.isArray(raw)) {
    for (const item of raw) {
      if (!item || typeof item !== "object") continue;
      const row = item as StoreSocialLink;
      if (!STORE_SOCIAL_PLATFORMS.some((p) => p.platform === row.platform)) continue;
      byPlatform.set(row.platform, {
        platform: row.platform,
        url: String(row.url ?? ""),
        icon: row.icon ? String(row.icon) : undefined,
        visible: Boolean(row.visible),
      });
    }
  }
  return STORE_SOCIAL_PLATFORMS.map((p) => byPlatform.get(p.platform)!);
}

export function normalizeStoreRow(row: Record<string, unknown>): StoreProfile {
  const weekly =
    row.weekly_hours && typeof row.weekly_hours === "object"
      ? (row.weekly_hours as StoreWeeklyHours)
      : { ...DEFAULT_WEEKLY_HOURS };
  const visibility = {
    ...DEFAULT_VISIBILITY,
    ...(typeof row.visibility === "object" && row.visibility
      ? (row.visibility as StoreVisibility)
      : {}),
  };
  const service_flags = {
    ...DEFAULT_SERVICE_FLAGS,
    ...(typeof row.service_flags === "object" && row.service_flags
      ? (row.service_flags as StoreServiceFlags)
      : {}),
    pickup:
      typeof (row.service_flags as StoreServiceFlags | undefined)?.pickup === "boolean"
        ? (row.service_flags as StoreServiceFlags).pickup
        : row.pickup_available !== false,
  };

  return {
    id: String(row.id),
    name: String(row.name ?? ""),
    code: (row.code as string | null) ?? null,
    address: String(row.address ?? ""),
    phone: (row.phone as string | null) ?? null,
    email: (row.email as string | null) ?? null,
    line_at: (row.line_at as string | null) ?? null,
    description: (row.description as string | null) ?? null,
    notes: (row.notes as string | null) ?? null,
    business_hours: (row.business_hours as string | null) ?? null,
    weekly_hours: Object.keys(weekly).length ? weekly : { ...DEFAULT_WEEKLY_HOURS },
    holidays: Array.isArray(row.holidays) ? (row.holidays as StoreHoliday[]) : [],
    pickup_hours: (row.pickup_hours as string | null) ?? null,
    map_url: (row.map_url as string | null) ?? (row.navigation_url as string | null) ?? null,
    navigation_url: (row.navigation_url as string | null) ?? (row.map_url as string | null) ?? null,
    latitude: row.latitude != null ? Number(row.latitude) : null,
    longitude: row.longitude != null ? Number(row.longitude) : null,
    line_url: (row.line_url as string | null) ?? null,
    logo_url: (row.logo_url as string | null) ?? null,
    image_url: (row.image_url as string | null) ?? null,
    cover_image_url: (row.cover_image_url as string | null) ?? (row.image_url as string | null) ?? null,
    social_links: normalizeSocialLinks(row.social_links),
    gallery: Array.isArray(row.gallery) ? (row.gallery as StoreGalleryItem[]) : [],
    announcements: Array.isArray(row.announcements)
      ? (row.announcements as StoreAnnouncement[])
      : [],
    seo:
      typeof row.seo === "object" && row.seo
        ? (row.seo as StoreSeo)
        : {},
    service_flags,
    visibility,
    services: row.services ?? [],
    daily_highlights: row.daily_highlights ?? {},
    pickup_available: row.pickup_available !== false,
    sort_order: Number(row.sort_order ?? 0),
    is_default: Boolean(row.is_default),
    is_active: row.is_active !== false,
    created_at: row.created_at as string | undefined,
    updated_at: row.updated_at as string | undefined,
    today_orders: row.today_orders != null ? Number(row.today_orders) : undefined,
    inventory_qty: row.inventory_qty != null ? Number(row.inventory_qty) : undefined,
  };
}

/** Derive legacy business_hours text from weekly_hours for old consumers */
export function legacyHoursText(weekly: StoreWeeklyHours): string {
  const parts = STORE_WEEKDAY_KEYS.map((k) => {
    const label = STORE_WEEKDAY_LABELS[k].replace("星期", "");
    return `${label} ${formatHoursRange(weekly[k])}`;
  });
  return parts.join("／");
}

export const STORE_PROFILE_SELECT = [
  "id",
  "name",
  "code",
  "address",
  "phone",
  "email",
  "line_at",
  "description",
  "notes",
  "business_hours",
  "weekly_hours",
  "holidays",
  "pickup_hours",
  "map_url",
  "navigation_url",
  "latitude",
  "longitude",
  "line_url",
  "logo_url",
  "image_url",
  "cover_image_url",
  "social_links",
  "gallery",
  "announcements",
  "seo",
  "service_flags",
  "visibility",
  "services",
  "daily_highlights",
  "pickup_available",
  "sort_order",
  "is_default",
  "is_active",
  "created_at",
  "updated_at",
].join(", ");
