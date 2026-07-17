"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { ChevronLeft, ChevronRight, Clock3, ShoppingBag } from "lucide-react";
import { cn } from "@/lib/utils";

export interface BannerItem {
  id: string;
  title: string;
  image: string;
  link: string;
  offer?: string;
  deadline?: string;
  productImage?: string | null;
}

interface BannerCarouselProps {
  banners: BannerItem[];
  autoPlayMs?: number;
}

export function BannerCarousel({ banners, autoPlayMs = 5000 }: BannerCarouselProps) {
  const [index, setIndex] = useState(0);
  const [failedProductImage, setFailedProductImage] = useState<string | null>(null);

  const goTo = useCallback(
    (next: number) => {
      if (!banners.length) return;
      setIndex((next + banners.length) % banners.length);
    },
    [banners.length]
  );

  useEffect(() => {
    if (banners.length <= 1 || !autoPlayMs) return;
    const timer = setInterval(() => goTo(index + 1), autoPlayMs);
    return () => clearInterval(timer);
  }, [banners.length, autoPlayMs, goTo, index]);

  if (!banners.length) return null;

  const current = banners[index];
  const productVisual =
    current.productImage && failedProductImage !== current.productImage
      ? current.productImage
      : current.image;
  const deadlineLabel = current.deadline
    ? new Intl.DateTimeFormat("zh-TW", {
        month: "numeric",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      }).format(new Date(current.deadline))
    : null;

  return (
    <section className="w-full">
      <div className="relative aspect-[390/250] w-full overflow-hidden rounded-[20px] bg-[#7F1D1D] shadow-[0_18px_45px_rgba(233,45,45,0.24)] md:aspect-[16/6]">
        <Link href={current.link} className="block h-full w-full">
          <Image
            src={current.image}
            alt={current.title}
            fill
            className="object-cover opacity-75"
            sizes="(max-width: 768px) 100vw, 1280px"
            priority
            unoptimized
          />
          <div className="absolute inset-0 bg-gradient-to-r from-[#9F1239]/95 via-[#E92D2D]/78 to-[#FF7A00]/20" />

          {current.productImage && (
            <div className="absolute bottom-5 right-4 top-5 w-[38%] overflow-hidden rounded-2xl border-2 border-white/40 bg-white/20 shadow-2xl md:right-10 md:w-[32%]">
              <Image
                src={productVisual}
                alt=""
                fill
                className="object-cover"
                sizes="(max-width: 768px) 38vw, 30vw"
                onError={() => setFailedProductImage(current.productImage ?? null)}
                unoptimized
              />
            </div>
          )}

          <div className="absolute inset-y-0 left-0 flex w-[66%] flex-col justify-center px-5 py-5 text-white md:w-[62%] md:px-10">
            <span className="mb-2 w-fit rounded-full bg-[#FFC83D] px-3 py-1 text-xs font-black text-[#7C2D12] shadow-sm">
              限時團購
            </span>
            {current.offer && (
              <p className="text-2xl font-black tracking-tight text-[#FFF3B0] drop-shadow md:text-4xl">
                {current.offer}
              </p>
            )}
            <h1 className="mt-1 line-clamp-2 text-xl font-black leading-tight drop-shadow-md md:text-3xl">
              {current.title}
            </h1>
            {deadlineLabel && (
              <p className="mt-2 flex items-center gap-1.5 text-xs font-semibold text-white/90 md:text-sm">
                <Clock3 className="h-4 w-4" />
                截止 {deadlineLabel}
              </p>
            )}
            <span className="mt-4 inline-flex min-h-11 w-fit items-center gap-2 rounded-[14px] bg-gradient-to-r from-[#E92D2D] to-[#FF7A00] px-5 text-sm font-black text-white shadow-[0_10px_24px_rgba(127,29,29,0.35)] ring-1 ring-white/30 transition active:scale-95">
              <ShoppingBag className="h-4 w-4" />
              立即搶購
            </span>
          </div>
        </Link>

        {banners.length > 1 && (
          <>
            <button
              type="button"
              onClick={() => goTo(index - 1)}
              className="absolute left-2 top-1/2 hidden h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full bg-black/25 text-white backdrop-blur-sm md:flex"
              aria-label="上一張"
            >
              <ChevronLeft className="h-5 w-5" />
            </button>
            <button
              type="button"
              onClick={() => goTo(index + 1)}
              className="absolute right-2 top-1/2 hidden h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full bg-black/25 text-white backdrop-blur-sm md:flex"
              aria-label="下一張"
            >
              <ChevronRight className="h-5 w-5" />
            </button>

            <div className="absolute bottom-3 right-4 flex gap-1.5">
              {banners.map((b, i) => (
                <button
                  key={b.id}
                  type="button"
                  onClick={() => setIndex(i)}
                  className={cn(
                    "h-1.5 rounded-full transition-all",
                    i === index ? "w-4 bg-white" : "w-1.5 bg-white/50"
                  )}
                  aria-label={`第 ${i + 1} 張`}
                />
              ))}
            </div>
          </>
        )}
      </div>
    </section>
  );
}
