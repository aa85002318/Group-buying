/** Client-side browse history (product / recipe / group buy). No schema changes. */

export type BrowseItemType = "product" | "recipe" | "group_buy";

export type BrowseHistoryItem = {
  type: BrowseItemType;
  id: string;
  title: string;
  imageUrl?: string | null;
  href: string;
  price?: number | null;
  endAt?: string | null;
  viewedAt: string;
};

const STORAGE_KEY = "chimei_browse_history";
const MAX_ITEMS = 10;

function canUseStorage(): boolean {
  return typeof window !== "undefined" && typeof localStorage !== "undefined";
}

export function readBrowseHistory(): BrowseHistoryItem[] {
  if (!canUseStorage()) return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as BrowseHistoryItem[];
    if (!Array.isArray(parsed)) return [];
    return parsed
      .filter((i) => i && i.id && i.type && i.title && i.href)
      .sort((a, b) => new Date(b.viewedAt).getTime() - new Date(a.viewedAt).getTime())
      .slice(0, MAX_ITEMS);
  } catch {
    return [];
  }
}

function writeBrowseHistory(items: BrowseHistoryItem[]) {
  if (!canUseStorage()) return;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(items.slice(0, MAX_ITEMS)));
  } catch {
    // quota / private mode
  }
}

export function recordBrowse(
  item: Omit<BrowseHistoryItem, "viewedAt"> & { viewedAt?: string }
): BrowseHistoryItem[] {
  const nextItem: BrowseHistoryItem = {
    ...item,
    viewedAt: item.viewedAt ?? new Date().toISOString(),
  };
  const prev = readBrowseHistory().filter(
    (x) => !(x.type === nextItem.type && x.id === nextItem.id)
  );
  const next = [nextItem, ...prev].slice(0, MAX_ITEMS);
  writeBrowseHistory(next);
  return next;
}

export function clearBrowseHistory() {
  if (!canUseStorage()) return;
  localStorage.removeItem(STORAGE_KEY);
}

export const BROWSE_TYPE_LABEL: Record<BrowseItemType, string> = {
  product: "商品",
  recipe: "食譜",
  group_buy: "團購",
};
