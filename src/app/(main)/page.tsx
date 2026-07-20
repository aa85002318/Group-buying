"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { HomeWelcome } from "@/components/home/HomeWelcome";
import { HomeSearchBar } from "@/components/home/HomeSearchBar";
import { HomeHero } from "@/components/home/HomeHero";
import { PrimaryQuickActions } from "@/components/home/PrimaryQuickActions";
import { SecondaryServiceScroller } from "@/components/home/SecondaryServiceScroller";
import { PopularCategories } from "@/components/home/PopularCategories";
import {
  NewProductsSection,
  PopularProductsSection,
} from "@/components/home/NewProductsSection";
import { HomeSectionFrame } from "@/components/home/HomeSectionFrame";
import { RecipeCard } from "@/components/consumer/RecipeCard";
import { NewsCard } from "@/components/consumer/NewsCard";
import { AIEntryCard } from "@/components/consumer/AIEntryCard";
import { SectionHeader } from "@/components/consumer/SectionHeader";
import { getNewThisWeekProducts } from "@/lib/home";
import { mockProducts } from "@/lib/mock-data";
import type { RecipeSummary, NewsItem } from "@/lib/consumer-hub";
import type { Product, Video } from "@/lib/types/database";
import { formatCurrency } from "@/lib/utils";
import { APP_ROUTES } from "@/lib/site-links";
import { isSupabaseConfigured } from "@/lib/config";

