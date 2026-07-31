"use client";

import { useEffect, useMemo, useState, type ReactNode } from "react";
import Link from "next/link";
import { Play } from "lucide-react";
import { HomeHeroSection } from "@/components/home/HomeHeroSection";
import { HomeContentArea } from "@/components/home/HomeContentArea";
import { HomeQuickMenuCarousel } from "@/components/home/HomeQuickMenuCarousel";
import { HorizontalProductRail } from "@/components/home/HorizontalProductRail";
import { PromoBannerStrip } from "@/components/home/PromoBannerStrip";
import { HomeSectionFrame } from "@/components/home/HomeSectionFrame";
import { HomeFooter } from "@/components/home/HomeFooter";
import { HomepagePopupDialog } from "@/components/home/HomepagePopupDialog";
import { HorizontalScroller } from "@/components/home/HorizontalScroller";
import { BrandStatementSection } from "@/components/home/BrandStatementSection";
import { AiAssistantSection } from "@/components/home/AiAssistantSection";
import { BakingInspirationSection } from "@/components/home/BakingInspirationSection";
import { MonthlyChallengeSection } from "@/components/home/MonthlyChallengeSection";
import { SeasonalThemesSection } from "@/components/home/SeasonalThemesSection";
import { StoreInformationSection } from "@/components/home/StoreInformationSection";
import { FeaturedCoursesSection } from "@/components/home/FeaturedCoursesSection";
import {
  TrustServicesSection,
  parseTrustServices,
} from "@/components/home/TrustServicesSection";
import { HomeLatestCampaignSection } from "@/components/home/latest-campaign/HomeLatestCampaignSection";
import { HomeQuickServicesSection } from "@/components/home/HomeQuickServicesSection";
import { WeeklyPopularRecipesSection } from "@/components/home/weekly-recipes/WeeklyPopularRecipesSection";
import { HomeIngredientShopSection } from "@/components/home/HomeIngredientShopSection";
import { HomeGroupBuyBannerSection } from "@/components/home/group-buy-banner/HomeGroupBuyBannerSection";
import { HomeServiceShortcutsSection } from "@/components/home/HomeServiceShortcutsSection";
import {
  ChimeSelectGroupBuySection,
  ClosingGroupBuysSection,
  WeeklyGroupBuysSection,
  WeeklyLiveStreamsSection,
} from "@/components/home/group-buy-hub/HomeGroupBuySections";
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
import { parseLatestCampaignSettings } from "@/types/home-latest-campaign";
import { CREAM_ZONE_KEYS, type HomeSectionKey } from "@/lib/home/section-keys";
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
  const reactKey = block.id;
  switch (key) {
    case "hot_searches":
      // Replaced by Quick Entry — never render 熱門搜尋 on homepage
      return null;
    case "hero":
      return <HomeHeroSection key={reactKey} />;
    case "latest_campaigns": {
      const settings = parseLatestCampaignSettings(block.config);
      return (
        <HomeLatestCampaignSection
          key={reactKey}
          settings={{
            ...settings,
            title: block.title || settings.title,
            viewAllHref: block.viewAllUrl || settings.viewAllHref,
            enabled: block.visible && settings.enabled !== false,
          }}
        />
      );
    }
    case "quick_entry":
      return <HomeQuickServicesSection key={reactKey} />;
    case "latest_recipes":
      return (
        <WeeklyPopularRecipesSection
          key={reactKey}
          title={block.title}
          recipes={ctx.recipes}
          manualIds={block.manualIds}
          sourceMode={block.sourceMode}
          limit={block.displayCount}
          loading={ctx.recipesLoading}
        />
      );
    case "ingredient_shop":
      return <HomeIngredientShopSection key={reactKey} />;
    case "group_buy_banner":
      return <HomeGroupBuyBannerSection key={reactKey} />;
    case "weekly_group_buys":
      return <WeeklyGroupBuysSection key={reactKey} block={block} />;
    case "closing_group_buys":
      return <ClosingGroupBuysSection key={reactKey} block={block} />;
    case "weekly_live_streams":
      return <WeeklyLiveStreamsSection key={reactKey} block={block} />;
    case "chime_select":
      return <ChimeSelectGroupBuySection key={reactKey} block={block} />;
    case "service_shortcuts":
      return <HomeServiceShortcutsSection key={reactKey} />;
    case "recipe_kits":
    case "popular_categories":
    case "ingredient_categories":
    case "popular_baking_products":
      // Legacy optional sections — keep available if re-enabled in CMS
      return null;
    case "store_news":
      return null;
    case "brand_statement":
      return <BrandStatementSection key={reactKey} config={block.config} />;
    case "quick_menu":
      return <HomeQuickMenuCarousel key={reactKey} />;
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
          key={reactKey}
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
          key={reactKey}
          title={block.title}
          subtitle={block.subtitle}
          viewAllHref={block.viewAllUrl || undefined}
          limit={block.displayCount}
        />
      );
    case "featured_courses":
      return (
        <FeaturedCoursesSection
          key={reactKey}
          title={block.title || "最新課程"}
          subtitle={block.subtitle}
          viewAllHref={block.viewAllUrl || "/courses"}
          limit={block.displayCount}
          manualIds={block.manualIds}
        />
      );
    case "trust_services":
      return (
        <TrustServicesSection
          key={reactKey}
          title={block.title || "安心服務"}
          subtitle={block.subtitle}
          items={parseTrustServices(block.config)}
        />
      );
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
          key={reactKey}
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
    case "product_series": {
      const scopeRaw = String(block.config?.product_scope ?? "baking");
      const scope =
        scopeRaw === "chime_select" || scopeRaw === "baking" ? scopeRaw : undefined;
      let pool = scope ? filterProductsByScope(ctx.products, scope) : ctx.products;
      const categoryId = String(block.config?.category_id ?? "").trim();
      if (categoryId) {
        pool = pool.filter(
          (p) =>
            p.category_id === categoryId ||
            (p as { primary_category_id?: string | null }).primary_category_id === categoryId
        );
      }
      const badgeRaw = String(block.config?.badge ?? "");
      const badge =
        badgeRaw === "new" || badgeRaw === "hot" ? (badgeRaw as "new" | "hot") : undefined;
      const mode =
        block.manualIds.length > 0 || block.sourceMode === "manual" ? "manual" : "auto";
      const products = pickHomeProducts({
        products: pool,
        manualIds: block.manualIds,
        autoList: pool,
        mode: mode === "manual" && block.manualIds.length === 0 ? "auto" : mode,
        limit: block.displayCount,
      });
      return (
        <HorizontalProductRail
          key={reactKey}
          title={block.title || "系列商品曝光"}
          href={block.viewAllUrl || "/shop/categories"}
          products={products}
          badge={badge}
          loading={ctx.productsLoading}
          error={ctx.productsError}
          onRetry={ctx.reloadProducts}
        />
      );
    }
    case "weekly_promotions":
      return (
        <PromoBannerStrip
          key={reactKey}
          title={block.title || "本週優惠"}
          limit={block.displayCount}
          placement="home_weekly_promo"
        />
      );
    case "banner_strip": {
      const placement = String(block.config?.placement ?? "").trim() || "home_weekly_promo";
      return (
        <PromoBannerStrip
          key={reactKey}
          title={block.title || "Banner 帶"}
          limit={block.displayCount}
          placement={placement}
        />
      );
    }
    case "monthly_challenge":
      return (
        <MonthlyChallengeSection
          key={reactKey}
          title={block.title}
          viewAllHref={block.viewAllUrl || "/challenges"}
          limit={block.displayCount}
        />
      );
    case "seasonal_themes":
      return (
        <SeasonalThemesSection
          key={reactKey}
          title={block.title}
          viewAllHref={block.viewAllUrl || "/themes"}
          limit={block.displayCount}
        />
      );
    case "latest_videos": {
      const videos = ctx.videos.slice(0, block.displayCount);
      return (
        <section key={reactKey} className="space-y-3">
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
          key={reactKey}
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
        <section key={reactKey} className="space-y-3">
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
  const [draftPreview, setDraftPreview] = useState(false);

  const cmsLoad = useIndependentLoad<HomepageBlock[]>([], async () => {
    const preview =
      typeof window !== "undefined" &&
      new URLSearchParams(window.location.search).get("preview") === "draft";
    setDraftPreview(preview);
    const r = await fetch(preview ? "/api/cms?preview=draft" : "/api/cms", {
      credentials: "include",
    });
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
      {draftPreview ? (
        <div className="sticky top-0 z-50 border-b border-amber-300 bg-amber-50 px-3 py-2 text-center text-xs font-semibold text-amber-900">
          草稿預覽模式 — 尚未發布，訪客看不到此版面
        </div>
      ) : null}
      <section className="w-full max-w-full overflow-x-clip p-0">
        {creamToRender.map((block) => renderHomeSection(block, ctx))}
      </section>

      <HomeContentArea>
        <div className="site-container site-content-container home-page-inner space-y-6 min-[375px]:space-y-7 md:space-y-8">
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
