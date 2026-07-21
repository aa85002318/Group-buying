"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { Play } from "lucide-react";
import { HomeSearchBar } from "@/components/home/HomeSearchBar";
import { HomeHero } from "@/components/home/HomeHero";
import { HomeContentArea } from "@/components/home/HomeContentArea";
import { PrimaryQuickActions } from "@/components/home/PrimaryQuickActions";
import { FeatureDuoCards } from "@/components/home/FeatureDuoCards";
import { PopularCategories } from "@/components/home/PopularCategories";
import { HotSearchChips } from "@/components/home/HotSearchChips";
import { RecentBrowseSection } from "@/components/home/RecentBrowseSection";
import { QuickReorderSection } from "@/components/home/QuickReorderSection";
import { HorizontalProductRail } from "@/components/home/HorizontalProductRail";
import { GroupBuyClosingSection } from "@/components/home/GroupBuyClosingSection";
import { PromoBannerStrip } from "@/components/home/PromoBannerStrip";
import { HomeSectionFrame } from "@/components/home/HomeSectionFrame";
import { HomeFooter } from "@/components/home/HomeFooter";
import { RecipeCard } from "@/components/consumer/RecipeCard";
import { NewsCard } from "@/components/consumer/NewsCard";
import { SectionHeader } from "@/components/consumer/SectionHeader";
import { getNewThisWeekProducts } from "@/lib/home";
import { resolveHomeBlock } from "@/lib/home/blocks";
import { resolveHotSearchKeywords } from "@/lib/home/hot-search";
import { readBrowseHistory, type BrowseHistoryItem } from "@/lib/home/browse-history";
import { buildReorderCandidates } from "@/lib/home/reorder";
import { mockProducts } from "@/lib/mock-data";
import type { RecipeSummary, NewsItem } from "@/lib/consumer-hub";
import type { HomepageBlock, Order, Product, Video } from "@/lib/types/database";
import { isSupabaseConfigured } from "@/lib/config";

