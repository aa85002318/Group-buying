"use client";

import { useEffect, useMemo, useState } from "react";
import { BannerCarousel, type BannerItem } from "@/components/home/BannerCarousel";
import { CategoryGrid } from "@/components/home/CategoryGrid";
import { ProductScrollSection } from "@/components/home/ProductScrollSection";
import { VideoSection } from "@/components/home/VideoSection";
import {
  getClosingSoonProducts,
  getNewThisWeekProducts,
} from "@/lib/home";
import {
  getMockGroupBuyEventsWithProducts,
  mockBanners,
  mockCategories,
  mockProducts,
  mockVideos,
} from "@/lib/mock-data";
import type { GroupBuyEvent, Product, ProductCategory, Video } from "@/lib/types/database";

type GroupBuyEventWithProducts = GroupBuyEvent & {
  group_buy_products?: Array<{
    products?: Product | null;
    special_price?: number | null;
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
    const toBanner = (e: GroupBuyEventWithProducts): BannerItem => ({
      id: e.id,
      title: e.title,
      image: e.banner_url!,
      link: e.linked_product_id ? `/products/${e.linked_product_id}` : `/group-buy/${e.id}`,
    });

    const featuredBanners = featuredEvents
      .filter((e) => e.banner_url && e.status === "active")
      .map(toBanner);

    if (featuredBanners.length > 0) return featuredBanners;

    const eventBanners = events
      .filter((e) => e.banner_url && e.status === "active")
      .map(toBanner);

    return eventBanners.length > 0 ? eventBanners : mockBanners;
  }, [events, featuredEvents]);

  const newThisWeek = useMemo(() => getNewThisWeekProducts(products), [products]);
  const closingSoon = useMemo(() => getClosingSoonProducts(products, events), [products, events]);
  const recommended = useMemo(() => products.slice(0, 6), [products]);

  return (
    <div className="space-y-8">
      <BannerCarousel banners={banners} />

      <CategoryGrid categories={categories} />

      <ProductScrollSection
        title="本週上新"
        products={newThisWeek}
        seeMoreHref="/group-buy"
        fourPerRow
        emptyText="本週尚無新商品"
      />

      <ProductScrollSection
        title="即將收單"
        products={closingSoon}
        seeMoreHref="/group-buy"
        showCutoff
        fourPerRow
        emptyText="近期無即將截止的團購"
      />

      <ProductScrollSection
        title="推薦商品"
        products={recommended}
        seeMoreHref="/group-buy"
        fourPerRow
        emptyText="暫無推薦商品"
      />

      <VideoSection videos={videos} />
    </div>
  );
}