type GbEvent = {
  id: string;
  title: string;
  end_at?: string | null;
  status?: string;
  group_buy_products?: Array<{
    special_price?: number | null;
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
  loader: () => Promise<T>
): LoadState<T> & { reload: () => void } {
  const [data, setData] = useState<T>(initial);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [tick, setTick] = useState(0);

  useEffect(() => {
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
    // eslint-disable-next-line react-hooks/exhaustive-deps -- tick drives reload; loader identity ignored
  }, [tick]);

  return {
    data,
    loading,
    error,
    reload: () => setTick((t) => t + 1),
  };
}

export default function HomePage() {
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
    return (d.recipes ?? []).slice(0, 6);
  });

  const videosLoad = useIndependentLoad<Video[]>([], async () => {
    const r = await fetch("/api/videos");
    const d = await r.json();
    if (!r.ok) throw new Error(d.error ?? "影音載入失敗");
    return (d.videos ?? []).slice(0, 4);
  });

  const newsLoad = useIndependentLoad<NewsItem[]>([], async () => {
    const r = await fetch("/api/news");
    const d = await r.json();
    if (!r.ok) throw new Error(d.error ?? "最新資訊載入失敗");
    return (d.news ?? []).slice(0, 5);
  });

  const [authState, setAuthState] = useState<"loading" | "guest" | "member">("loading");
  const [unread, setUnread] = useState(0);

  const loadMemberBits = useCallback(() => {
    if (!isSupabaseConfigured()) {
      setAuthState("guest");
      setUnread(0);
      return;
    }
    fetch("/api/auth/me")
      .then((r) => r.json())
      .then((data) => {
        if (data.profile) {
          setAuthState("member");
          return fetch("/api/member/summary").then((r) => r.json());
        }
        setAuthState("guest");
        setUnread(0);
        return null;
      })
      .then((summary) => {
        if (summary) setUnread(summary.unreadNotifications ?? 0);
      })
      .catch(() => {
        setAuthState("guest");
        setUnread(0);
      });
  }, []);

  useEffect(() => {
    loadMemberBits();
  }, [loadMemberBits]);

  const newest = useMemo(
    () => getNewThisWeekProducts(productsLoad.data),
    [productsLoad.data]
  );
  const popular = useMemo(() => productsLoad.data.slice(0, 8), [productsLoad.data]);
  const closing = useMemo(
    () => eventsLoad.data.filter((e) => e.status === "active").slice(0, 4),
    [eventsLoad.data]
  );

  return (
    <div className="mx-auto max-w-[1280px] space-y-6 pb-6 pt-3 md:space-y-8 md:pt-4">
      <div className="space-y-4 md:space-y-5">
        <div className="flex items-start justify-between gap-3">
          <HomeWelcome />
          {authState === "member" && unread > 0 ? (
            <Link
              href={APP_ROUTES.memberNotifications}
              className="shrink-0 rounded-full bg-primary px-3 py-1.5 text-xs font-bold text-white shadow-card"
            >
              {unread} 則未讀
            </Link>
          ) : null}
        </div>
        <HomeSearchBar />
        <HomeHero />
        <PrimaryQuickActions />
        <SecondaryServiceScroller />
      </div>

      <PopularCategories />

      <HomeSectionFrame
        loading={productsLoad.loading}
        error={productsLoad.error}
        onRetry={productsLoad.reload}
      >
        <NewProductsSection products={newest} href="/products?sort=newest" title="今日新品" />
      </HomeSectionFrame>

      <HomeSectionFrame
        loading={productsLoad.loading}
        error={productsLoad.error}
        onRetry={productsLoad.reload}
      >
        <PopularProductsSection products={popular} href="/products" title="本週熱門" />
      </HomeSectionFrame>

      <section className="space-y-3">
        <SectionHeader title="一分鐘教你做" href="/recipes" />
        <HomeSectionFrame
          loading={recipesLoad.loading}
          error={recipesLoad.error}
          onRetry={recipesLoad.reload}
          empty={!recipesLoad.loading && !recipesLoad.error && recipesLoad.data.length === 0}
          emptyText="尚無食譜，稍後再來看看"
        >
          <div className="grid grid-cols-2 gap-3 md:grid-cols-3 lg:grid-cols-4">
            {recipesLoad.data.slice(0, 4).map((r) => (
              <RecipeCard key={r.id} recipe={r} />
            ))}
          </div>
        </HomeSectionFrame>
      </section>

      <section className="space-y-3">
        <SectionHeader title="熱門影音" href="/videos" />
        <HomeSectionFrame
          loading={videosLoad.loading}
          error={videosLoad.error}
          onRetry={videosLoad.reload}
          empty={!videosLoad.loading && !videosLoad.error && videosLoad.data.length === 0}
          emptyText="尚無影音"
        >
          <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {videosLoad.data.map((v) => (
              <li key={v.id}>
                <Link
                  href={`/videos/${v.slug || v.id}`}
                  className="card-lift block overflow-hidden border-border-soft bg-surface"
                >
                  <div className="aspect-video bg-surface-soft">
                    {v.thumbnail_url ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={v.thumbnail_url}
                        alt=""
                        className="h-full w-full object-cover"
                      />
                    ) : null}
                  </div>
                  <p className="line-clamp-2 p-3 text-sm font-bold text-foreground">{v.title}</p>
                </Link>
              </li>
            ))}
          </ul>
        </HomeSectionFrame>
      </section>

      <section className="space-y-3">
        <SectionHeader title="即將收單" href="/group-buy" accentClass="bg-groupBuy" />
        <HomeSectionFrame
          loading={eventsLoad.loading}
          error={eventsLoad.error}
          onRetry={eventsLoad.reload}
          empty={!eventsLoad.loading && !eventsLoad.error && closing.length === 0}
          emptyText="目前沒有進行中的團購，稍後再來看看。"
        >
          <ul className="space-y-2">
            {closing.map((e) => {
              const gp = e.group_buy_products?.find((x) => x.products);
              const price = gp?.special_price ?? gp?.products?.price;
              return (
                <li key={e.id}>
                  <Link
                    href={`/group-buy/${e.id}`}
                    className="flex items-center justify-between gap-3 rounded-[18px] border border-border-soft bg-surface p-3 shadow-card transition hover:-translate-y-0.5 hover:shadow-lift"
                  >
                    <span className="min-w-0">
                      <span className="block truncate font-semibold text-foreground">{e.title}</span>
                      <span className="text-xs text-foreground-secondary">團購專區</span>
                    </span>
                    {price != null && (
                      <span className="shrink-0 font-semibold text-groupBuy">
                        {formatCurrency(Number(price))}
                      </span>
                    )}
                  </Link>
                </li>
              );
            })}
          </ul>
        </HomeSectionFrame>
      </section>

      <section className="space-y-3">
        <SectionHeader title="會員福利" href={APP_ROUTES.memberBenefits ?? "/member/benefits"} />
        {authState === "member" ? (
          <div className="rounded-[18px] border border-border-soft bg-butter-soft/70 p-4 text-sm text-foreground-secondary">
            前往{" "}
            <Link href="/member/benefits" className="font-semibold text-caramel underline-offset-2 hover:underline">
              會員福利
            </Link>{" "}
            查看 App 活動發放的福利（不含門市 POS 消費累計）。
          </div>
        ) : (
          <div className="rounded-[18px] border border-border-soft bg-peach-soft/80 p-4 text-center">
            <p className="font-semibold text-caramel">登入查看會員福利</p>
            <Link
              href={`/auth/login?redirect=${encodeURIComponent("/member/benefits")}`}
              className="mt-3 inline-flex h-11 items-center rounded-button bg-primary px-5 text-sm font-bold text-white"
            >
              登入
            </Link>
          </div>
        )}
      </section>

      <section className="space-y-3">
        <SectionHeader title="AI 烘焙助手" href="/ai-tools" />
        <div className="grid gap-3 sm:grid-cols-2">
          <AIEntryCard
            title="不知道怎麼挑產品？"
            description="依目標、經驗與預算給你建議"
            href="/ai-tools"
          />
          <AIEntryCard
            title="手上的食材能做什麼？"
            description="勾選食材，找出可做甜點"
            href="/ai-tools"
          />
        </div>
      </section>

      <section className="space-y-3">
        <SectionHeader title="最新資訊" href="/news" />
        <HomeSectionFrame
          loading={newsLoad.loading}
          error={newsLoad.error}
          onRetry={newsLoad.reload}
          empty={!newsLoad.loading && !newsLoad.error && newsLoad.data.length === 0}
          emptyText="尚無最新資訊"
        >
          <div className="space-y-3">
            {newsLoad.data.slice(0, 3).map((n) => (
              <NewsCard key={n.id} item={n} />
            ))}
          </div>
        </HomeSectionFrame>
      </section>

      <section className="rounded-[18px] border border-border-soft bg-caramel-soft/60 p-4 md:p-5">
        <h2 className="text-xl font-semibold text-caramel">門市服務</h2>
        <p className="mt-1 text-sm text-foreground-secondary">
          查詢商品擺放位置、聯絡客服、查看門市資訊。
        </p>
        <div className="mt-3 flex flex-wrap gap-2">
          <Link
            href="/store-map"
            className="inline-flex min-h-11 items-center rounded-button bg-surface px-4 text-sm font-semibold text-caramel shadow-card"
          >
            門市地圖
          </Link>
          <Link
            href="/support"
            className="inline-flex min-h-11 items-center rounded-button bg-surface px-4 text-sm font-semibold text-caramel shadow-card"
          >
            門市客服
          </Link>
          <Link
            href={APP_ROUTES.stores ?? "/stores"}
            className="inline-flex min-h-11 items-center rounded-button bg-surface px-4 text-sm font-semibold text-caramel shadow-card"
          >
            門市資訊
          </Link>
        </div>
      </section>

      <footer className="border-t border-border-soft pt-4 text-center text-xs text-foreground-muted">
        <p>CHIMEIDIY 烘焙生活平台</p>
        <p className="mt-1">
          <Link href="/terms" className="underline-offset-2 hover:underline">
            服務條款
          </Link>
          {" · "}
          <Link href="/privacy" className="underline-offset-2 hover:underline">
            隱私權政策
          </Link>
        </p>
      </footer>
    </div>
  );
}
