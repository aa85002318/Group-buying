import { FEATURES } from "@/lib/features";

/**
 * Temporary consumer-facing switch: hide group-buy surfaces while
 * shop + recipes are the primary focus. Flip FEATURES.groupBuying to restore.
 */
export const GROUP_BUY_CONSUMER_VISIBLE = FEATURES.groupBuying;

/** Homepage CMS keys that are group-buy oriented. */
export const HIDDEN_HOME_GROUP_BUY_KEYS = new Set<string>([
  "group_buy_banner",
  "weekly_group_buys",
  "closing_group_buys",
  "weekly_live_streams",
  "chime_select",
]);

export function isGroupBuyConsumerHref(href: string | null | undefined): boolean {
  if (!href) return false;
  const path = href.split("?")[0] ?? href;
  return (
    path === "/group-buy" ||
    path.startsWith("/group-buy/") ||
    path === "/group-buy"
  );
}

export function isGroupBuyConsumerLabel(label: string | null | undefined): boolean {
  if (!label) return false;
  return /團購/.test(label);
}

/** Filter nav / menu link lists when group-buy is hidden. */
export function filterConsumerGroupBuyLinks<
  T extends { href?: string; label?: string; id?: string },
>(items: readonly T[]): T[] {
  if (GROUP_BUY_CONSUMER_VISIBLE) return [...items];
  return items.filter((item) => {
    if (item.id === "group_buy" || item.id === "today" || item.id === "ending") {
      return false;
    }
    if (isGroupBuyConsumerHref(item.href)) return false;
    if (isGroupBuyConsumerLabel(item.label)) return false;
    return true;
  });
}

export function filterSideMenuSectionsForGroupBuyVisibility<
  T extends { items?: Array<{ href?: string; label?: string; id?: string }> },
>(sections: T[]): T[] {
  if (GROUP_BUY_CONSUMER_VISIBLE) return sections;
  return sections
    .map((section) => ({
      ...section,
      items: filterConsumerGroupBuyLinks(section.items ?? []),
    }))
    .filter((section) => (section.items?.length ?? 0) > 0);
}
