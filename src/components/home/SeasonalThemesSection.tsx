"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { SectionHeader } from "@/components/consumer/SectionHeader";
import { HorizontalScroller } from "@/components/home/HorizontalScroller";
import { HomeSectionFrame } from "@/components/home/HomeSectionFrame";
import type { SeasonalTheme } from "@/lib/types/database";
import { cn, formatDate } from "@/lib/utils";

type SeasonalThemesSectionProps = {
  title?: string;
  viewAllHref?: string;
  limit?: number;
  featuredOnly?: boolean;
  className?: string;
};

export function SeasonalThemesSection({
  title = "季節主題企劃",
  viewAllHref = "/themes",
  limit = 4,
  featuredOnly = false,
  className,
}: SeasonalThemesSectionProps) {
  const [items, setItems] = useState<SeasonalTheme[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = () => {
    setLoading(true);
    setError(null);
    const params = new URLSearchParams({ limit: String(limit) });
    if (featuredOnly) params.set("featured", "1");
    fetch(`/api/themes?${params}`)
      .then(async (r) => {
        const d = await r.json();
        if (!r.ok) throw new Error(d.error ?? "載入失敗");
        setItems(d.themes ?? []);
      })
      .catch((e) => setError(e instanceof Error ? e.message : "載入失敗"))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [limit, featuredOnly]);

  return (
    <section className={cn("space-y-3", className)} aria-label={title}>
      <SectionHeader title={title} href={viewAllHref} accentClass="bg-success" />

      <HomeSectionFrame
        loading={loading}
        error={error}
        onRetry={load}
        empty={!loading && !error && items.length === 0}
        emptyTitle="目前沒有季節主題"
        emptyActionHref={viewAllHref}
        emptyActionLabel="查看全部主題"
        skeletonCount={3}
      >
        <HorizontalScroller className="gap-3 md:grid md:grid-cols-2 md:gap-4 md:overflow-visible lg:grid-cols-4">
          {items.map((t) => (
            <Link
              key={t.id}
              href={`/themes/${t.slug}`}
              className="group relative flex w-[220px] shrink-0 flex-col overflow-hidden rounded-[22px] border border-[#F2D8BF] bg-white shadow-soft min-[375px]:w-[240px] md:w-auto"
              style={t.theme_color ? { borderColor: `${t.theme_color}55` } : undefined}
            >
              <div className="relative aspect-[3/4] bg-[#FFF9EA]">
                {(t.cover_image_url || t.mobile_cover_image_url) ? (
                  <Image
                    src={t.cover_image_url || t.mobile_cover_image_url || ""}
                    alt=""
                    fill
                    className="object-cover transition group-hover:scale-[1.02]"
                    unoptimized
                  />
                ) : (
                  <div
                    className="flex h-full items-end p-4"
                    style={{ backgroundColor: t.theme_color ?? "#FFF9EA" }}
                  >
                    <span className="text-lg font-black text-[#6B3F24]">{t.title}</span>
                  </div>
                )}
                <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/55 to-transparent p-3 pt-10">
                  <h3 className="line-clamp-2 text-sm font-bold text-white">{t.title}</h3>
                  {t.starts_at ? (
                    <p className="mt-1 text-[11px] text-white/85">{formatDate(t.starts_at)} 起</p>
                  ) : null}
                </div>
              </div>
            </Link>
          ))}
        </HorizontalScroller>
      </HomeSectionFrame>
    </section>
  );
}
