import { APP_ROUTES } from "@/lib/site-links";

export type QuickServiceItem = {
  id: string;
  title: string;
  imageUrl: string;
  href: string;
  backgroundColor?: string;
  badge?: string | null;
  enabled: boolean;
  sortOrder: number;
};

export type MemberShortcutItem = {
  id: string;
  title: string;
  imageUrl: string;
  href: string;
  enabled: boolean;
  sortOrder: number;
};

export type HomeQuickServicesSettings = {
  enabled: boolean;
  title: string;
  subtitle: string;
  allServicesLabel: string;
  allServicesHref: string;
  items: QuickServiceItem[];
  memberCenterEnabled: boolean;
  memberCenterTitle: string;
  memberCenterSubtitle: string;
  memberCenterHref: string;
  memberCenterImageUrl: string;
  memberShortcuts: MemberShortcutItem[];
};

const ICON = "/images/home/quick-services";

export const DEFAULT_QUICK_SERVICE_ITEMS: QuickServiceItem[] = [
  {
    id: "baking",
    title: "烘焙材料",
    imageUrl: `${ICON}/baking-materials.svg`,
    href: APP_ROUTES.bakingMaterials,
    backgroundColor: "#FFF5CC",
    enabled: true,
    sortOrder: 10,
  },
  {
    id: "group-buy",
    title: "團購",
    imageUrl: `${ICON}/group-buy.svg`,
    href: "/group-buy",
    backgroundColor: "#FFE9E8",
    enabled: true,
    sortOrder: 20,
  },
  {
    id: "recipes-videos",
    title: "食譜影音",
    imageUrl: `${ICON}/recipe-video.svg`,
    href: APP_ROUTES.recipes,
    backgroundColor: "#EAF6EE",
    enabled: true,
    sortOrder: 30,
  },
  {
    id: "ai",
    title: "AI 助手",
    imageUrl: `${ICON}/ai-assistant.svg`,
    href: APP_ROUTES.ai,
    backgroundColor: "#F1EDFF",
    enabled: true,
    sortOrder: 40,
  },
  {
    id: "store-map",
    title: "門市地圖",
    imageUrl: `${ICON}/store-map.svg`,
    href: APP_ROUTES.storeMap,
    backgroundColor: "#FFF2D8",
    enabled: true,
    sortOrder: 50,
  },
  {
    id: "promo",
    title: "優惠活動",
    imageUrl: `${ICON}/promotion.svg`,
    href: "/shop?promo=1",
    backgroundColor: "#FFE9E7",
    badge: "HOT",
    enabled: true,
    sortOrder: 60,
  },
  {
    id: "news",
    title: "最新消息",
    imageUrl: `${ICON}/latest-news.svg`,
    href: APP_ROUTES.news,
    backgroundColor: "#EAF4FF",
    enabled: true,
    sortOrder: 70,
  },
  {
    id: "more",
    title: "更多",
    imageUrl: `${ICON}/more.svg`,
    href: APP_ROUTES.member,
    backgroundColor: "#FFFFFF",
    enabled: true,
    sortOrder: 80,
  },
];

export const DEFAULT_MEMBER_SHORTCUT_ITEMS: MemberShortcutItem[] = [
  {
    id: "orders",
    title: "團購訂單",
    imageUrl: `${ICON}/shortcut-orders.svg`,
    href: APP_ROUTES.memberOrders,
    enabled: true,
    sortOrder: 10,
  },
  {
    id: "store-member",
    title: "門市會員",
    imageUrl: `${ICON}/shortcut-member.svg`,
    href: APP_ROUTES.memberBarcode,
    enabled: true,
    sortOrder: 20,
  },
  {
    id: "carrier",
    title: "發票載具",
    imageUrl: `${ICON}/shortcut-carrier.svg`,
    href: APP_ROUTES.memberCarrier,
    enabled: true,
    sortOrder: 30,
  },
];

