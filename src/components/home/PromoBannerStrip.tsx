"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { cn } from "@/lib/utils";
import { HorizontalScroller } from "@/components/home/HorizontalScroller";
import type { CmsBanner } from "@/lib/types/database";

const FALLBACK_PROMOS = [
  {
    id: "fallback-1",
    href: "/shop?promo=weekly",
    title: "本週優惠",
    subtitle: "精選材料限時折扣",
    image: null as string | null,
  },
  {
    id: "fallback-2",
    href: "/shop?promo=free-shipping",
    title: "免運活動",
    subtitle: "滿額享免運",
    image: null as string | null,
  },
];

type PromoItem = {
  id: string;
  href: string;
  title: string;
  subtitle: string;
  image: string | null;
};

/** 本週優惠 — 優先使用 cms_banners placement=home_weekly_promo */
export function PromoBannerStrip({
  className,
  title = "本週優惠",
  limit = 4,
}: {
  className?: string;
  title?: string;
  limit?: number;
}) {
  const [items, setItems] = useState<PromoItem[]>(FALLBACK_PROMOS);

  useEffect(() => {
    let cancelled = false;
    fetch("/api/cms?placement=home_weekly_promo")
      .then((r) => r.json())
      .then((d) => {
        if (cancelled) return;
        const banners = (d.banners ?? []) as CmsBanner[];
        if (!banners.length) return;
        setItems(
          banners.slice(0, limit).map((b) => ({
            id: b.id,
            href: b.link_url || "/shop",
            title: b.title,
            subtitle: b.subtitle || b.button_text || "",
            image: b.image_url || b.mobile_image_url || null,
          }))
        );
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, [limit]);

  return (
    <section aria-label={title} className={cn("space-y-3", className)}>
      <h2 className="text-lg font-semibold text-brand-caramel">{title}</h2>
      <HorizontalScroller className="gap-2.5 md:grid md:grid-cols-2 md:gap-4 md:overflow-visible xl:grid-cols-4">
        {items.map((p) => (
          <Link
            key={p.id}
            href={p.href}
            className="relative flex h-[118px] w-[272px] shrink-0 items-center overflow-hidden rounded-[18px] border border-border-soft bg-surface-peach px-4 py-3 text-brand-caramel min-[375px]:w-[292px] sm:h-[124px] sm:w-[300px] md:w-auto"
          >
            {p.image ? (
              <Image
                src={p.image}
                alt=""
                fill
                className="object-cover"
                unoptimized
              />
            ) : null}
            {!p.image ? (
              <span className="relative z-10 min-w-0 flex-1">
                <span className="block text-base font-bold">{p.title}</span>
                {p.subtitle ? (
                  <span className="mt-1 block text-xs text-foreground-secondary">
                    {p.subtitle}
                  </span>
                ) : null}
              </span>
            ) : (
              <span className="sr-only">{p.title}</span>
            )}
          </Link>
        ))}
      </HorizontalScroller>
    </section>
  );
}
