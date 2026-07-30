import { APP_ROUTES } from "@/lib/site-links";

export type QuickEntryBadge = "NEW" | "HOT" | "優惠" | null;

export type QuickEntryCardConfig = {
  id: string;
  title: string;
  subtitle?: string;
  href: string;
  emoji: string;
  background: string;
  badge?: QuickEntryBadge;
  enabled?: boolean;
  sortOrder?: number;
  variant?: "standard" | "member" | "wide";
};

export type MemberShortcut = {
  id: string;
  label: string;
  href: string;
  emoji: string;
};

export type HomeQuickEntryConfig = {
  enabled?: boolean;
  cards?: QuickEntryCardConfig[];
  memberShortcuts?: MemberShortcut[];
};

export const DEFAULT_MEMBER_SHORTCUTS: MemberShortcut[] = [
  {
    id: "orders",
    label: "團購訂單",
    href: APP_ROUTES.memberOrders,
    emoji: "📦",
  },
  {
    id: "store-member",
    label: "門市會員",
    href: APP_ROUTES.memberBarcode,
    emoji: "🪪",
  },
  {
    id: "carrier",
    label: "發票載具",
    href: APP_ROUTES.memberCarrier,
    emoji: "🧾",
  },
];

export const DEFAULT_QUICK_ENTRY_CARDS: QuickEntryCardConfig[] = [
  {
    id: "baking",
    title: "烘焙材料",
    subtitle: "一次購足原料",
    href: APP_ROUTES.bakingMaterials,
    emoji: "🥖",
    background: "#FFF5CC",
    sortOrder: 10,
  },
  {
    id: "group-buy",
    title: "團購",
    subtitle: "限時優惠開團",
    href: "/group-buy",
    emoji: "🛒",
    background: "#FFF1EE",
    sortOrder: 20,
  },
  {
    id: "recipes-videos",
    title: "食譜影音",
    subtitle: "跟著做更簡單",
    href: APP_ROUTES.recipes,
    emoji: "🎬",
    background: "#EEF8FC",
    sortOrder: 30,
  },
  {
    id: "ai",
    title: "AI 助手",
    subtitle: "智能烘焙建議",
    href: APP_ROUTES.ai,
    emoji: "✨",
    background: "#F5F1FF",
    sortOrder: 40,
  },
  {
    id: "member",
    title: "會員中心",
    subtitle: "訂單、門市與載具",
    href: APP_ROUTES.member,
    emoji: "👤",
    background: "linear-gradient(180deg, #EEF8FC 0%, #F8FBFF 100%)",
    variant: "member",
    sortOrder: 50,
  },
  {
    id: "store-map",
    title: "門市地圖",
    subtitle: "找最近的門市",
    href: APP_ROUTES.storeMap,
    emoji: "📍",
    background: "#FFF8E3",
    sortOrder: 60,
  },
  {
    id: "promo",
    title: "優惠活動",
    subtitle: "本週精選優惠",
    href: "/shop?promo=1",
    emoji: "🎁",
    background: "#FFF3F0",
    badge: "HOT",
    sortOrder: 70,
  },
  {
    id: "news",
    title: "最新消息",
    subtitle: "品牌與門市動態",
    href: APP_ROUTES.news,
    emoji: "📰",
    background: "#F2F8FF",
    variant: "wide",
    sortOrder: 80,
  },
];

export function parseQuickEntryConfig(
  raw: Record<string, unknown> | null | undefined
): HomeQuickEntryConfig {
  if (!raw) {
    return {
      enabled: true,
      cards: DEFAULT_QUICK_ENTRY_CARDS,
      memberShortcuts: DEFAULT_MEMBER_SHORTCUTS,
    };
  }

  const cards = Array.isArray(raw.cards)
    ? (raw.cards as QuickEntryCardConfig[])
    : DEFAULT_QUICK_ENTRY_CARDS;

  const memberShortcuts = Array.isArray(raw.memberShortcuts)
    ? (raw.memberShortcuts as MemberShortcut[])
    : Array.isArray(raw.member_shortcuts)
      ? (raw.member_shortcuts as MemberShortcut[])
      : DEFAULT_MEMBER_SHORTCUTS;

  return {
    enabled: raw.enabled !== false,
    cards,
    memberShortcuts,
  };
}

export function listVisibleQuickEntryCards(
  cards: QuickEntryCardConfig[] | undefined
): QuickEntryCardConfig[] {
  return (cards ?? DEFAULT_QUICK_ENTRY_CARDS)
    .filter((c) => c.enabled !== false)
    .slice()
    .sort((a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0));
}
