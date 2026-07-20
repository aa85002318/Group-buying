"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { Barcode, ChevronRight } from "lucide-react";
import { BannerCarousel, type BannerItem } from "@/components/home/BannerCarousel";
import { CategoryGrid } from "@/components/home/CategoryGrid";
import { ProductScrollSection } from "@/components/home/ProductScrollSection";
import { VideoSection } from "@/components/home/VideoSection";
import {
  getClosingSoonProducts,
  getNewThisWeekProducts,
  type HomeProduct,
} from "@/lib/home";
import {
  getMockGroupBuyEventsWithProducts,
  mockBanners,
  mockCategories,
  mockProducts,
  mockVideos,
} from "@/lib/mock-data";
import type { GroupBuyEvent, Product, ProductCategory, Video } from "@/lib/types/database";
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
  const [categories, setCategories] = useState<ProductCategory[]>(mockCategories);
  const [events, setEvents] = useState<GroupBuyEventWithProducts[]>(getMockGroupBuyEventsWithProducts());
  const [featuredEvents, setFeaturedEvents] = useState<GroupBuyEventWithProducts[]>([]);
  const [videos, setVideos] = useState<Video[]>(mockVideos);

  useEffect(() => {
    Promise.all([
      fetch("/api/products").then((r) => r.json()),
      fetch("/api/categories").then((r) => r.json()),
      fetch("/api/group-buy-events").then((r) => r.json()),
      fetch("/api/group-buy-events?featured=true").then((r) => r.json()),
      fetch("/api/videos").then((r) => r.json()),
    ])
      .then(([productsRes, categoriesRes, eventsRes, featuredRes, videosRes]) => {
        if (productsRes.products?.length) setProducts(productsRes.products);
        if (categoriesRes.categories?.length) setCategories(categoriesRes.categories);
        if (eventsRes.events?.length) setEvents(eventsRes.events);
        if (featuredRes.events?.length) setFeaturedEvents(featuredRes.events);
        if (videosRes.videos?.length) setVideos(videosRes.videos);
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
  const recommended = useMemo(() => {
    const ranked = new Map<string, HomeProduct>();

    for (const event of events) {
      for (const item of event.group_buy_products ?? []) {
        const product = item.products;
        if (!product) continue;
        const existing = ranked.get(product.id);
        const soldCount = item.sold_count ?? 0;
        if ((existing?.sold_count ?? -1) >= soldCount) continue;
        ranked.set(product.id, {
          ...product,
          price: item.special_price ?? product.price,
          href: `/group-buy/${event.id}`,
          sold_count: soldCount,
        });
      }
    }

    const rankedProducts = Array.from(ranked.values()).sort(
      (a, b) => (b.sold_count ?? 0) - (a.sold_count ?? 0)
    );
    for (const product of products) {
      if (rankedProducts.length >= 3) break;
      if (!ranked.has(product.id)) rankedProducts.push({ ...product, sold_count: 0 });
    }
    return rankedProducts.slice(0, 3);
  }, [events, products]);

  return (
    <div className="space-y-10">
      <BannerCarousel banners={banners} />

      <Link
        href="/member/carrier"
        className="flex items-center gap-3 rounded-[20px] bg-white px-4 py-3 shadow-[0_4px_24px_rgba(23,63,117,0.06)] transition hover:shadow-md"
      >
        <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-[#E9285C]/10 text-[#E9285C]">
          <Barcode className="h-5 w-5" />
        </span>
        <span className="min-w-0 flex-1">
          <span className="block font-semibold text-[#202124]">發票載具</span>
          <span className="block text-xs text-[#6B7280]">門市結帳快速出示</span>
        </span>
        <ChevronRight className="h-5 w-5 shrink-0 text-[#6B7280]" />
      </Link>

      <CategoryGrid categories={categories} />

      <ProductScrollSection
        title="本週新品搶先看"
        products={newThisWeek}
        seeMoreHref="/group-buy"
        variant="new"
        emptyText="本週尚無新商品"
      />

      <ProductScrollSection
        title="即將收單"
        products={closingSoon}
        seeMoreHref="/group-buy"
        showCutoff
        variant="closing"
        emptyText="近期無即將截止的團購"
      />

      <ProductScrollSection
        title="團友熱買排行榜"
        products={recommended}
        seeMoreHref="/group-buy"
        variant="ranking"
        emptyText="暫無推薦商品"
      />

      <VideoSection videos={videos} />
    </div>
  );
}