export const DEFAULT_QUICK_SERVICES_SETTINGS: HomeQuickServicesSettings = {
  enabled: true,
  title: "常用服務",
  subtitle: "快速進入常用功能",
  allServicesLabel: "全部服務",
  allServicesHref: APP_ROUTES.member,
  items: DEFAULT_QUICK_SERVICE_ITEMS,
  memberCenterEnabled: true,
  memberCenterTitle: "會員中心",
  memberCenterSubtitle: "訂單、門市與載具管理",
  memberCenterHref: APP_ROUTES.member,
  memberCenterImageUrl: `${ICON}/member-avatar.svg`,
  memberShortcuts: DEFAULT_MEMBER_SHORTCUT_ITEMS,
};

function asString(value: unknown, fallback = ""): string {
  return typeof value === "string" ? value : fallback;
}

function asBool(value: unknown, fallback = true): boolean {
  return typeof value === "boolean" ? value : fallback;
}

function asNumber(value: unknown, fallback = 0): number {
  const n = Number(value);
  return Number.isFinite(n) ? n : fallback;
}

/** Migrate legacy quick_entry.cards emoji format into circular service items. */
function migrateLegacyCards(raw: Record<string, unknown>): QuickServiceItem[] | null {
  if (!Array.isArray(raw.cards)) return null;
  const mapped = (raw.cards as Record<string, unknown>[])
    .filter((c) => {
      const id = asString(c.id);
      const variant = asString(c.variant);
      return id !== "member" && variant !== "member" && c.enabled !== false;
    })
    .map((c, index) => {
      const id = asString(c.id, `item-${index}`);
      const fallback = DEFAULT_QUICK_SERVICE_ITEMS.find((d) => d.id === id);
      return {
        id,
        title: asString(c.title, fallback?.title ?? "服務"),
        imageUrl: asString(c.imageUrl ?? c.image_url, fallback?.imageUrl ?? `${ICON}/more.svg`),
        href: asString(c.href, fallback?.href ?? "/"),
        backgroundColor: asString(
          c.backgroundColor ?? c.background_color ?? c.background,
          fallback?.backgroundColor ?? "#FFF5CC"
        ).startsWith("linear")
          ? fallback?.backgroundColor ?? "#FFF5CC"
          : asString(
              c.backgroundColor ?? c.background_color ?? c.background,
              fallback?.backgroundColor ?? "#FFF5CC"
            ),
        badge: (c.badge as string | null | undefined) ?? fallback?.badge ?? null,
        enabled: c.enabled !== false,
        sortOrder: asNumber(c.sortOrder ?? c.sort_order, fallback?.sortOrder ?? (index + 1) * 10),
      } satisfies QuickServiceItem;
    });
  return mapped.length > 0 ? mapped : null;
}

