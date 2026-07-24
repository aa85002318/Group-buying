"use client";

import { useEffect, useMemo, useState, type ReactNode } from "react";
import Link from "next/link";
import { Clock3, Heart, Play } from "lucide-react";
import { HomeSearchBar } from "@/components/home/HomeSearchBar";
import { HomeHero } from "@/components/home/HomeHero";
import { HomeContentArea } from "@/components/home/HomeContentArea";
import { HomeQuickMenuCarousel } from "@/components/home/HomeQuickMenuCarousel";
import { PopularCategories } from "@/components/home/PopularCategories";
import { HotSearchChips } from "@/components/home/HotSearchChips";
import { HorizontalProductRail } from "@/components/home/HorizontalProductRail";
import { GroupBuyClosingSection } from "@/components/home/GroupBuyClosingSection";
import { PromoBannerStrip } from "@/components/home/PromoBannerStrip";
import { HomeSectionFrame } from "@/components/home/HomeSectionFrame";
import { HomeFooter } from "@/components/home/HomeFooter";
import { HomepagePopupDialog } from "@/components/home/HomepagePopupDialog";
import { HorizontalScroller } from "@/components/home/HorizontalScroller";
import { BrandStatementSection } from "@/components/home/BrandStatementSection";
import { AiAssistantSection } from "@/components/home/AiAssistantSection";
import { BakingInspirationSection } from "@/components/home/BakingInspirationSection";
import { ChimeSelectSection } from "@/components/home/ChimeSelectSection";
import { WeeklyLiveStreamsSection } from "@/components/home/WeeklyLiveStreamsSection";
import { MonthlyChallengeSection } from "@/components/home/MonthlyChallengeSection";
import { SeasonalThemesSection } from "@/components/home/SeasonalThemesSection";
import { StoreInformationSection } from "@/components/home/StoreInformationSection";
import { SectionHeader } from "@/components/consumer/SectionHeader";
import {
  filterProductsByScope,
  getRecentProducts,
  pickHomeProducts,
} from "@/lib/home";
import {
  listOrderedHomeSections,
  resolveHomeBlock,
  warnUnknownHomeSection,
  type ResolvedHomeBlock,
} from "@/lib/home/blocks";
import { CREAM_ZONE_KEYS, type HomeSectionKey } from "@/lib/home/section-keys";
import { resolveHotSearchKeywords } from "@/lib/home/hot-search";
import { parsePopularCategories } from "@/lib/home/admin-sections";
import { mockProducts } from "@/lib/mock-data";
import type { RecipeSummary } from "@/lib/consumer-hub";
import type { Article, HomepageBlock, Product, Video } from "@/lib/types/database";

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

type HomeDataCtx = {
  blocks: HomepageBlock[];
  products: Product[];
  productsLoading: boolean;
  productsError: string | null;
  reloadProducts: () => void;
  events: GbEvent[];
  eventsLoading: boolean;
  eventsError: string | null;
  reloadEvents: () => void;
  recipes: RecipeSummary[];
  recipesLoading: boolean;
  recipesError: string | null;
  reloadRecipes: () => void;
  videos: Video[];
  videosLoading: boolean;
  videosError: string | null;
  reloadVideos: () => void;
  articles: Article[];
  articlesLoading: boolean;
  articlesError: string | null;
  reloadArticles: () => void;
  cmsLoading: boolean;
};

