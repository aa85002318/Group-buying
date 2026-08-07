import type { SideMenuCategory, SideMenuCategorySource } from "@/types/navigation";

const STALE_MS = 5 * 60 * 1000;
const GC_MS = 30 * 60 * 1000;

type CacheEntry = {
  categories: SideMenuCategory[];
  comingSoon?: boolean;
  fetchedAt: number;
};

const cache = new Map<string, CacheEntry>();
const inflight = new Map<string, Promise<CacheEntry>>();

export function categoryCacheKey(
  source: SideMenuCategorySource,
  parentId?: string | null
) {
  return `side-menu-categories:${source}:${parentId ?? "root"}`;
}

export function getCachedCategories(
  source: SideMenuCategorySource,
  parentId?: string | null
): CacheEntry | null {
  const key = categoryCacheKey(source, parentId);
  const entry = cache.get(key);
  if (!entry) return null;
  if (Date.now() - entry.fetchedAt > GC_MS) {
    cache.delete(key);
    return null;
  }
  return entry;
}

export function isCategoryCacheFresh(
  source: SideMenuCategorySource,
  parentId?: string | null
) {
  const entry = getCachedCategories(source, parentId);
  if (!entry) return false;
  return Date.now() - entry.fetchedAt < STALE_MS;
}

export function setCachedCategories(
  source: SideMenuCategorySource,
  parentId: string | null | undefined,
  data: { categories: SideMenuCategory[]; comingSoon?: boolean }
) {
  const key = categoryCacheKey(source, parentId);
  cache.set(key, {
    categories: data.categories,
    comingSoon: data.comingSoon,
    fetchedAt: Date.now(),
  });
}

export async function fetchSideMenuCategories(
  source: SideMenuCategorySource,
  parentId?: string | null,
  opts?: { signal?: AbortSignal; force?: boolean }
): Promise<CacheEntry> {
  const key = categoryCacheKey(source, parentId);
  const cached = getCachedCategories(source, parentId);
  if (cached && !opts?.force && Date.now() - cached.fetchedAt < STALE_MS) {
    return cached;
  }

  if (!opts?.force && inflight.has(key)) {
    return inflight.get(key)!;
  }

  const params = new URLSearchParams({ source });
  if (parentId) params.set("parentId", parentId);

  const promise = fetch(`/api/side-menu/categories?${params}`, {
    signal: opts?.signal,
  })
    .then(async (r) => {
      const d = await r.json();
      if (!r.ok) throw new Error(d.error ?? "分類載入失敗");
      const entry: CacheEntry = {
        categories: d.categories ?? [],
        comingSoon: Boolean(d.comingSoon),
        fetchedAt: Date.now(),
      };
      cache.set(key, entry);
      return entry;
    })
    .finally(() => {
      inflight.delete(key);
    });

  inflight.set(key, promise);
  return promise;
}

/** Background revalidate without blocking UI. */
export function revalidateSideMenuCategories(
  source: SideMenuCategorySource,
  parentId?: string | null
) {
  if (isCategoryCacheFresh(source, parentId)) return;
  void fetchSideMenuCategories(source, parentId, { force: true }).catch(() => {});
}

export function prefetchShopRootCategories() {
  return fetchSideMenuCategories("materials", null).catch(() => null);
}

export function pickDefaultCategoryId(
  categories: SideMenuCategory[],
  preferredId?: string | null
): string | null {
  if (!categories.length) return null;
  if (preferredId && categories.some((c) => c.id === preferredId)) {
    return preferredId;
  }
  const withChildren = categories.find((c) => c.childCount > 0);
  if (withChildren) return withChildren.id;
  const withProducts = categories.find((c) => (c.productCount ?? 0) > 0);
  if (withProducts) return withProducts.id;
  return categories[0]?.id ?? null;
}

/** Session memory for last selected materials main category. */
let lastMaterialsCategoryId: string | null = null;

export function getLastMaterialsCategoryId() {
  return lastMaterialsCategoryId;
}

export function setLastMaterialsCategoryId(id: string | null) {
  lastMaterialsCategoryId = id;
}
