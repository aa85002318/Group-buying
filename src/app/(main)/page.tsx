"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { Clock3, Heart, Play } from "lucide-react";
import { HomeSearchBar } from "@/components/home/HomeSearchBar";
import { HomeHero } from "@/components/home/HomeHero";
import { HomeContentArea } from "@/components/home/HomeContentArea";
import { HomeQuickMenuCarousel } from "@/components/home/HomeQuickMenuCarousel";
import { PopularCategories } from "@/components/home/PopularCategories";
import { HotSearchChips } from "@/components/home/HotSearchChips";
import { RecentBrowseSection } from "@/components/home/RecentBrowseSection";
import { QuickReorderSection } from "@/components/home/QuickReorderSection";
import { HorizontalProductRail } from "@/components/home/HorizontalProductRail";
import { GroupBuyClosingSection } from "@/components/home/GroupBuyClosingSection";
import { PromoBannerStrip } from "@/components/home/PromoBannerStrip";
import { HomeSectionFrame } from "@/components/home/HomeSectionFrame";
import { HomeFooter } from "@/components/home/HomeFooter";
import { HorizontalScroller } from "@/components/home/HorizontalScroller";
import { SectionHeader } from "@/components/consumer/SectionHeader";
import { getNewThisWeekProducts } from "@/lib/home";
import { resolveHomeBlock } from "@/lib/home/blocks";
import { resolveHotSearchKeywords } from "@/lib/home/hot-search";
import { parsePopularCategories } from "@/lib/home/admin-sections";
import { readBrowseHistory, type BrowseHistoryItem } from "@/lib/home/browse-history";
import { buildReorderCandidates } from "@/lib/home/reorder";
import { mockProducts } from "@/lib/mock-data";
import type { RecipeSummary } from "@/lib/consumer-hub";
import type { Article, HomepageBlock, Order, Product, Video } from "@/lib/types/database";
import { isSupabaseConfigured } from "@/lib/config";

type GbEvent = {
  id: string;
  title: string;
  end_at?: string | null;
  status?: string;
  cover_image?: string | null;
  group_buy_products?: Array<{
    special_price?: number | null;
    stock?: number | null;
    products?: Product | null;
  }>;
};

type LoadState<T> = {
  data: T;
  loading: boolean;
  error: string | null;
};

