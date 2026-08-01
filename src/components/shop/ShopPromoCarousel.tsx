"use client";

import { useCallback, useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import useEmblaCarousel from "embla-carousel-react";
import Autoplay from "embla-carousel-autoplay";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { APP_ROUTES } from "@/lib/site-links";
import {
  isExternalHref,
  isShopPromoBannerLive,
  type ShopPromoBanner,
} from "@/lib/shop/promo-banners";
import { cn } from "@/lib/utils";

const FALLBACK_SLIDES: ShopPromoBanner[] = [
  {
    id: "fallback-1",
    title: "本月活動",
    desktop_image_url: "",
    link_type: "page",
    link_url: "/shop/categories",
    button_text: "立即逛逛",
    sort_order: 10,
    is_active: true,
    subtitle: "滿額免運、滿額折扣",
  },
  {
    id: "fallback-2",
    title: "新品到貨",
    desktop_image_url: "",
    link_type: "page",
    link_url: "/shop/categories?sort=newest",
    button_text: "看新品",
    sort_order: 20,
    is_active: true,
    subtitle: "新品牌、新材料、新器具",
  },
];

function BannerMedia({
  banner,
  failed,
  onError,
}: {
  banner: ShopPromoBanner;
  failed: boolean;
  onError: () => void;
}) {
  const desktop = banner.desktop_image_url?.trim();
  const mobile = banner.mobile_image_url?.trim() || desktop;

  if (failed || !desktop) {
    return (
      <div className="flex h-full w-full flex-col justify-center bg-gradient-to-br from-[#FFF8E8] to-[#EEF5FF] px-5 md:px-8">
        <p className="text-xs font-semibold text-[#F0645A]">商城活動</p>
        <h2 className="mt-1 text-lg font-bold text-[#153E73] md:text-2xl">
          {banner.title}
        </h2>
        {banner.subtitle ? (
          <p className="mt-1 text-sm text-[#687386]">{banner.subtitle}</p>
        ) : null}
        {banner.button_text ? (
          <span className="mt-3 inline-flex h-10 w-fit items-center rounded-full bg-[#153E73] px-4 text-sm font-bold text-white">
            {banner.button_text}
          </span>
        ) : null}
      </div>
    );
  }

  return (
    <picture className="block h-full w-full">
      {mobile && mobile !== desktop ? (
        <source media="(max-width: 767px)" srcSet={mobile} />
      ) : null}
      <Image
        src={desktop}
        alt={banner.title}
        fill
        className="object-cover"
        sizes="(max-width: 1200px) 100vw, 1200px"
        priority={false}
        onError={onError}
      />
    </picture>
  );
}

/**
 * 5:2 promo banner carousel under shop category menu.
 */
export function ShopPromoCarousel() {
  const [banners, setBanners] = useState<ShopPromoBanner[]>(FALLBACK_SLIDES);
  const [selected, setSelected] = useState(0);
  const [failedIds, setFailedIds] = useState<Record<string, boolean>>({});
  const [emblaRef, emblaApi] = useEmblaCarousel(
    { loop: true, align: "start", dragFree: false },
    [
      Autoplay({
        delay: 5000,
        stopOnInteraction: false,
        stopOnMouseEnter: true,
      }),
    ]
  );

  useEffect(() => {
    let cancelled = false;
    fetch("/api/cms?type=banners&placement=shop_promo", { cache: "no-store" })
      .then((r) => r.json())
      .then((d) => {
        if (cancelled) return;
        const rows = Array.isArray(d.banners) ? d.banners : [];
        const mapped: ShopPromoBanner[] = rows
          .map((b: Record<string, unknown>) => ({
            id: String(b.id),
            title: String(b.title ?? ""),
            desktop_image_url: String(b.image_url ?? ""),
            mobile_image_url: b.mobile_image_url
              ? String(b.mobile_image_url)
              : undefined,
            link_type: (b.link_type as ShopPromoBanner["link_type"]) || "page",
            link_url: b.link_url ? String(b.link_url) : undefined,
            button_text: b.button_text ? String(b.button_text) : undefined,
            sort_order: Number(b.sort_order ?? 0),
            is_active: b.is_active !== false && b.status !== "inactive",
            starts_at: b.starts_at ? String(b.starts_at) : undefined,
            ends_at: b.ends_at ? String(b.ends_at) : undefined,
            subtitle: b.subtitle ? String(b.subtitle) : null,
          }))
          .filter((b: ShopPromoBanner) => isShopPromoBannerLive(b))
          .sort(
            (a: ShopPromoBanner, b: ShopPromoBanner) => a.sort_order - b.sort_order
          );
        if (mapped.length) setBanners(mapped);
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, []);

  const onSelect = useCallback(() => {
    if (!emblaApi) return;
    setSelected(emblaApi.selectedScrollSnap());
  }, [emblaApi]);

  useEffect(() => {
    if (!emblaApi) return;
    onSelect();
    emblaApi.on("select", onSelect);
    emblaApi.on("reInit", onSelect);
    return () => {
      emblaApi.off("select", onSelect);
      emblaApi.off("reInit", onSelect);
    };
  }, [emblaApi, onSelect]);

  const slideClass =
    "shop-promo-carousel__frame relative min-w-0 flex-[0_0_100%] overflow-hidden rounded-2xl bg-[#F7F8FB]";

  return (
    <section
      className="shop-promo-carousel w-full bg-white"
      aria-label="商城活動 Banner"
    >
      <div className="mx-auto max-w-[1200px] px-4 md:px-6">
        <div className="relative">
          <div className="overflow-hidden" ref={emblaRef}>
            <div className="flex">
              {banners.map((banner) => {
                const href = (banner.link_url || APP_ROUTES.shopCategories).trim();
                const external = isExternalHref(href);
                const body = (
                  <BannerMedia
                    banner={banner}
                    failed={Boolean(failedIds[banner.id])}
                    onError={() =>
                      setFailedIds((prev) => ({ ...prev, [banner.id]: true }))
                    }
                  />
                );

                if (!href) {
                  return (
                    <div key={banner.id} className={slideClass}>
                      {body}
                    </div>
                  );
                }

                if (external) {
                  return (
                    <a
                      key={banner.id}
                      href={href}
                      target="_blank"
                      rel="noopener noreferrer"
                      className={slideClass}
                      aria-label={banner.title}
                    >
                      {body}
                    </a>
                  );
                }

                return (
                  <Link
                    key={banner.id}
                    href={href}
                    className={slideClass}
                    aria-label={banner.title}
                  >
                    {body}
                  </Link>
                );
              })}
            </div>
          </div>

          {banners.length > 1 ? (
            <>
              <button
                type="button"
                aria-label="上一張"
                className="absolute left-2 top-1/2 z-10 hidden h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full bg-white/90 text-[#153E73] shadow-[0_4px_12px_rgba(21,62,115,0.12)] md:inline-flex"
                onClick={() => emblaApi?.scrollPrev()}
              >
                <ChevronLeft className="h-5 w-5" aria-hidden />
              </button>
              <button
                type="button"
                aria-label="下一張"
                className="absolute right-2 top-1/2 z-10 hidden h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full bg-white/90 text-[#153E73] shadow-[0_4px_12px_rgba(21,62,115,0.12)] md:inline-flex"
                onClick={() => emblaApi?.scrollNext()}
              >
                <ChevronRight className="h-5 w-5" aria-hidden />
              </button>
            </>
          ) : null}
        </div>

        {banners.length > 1 ? (
          <div
            className="mt-3 flex items-center justify-center gap-2"
            role="tablist"
            aria-label="Banner 指示器"
          >
            {banners.map((banner, index) => (
              <button
                key={banner.id}
                type="button"
                role="tab"
                aria-selected={selected === index}
                aria-label={`第 ${index + 1} 張`}
                className={cn(
                  "h-2 w-2 rounded-full transition",
                  selected === index ? "bg-[#153E73]" : "bg-[#D8DEE8]"
                )}
                onClick={() => emblaApi?.scrollTo(index)}
              />
            ))}
          </div>
        ) : null}
      </div>
    </section>
  );
}
