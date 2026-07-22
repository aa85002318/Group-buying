"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { SectionHeader } from "@/components/consumer/SectionHeader";
import { HorizontalScroller } from "@/components/home/HorizontalScroller";
import { HomeSectionFrame } from "@/components/home/HomeSectionFrame";
import type { HomeInspiration } from "@/lib/types/database";
import { cn } from "@/lib/utils";

type BakingInspirationSectionProps = {
  title?: string;
  subtitle?: string | null;
  viewAllHref?: string;
  limit?: number;
  className?: string;
};

export function BakingInspirationSection({
  title = "今日烘焙靈感",
  subtitle,
  viewAllHref,
  limit = 4,
  className,
}: BakingInspirationSectionProps) {
  const [items, setItems] = useState<HomeInspiration[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = () => {
    setLoading(true);
    setError(null);
    fetch(`/api/home/inspirations?limit=${limit}`)
      .then(async (r) => {
        const d = await r.json();
        if (!r.ok) throw new Error(d.error ?? "載入失敗");
        setItems(d.inspirations ?? []);
      })
      .catch((e) => setError(e instanceof Error ? e.message : "載入失敗"))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [limit]);

  return (
    <section className={cn("space-y-3", className)} aria-label={title}>
      <SectionHeader title={title} href={viewAllHref} accentClass="bg-warning" />
      {subtitle ? (
        <p className="-mt-2 text-sm text-foreground-secondary">{subtitle}</p>
      ) : null}

      <HomeSectionFrame
        loading={loading}
        error={error}
        onRetry={load}
        empty={!loading && !error && items.length === 0}
        emptyTitle="今天還沒有靈感卡片"
        skeletonCount={3}
      >
        <HorizontalScroller className="gap-3 md:grid md:grid-cols-2 md:gap-4 md:overflow-visible lg:grid-cols-4">
          {items.map((item) => {
            const href = item.target_url || "#";
            return (
              <Link
                key={item.id}
                href={href}
                className="group flex w-[240px] shrink-0 flex-col overflow-hidden rounded-[20px] border border-[#F2D8BF] bg-white shadow-soft min-[375px]:w-[260px] md:w-auto"
              >
                <div className="relative aspect-[4/3] bg-[#FFF9EA]">
                  {item.image_url ? (
                    <Image
                      src={item.image_url}
                      alt=""
                      fill
                      className="object-cover transition group-hover:scale-[1.02]"
                      sizes="260px"
                      unoptimized
                    />
                  ) : (
                    <div className="flex h-full items-center justify-center text-sm text-[#6B3F24]/60">
                      {item.title.slice(0, 2)}
                    </div>
                  )}
                </div>
                <div className="flex flex-1 flex-col gap-1 p-3.5">
                  <h3 className="line-clamp-1 text-sm font-bold text-[#6B3F24]">{item.title}</h3>
                  {item.subtitle ? (
                    <p className="line-clamp-2 text-xs text-foreground-secondary">{item.subtitle}</p>
                  ) : null}
                  <span className="mt-auto inline-flex pt-2 text-xs font-bold text-[#FF5A5F]">
                    {item.button_label || "去看看"} →
                  </span>
                </div>
              </Link>
            );
          })}
        </HorizontalScroller>
      </HomeSectionFrame>
    </section>
  );
}
