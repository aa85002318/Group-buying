"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { HomeSearchBar } from "@/components/home/HomeSearchBar";
import { HomeHero } from "@/components/home/HomeHero";
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
import { APP_ROUTES } from "@/lib/site-links";
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

  const suggestProducts = useMemo(() => forYou.slice(0, 6), [forYou]);
  const reorderMode = reorderCandidates.length > 0 ? "reorder" : "suggest";

  return (
    <div className="page-enter mx-auto max-w-[1280px] space-y-6 overflow-x-hidden pb-4 pt-3 md:space-y-8 md:pb-6 md:pt-4">
      {/* 2. Search */}
      <HomeSearchBar />

      {/* 3. Hot search */}
      {hotSearchBlock.visible ? (
        <HotSearchChips
          title={hotSearchBlock.title}
          keywords={hotKeywords}
          loading={cmsLoad.loading}
        />
      ) : null}

      {/* 4. Hero */}
      {heroBlock.visible ? <HomeHero /> : null}

      {/* 5. Eight quick actions */}
      <PrimaryQuickActions />

      {/* 6. AI + Store map */}
      <FeatureDuoCards />

      {/* 7. Recent browse — always show; guest empty state */}
      {recentBlock.visible ? (
        <RecentBrowseSection
          items={isMember || authState === "guest" ? browseItems : []}
          limit={recentBlock.displayCount}
          onRetry={() => setBrowseTick((t) => t + 1)}
          showGuestEmpty={authState === "guest"}
        />
      ) : null}

      {/* 8. Quick reorder — members only */}
      {isMember && reorderBlock.visible ? (
        <QuickReorderSection
          mode={reorderMode}
          candidates={reorderCandidates}
          suggestProducts={suggestProducts}
          loading={ordersLoad.loading || productsLoad.loading}
          error={ordersLoad.error}
          onRetry={ordersLoad.reload}
        />
      ) : null}

      {/* 9. Categories */}
      <PopularCategories />

      {/* 10–11 + weekly + for you */}
      {newBlock.visible ? (
        <HorizontalProductRail
          title={newBlock.title || "今日新品"}
          href="/products?sort=newest"
          products={newest}
          badge="new"
          loading={productsLoad.loading}
        />
      ) : null}

      {hotBlock.visible ? (
        <HorizontalProductRail
          title={hotBlock.title || "熱門商品"}
          href="/products"
          products={popular}
          badge="hot"
          loading={productsLoad.loading}
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

      {/* 12. Group buy closing */}
      {groupBuyBlock.visible ? (
        <GroupBuyClosingSection
          title={groupBuyBlock.title || "即將收單"}
          events={closing}
          loading={eventsLoad.loading}
          error={eventsLoad.error}
          onRetry={eventsLoad.reload}
        />
      ) : null}

      {/* 13. Promo banners */}
      <PromoBannerStrip />

      {/* 14. Recipes */}
      {recipesBlock.visible ? (
        <section className="space-y-3">
          <SectionHeader title={recipesBlock.title || "最新食譜"} href="/recipes" />
          <p className="-mt-2 text-sm text-foreground-secondary">一分鐘教你做</p>
          <HomeSectionFrame
            loading={recipesLoad.loading}
            error={recipesLoad.error}
            onRetry={recipesLoad.reload}
            empty={!recipesLoad.loading && !recipesLoad.error && recipes.length === 0}
            emptyText="尚無食譜"
          >
            <div className="flex gap-3 overflow-x-auto pb-1 scrollbar-none md:grid md:grid-cols-4 md:overflow-visible">
              {recipes.map((r) => (
                <div key={r.id} className="w-[42%] shrink-0 md:w-auto">
                  <RecipeCard recipe={r} />
                </div>
              ))}
            </div>
          </HomeSectionFrame>
        </section>
      ) : null}

      {/* 15. Videos */}
      {videosBlock.visible ? (
        <section className="space-y-3">
          <SectionHeader title={videosBlock.title || "熱門影音"} href="/videos" />
          <p className="-mt-2 text-sm text-foreground-secondary">老師推薦</p>
          <HomeSectionFrame
            loading={videosLoad.loading}
            error={videosLoad.error}
            onRetry={videosLoad.reload}
            empty={!videosLoad.loading && !videosLoad.error && videos.length === 0}
            emptyText="尚無影音"
          >
            <ul className="flex gap-3 overflow-x-auto pb-1 scrollbar-none sm:grid sm:grid-cols-2 sm:overflow-visible lg:grid-cols-4">
              {videos.map((v) => (
                <li key={v.id} className="w-[70%] shrink-0 sm:w-auto">
                  <Link
                    href={`/videos/${v.slug || v.id}`}
                    className="card-lift block overflow-hidden border-border bg-surface"
                  >
                    <div className="relative aspect-video bg-surface-peach">
                      {v.thumbnail_url ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={v.thumbnail_url}
                          alt=""
                          className="h-full w-full object-cover"
                        />
                      ) : null}
                      <span className="absolute bottom-2 right-2 rounded-full bg-brand-primary px-2.5 py-1 text-[11px] font-bold text-white">
                        播放
                      </span>
                    </div>
                    <p className="line-clamp-2 p-3 text-sm font-bold text-brand-caramel">
                      {v.title}
                    </p>
                  </Link>
                </li>
              ))}
            </ul>
          </HomeSectionFrame>
        </section>
      ) : null}

      {/* 16. News */}
      {newsBlock.visible ? (
        <section className="space-y-3">
          <SectionHeader title={newsBlock.title || "最新消息"} href="/news" />
          <HomeSectionFrame
            loading={newsLoad.loading}
            error={newsLoad.error}
            onRetry={newsLoad.reload}
            empty={!newsLoad.loading && !newsLoad.error && news.length === 0}
            emptyText="尚無最新資訊"
          >
            <div className="space-y-3">
              {news.map((n) => (
                <NewsCard key={n.id} item={n} />
              ))}
            </div>
          </HomeSectionFrame>
        </section>
      ) : null}

      {/* 17. Footer */}
      <footer className="border-t border-border-soft pt-4 text-center text-xs text-foreground-muted">
        <p className="font-semibold text-brand-caramel">CHIMEIDIY 烘焙生活平台</p>
        <p className="mt-1">
          <Link href="/terms" className="underline-offset-2 hover:underline">
            服務條款
          </Link>
          {" · "}
          <Link href="/privacy" className="underline-offset-2 hover:underline">
            隱私權政策
          </Link>
          {" · "}
          <Link href={APP_ROUTES.support} className="underline-offset-2 hover:underline">
            客服中心
          </Link>
        </p>
      </footer>
    </div>
  );
}
