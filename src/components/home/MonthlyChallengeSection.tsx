"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { Users } from "lucide-react";
import { SectionHeader } from "@/components/consumer/SectionHeader";
import { HorizontalScroller } from "@/components/home/HorizontalScroller";
import { HomeSectionFrame } from "@/components/home/HomeSectionFrame";
import type { BakingChallenge } from "@/lib/types/database";
import { cn, formatDate } from "@/lib/utils";

type MonthlyChallengeSectionProps = {
  title?: string;
  viewAllHref?: string;
  limit?: number;
  featuredOnly?: boolean;
  className?: string;
};

export function MonthlyChallengeSection({
  title = "本月烘焙挑戰",
  viewAllHref = "/challenges",
  limit = 3,
  featuredOnly = false,
  className,
}: MonthlyChallengeSectionProps) {
  const [items, setItems] = useState<BakingChallenge[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = () => {
    setLoading(true);
    setError(null);
    const params = new URLSearchParams({ limit: String(limit) });
    if (featuredOnly) params.set("featured", "1");
    fetch(`/api/challenges?${params}`)
      .then(async (r) => {
        const d = await r.json();
        if (!r.ok) throw new Error(d.error ?? "載入失敗");
        setItems(d.challenges ?? []);
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
      <SectionHeader title={title} href={viewAllHref} accentClass="bg-groupBuy" />

      <HomeSectionFrame
        loading={loading}
        error={error}
        onRetry={load}
        empty={!loading && !error && items.length === 0}
        emptyTitle="目前沒有進行中的挑戰"
        emptyActionHref={viewAllHref}
        emptyActionLabel="查看全部挑戰"
        skeletonCount={3}
      >
        <HorizontalScroller className="gap-3 md:grid md:grid-cols-3 md:gap-4 md:overflow-visible">
          {items.map((c) => (
            <Link
              key={c.id}
              href={`/challenges/${c.slug}`}
              className="group flex w-[240px] shrink-0 flex-col overflow-hidden rounded-[20px] border border-[#F2D8BF] bg-[#FFF9EA] shadow-soft min-[375px]:w-[260px] md:w-auto"
            >
              <div className="relative aspect-[16/10] bg-white">
                {c.cover_image_url ? (
                  <Image
                    src={c.cover_image_url}
                    alt=""
                    fill
                    className="object-cover transition group-hover:scale-[1.02]"
                    unoptimized
                  />
                ) : (
                  <div className="flex h-full items-center justify-center text-sm font-bold text-[#6B3F24]/50">
                    烘焙挑戰
                  </div>
                )}
              </div>
              <div className="flex flex-1 flex-col gap-2 p-3.5">
                <h3 className="line-clamp-2 text-sm font-bold text-[#6B3F24]">{c.title}</h3>
                {c.description ? (
                  <p className="line-clamp-2 text-xs text-foreground-secondary">{c.description}</p>
                ) : null}
                <div className="mt-auto flex flex-wrap items-center gap-2 text-[11px] text-foreground-secondary">
                  {c.starts_at ? <span>{formatDate(c.starts_at)} 起</span> : null}
                  {c.participant_count > 0 ? (
                    <span className="inline-flex items-center gap-1">
                      <Users className="h-3.5 w-3.5" aria-hidden />
                      {c.participant_count} 人參加
                    </span>
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
