"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { Calendar, Play, Radio } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { SectionHeader } from "@/components/consumer/SectionHeader";
import { HorizontalScroller } from "@/components/home/HorizontalScroller";
import { HomeSectionFrame } from "@/components/home/HomeSectionFrame";
import type { Livestream } from "@/lib/types/database";
import { cn, formatDate } from "@/lib/utils";

function isThisWeek(dateStr: string | null): boolean {
  if (!dateStr) return false;
  const d = new Date(dateStr);
  const now = new Date();
  const start = new Date(now);
  start.setHours(0, 0, 0, 0);
  const end = new Date(start);
  end.setDate(end.getDate() + 7);
  return d >= start && d < end;
}

function actionLabel(status: Livestream["status"]): string {
  if (status === "live") return "進入直播";
  if (status === "ended") return "看回放";
  return "預約提醒";
}

type WeeklyLiveStreamsSectionProps = {
  title?: string;
  viewAllHref?: string;
  limit?: number;
  className?: string;
};

export function WeeklyLiveStreamsSection({
  title = "本週團購直播",
  viewAllHref = "/live",
  limit = 4,
  className,
}: WeeklyLiveStreamsSectionProps) {
  const [items, setItems] = useState<Livestream[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = () => {
    setLoading(true);
    setError(null);
    fetch("/api/livestreams")
      .then(async (r) => {
        const d = await r.json();
        if (!r.ok) throw new Error(d.error ?? "載入失敗");
        setItems(d.livestreams ?? []);
      })
      .catch((e) => setError(e instanceof Error ? e.message : "載入失敗"))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    load();
  }, []);

  const visible = useMemo(() => {
    return items
      .filter(
        (l) =>
          l.featured_on_home ||
          l.status === "live" ||
          isThisWeek(l.scheduled_at) ||
          l.status === "scheduled"
      )
      .sort((a, b) => {
        const orderA = a.sort_order ?? 0;
        const orderB = b.sort_order ?? 0;
        if (orderA !== orderB) return orderA - orderB;
        const dateA = a.scheduled_at ? new Date(a.scheduled_at).getTime() : 0;
        const dateB = b.scheduled_at ? new Date(b.scheduled_at).getTime() : 0;
        return dateA - dateB;
      })
      .slice(0, limit);
  }, [items, limit]);

  return (
    <section className={cn("space-y-3", className)} aria-label={title}>
      <SectionHeader title={title} href={viewAllHref} accentClass="bg-error" />

      <HomeSectionFrame
        loading={loading}
        error={error}
        onRetry={load}
        empty={!loading && !error && visible.length === 0}
        emptyTitle="本週尚無直播"
        emptyActionHref={viewAllHref}
        emptyActionLabel="查看直播專區"
        skeletonCount={2}
      >
        <HorizontalScroller className="gap-3 md:grid md:grid-cols-2 md:gap-4 md:overflow-visible">
          {visible.map((l) => (
            <article
              key={l.id}
              className="flex w-[280px] shrink-0 flex-col overflow-hidden rounded-[20px] border border-[#F2D8BF] bg-white shadow-soft min-[375px]:w-[300px] md:w-auto"
            >
              <Link href={`/live/${l.id}`} className="group relative block aspect-video bg-muted">
                {l.thumbnail_url ? (
                  <Image
                    src={l.thumbnail_url}
                    alt=""
                    fill
                    className="object-cover transition group-hover:scale-[1.02]"
                    unoptimized
                  />
                ) : null}
                <div className="absolute inset-0 flex items-center justify-center bg-black/15">
                  <span className="flex h-10 w-10 items-center justify-center rounded-full bg-white/95 text-[#FF5A5F] shadow-brand">
                    {l.status === "live" ? (
                      <Radio className="h-5 w-5" aria-hidden />
                    ) : (
                      <Play className="ml-0.5 h-5 w-5 fill-current" aria-hidden />
                    )}
                  </span>
                </div>
                {l.status === "live" ? (
                  <Badge variant="live" className="absolute left-2 top-2 normal-case">
                    LIVE
                  </Badge>
                ) : null}
              </Link>
              <div className="flex flex-1 flex-col gap-2 p-3.5">
                {l.theme_label ? (
                  <span className="text-[10px] font-bold uppercase tracking-wide text-[#FF5A5F]">
                    {l.theme_label}
                  </span>
                ) : null}
                <Link href={`/live/${l.id}`}>
                  <h3 className="line-clamp-2 text-sm font-bold text-[#6B3F24]">{l.title}</h3>
                </Link>
                <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-foreground-secondary">
                  {l.host_name ? <span>主持人 {l.host_name}</span> : null}
                  {l.scheduled_at ? (
                    <span className="inline-flex items-center gap-1">
                      <Calendar className="h-3.5 w-3.5" aria-hidden />
                      {formatDate(l.scheduled_at)}
                    </span>
                  ) : null}
                </div>
                <Link
                  href={`/live/${l.id}`}
                  className="mt-auto inline-flex w-fit rounded-full bg-[#FF5A5F] px-3.5 py-1.5 text-xs font-bold text-white transition hover:opacity-90"
                >
                  {actionLabel(l.status)}
                </Link>
              </div>
            </article>
          ))}
        </HorizontalScroller>
      </HomeSectionFrame>
    </section>
  );
}
