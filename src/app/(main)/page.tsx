"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { BannerCarousel, type BannerItem } from "@/components/home/BannerCarousel";
import { ProductScrollSection } from "@/components/home/ProductScrollSection";
import { VideoSection } from "@/components/home/VideoSection";
import { StoreAnnouncementsSection } from "@/components/home/StoreAnnouncementsSection";
import { ServiceHubGrid } from "@/components/consumer/ServiceHubGrid";
import { HomeSearchBar } from "@/components/consumer/HomeSearchBar";
import { SectionHeader } from "@/components/consumer/SectionHeader";
import { RecipeCard } from "@/components/consumer/RecipeCard";
import { NewsCard } from "@/components/consumer/NewsCard";
import { AIEntryCard } from "@/components/consumer/AIEntryCard";
import {
  getClosingSoonProducts,
  getNewThisWeekProducts,
  type HomeProduct,
} from "@/lib/home";
import {
  getMockGroupBuyEventsWithProducts,
  mockBanners,
  mockLivestreams,
  mockProducts,
  mockVideos,
} from "@/lib/mock-data";
import { MOCK_NEWS, MOCK_RECIPES } from "@/lib/mock/consumer-hub";
import type { GroupBuyEvent, Livestream, Product, Video } from "@/lib/types/database";
import { formatCurrency } from "@/lib/utils";

type GroupBuyEventWithProducts = GroupBuyEvent & {
  group_buy_products?: Array<{
    products?: Product | null;
    special_price?: number | null;
    sold_count?: number;
  }>;
};

