"use client";

import { useEffect, useMemo, useState } from "react";
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
import { RecipeCard } from "@/components/consumer/RecipeCard";
import { NewsCard } from "@/components/consumer/NewsCard";
import { AIEntryCard } from "@/components/consumer/AIEntryCard";
import { SectionHeader } from "@/components/consumer/SectionHeader";
import { getNewThisWeekProducts } from "@/lib/home";
import { mockProducts } from "@/lib/mock-data";
import { MOCK_NEWS, MOCK_RECIPES } from "@/lib/mock/consumer-hub";
import type { Product } from "@/lib/types/database";
import { formatCurrency } from "@/lib/utils";
import { APP_ROUTES } from "@/lib/site-links";

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

export default function HomePage() {
  const [products, setProducts] = useState<Product[]>(mockProducts);
  const [events, setEvents] = useState<GbEvent[]>([]);

  useEffect(() => {
    Promise.all([
      fetch("/api/products").then((r) => r.json()),
      fetch("/api/group-buy-events").then((r) => r.json()),
    ])
      .then(([productsRes, eventsRes]) => {
        if (productsRes.products?.length) setProducts(productsRes.products);
        if (eventsRes.events?.length) setEvents(eventsRes.events);
      })
      .catch(() => {});
  }, []);

  const newest = useMemo(() => getNewThisWeekProducts(products), [products]);
  const popular = useMemo(() => products.slice(0, 8), [products]);
  const closing = useMemo(
    () => events.filter((e) => e.status === "active").slice(0, 4),
    [events]
  );

  return (
    <div className="mx-auto max-w-[1280px] space-y-6 pb-6 pt-3 md:space-y-8 md:pt-4">
      {/* First viewport: welcome + search + hero + primary + secondary peek */}
      <div className="space-y-4 md:space-y-5">
        <HomeWelcome />
        <HomeSearchBar />
        <HomeHero />
        <PrimaryQuickActions />
        <SecondaryServiceScroller />
      </div>

      <PopularCategories />

      <NewProductsSection products={newest} href="/products?sort=newest" title="今日新品" />

      <PopularProductsSection products={popular} href="/products" title="本週熱門" />

      <section className="space-y-3">
        <SectionHeader title="一分鐘教你做" href="/recipes" />
        <div className="grid grid-cols-2 gap-3 md:grid-cols-3 lg:grid-cols-4">
          {MOCK_RECIPES.slice(0, 4).map((r) => (
            <RecipeCard key={r.id} recipe={r} />
          ))}
        </div>
      </section>

      <section className="space-y-3">
        <SectionHeader title="即將收單" href="/group-buy" accentClass="bg-groupBuy" />
        {closing.length === 0 ? (
          <div className="rounded-[18px] border border-border-soft bg-groupBuy-soft p-4 text-sm text-foreground-secondary">
            目前沒有進行中的團購，稍後再來看看。
          </div>
        ) : (
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
        <div className="space-y-3">
          {MOCK_NEWS.slice(0, 3).map((n) => (
            <NewsCard key={n.id} item={n} />
          ))}
        </div>
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
