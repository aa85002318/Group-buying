/**
 * 首頁「精選活動」區塊：把後台「文章管理」新增的活動文章，挑出來排成輪播。
 *
 * 設定都放在 homepage_blocks.config（不動 schema）：
 *   config.article_category  分類名稱或 slug；留白 = 全部文章
 *   config.only_featured     只顯示勾選「精選」的文章
 */

export type FeaturedArticleSettings = {
  /** Empty = every published article. */
  category: string;
  onlyFeatured: boolean;
};

export const DEFAULT_FEATURED_ARTICLE_SETTINGS: FeaturedArticleSettings = {
  category: "",
  onlyFeatured: false,
};

export function parseFeaturedArticleSettings(
  config: Record<string, unknown> | null | undefined
): FeaturedArticleSettings {
  const c = (config ?? {}) as Record<string, unknown>;
  const raw = c.article_category ?? c.category;
  return {
    category: typeof raw === "string" ? raw.trim() : "",
    onlyFeatured: c.only_featured === true,
  };
}

export type ArticleLike = {
  id: string;
  title?: string | null;
  slug?: string | null;
  cover_image?: string | null;
  sort_order?: number | null;
  is_featured?: boolean | null;
  created_at?: string | null;
  article_categories?: { id?: string; name?: string | null; slug?: string | null } | null;
  category_id?: string | null;
};

function categoryOf(a: ArticleLike): string[] {
  const c = a.article_categories;
  return [c?.name ?? "", c?.slug ?? "", a.category_id ?? ""].filter(Boolean) as string[];
}

/** 精選在前、再照 sort_order、最後照建立時間新到舊。 */
export function pickFeaturedArticles<T extends ArticleLike>(
  articles: T[] | null | undefined,
  settings: FeaturedArticleSettings,
  limit: number
): T[] {
  const needle = settings.category.trim().toLowerCase();
  const list = (articles ?? []).filter((a) => {
    if (settings.onlyFeatured && !a.is_featured) return false;
    if (!needle) return true;
    return categoryOf(a).some((c) => c.toLowerCase() === needle);
  });
  return list
    .slice()
    .sort((a, b) => {
      const af = a.is_featured ? 1 : 0;
      const bf = b.is_featured ? 1 : 0;
      if (af !== bf) return bf - af;
      const as = Number(a.sort_order ?? 9999);
      const bs = Number(b.sort_order ?? 9999);
      if (as !== bs) return as - bs;
      return String(b.created_at ?? "").localeCompare(String(a.created_at ?? ""));
    })
    .slice(0, Math.max(1, limit || 6));
}

export function articleHref(a: ArticleLike): string {
  return `/articles/${a.slug || a.id}`;
}