function renderHomeSection(block: ResolvedHomeBlock, ctx: HomeDataCtx): ReactNode {
  const { key } = block;
  switch (key) {
    case "hot_searches": {
      const keywords = resolveHotSearchKeywords(block.config);
      return (
        <HotSearchChips
          key={key}
          title={block.title || "熱門搜尋"}
          keywords={keywords}
          loading={ctx.cmsLoading}
        />
      );
    }
    case "hero":
      return <HomeHero key={key} />;
    case "brand_statement":
      return <BrandStatementSection key={key} config={block.config} />;
    case "quick_menu":
      return <HomeQuickMenuCarousel key={key} />;
    case "ai_assistant": {
      const placeholder =
        typeof block.config?.placeholder === "string"
          ? block.config.placeholder
          : "輸入材料、問題或想做的甜點……";
      const targetPath =
        typeof block.config?.target_path === "string"
          ? block.config.target_path
          : block.viewAllUrl || "/ai";
      return (
        <AiAssistantSection
          key={key}
          title={block.title}
          subtitle={block.subtitle || "今天想做什麼？"}
          placeholder={placeholder}
          targetPath={targetPath}
          viewAllHref={block.viewAllUrl || "/ai"}
          limit={block.displayCount}
        />
      );
    }
    case "baking_inspiration":
      return (
        <BakingInspirationSection
          key={key}
          title={block.title}
          subtitle={block.subtitle}
          viewAllHref={block.viewAllUrl || undefined}
          limit={block.displayCount}
        />
      );
    case "popular_categories": {
      const fromCms = parsePopularCategories(block.config);
      return (
        <PopularCategories
          key={key}
          items={fromCms.length > 0 ? fromCms : undefined}
          title={block.title || "熱門烘焙分類"}
        />
      );
    }
    case "latest_recipes": {
      const recipes = ctx.recipes.slice(0, block.displayCount);
      return (
        <section key={key} className="space-y-3">
          <SectionHeader
            title={block.title || "最新食譜"}
            href={block.viewAllUrl || "/recipes"}
            className="!mb-0"
          />
          {block.subtitle ? (
            <p className="text-xs text-foreground-secondary">{block.subtitle}</p>
          ) : (
            <p className="text-xs text-foreground-secondary">一分鐘教你做 · 老師推薦</p>
          )}
          <HomeSectionFrame
            loading={ctx.recipesLoading}
            error={ctx.recipesError}
            onRetry={ctx.reloadRecipes}
            empty={!ctx.recipesLoading && !ctx.recipesError && recipes.length === 0}
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
                      <img src={r.coverImage} alt="" className="h-full w-full object-cover" />
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
      );
    }
    case "weekly_new_products": {
      const baking = filterProductsByScope(ctx.products, "baking");
      const newDays = Math.max(1, Number(block.config?.new_days ?? 7) || 7);
      const mode =
        block.dataSource === "mixed"
          ? "mixed"
          : block.sourceMode === "manual" && block.manualIds.length > 0
            ? "mixed"
            : "auto";
      const products = pickHomeProducts({
        products: baking,
        manualIds: block.manualIds,
        autoList: getRecentProducts(baking, newDays),
        mode,
        limit: block.displayCount,
      });
      return (
        <HorizontalProductRail
          key={key}
          title={block.title || "本週新品推薦"}
          href={block.viewAllUrl || "/products?sort=newest"}
          products={products}
          badge="new"
          loading={ctx.productsLoading}
          error={ctx.productsError}
          onRetry={ctx.reloadProducts}
        />
      );
    }
    case "popular_baking_products": {
      const baking = filterProductsByScope(ctx.products, "baking");
      const mode =
        block.manualIds.length > 0 || block.sourceMode === "manual" ? "manual" : "auto";
      const products = pickHomeProducts({
        products: baking,
        manualIds: block.manualIds,
        autoList: baking,
        mode: mode === "manual" && block.manualIds.length === 0 ? "auto" : mode,
        limit: block.displayCount,
      });
      return (
        <HorizontalProductRail
          key={key}
          title={block.title || "人氣烘焙材料"}
          href={block.viewAllUrl || "/baking-materials"}
          products={products}
          badge="hot"
          loading={ctx.productsLoading}
          error={ctx.productsError}
          onRetry={ctx.reloadProducts}
        />
      );
    }
    case "chime_select":
      return (
        <ChimeSelectSection
          key={key}
          title={block.title}
          subtitle={block.subtitle || "每天發現值得買的生活好物"}
          viewAllHref={block.viewAllUrl || "/shop?scope=chime_select"}
          config={block.config}
          manualIds={block.manualIds}
          limit={block.displayCount}
        />
      );
    case "weekly_live_streams":
      return (
        <WeeklyLiveStreamsSection
          key={key}
          title={block.title}
          viewAllHref={block.viewAllUrl || "/live"}
          limit={block.displayCount}
        />
      );
    case "closing_group_buys": {
      const closing = ctx.events
        .filter((e) => e.status === "active")
        .slice()
        .sort((a, b) => String(a.end_at ?? "").localeCompare(String(b.end_at ?? "")))
        .slice(0, block.displayCount);
      return (
        <GroupBuyClosingSection
          key={key}
          title={block.title || "即將結單"}
          events={closing}
          loading={ctx.eventsLoading}
          error={ctx.eventsError}
          onRetry={ctx.reloadEvents}
        />
      );
    }
    case "weekly_promotions":
      return (
        <PromoBannerStrip
          key={key}
          title={block.title || "本週優惠"}
          limit={block.displayCount}
        />
      );
    case "monthly_challenge":
      return (
        <MonthlyChallengeSection
          key={key}
          title={block.title}
          viewAllHref={block.viewAllUrl || "/challenges"}
          limit={block.displayCount}
        />
      );
    case "seasonal_themes":
      return (
        <SeasonalThemesSection
          key={key}
          title={block.title}
          viewAllHref={block.viewAllUrl || "/themes"}
          limit={block.displayCount}
        />
      );
    case "latest_videos": {
      const videos = ctx.videos.slice(0, block.displayCount);
      return (
        <section key={key} className="space-y-3">
          <SectionHeader
            title={block.title || "最新影音"}
            href={block.viewAllUrl || "/videos"}
            className="!mb-0"
          />
          {block.subtitle ? (
            <p className="text-xs text-foreground-secondary">{block.subtitle}</p>
          ) : (
            <p className="text-xs text-foreground-secondary">一分鐘教你做 · 熱門影音</p>
          )}
          <HomeSectionFrame
            loading={ctx.videosLoading}
            error={ctx.videosError}
            onRetry={ctx.reloadVideos}
            empty={!ctx.videosLoading && !ctx.videosError && videos.length === 0}
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
      );
    }
    case "store_information": {
      const storeId =
        typeof block.config?.store_id === "string"
          ? block.config.store_id
          : Array.isArray(block.manualIds) && block.manualIds[0]
            ? block.manualIds[0]
            : null;
      return (
        <StoreInformationSection
          key={key}
          title={block.title}
          viewAllHref={block.viewAllUrl || "/stores"}
          storeId={storeId}
        />
      );
    }
    case "latest_articles": {
      const list = [...ctx.articles].sort((a, b) => {
        const af = Number(Boolean((a as Article & { is_featured?: boolean }).is_featured));
        const bf = Number(Boolean((b as Article & { is_featured?: boolean }).is_featured));
        if (bf !== af) return bf - af;
        return (a.sort_order ?? 0) - (b.sort_order ?? 0);
      });
      const articles = list.slice(0, block.displayCount);
      return (
        <section key={key} className="space-y-3">
          <SectionHeader
            title={block.title || "最新資訊"}
            href={block.viewAllUrl || "/articles"}
            className="!mb-0"
          />
          {block.subtitle ? (
            <p className="text-xs text-foreground-secondary">{block.subtitle}</p>
          ) : null}
          <HomeSectionFrame
            loading={ctx.articlesLoading}
            error={ctx.articlesError}
            onRetry={ctx.reloadArticles}
            empty={!ctx.articlesLoading && !ctx.articlesError && articles.length === 0}
            emptyTitle="尚無最新資訊"
            emptyText="新文章發布後會顯示在這裡"
            emptyActionHref="/articles"
            emptyActionLabel="看全部文章"
            skeletonCount={2}
          >
            <ul className="space-y-2.5 md:grid md:grid-cols-2 md:gap-4 md:space-y-0 xl:grid-cols-3">
              {articles.map((a) => {
                const featured = Boolean(
                  (a as Article & { is_featured?: boolean }).is_featured
                );
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
      );
    }
    default: {
      warnUnknownHomeSection(key);
      return null;
    }
  }
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

  const blocks = cmsLoad.data;
  const ordered = useMemo(() => listOrderedHomeSections(blocks), [blocks]);

  useEffect(() => {
    for (const b of blocks) {
      warnUnknownHomeSection(b.block_key);
    }
  }, [blocks]);

  const creamKeys = new Set<HomeSectionKey>(CREAM_ZONE_KEYS);
  const creamSections = ordered.filter((b) => creamKeys.has(b.key));
  const bodySections = ordered.filter((b) => !creamKeys.has(b.key));

  const ctx: HomeDataCtx = {
    blocks,
    products: productsLoad.data,
    productsLoading: productsLoad.loading,
    productsError: productsLoad.error,
    reloadProducts: productsLoad.reload,
    events: eventsLoad.data,
    eventsLoading: eventsLoad.loading,
    eventsError: eventsLoad.error,
    reloadEvents: eventsLoad.reload,
    recipes: recipesLoad.data,
    recipesLoading: recipesLoad.loading,
    recipesError: recipesLoad.error,
    reloadRecipes: recipesLoad.reload,
    videos: videosLoad.data,
    videosLoading: videosLoad.loading,
    videosError: videosLoad.error,
    reloadVideos: videosLoad.reload,
    articles: articlesLoad.data,
    articlesLoading: articlesLoad.loading,
    articlesError: articlesLoad.error,
    reloadArticles: articlesLoad.reload,
    cmsLoading: cmsLoad.loading,
  };

  // Ensure cream-zone defaults render even if CMS temporarily empty
  const creamToRender =
    creamSections.length > 0
      ? creamSections
      : CREAM_ZONE_KEYS.map((key) => resolveHomeBlock(blocks, key)).filter((b) => b.visible);

  return (
    <div className="home-page page-enter w-full max-w-full overflow-x-clip">
      <section className="home-top-area pb-4 pt-3 sm:pt-4">
        <div className="home-page-inner space-y-3 sm:space-y-4">
          <HomeSearchBar />
          {creamToRender.map((block) => renderHomeSection(block, ctx))}
        </div>
      </section>

      <HomeContentArea>
        <div className="home-page-inner space-y-6 min-[375px]:space-y-7 md:space-y-8">
          {bodySections.map((block) => {
            try {
              return renderHomeSection(block, ctx);
            } catch (err) {
              console.error(`[home] section ${block.key} failed`, err);
              return null;
            }
          })}
        </div>
      </HomeContentArea>

      <HomeFooter className="mt-0" />
      <HomepagePopupDialog />
    </div>
  );
}
