"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";

export interface BannerItem {
  id: string;
  title: string;
  image: string;
  link: string;
}

interface BannerCarouselProps {
  banners: BannerItem[];
  autoPlayMs?: number;
}

export function BannerCarousel({ banners, autoPlayMs = 5000 }: BannerCarouselProps) {
  const [index, setIndex] = useState(0);

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

  return (
    <section className="w-full">
      <div className="relative aspect-video w-full overflow-hidden rounded-2xl bg-muted shadow-card">
        <Link href={current.link} className="block h-full w-full">
          <Image
            src={current.image}
            alt={current.title}
            fill
            className="object-cover"
            sizes="(max-width: 512px) 100vw, 512px"
            priority
            unoptimized
          />
          <div className="absolute inset-0 bg-gradient-to-t from-coffee/60 via-transparent to-transparent" />
          <span className="absolute bottom-4 left-4 right-12 text-base font-semibold text-white drop-shadow">
            {current.title}
          </span>
        </Link>

        {banners.length > 1 && (
          <>
            <button
              type="button"
              onClick={() => goTo(index - 1)}
              className="absolute left-2 top-1/2 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-full bg-primary/70 text-white backdrop-blur-sm"
              aria-label="上一張"
            >
              <ChevronLeft className="h-5 w-5" />
            </button>
            <button
              type="button"
              onClick={() => goTo(index + 1)}
              className="absolute right-2 top-1/2 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-full bg-primary/70 text-white backdrop-blur-sm"
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