export default function HomePage() {
  const [products, setProducts] = useState<Product[]>(mockProducts);
  const [events, setEvents] = useState<GroupBuyEventWithProducts[]>(getMockGroupBuyEventsWithProducts());
  const [featuredEvents, setFeaturedEvents] = useState<GroupBuyEventWithProducts[]>([]);
  const [videos, setVideos] = useState<Video[]>(mockVideos);
  const [livestreams, setLivestreams] = useState<Livestream[]>(mockLivestreams);

  useEffect(() => {
    Promise.all([
      fetch("/api/products").then((r) => r.json()),
      fetch("/api/group-buy-events").then((r) => r.json()),
      fetch("/api/group-buy-events?featured=true").then((r) => r.json()),
      fetch("/api/videos").then((r) => r.json()),
      fetch("/api/livestreams").then((r) => r.json()),
    ])
      .then(([productsRes, eventsRes, featuredRes, videosRes, liveRes]) => {
        if (productsRes.products?.length) setProducts(productsRes.products);
        if (eventsRes.events?.length) setEvents(eventsRes.events);
        if (featuredRes.events?.length) setFeaturedEvents(featuredRes.events);
        if (videosRes.videos?.length) setVideos(videosRes.videos);
        if (liveRes.livestreams?.length) setLivestreams(liveRes.livestreams);
      })
      .catch(() => {});
  }, []);

  const banners: BannerItem[] = useMemo(() => {
    const toBanner = (e: GroupBuyEventWithProducts): BannerItem => {
      const groupBuyProduct = e.group_buy_products?.find((item) => item.products);
      const product = groupBuyProduct?.products;
      const price = groupBuyProduct?.special_price ?? product?.price;
      const saving =
        product?.original_price && price && product.original_price > price
          ? product.original_price - price
          : 0;

      return {
        id: e.id,
        title: e.title,
        image: e.banner_url!,
        link: e.linked_product_id ? `/products/${e.linked_product_id}` : `/group-buy/${e.id}`,
        offer:
          saving > 0
            ? `現省 ${formatCurrency(saving)}`
            : price
              ? `團購價 ${formatCurrency(price)}`
              : undefined,
        deadline: e.end_at,
        productImage: product?.image_url,
      };
    };

    const featuredBanners = featuredEvents
      .filter((e) => e.banner_url && e.status === "active")
      .map(toBanner);
    if (featuredBanners.length > 0) return featuredBanners;

    const eventBanners = events
      .filter((e) => e.banner_url && e.status === "active")
      .map(toBanner);
    if (eventBanners.length > 0) return eventBanners;

    return mockBanners.map((banner, index) => {
      const product = products[index % products.length];
      const saving =
        product?.original_price && product.original_price > product.price
          ? product.original_price - product.price
          : 0;
      return {
        ...banner,
        offer: product
          ? saving > 0
            ? `現省 ${formatCurrency(saving)}`
            : `團購價 ${formatCurrency(product.price)}`
          : undefined,
        deadline: product?.preorder_deadline ?? undefined,
        productImage: product?.image_url,
      };
    });
  }, [events, featuredEvents, products]);

  const newThisWeek = useMemo(() => getNewThisWeekProducts(products), [products]);
  const closingSoon = useMemo(() => getClosingSoonProducts(products, events), [products, events]);

  const hotProducts = useMemo(() => {
    const map = new Map<string, HomeProduct>();
    for (const event of events) {
      for (const item of event.group_buy_products ?? []) {
        const product = item.products;
        if (!product) continue;
        const existing = map.get(product.id);
        const soldCount = item.sold_count ?? 0;
        if ((existing?.sold_count ?? -1) >= soldCount) continue;
        map.set(product.id, {
          ...product,
          price: item.special_price ?? product.price,
          href: `/group-buy/${event.id}`,
          sold_count: soldCount,
        });
      }
    }
    const list = Array.from(map.values()).sort((a, b) => (b.sold_count ?? 0) - (a.sold_count ?? 0));
    for (const product of products) {
      if (list.length >= 8) break;
      if (!map.has(product.id)) list.push({ ...product, sold_count: 0 });
    }
    return list.slice(0, 6);
  }, [events, products]);

  return (
    <div className="page-enter space-y-8 pb-4">
      <section className="space-y-3">
        <div>
          <p className="text-xs font-bold uppercase tracking-wide text-groupBuy">烘焙生活平台</p>
          <h1 className="mt-1 text-2xl font-black text-foreground md:text-3xl">
            CHIMEIDIY 消費者中心
          </h1>
          <p className="mt-1 text-sm text-foreground-secondary">
            買材料、看食譜、用會員、參加團購 — 同一個 App 全部搞定
          </p>
        </div>
        <HomeSearchBar />
      </section>

      <BannerCarousel banners={banners} />

      <ServiceHubGrid />

      <ProductScrollSection
        title="今日新品"
        products={newThisWeek}
        seeMoreHref="/shop"
        variant="new"
        badge="NEW"
        badgeTone="new"
        emptyText="今日尚無新商品"
      />

      <ProductScrollSection
        title="熱門商品"
        products={hotProducts}
        seeMoreHref="/group-buy"
        variant="ranking"
        badge="HOT"
        badgeTone="hot"
        emptyText="暫無熱門商品"
      />

      <section>
        <SectionHeader title="最新食譜／影音" href="/recipes" accentClass="bg-warning" />
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {MOCK_RECIPES.map((recipe) => (
            <RecipeCard key={recipe.id} recipe={recipe} />
          ))}
        </div>
        {videos.length > 0 && (
          <div className="mt-4">
            <VideoSection videos={videos.slice(0, 4)} />
          </div>
        )}
      </section>

      <ProductScrollSection
        title="即將收單團購"
        products={closingSoon}
        seeMoreHref="/group-buy"
        showCutoff
        variant="closing"
        emptyText="近期無即將截止的團購"
      />

      <section>
        <SectionHeader title="最新資訊" href="/news" accentClass="bg-info" />
        <div className="grid gap-3 md:grid-cols-2">
          {MOCK_NEWS.slice(0, 3).map((item) => (
            <NewsCard key={item.id} item={item} />
          ))}
        </div>
      </section>

      <section>
        <SectionHeader title="AI 烘焙助手" href="/ai-tools" accentClass="bg-primary" />
        <div className="grid gap-3 md:grid-cols-2">
          <AIEntryCard
            title="不知道怎麼挑產品？"
            description="告訴我們目標與預算，獲得規則式商品建議。"
            href="/ai-tools#pick-product"
          />
          <AIEntryCard
            title="手上的食材能做什麼？"
            description="勾選現有材料，找出可做的甜點與食譜。"
            href="/ai-tools#pantry"
          />
        </div>
        {livestreams.length > 0 && (
          <p className="mt-3 text-xs text-foreground-secondary">
            直播進行中也可搭配 AI 工具選品 →{" "}
            <Link href="/live" className="font-bold text-primary">
              直播專區
            </Link>
          </p>
        )}
      </section>

      <StoreAnnouncementsSection />

      <section className="card-surface p-5">
        <SectionHeader title="門市資訊" href="/stores" accentClass="bg-success" className="mb-2" />
        <p className="text-sm text-foreground-secondary">
          查詢營業時間、地址，或使用門市地圖找商品擺放位置。
        </p>
        <div className="mt-3 flex flex-wrap gap-2">
          <Link href="/stores" className="btn-secondary">
            門市列表
          </Link>
          <Link href="/store-map" className="btn-brand">
            門市商品地圖
          </Link>
        </div>
      </section>
    </div>
  );
}
