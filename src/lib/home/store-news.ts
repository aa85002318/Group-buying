export type StoreNewsCardType =
  | "app_store_gift"
  | "store_member"
  | "promotion"
  | "store_notice"
  | "custom";

export type StoreNewsCard = {
  id: string;
  cardType: StoreNewsCardType;
  name: string;
  title: string;
  subtitle?: string;
  desktopImageUrl?: string | null;
  mobileImageUrl?: string | null;
  icon?: string | null;
  buttonText: string;
  buttonHref: string;
  backgroundColor?: string | null;
  startAt?: string | null;
  endAt?: string | null;
  requiresAuth?: boolean;
  sortOrder: number;
  enabled: boolean;
};

export const DEFAULT_STORE_NEWS_CARDS: StoreNewsCard[] = [
  {
    id: "app-gift",
    cardType: "app_store_gift",
    name: "App 門市禮",
    title: "App 門市禮",
    subtitle: "到門市出示 CHIMEIDIY App，享 App 會員限定優惠與好禮。",
    icon: "Gift",
    buttonText: "查看活動",
    buttonHref: "/member/gifts",
    backgroundColor: "#FFF4EC",
    sortOrder: 10,
    enabled: true,
  },
  {
    id: "store-member",
    cardType: "store_member",
    name: "門市會員",
    title: "門市會員",
    subtitle: "綁定門市會員，查詢點數與優惠。",
    icon: "UserRound",
    buttonText: "登入／註冊",
    buttonHref: "/member",
    backgroundColor: "#FFF8F3",
    sortOrder: 20,
    enabled: true,
  },
];

export function parseStoreNewsCards(
  config: Record<string, unknown> | null | undefined
): StoreNewsCard[] {
  const raw = config?.cards;
  if (!Array.isArray(raw) || raw.length === 0) return DEFAULT_STORE_NEWS_CARDS;
  const now = Date.now();
  return raw
    .map((item, index) => {
      if (!item || typeof item !== "object") return null;
      const row = item as Record<string, unknown>;
      const title = String(row.title ?? "").trim();
      if (!title) return null;
      const startAt = row.startAt ? String(row.startAt) : row.start_at ? String(row.start_at) : null;
      const endAt = row.endAt ? String(row.endAt) : row.end_at ? String(row.end_at) : null;
      if (startAt && new Date(startAt).getTime() > now) return null;
      if (endAt && new Date(endAt).getTime() < now) return null;
      return {
        id: String(row.id ?? `card-${index}`),
        cardType: (row.cardType ?? row.card_type ?? "custom") as StoreNewsCardType,
        name: String(row.name ?? title),
        title,
        subtitle: row.subtitle ? String(row.subtitle) : undefined,
        desktopImageUrl: row.desktopImageUrl
          ? String(row.desktopImageUrl)
          : row.desktop_image_url
            ? String(row.desktop_image_url)
            : null,
        mobileImageUrl: row.mobileImageUrl
          ? String(row.mobileImageUrl)
          : row.mobile_image_url
            ? String(row.mobile_image_url)
            : null,
        icon: row.icon ? String(row.icon) : null,
        buttonText: String(row.buttonText ?? row.button_text ?? "了解更多"),
        buttonHref: String(row.buttonHref ?? row.button_href ?? "/"),
        backgroundColor: row.backgroundColor
          ? String(row.backgroundColor)
          : row.background_color
            ? String(row.background_color)
            : null,
        startAt,
        endAt,
        requiresAuth: row.requiresAuth === true || row.requires_auth === true,
        sortOrder: Number(row.sortOrder ?? row.sort_order ?? (index + 1) * 10),
        enabled: row.enabled !== false,
      };
    })
    .filter(Boolean)
    .filter((c) => c!.enabled) as StoreNewsCard[];
}
