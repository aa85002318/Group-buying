"use client";

import Link from "next/link";
import useEmblaCarousel from "embla-carousel-react";
import Autoplay from "embla-carousel-autoplay";
import { APP_ROUTES } from "@/lib/site-links";

const DEFAULT_SLIDES = [
  {
    id: "1",
    title: "今日精選烘焙材料",
    subtitle: "依分類瀏覽、篩選品牌與價格",
    href: APP_ROUTES.bakingMaterials,
    tone: "#FFF8E8",
  },
  {
    id: "2",
    title: "團購好物一起買",
    subtitle: "熱門開團限時優惠",
    href: "/group-buy",
    tone: "#EEF5FF",
  },
];

/**
 * 5:2 promo banner carousel under shop category menu.
 */
export function ShopPromoCarousel() {
  const [emblaRef] = useEmblaCarousel({ loop: true, align: "start" }, [
    Autoplay({ delay: 4500, stopOnInteraction: false, stopOnMouseEnter: true }),
  ]);

  return (
    <section className="shop-promo-carousel w-full" aria-label="商城活動 Banner">
      <div className="mx-auto max-w-[1200px] overflow-hidden rounded-[20px]" ref={emblaRef}>
        <div className="flex">
          {DEFAULT_SLIDES.map((slide) => (
            <Link
              key={slide.id}
              href={slide.href}
              className="relative min-w-0 flex-[0_0_100%] overflow-hidden"
              style={{ backgroundColor: slide.tone }}
            >
              <div className="shop-promo-carousel__frame flex flex-col justify-center px-5 py-6 md:px-8 md:py-8">
                <p className="text-xs font-semibold text-[#F0645A]">商城活動</p>
                <h2 className="mt-1 text-lg font-bold text-[#153E73] md:text-xl">
                  {slide.title}
                </h2>
                <p className="mt-1 text-sm text-[#687386]">{slide.subtitle}</p>
                <span className="mt-3 inline-flex h-10 w-fit items-center rounded-full bg-[#153E73] px-4 text-sm font-bold text-white">
                  立即逛逛
                </span>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
