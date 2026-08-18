/** Shop hub layout — section order / visibility + appearance (draftable). */

import {
  DEFAULT_SHOP_PAGE_SETTINGS,
  parseShopPageSettings,
  type ShopPageSettings,
} from "@/lib/shop/page-settings";

export const SHOP_LAYOUT_SECTION_IDS = [
  "categories",
  "features",
  "promo",
  "popular",
  "new",
  "inspiration",
  "ai-assistant",
  "info-banners",
  "hero",
] as const;

export type ShopLayoutSectionId = (typeof SHOP_LAYOUT_SECTION_IDS)[number];

/** Sections rendered in the main column (hero stays in the yellow plane). */
export const SHOP_LAYOUT_MAIN_IDS: ShopLayoutSectionId[] = [
  "categories",
  "features",
  "promo",
  "popular",
  "new",
  "inspiration",
  "ai-assistant",
  "info-banners",
];

export const SHOP_LAYOUT_SECTION_LABELS: Record<ShopLayoutSectionId, string> = {
  categories: "商品分類",
  features: "三格特色",
  promo: "活動 Banner",
  popular: "熱門商品",
  new: "新品上架",
  inspiration: "烘焙靈感牆",
  "ai-assistant": "AI 助手卡",
  "info-banners": "訂購／企業 Banner",
  hero: "商城 Hero Banner",
};

export type ShopLayoutSettings = {
  sectionOrder: ShopLayoutSectionId[];
  sections: Record<ShopLayoutSectionId, boolean>;
  appearance: ShopPageSettings;
};

function defaultSections(): Record<ShopLayoutSectionId, boolean> {
  return Object.fromEntries(
    SHOP_LAYOUT_SECTION_IDS.map((id) => [id, true])
  ) as Record<ShopLayoutSectionId, boolean>;
}

export const DEFAULT_SHOP_LAYOUT: ShopLayoutSettings = {
  sectionOrder: [...SHOP_LAYOUT_MAIN_IDS],
  sections: defaultSections(),
  appearance: { ...DEFAULT_SHOP_PAGE_SETTINGS },
};

function isSectionId(id: unknown): id is ShopLayoutSectionId {
  return (
    typeof id === "string" &&
    (SHOP_LAYOUT_SECTION_IDS as readonly string[]).includes(id)
  );
}

export function mergeShopLayoutSettings(input: unknown): ShopLayoutSettings {
  const raw =
    input && typeof input === "object" ? (input as Record<string, unknown>) : {};
  const sections = defaultSections();
  if (raw.sections && typeof raw.sections === "object") {
    for (const id of SHOP_LAYOUT_SECTION_IDS) {
      const v = (raw.sections as Record<string, unknown>)[id];
      if (typeof v === "boolean") sections[id] = v;
    }
  }
  sections.hero = false;

  const order: ShopLayoutSectionId[] = [];
  if (Array.isArray(raw.sectionOrder)) {
    for (const id of raw.sectionOrder) {
      if (isSectionId(id) && id !== "hero" && !order.includes(id)) order.push(id);
    }
  }
  for (const id of SHOP_LAYOUT_MAIN_IDS) {
    if (!order.includes(id)) order.push(id);
  }

  return {
    sectionOrder: order,
    sections,
    appearance: parseShopPageSettings(
      (raw.appearance as Record<string, unknown> | undefined) ??
        (raw as Record<string, unknown>)
    ),
  };
}

export function validateShopLayoutSettings(
  settings: ShopLayoutSettings
): string | null {
  if (!settings.sectionOrder.length) return "至少需要一個主區塊";
  return null;
}
