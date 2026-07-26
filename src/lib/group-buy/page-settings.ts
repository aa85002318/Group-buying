/** Group-buy page settings — drives /group-buy presentation from admin. */

export type GroupBuyTab =
  | "all"
  | "active"
  | "ending_soon"
  | "upcoming"
  | "ended";

export type GroupBuySectionId =
  | "header"
  | "tabs"
  | "search_filters"
  | "ending_soon"
  | "group_buy_list"
  | "upcoming"
  | "purchase_notice";

export type GroupBuySort =
  | "recommended"
  | "ending_soon"
  | "newest"
  | "popular"
  | "price_asc"
  | "price_desc";

export type GroupBuyRuntimeStatus =
  | "upcoming"
  | "active"
  | "ending_soon"
  | "ended"
  | "sold_out"
  | "draft"
  | "cancelled";

export type GroupBuyPageSettings = {
  enabled: boolean;
  title: string;
  subtitle?: string;

  showActiveCount: boolean;
  showEndingSoonCount: boolean;

  defaultTab: GroupBuyTab;
  enabledTabs: GroupBuyTab[];

  sectionOrder: GroupBuySectionId[];
  sections: Record<GroupBuySectionId, boolean>;
  sectionTitles: Partial<Record<GroupBuySectionId, string>>;
  sectionSubtitles: Partial<Record<GroupBuySectionId, string>>;

  endingSoonHours: number;
  endingSoonLimit: number;
  endingSoonShowCountdown: boolean;
  upcomingDays: number;
  upcomingLimit: number;

  pageSizeDesktop: number;
  pageSizeMobile: number;

  searchPlaceholder: string;
  enabledSearchFields: {
    name: boolean;
    subtitle: boolean;
    brand: boolean;
    keyword: boolean;
    sku: boolean;
  };

  defaultSort: GroupBuySort;
  enabledSorts: GroupBuySort[];
  enabledFilters: {
    category: boolean;
    fulfillment: boolean;
    status: boolean;
    price: boolean;
    endingTime: boolean;
  };

  cardFields: {
    image: boolean;
    status: boolean;
    name: boolean;
    spec: boolean;
    groupPrice: boolean;
    originalPrice: boolean;
    savings: boolean;
    endDate: boolean;
    countdown: boolean;
    participantCount: boolean;
    soldQuantity: boolean;
    progress: boolean;
    fulfillment: boolean;
    tags: boolean;
    actionButton: boolean;
  };

  buttonLabels: {
    active: string;
    ending_soon: string;
    upcoming: string;
    ended: string;
    sold_out: string;
  };

  purchaseNoticeEnabled: boolean;
  purchaseNoticeTitle: string;
  purchaseNoticeContent: string;
  purchaseNoticeDefaultOpen: boolean;
};

export const DEFAULT_GROUP_BUY_PAGE_SETTINGS: GroupBuyPageSettings = {
  enabled: true,
  title: "團購專區",
  subtitle: "精選限時團購，一起買更優惠",

  showActiveCount: true,
  showEndingSoonCount: true,

  defaultTab: "active",
  enabledTabs: ["all", "active", "ending_soon", "upcoming"],

  sectionOrder: [
    "header",
    "tabs",
    "search_filters",
    "ending_soon",
    "group_buy_list",
    "upcoming",
    "purchase_notice",
  ],
  sections: {
    header: true,
    tabs: true,
    search_filters: true,
    ending_soon: true,
    group_buy_list: true,
    upcoming: true,
    purchase_notice: true,
  },
  sectionTitles: {
    ending_soon: "即將結團",
    group_buy_list: "團購商品列表",
    upcoming: "即將開團",
    purchase_notice: "團購購買須知",
  },
  sectionSubtitles: {},

  endingSoonHours: 48,
  endingSoonLimit: 6,
  endingSoonShowCountdown: true,
  upcomingDays: 14,
  upcomingLimit: 6,

  pageSizeDesktop: 12,
  pageSizeMobile: 10,

  searchPlaceholder: "搜尋團購商品、品牌或關鍵字",
  enabledSearchFields: {
    name: true,
    subtitle: true,
    brand: true,
    keyword: true,
    sku: true,
  },

  defaultSort: "recommended",
  enabledSorts: [
    "recommended",
    "ending_soon",
    "newest",
    "popular",
    "price_asc",
    "price_desc",
  ],
  enabledFilters: {
    category: true,
    fulfillment: true,
    status: true,
    price: false,
    endingTime: true,
  },

  cardFields: {
    image: true,
    status: true,
    name: true,
    spec: true,
    groupPrice: true,
    originalPrice: true,
    savings: true,
    endDate: false,
    countdown: true,
    participantCount: true,
    soldQuantity: false,
    progress: false,
    fulfillment: true,
    tags: true,
    actionButton: true,
  },

  buttonLabels: {
    active: "查看團購",
    ending_soon: "立即查看",
    upcoming: "查看詳情",
    ended: "已結團",
    sold_out: "已售罄",
  },

  purchaseNoticeEnabled: true,
  purchaseNoticeTitle: "團購購買須知",
  purchaseNoticeContent: [
    "【結單說明】請於結團時間前完成下單與付款。",
    "【預計到貨】到貨日依各團公告為準，可能因天候或物流調整。",
    "【付款方式】請依結帳頁提供的方式完成付款。",
    "【取貨方式】依各團開放的門市取貨或宅配選項為準。",
    "【配送限制】不同溫層可能無法合併配送，結帳時將依規則拆單。",
    "【取消規則】結團後恕不接受無故取消；特殊狀況請聯繫客服。",
    "【缺貨處理】若遇缺貨將優先聯繫更換或退款。",
    "【退款方式】退款將退回原付款方式或約定帳戶。",
    "【客服資訊】請至會員中心「客服」或官方客服管道聯繫。",
  ].join("\n\n"),
  purchaseNoticeDefaultOpen: false,
};