function useIndependentLoad<T>(
  initial: T,
  loader: () => Promise<T>,
  enabled = true
): LoadState<T> & { reload: () => void } {
  const [data, setData] = useState<T>(initial);
  const [loading, setLoading] = useState(enabled);
  const [error, setError] = useState<string | null>(null);
  const [tick, setTick] = useState(0);

  useEffect(() => {
    if (!enabled) {
      setLoading(false);
      setError(null);
      return;
    }
    let cancelled = false;
    setLoading(true);
    setError(null);
    loader()
      .then((result) => {
        if (!cancelled) setData(result);
      })
      .catch((e) => {
        if (!cancelled) setError(e instanceof Error ? e.message : "載入失敗");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tick, enabled]);

  return {
    data,
    loading,
    error,
    reload: () => setTick((t) => t + 1),
  };
}

function formatArticleDate(iso: string | undefined) {
  if (!iso) return "";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  return `${d.getFullYear()}/${d.getMonth() + 1}/${d.getDate()}`;
}

export default function HomePage() {
  const cmsLoad = useIndependentLoad<HomepageBlock[]>([], async () => {
    const r = await fetch("/api/cms");
    const d = await r.json();
    if (!r.ok) throw new Error(d.error ?? "首頁設定載入失敗");
    return d.blocks ?? [];
  });

  const productsLoad = useIndependentLoad<Product[]>(mockProducts, async () => {
    const r = await fetch("/api/products");
    const d = await r.json();
    if (!r.ok) throw new Error(d.error ?? "商品載入失敗");
    return d.products?.length ? d.products : mockProducts;
  });

  const eventsLoad = useIndependentLoad<GbEvent[]>([], async () => {
    const r = await fetch("/api/group-buy-events");
    const d = await r.json();
    if (!r.ok) throw new Error(d.error ?? "團購載入失敗");
    return d.events ?? [];
  });

  const recipesLoad = useIndependentLoad<RecipeSummary[]>([], async () => {
    const r = await fetch("/api/recipes");
    const d = await r.json();
    if (!r.ok) throw new Error(d.error ?? "食譜載入失敗");
    return d.recipes ?? [];
  });

  const videosLoad = useIndependentLoad<Video[]>([], async () => {
    const r = await fetch("/api/videos");
    const d = await r.json();
    if (!r.ok) throw new Error(d.error ?? "影音載入失敗");
    return d.videos ?? [];
  });

  const articlesLoad = useIndependentLoad<Article[]>([], async () => {
    const r = await fetch("/api/articles");
    const d = await r.json();
    if (!r.ok) throw new Error(d.error ?? "文章載入失敗");
    return d.articles ?? [];
  });

  const [authState, setAuthState] = useState<"loading" | "guest" | "member">("loading");
  const [browseItems, setBrowseItems] = useState<BrowseHistoryItem[]>([]);
  const [browseTick, setBrowseTick] = useState(0);

  const loadMemberBits = useCallback(() => {
    if (!isSupabaseConfigured()) {
      setAuthState("guest");
      return;
    }
    fetch("/api/auth/me")
      .then((r) => r.json())
      .then((data) => setAuthState(data.profile ? "member" : "guest"))
      .catch(() => setAuthState("guest"));
  }, []);

  useEffect(() => {
    loadMemberBits();
  }, [loadMemberBits]);

  useEffect(() => {
    setBrowseItems(readBrowseHistory());
  }, [browseTick]);

  const isMember = authState === "member";

  const ordersLoad = useIndependentLoad<Order[]>(
    [],
    async () => {
      const r = await fetch("/api/orders");
      const d = await r.json();
      if (!r.ok) throw new Error(d.error ?? "訂單載入失敗");
      return d.orders ?? [];
    },
    isMember
  );

  const blocks = cmsLoad.data;
  const hotSearchBlock = resolveHomeBlock(blocks, "hot_search");
  const newBlock = resolveHomeBlock(blocks, "new_products");
  const hotBlock = resolveHomeBlock(blocks, "hot_products");
  const recipesBlock = resolveHomeBlock(blocks, "recipes");
  const videosBlock = resolveHomeBlock(blocks, "videos");
  const groupBuyBlock = resolveHomeBlock(blocks, "group_buy_closing");
  const newsBlock = resolveHomeBlock(blocks, "news");
  const heroBlock = resolveHomeBlock(blocks, "hero_banner");
  const reorderBlock = resolveHomeBlock(blocks, "quick_reorder");
  const recentBlock = resolveHomeBlock(blocks, "recent_browse");
  const quickMenuBlock = resolveHomeBlock(blocks, "quick_menu");
  const categoriesBlock = resolveHomeBlock(blocks, "popular_categories");
  const weeklyPromoBlock = resolveHomeBlock(blocks, "weekly_promo");

  const hotKeywords = useMemo(
    () => resolveHotSearchKeywords(hotSearchBlock.config),
    [hotSearchBlock.config]
  );

  const categoryItems = useMemo(() => {
    const fromCms = parsePopularCategories(categoriesBlock.config);
    return fromCms.length > 0 ? fromCms : undefined;
  }, [categoriesBlock.config]);

  const newest = useMemo(() => {
    const fromWeek = getNewThisWeekProducts(productsLoad.data);
    const source =
      fromWeek.length > 0
        ? fromWeek
        : [...productsLoad.data].sort((a, b) =>
            String(b.created_at ?? "").localeCompare(String(a.created_at ?? ""))
          );
    return source.slice(0, newBlock.displayCount);
  }, [productsLoad.data, newBlock.displayCount]);

  const popular = useMemo(() => {
    const found = blocks?.find((b) => b.block_key === "hot_products");
    const manualIds = found?.manual_ids ?? [];
    if (found?.source_mode === "manual" && manualIds.length > 0) {
      const byId = new Map(productsLoad.data.map((p) => [p.id, p]));
      return manualIds
        .map((id) => byId.get(id))
        .filter(Boolean)
        .slice(0, hotBlock.displayCount) as Product[];
    }
    return productsLoad.data.slice(0, hotBlock.displayCount);
  }, [productsLoad.data, hotBlock.displayCount, blocks]);

  const closing = useMemo(
    () =>
      eventsLoad.data
        .filter((e) => e.status === "active")
        .slice(0, groupBuyBlock.displayCount),
    [eventsLoad.data, groupBuyBlock.displayCount]
  );
  const recipes = useMemo(
    () => recipesLoad.data.slice(0, recipesBlock.displayCount),
    [recipesLoad.data, recipesBlock.displayCount]
  );
  const videos = useMemo(
    () => videosLoad.data.slice(0, videosBlock.displayCount),
    [videosLoad.data, videosBlock.displayCount]
  );
  const articles = useMemo(() => {
    const list = [...articlesLoad.data].sort((a, b) => {
      const af = Number(Boolean((a as Article & { is_featured?: boolean }).is_featured));
      const bf = Number(Boolean((b as Article & { is_featured?: boolean }).is_featured));
      if (bf !== af) return bf - af;
      return (a.sort_order ?? 0) - (b.sort_order ?? 0);
    });
    return list.slice(0, newsBlock.displayCount);
  }, [articlesLoad.data, newsBlock.displayCount]);

  const reorderCandidates = useMemo(() => {
    const ranked = buildReorderCandidates(ordersLoad.data, reorderBlock.displayCount);
    return ranked.map((c) => {
      const p = productsLoad.data.find((x) => x.id === c.productId);
      return {
        ...c,
        imageUrl: c.imageUrl ?? p?.image_url ?? null,
        unit: c.unit ?? p?.unit ?? p?.subtitle ?? null,
        price: c.price || Number(p?.price ?? 0),
        name: c.name || p?.name || "商品",
      };
    });
  }, [ordersLoad.data, productsLoad.data, reorderBlock.displayCount]);

  const showReorder =
    isMember &&
    reorderBlock.visible &&
    (ordersLoad.loading || ordersLoad.error != null || reorderCandidates.length > 0);

  return (
    <div className="home-page page-enter w-full max-w-full overflow-x-clip">
      {/* 頂部奶油色區：搜尋 + 熱門搜尋 + Hero */}
      <section className="home-top-area pb-4 pt-3 sm:pt-4">
        <div className="home-page-inner space-y-3 sm:space-y-4">
          <HomeSearchBar />
          {hotSearchBlock.visible ? (
            <HotSearchChips
              title={hotSearchBlock.title || "熱門搜尋"}
              keywords={hotKeywords}
              loading={cmsLoad.loading}
            />
          ) : null}
          {heroBlock.visible ? <HomeHero /> : null}
        </div>
      </section>

      {/* 中段純白區：Hero 底部到 Footer */}
      <HomeContentArea>
        <div className="home-page-inner space-y-6 min-[375px]:space-y-7 md:space-y-8">
          {quickMenuBlock.visible ? <HomeQuickMenuCarousel /> : null}

          {recentBlock.visible ? (
            <RecentBrowseSection
              items={isMember ? browseItems : []}
              limit={recentBlock.displayCount}
              onRetry={() => setBrowseTick((t) => t + 1)}
              showGuestEmpty={authState === "guest"}
            />
          ) : null}

          {showReorder ? (
            <QuickReorderSection
              candidates={reorderCandidates}
              loading={ordersLoad.loading || productsLoad.loading}
              error={ordersLoad.error}
              onRetry={ordersLoad.reload}
            />
          ) : null}

          {categoriesBlock.visible ? (
            <PopularCategories
              items={categoryItems}
              title={categoriesBlock.title || "熱門分類"}
            />
          ) : null}

          {newBlock.visible ? (
            <HorizontalProductRail
              title={newBlock.title || "今日新品"}
              href="/products?sort=newest"
              products={newest}
              badge="new"
              loading={productsLoad.loading}
              error={productsLoad.error}
              onRetry={productsLoad.reload}
            />
          ) : null}

          {hotBlock.visible ? (
            <HorizontalProductRail
              title={hotBlock.title || "熱門商品"}
              href="/products"
              products={popular}
              badge="hot"
              loading={productsLoad.loading}
              error={productsLoad.error}
              onRetry={productsLoad.reload}
            />
          ) : null}

          {groupBuyBlock.visible ? (
            <GroupBuyClosingSection
              title={groupBuyBlock.title || "即將收單"}
              events={closing}
              loading={eventsLoad.loading}
              error={eventsLoad.error}
              onRetry={eventsLoad.reload}
            />
          ) : null}

          {weeklyPromoBlock.visible ? (
            <PromoBannerStrip
              title={weeklyPromoBlock.title || "本週優惠"}
              limit={weeklyPromoBlock.displayCount}
            />
          ) : null}

          {recipesBlock.visible ? (
            <section className="space-y-3">
              <SectionHeader
                title={recipesBlock.title || "最新食譜"}
                href="/recipes"
                className="!mb-0"
              />
              <p className="text-xs text-foreground-secondary">一分鐘教你做 · 老師推薦</p>
              <HomeSectionFrame
                loading={recipesLoad.loading}
                error={recipesLoad.error}
                onRetry={recipesLoad.reload}
                empty={!recipesLoad.loading && !recipesLoad.error && recipes.length === 0}
                emptyTitle="尚無食譜"
                emptyText="新食譜上架後會出現在這裡"
                emptyActionHref="/recipes"
                emptyActionLabel="看全部食譜"
                skeletonCount={3}
              >
                <HorizontalScroller className="md:grid md:grid-cols-3 md:gap-4 md:overflow-visible xl:grid-cols-4">
                  {recipes.map((r) => (
                    <Link
                      key={r.id}
                      href={r.href}
                      className="flex w-[152px] shrink-0 flex-col overflow-hidden rounded-[16px] border border-border-soft bg-surface min-[375px]:w-[160px] sm:w-[168px] md:w-auto"
                    >
                      <div className="relative aspect-[4/3] bg-surface-soft">
                        {r.coverImage ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img
                            src={r.coverImage}
                            alt=""
                            className="h-full w-full object-cover"
                          />
                        ) : null}
                        <span className="absolute left-2 top-2 rounded-full bg-surface-yellow px-2 py-0.5 text-[10px] font-bold text-brand-caramel">
                          {r.category}
                        </span>
                        <span className="absolute right-2 top-2 text-brand-primary">
                          <Heart className="h-4 w-4" aria-hidden />
                        </span>
                      </div>
                      <div className="space-y-1 p-2.5">
                        <p className="line-clamp-2 text-[13px] font-bold text-brand-caramel">
                          {r.title}
                        </p>
                        <p className="inline-flex items-center gap-1 text-[11px] text-foreground-secondary">
                          <Clock3 className="h-3 w-3 text-brand-yellow" aria-hidden />
                          {r.durationMinutes} 分
                        </p>
                      </div>
                    </Link>
                  ))}
                </HorizontalScroller>
              </HomeSectionFrame>
            </section>
          ) : null}

          {videosBlock.visible ? (
            <section className="space-y-3">
              <SectionHeader
                title={videosBlock.title || "最新影音"}
                href="/videos"
                className="!mb-0"
              />
              <p className="text-xs text-foreground-secondary">一分鐘教你做 · 熱門影音</p>
              <HomeSectionFrame
                loading={videosLoad.loading}
                error={videosLoad.error}
                onRetry={videosLoad.reload}
                empty={!videosLoad.loading && !videosLoad.error && videos.length === 0}
                emptyTitle="尚無影音"
                emptyText="新影音上架後會出現在這裡"
                emptyActionHref="/videos"
                emptyActionLabel="看全部影音"
                skeletonCount={3}
              >
                <HorizontalScroller className="md:grid md:grid-cols-3 md:gap-4 md:overflow-visible xl:grid-cols-4">
                  {videos.map((v) => (
                    <Link
                      key={v.id}
                      href={`/videos/${v.slug || v.id}`}
                      className="flex w-[168px] shrink-0 flex-col overflow-hidden rounded-[16px] border border-border-soft bg-surface min-[375px]:w-[176px] sm:w-[188px] md:w-auto"
                    >
                      <div className="relative aspect-video bg-surface-soft">
                        {v.thumbnail_url ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img
                            src={v.thumbnail_url}
                            alt=""
                            className="h-full w-full object-cover"
                          />
                        ) : null}
                        <span className="absolute inset-0 flex items-center justify-center">
                          <span className="flex h-10 w-10 items-center justify-center rounded-full bg-brand-primary text-white">
                            <Play className="h-4 w-4 fill-current" aria-hidden />
                          </span>
                        </span>
                        {v.duration_seconds ? (
                          <span className="absolute bottom-2 right-2 rounded bg-[rgba(138,90,52,0.82)] px-1.5 py-0.5 text-[10px] font-bold text-white">
                            {Math.floor(v.duration_seconds / 60)}:
                            {String(v.duration_seconds % 60).padStart(2, "0")}
                          </span>
                        ) : null}
                      </div>
                      <div className="space-y-1 p-2.5">
                        <span className="inline-flex rounded-full bg-surface-yellow px-2 py-0.5 text-[10px] font-bold text-brand-caramel">
                          {v.category || "影音"}
                        </span>
                        <p className="line-clamp-2 text-[13px] font-bold text-brand-caramel">
                          {v.title}
                        </p>
                      </div>
                    </Link>
                  ))}
                </HorizontalScroller>
              </HomeSectionFrame>
            </section>
          ) : null}

          {newsBlock.visible ? (
            <section className="space-y-3">
              <SectionHeader
                title={newsBlock.title || "最新資訊"}
                href="/articles"
                className="!mb-0"
              />
              <HomeSectionFrame
                loading={articlesLoad.loading}
                error={articlesLoad.error}
                onRetry={articlesLoad.reload}
                empty={!articlesLoad.loading && !articlesLoad.error && articles.length === 0}
                emptyTitle="尚無最新資訊"
                emptyText="新文章發布後會顯示在這裡"
                emptyActionHref="/articles"
                emptyActionLabel="看全部文章"
                skeletonCount={2}
              >
                <ul className="space-y-2.5 md:grid md:grid-cols-2 md:gap-4 md:space-y-0 xl:grid-cols-3">
                  {articles.map((a) => {
                    const featured = Boolean((a as Article & { is_featured?: boolean }).is_featured);
                    return (
                      <li key={a.id} className="min-w-0">
                        <Link
                          href={`/articles/${a.slug || a.id}`}
                          className="flex gap-3 overflow-hidden rounded-[16px] border border-border-soft bg-surface p-3"
                        >
                          <span className="min-w-0 flex-1">
                            <span className="flex flex-wrap items-center gap-2">
                              {featured ? (
                                <span className="rounded-full bg-brand-primary px-2 py-0.5 text-[10px] font-bold text-white">
                                  置頂
                                </span>
                              ) : (
                                <span className="rounded-full bg-surface-coral px-2 py-0.5 text-[10px] font-bold text-brand-primary">
                                  文章
                                </span>
                              )}
                              <span className="text-[11px] text-foreground-secondary">
                                {formatArticleDate(a.created_at)}
                              </span>
                            </span>
                            <p className="mt-1.5 line-clamp-2 text-[13px] font-bold text-brand-caramel">
                              {a.title}
                            </p>
                          </span>
                          {a.cover_image ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img
                              src={a.cover_image}
                              alt=""
                              className="h-16 w-16 shrink-0 rounded-xl object-cover"
                            />
                          ) : (
                            <span className="h-16 w-16 shrink-0 rounded-xl bg-surface-soft" />
                          )}
                        </Link>
                      </li>
                    );
                  })}
                </ul>
              </HomeSectionFrame>
            </section>
          ) : null}
        </div>
      </HomeContentArea>

      <HomeFooter className="mt-0" />
    </div>
  );
}