export function parseQuickServicesSettings(
  raw: Record<string, unknown> | null | undefined
): HomeQuickServicesSettings {
  if (!raw) return { ...DEFAULT_QUICK_SERVICES_SETTINGS };

  const fromItems = Array.isArray(raw.items)
    ? (raw.items as Record<string, unknown>[]).map((item, index) => {
        const id = asString(item.id, `item-${index}`);
        const fallback = DEFAULT_QUICK_SERVICE_ITEMS.find((d) => d.id === id);
        return {
          id,
          title: asString(item.title ?? item.service_title, fallback?.title ?? "服務"),
          imageUrl: asString(
            item.imageUrl ?? item.image_url ?? item.service_image_url,
            fallback?.imageUrl ?? `${ICON}/more.svg`
          ),
          href: asString(item.href ?? item.service_href, fallback?.href ?? "/"),
          backgroundColor: asString(
            item.backgroundColor ?? item.background_color ?? item.service_background_color,
            fallback?.backgroundColor ?? "#FFF5CC"
          ),
          badge:
            typeof item.badge === "string"
              ? item.badge
              : typeof item.service_badge === "string"
                ? item.service_badge
                : null,
          enabled: item.enabled !== false && item.service_enabled !== false,
          sortOrder: asNumber(
            item.sortOrder ?? item.sort_order ?? item.service_sort_order,
            fallback?.sortOrder ?? (index + 1) * 10
          ),
        } satisfies QuickServiceItem;
      })
    : null;

  const items =
    fromItems && fromItems.length > 0
      ? fromItems
      : migrateLegacyCards(raw) ?? DEFAULT_QUICK_SERVICE_ITEMS;

  const shortcutsRaw = Array.isArray(raw.memberShortcuts)
    ? raw.memberShortcuts
    : Array.isArray(raw.member_shortcuts)
      ? raw.member_shortcuts
      : null;

  const memberShortcuts =
    shortcutsRaw && shortcutsRaw.length > 0
      ? (shortcutsRaw as Record<string, unknown>[]).map((item, index) => {
          const id = asString(item.id, `shortcut-${index}`);
          const fallback = DEFAULT_MEMBER_SHORTCUT_ITEMS.find((d) => d.id === id);
          return {
            id,
            title: asString(
              item.title ?? item.label ?? item.shortcut_title,
              fallback?.title ?? "快捷"
            ),
            imageUrl: asString(
              item.imageUrl ?? item.image_url ?? item.shortcut_image_url,
              fallback?.imageUrl ?? `${ICON}/shortcut-orders.svg`
            ),
            href: asString(item.href ?? item.shortcut_href, fallback?.href ?? APP_ROUTES.member),
            enabled: item.enabled !== false && item.shortcut_enabled !== false,
            sortOrder: asNumber(
              item.sortOrder ?? item.sort_order ?? item.shortcut_sort_order,
              fallback?.sortOrder ?? (index + 1) * 10
            ),
          } satisfies MemberShortcutItem;
        })
      : DEFAULT_MEMBER_SHORTCUT_ITEMS;

  return {
    enabled: asBool(raw.enabled, true),
    title: asString(raw.title ?? raw.section_title, DEFAULT_QUICK_SERVICES_SETTINGS.title),
    subtitle: asString(
      raw.subtitle ?? raw.section_subtitle,
      DEFAULT_QUICK_SERVICES_SETTINGS.subtitle
    ),
    allServicesLabel: asString(
      raw.allServicesLabel ?? raw.all_services_label,
      DEFAULT_QUICK_SERVICES_SETTINGS.allServicesLabel
    ),
    allServicesHref: asString(
      raw.allServicesHref ?? raw.all_services_href,
      DEFAULT_QUICK_SERVICES_SETTINGS.allServicesHref
    ),
    items,
    memberCenterEnabled: asBool(
      raw.memberCenterEnabled ?? raw.member_center_enabled,
      true
    ),
    memberCenterTitle: asString(
      raw.memberCenterTitle ?? raw.member_center_title,
      DEFAULT_QUICK_SERVICES_SETTINGS.memberCenterTitle
    ),
    memberCenterSubtitle: asString(
      raw.memberCenterSubtitle ?? raw.member_center_subtitle,
      DEFAULT_QUICK_SERVICES_SETTINGS.memberCenterSubtitle
    ),
    memberCenterHref: asString(
      raw.memberCenterHref ?? raw.member_center_href,
      DEFAULT_QUICK_SERVICES_SETTINGS.memberCenterHref
    ),
    memberCenterImageUrl: asString(
      raw.memberCenterImageUrl ?? raw.member_center_image_url,
      DEFAULT_QUICK_SERVICES_SETTINGS.memberCenterImageUrl
    ),
    memberShortcuts,
  };
}

export function listVisibleQuickServices(items: QuickServiceItem[]): QuickServiceItem[] {
  return items
    .filter((i) => i.enabled !== false)
    .slice()
    .sort((a, b) => a.sortOrder - b.sortOrder);
}

export function listVisibleMemberShortcuts(
  items: MemberShortcutItem[]
): MemberShortcutItem[] {
  return items
    .filter((i) => i.enabled !== false)
    .slice()
    .sort((a, b) => a.sortOrder - b.sortOrder);
}