export const TAB_LABELS: Record<GroupBuyTab, string> = {
  all: "全部團購",
  active: "進行中",
  ending_soon: "即將結團",
  upcoming: "即將開團",
  ended: "已結團",
};

export const SECTION_LABELS: Record<GroupBuySectionId, string> = {
  header: "頁面標題區",
  tabs: "團購狀態分頁",
  search_filters: "搜尋與篩選",
  ending_soon: "即將結團區",
  group_buy_list: "團購商品列表",
  upcoming: "即將開團區",
  purchase_notice: "團購購買須知",
};

export const SORT_LABELS: Record<GroupBuySort, string> = {
  recommended: "推薦排序",
  ending_soon: "即將結團",
  newest: "最新開團",
  popular: "熱門團購",
  price_asc: "價格低到高",
  price_desc: "價格高到低",
};

export function mergeGroupBuyPageSettings(
  raw: unknown
): GroupBuyPageSettings {
  const base = structuredClone(DEFAULT_GROUP_BUY_PAGE_SETTINGS);
  if (!raw || typeof raw !== "object") return base;
  const input = raw as Partial<GroupBuyPageSettings>;

  const merged: GroupBuyPageSettings = {
    ...base,
    ...input,
    sections: { ...base.sections, ...(input.sections ?? {}) },
    sectionTitles: { ...base.sectionTitles, ...(input.sectionTitles ?? {}) },
    sectionSubtitles: { ...base.sectionSubtitles, ...(input.sectionSubtitles ?? {}) },
    enabledSearchFields: {
      ...base.enabledSearchFields,
      ...(input.enabledSearchFields ?? {}),
    },
    enabledFilters: { ...base.enabledFilters, ...(input.enabledFilters ?? {}) },
    cardFields: { ...base.cardFields, ...(input.cardFields ?? {}) },
    buttonLabels: { ...base.buttonLabels, ...(input.buttonLabels ?? {}) },
    enabledTabs: Array.isArray(input.enabledTabs) && input.enabledTabs.length
      ? input.enabledTabs
      : base.enabledTabs,
    sectionOrder: Array.isArray(input.sectionOrder) && input.sectionOrder.length
      ? (input.sectionOrder as GroupBuySectionId[])
      : base.sectionOrder,
    enabledSorts: Array.isArray(input.enabledSorts) && input.enabledSorts.length
      ? input.enabledSorts
      : base.enabledSorts,
  };

  if (!merged.enabledTabs.includes(merged.defaultTab)) {
    merged.defaultTab = merged.enabledTabs[0] ?? "active";
  }

  return merged;
}

export function validateGroupBuyPageSettings(
  settings: GroupBuyPageSettings
): string | null {
  if (!settings.title.trim()) return "請填寫頁面標題";
  if (!settings.enabledTabs.length) return "至少啟用一個狀態分頁";
  if (!settings.enabledTabs.includes(settings.defaultTab)) {
    return "預設分頁必須為已啟用的分頁";
  }
  if (settings.endingSoonHours < 1 || settings.endingSoonHours > 168) {
    return "即將結團判定時數需介於 1–168";
  }
  if (settings.upcomingDays < 1 || settings.upcomingDays > 90) {
    return "即將開團提前天數需介於 1–90";
  }
  return null;
}

export function computeGroupBuyRuntimeStatus(input: {
  status: string;
  start_at: string;
  end_at: string;
  sold_out?: boolean;
  endingSoonHours: number;
  now?: Date;
}): GroupBuyRuntimeStatus {
  if (input.status === "draft") return "draft";
  if (input.status === "cancelled") return "cancelled";
  if (input.sold_out) return "sold_out";

  const now = input.now ?? new Date();
  const start = new Date(input.start_at).getTime();
  const end = new Date(input.end_at).getTime();
  const t = now.getTime();

  if (Number.isFinite(end) && t > end) return "ended";
  if (input.status === "ended") return "ended";
  if (Number.isFinite(start) && t < start) return "upcoming";

  const hoursLeft = (end - t) / (1000 * 60 * 60);
  if (hoursLeft >= 0 && hoursLeft <= input.endingSoonHours) return "ending_soon";
  return "active";
}

export function formatCountdown(targetIso: string, now = new Date()): string {
  const diff = new Date(targetIso).getTime() - now.getTime();
  if (diff <= 0) return "已結束";
  const hours = Math.floor(diff / (1000 * 60 * 60));
  const days = Math.floor(hours / 24);
  const remH = hours % 24;
  if (days > 0) return `${days}天${remH}小時`;
  const mins = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
  if (hours > 0) return `${hours}小時${mins}分`;
  return `${Math.max(1, mins)}分鐘`;
}

export function formatPriceTwd(n: number): string {
  return `$${Math.round(Number(n) || 0).toLocaleString("zh-TW")}`;
}

export function fulfillmentShortLabels(options: unknown): string[] {
  if (!Array.isArray(options)) return [];
  const map: Record<string, string> = {
    store_pickup: "門市取貨",
    ambient: "常溫宅配",
    chilled: "冷藏宅配",
    frozen: "冷凍宅配",
    cvs: "超商取貨",
  };
  return options
    .map((o) => (typeof o === "string" ? map[o] ?? o : null))
    .filter((x): x is string => Boolean(x));
}
