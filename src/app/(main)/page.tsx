"use client";

import { useEffect, useMemo, useState } from "react";
import { BannerCarousel, type BannerItem } from "@/components/home/BannerCarousel";
import { CategoryGrid } from "@/components/home/CategoryGrid";
import { ProductScrollSection } from "@/components/home/ProductScrollSection";
import { VideoSection } from "@/components/home/VideoSection";
import { HomeQuickLinks } from "@/components/home/HomeQuickLinks";
import { LiveHomeSection } from "@/components/home/LiveHomeSection";
import { ArticleHomeSection } from "@/components/home/ArticleHomeSection";
import { RecommendHomeSection } from "@/components/home/RecommendHomeSection";
import { StoreAnnouncementsSection } from "@/components/home/StoreAnnouncementsSection";
import { CourseCard } from "@/components/courses/CourseCard";
import { MOCK_COURSES } from "@/lib/mock-courses";
import {
  getClosingSoonProducts,
  getNewThisWeekProducts,
  type HomeProduct,
} from "@/lib/home";
import {
  getMockGroupBuyEventsWithProducts,
  mockArticles,
  mockBanners,
  mockCategories,
  mockLivestreams,
  mockProducts,
  mockVideos,
} from "@/lib/mock-data";
import type {
  Article,
  GroupBuyEvent,
  Livestream,
  Product,
  ProductCategory,
  Video,
} from "@/lib/types/database";
import { formatCurrency } from "@/lib/utils";
import Link from "next/link";

type GroupBuyEventWithProducts = GroupBuyEvent & {
  group_buy_products?: Array<{
    products?: Product | null;
    special_price?: number | null;
    sold_count?: number;
  }>;
};

export default function HomePage() {
  const [products, setProducts] = useState<Product[]>(mockProducts);
  const [categories, setCategories] = useState<ProductCategory[]>(mockCategories);
  const [events, setEvents] = useState<GroupBuyEventWithProducts[]>(getMockGroupBuyEventsWithProducts());
  const [featuredEvents, setFeaturedEvents] = useState<GroupBuyEventWithProducts[]>([]);
  const [videos, setVideos] = useState<Video[]>(mockVideos);
  const [livestreams, setLivestreams] = useState<Livestream[]>(mockLivestreams);
  const [articles, setArticles] = useState<Article[]>(mockArticles);

  useEffect(() => {
    Promise.all([
      fetch("/api/products").then((r) => r.json()),
      fetch("/api/categories").then((r) => r.json()),
      fetch("/api/group-buy-events").then((r) => r.json()),
      fetch("/api/group-buy-events?featured=true").then((r) => r.json()),
      fetch("/api/videos").then((r) => r.json()),
      fetch("/api/livestreams").then((r) => r.json()),
      fetch("/api/articles").then((r) => r.json()),
    ])
      .then(([productsRes, categoriesRes, eventsRes, featuredRes, videosRes, liveRes, articlesRes]) => {
        if (productsRes.products?.length) setProducts(productsRes.products);
        if (categoriesRes.categories?.length) setCategories(categoriesRes.categories);
        if (eventsRes.events?.length) setEvents(eventsRes.events);
        if (featuredRes.events?.length) setFeaturedEvents(featuredRes.events);
        if (videosRes.videos?.length) setVideos(videosRes.videos);
        if (liveRes.livestreams?.length) setLivestreams(liveRes.livestreams);
        if (articlesRes.articles?.length) setArticles(articlesRes.articles);
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

  const ranked = useMemo(() => {
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
    return list;
  }, [events, products]);

  const hotProducts = ranked.slice(0, 6);
  const everyoneBuying = ranked.slice(0, 8);
  const teacherPick = useMemo(() => {
    const picks = [...products]
      .filter((p) => p.is_active !== false)
      .sort((a, b) => (b.original_price ?? 0) - (a.original_price ?? 0))
      .slice(0, 6);
    return picks.length ? picks : products.slice(0, 6);
  }, [products]);

  return (
    <div className="page-enter space-y-8 pb-4">
      <BannerCarousel banners={banners} />
      <HomeQuickLinks />

      <Link
        href="/ai"
        className="flex items-center gap-3 rounded-[22px] bg-hero-gradient px-4 py-4 text-white shadow-lift transition hover:-translate-y-0.5"
      >
        <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-surface/20 text-lg font-black">AI</span>
        <span className="min-w-0 flex-1">
          <span className="block font-black">AI 烘焙助手</span>
          <span className="block text-xs text-white/90">材料推薦 · 份量換算 · 失敗分析</span>
        </span>
        <span className="text-sm font-bold">開始 →</span>
      </Link>

      <CategoryGrid categories={categories} />

      <RecommendHomeSection />

      <ProductScrollSection
        title="今日新品"
        products={newThisWeek}
        seeMoreHref="/group-buy"
        variant="new"
        badge="NEW"
        badgeTone="new"
        emptyText="今日尚無新商品"
      />

      <LiveHomeSection livestreams={livestreams} />

      <ProductScrollSection
        title="直播限定"
        products={hotProducts.slice(0, 4)}
        seeMoreHref="/live"
        variant="hot"
        badge="LIVE"
        badgeTone="live"
        emptyText="暫無直播限定商品"
      />

      <ProductScrollSection
        title="老師推薦"
        products={teacherPick}
        seeMoreHref="/products"
        variant="recommend"
        badge="推薦"
        badgeTone="mint"
        emptyText="暫無推薦商品"
      />

      <ProductScrollSection
        title="熱門排行"
        products={hotProducts}
        seeMoreHref="/group-buy"
        variant="ranking"
        badge="HOT"
        badgeTone="hot"
        emptyText="暫無熱門商品"
      />

      <ProductScrollSection
        title="大家都在買"
        products={everyoneBuying}
        seeMoreHref="/products"
        variant="hot"
        emptyText="暫無商品"
      />

      <ProductScrollSection
        title="即將收單"
        products={closingSoon}
        seeMoreHref="/group-buy"
        showCutoff
        variant="closing"
        emptyText="近期無即將截止的團購"
      />

      <section>
        <div className="mb-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="h-7 w-1.5 rounded-full bg-info" />
            <h2 className="section-title">烘焙課程</h2>
          </div>
          <Link href="/courses" className="text-sm font-bold text-primary">
            查看更多
          </Link>
        </div>
        <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-none">
          {MOCK_COURSES.map((c) => (
            <div key={c.id} className="w-[78%] shrink-0 sm:w-[46%] lg:w-[31%]">
              <CourseCard course={c} />
            </div>
          ))}
        </div>
      </section>

      <ArticleHomeSection articles={articles} />
      <StoreAnnouncementsSection />
      <VideoSection videos={videos} />
    </div>
  );
}