type GbEvent = {
  id: string;
  title: string;
  end_at?: string | null;
  status?: string;
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

  const newsLoad = useIndependentLoad<NewsItem[]>([], async () => {
    const r = await fetch("/api/news");
    const d = await r.json();
    if (!r.ok) throw new Error(d.error ?? "最新資訊載入失敗");
    return d.news ?? [];
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

  const hotKeywords = useMemo(
    () => resolveHotSearchKeywords(hotSearchBlock.config),
    [hotSearchBlock.config]
  );

  const newest = useMemo(
    () => getNewThisWeekProducts(productsLoad.data).slice(0, newBlock.displayCount),
    [productsLoad.data, newBlock.displayCount]
  );
  const popular = useMemo(
    () => productsLoad.data.slice(0, hotBlock.displayCount),
    [productsLoad.data, hotBlock.displayCount]
  );
  const weeklyHot = useMemo(
    () => productsLoad.data.slice(0, 8),
    [productsLoad.data]
  );
  const forYou = useMemo(() => {
    const hot = productsLoad.data.slice(2, 10);
    const neu = getNewThisWeekProducts(productsLoad.data).slice(0, 6);
    const map = new Map<string, Product>();
    [...hot, ...neu].forEach((p) => map.set(p.id, p));
    return Array.from(map.values()).slice(0, 8);
  }, [productsLoad.data]);

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
  const news = useMemo(
    () => newsLoad.data.slice(0, newsBlock.displayCount),
    [newsLoad.data, newsBlock.displayCount]
  );

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
    <div className="page-enter mx-auto max-w-[1200px] overflow-x-hidden">
      {/* Cream band: Search + Hot search + Hero */}
      <div className="space-y-4 bg-background pb-4 pt-3 md:space-y-5 md:pb-5 md:pt-4">
        <HomeSearchBar />

        {hotSearchBlock.visible ? (
          <HotSearchChips
            title={hotSearchBlock.title}
            keywords={hotKeywords}
            loading={cmsLoad.loading}
          />
        ) : null}

        {heroBlock.visible ? <HomeHero /> : null}
      </div>

      {/* White mid content */}
      <HomeContentArea>
        <PrimaryQuickActions />

        <FeatureDuoCards />

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

        <PopularCategories />

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

        <HorizontalProductRail
          title="本週熱銷"
          href="/products"
          products={weeklyHot}
          badge="hot"
          loading={productsLoad.loading}
        />

        <HorizontalProductRail
          title="猜你喜歡"
          href="/products"
          products={forYou}
          loading={productsLoad.loading}
        />

        {groupBuyBlock.visible ? (
          <GroupBuyClosingSection
            title={groupBuyBlock.title || "即將收單"}
            events={closing}
            loading={eventsLoad.loading}
            error={eventsLoad.error}
            onRetry={eventsLoad.reload}
          />
        ) : null}

        <PromoBannerStrip />

        {recipesBlock.visible ? (
          <section className="space-y-3">
            <SectionHeader title={recipesBlock.title || "最新食譜"} href="/recipes" />
            <p className="-mt-2 text-sm text-foreground-secondary">
              一分鐘教你做 · 老師推薦
            </p>
            <HomeSectionFrame
              loading={recipesLoad.loading}
              error={recipesLoad.error}
              onRetry={recipesLoad.reload}
              empty={!recipesLoad.loading && !recipesLoad.error && recipes.length === 0}
              emptyTitle="尚無食譜"
              emptyText="新食譜上架後會出現在這裡，先去食譜區逛逛吧。"
              emptyActionHref="/recipes"
              emptyActionLabel="看全部食譜"
            >
              <div className="flex gap-3 overflow-x-auto pb-1 scrollbar-none md:grid md:grid-cols-3 lg:grid-cols-4 md:overflow-visible">
                {recipes.map((r) => (
                  <div key={r.id} className="w-[42%] shrink-0 md:w-auto">
                    <RecipeCard recipe={r} />
                  </div>
                ))}
              </div>
            </HomeSectionFrame>
          </section>
        ) : null}

        {videosBlock.visible ? (
          <section className="space-y-3">
            <SectionHeader title={videosBlock.title || "最新影音"} href="/videos" />
            <p className="-mt-2 text-sm text-foreground-secondary">
              一分鐘教你做 · 熱門影音
            </p>
            <HomeSectionFrame
              loading={videosLoad.loading}
              error={videosLoad.error}
              onRetry={videosLoad.reload}
              empty={!videosLoad.loading && !videosLoad.error && videos.length === 0}
              emptyTitle="尚無影音"
              emptyText="新影音上架後會出現在這裡。"
              emptyActionHref="/videos"
              emptyActionLabel="看全部影音"
            >
              <ul className="flex gap-3 overflow-x-auto pb-1 scrollbar-none sm:grid sm:grid-cols-2 sm:overflow-visible lg:grid-cols-3 xl:grid-cols-4">
                {videos.map((v) => (
                  <li key={v.id} className="w-[70%] shrink-0 sm:w-auto">
                    <Link
                      href={`/videos/${v.slug || v.id}`}
                      className="card-lift block overflow-hidden border-border-soft bg-surface"
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
                          <span className="flex h-11 w-11 items-center justify-center rounded-full bg-brand-primary text-white shadow-soft">
                            <Play className="h-5 w-5 fill-current" aria-hidden />
                          </span>
                        </span>
                        {v.duration_seconds ? (
                          <span className="absolute bottom-2 right-2 rounded-md bg-[rgba(138,90,52,0.82)] px-2 py-0.5 text-[11px] font-bold text-white">
                            {Math.floor(v.duration_seconds / 60)}:
                            {String(v.duration_seconds % 60).padStart(2, "0")}
                          </span>
                        ) : null}
                      </div>
                      <div className="space-y-1.5 p-3">
                        <span className="inline-flex rounded-full bg-surface-yellow px-2 py-0.5 text-[11px] font-bold text-brand-caramel">
                          影音
                        </span>
                        <p className="line-clamp-2 text-sm font-bold text-brand-caramel">
                          {v.title}
                        </p>
                      </div>
                    </Link>
                  </li>
                ))}
              </ul>
            </HomeSectionFrame>
          </section>
        ) : null}

        {newsBlock.visible ? (
          <section className="space-y-3">
            <SectionHeader title={newsBlock.title || "最新消息"} href="/news" />
            <HomeSectionFrame
              loading={newsLoad.loading}
              error={newsLoad.error}
              onRetry={newsLoad.reload}
              empty={!newsLoad.loading && !newsLoad.error && news.length === 0}
              emptyTitle="尚無最新資訊"
              emptyText="新品、公告、課程與直播消息會顯示在這裡。"
              emptyActionHref="/news"
              emptyActionLabel="看全部消息"
            >
              <div className="space-y-3">
                {news.map((n) => (
                  <NewsCard key={n.id} item={n} />
                ))}
              </div>
            </HomeSectionFrame>
          </section>
        ) : null}
      </HomeContentArea>

      <HomeFooter />
    </div>
  );
}
