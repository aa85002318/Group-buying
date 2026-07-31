"use client";

import { useEffect, useMemo, useState } from "react";
import { HorizontalScroller } from "@/components/home/HorizontalScroller";
import { GroupBuyHubHeader } from "./GroupBuyHubHeader";
import { WeeklyOpenGroupCard } from "./WeeklyOpenGroupCard";
import { ClosingSoonCard } from "./ClosingSoonCard";
import { LivePreviewCard } from "./LivePreviewCard";
import { FeaturedGroupBuySection } from "./FeaturedGroupBuySection";
import {
  isEndingSoon,
  isOpenedThisWeek,
  type GroupBuyHubEvent,
  type GroupBuyHubLive,
} from "./types";
import type { ResolvedHomeBlock } from "@/lib/home/blocks";
import {
  enabledCategoryMenu,
  parseCategoryMenu,
} from "@/lib/home/category-menu";

function useGroupBuyHubData() {
  const [events, setEvents] = useState<GroupBuyHubEvent[]>([]);
  const [lives, setLives] = useState<GroupBuyHubLive[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const [evRes, liveRes] = await Promise.all([
          fetch("/api/group-buy-events"),
          fetch("/api/livestreams"),
        ]);
        const evJson = await evRes.json().catch(() => ({}));
        const liveJson = await liveRes.json().catch(() => ({}));
        if (cancelled) return;
        setEvents((evJson.events ?? []) as GroupBuyHubEvent[]);
        setLives((liveJson.livestreams ?? []) as GroupBuyHubLive[]);
      } catch {
        // keep empty
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  return { events, lives, loading };
}

function HubShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="gb-hub-band bg-[#FFFEFA]">
      <div className="gb-hub-band-inner mx-auto w-full max-w-[1440px] px-4 md:px-6 xl:max-w-[1320px]">
        {children}
      </div>
    </div>
  );
}

function HubEmpty({
  text,
  href,
  action = "查看團購",
}: {
  text: string;
  href: string;
  action?: string;
}) {
  return (
    <div className="rounded-[24px] border border-[#E9EDF2] bg-white px-4 py-7 text-center">
      <p className="text-sm text-[#687386]">{text}</p>
      <a
        href={href}
        className="mt-3 inline-flex text-[13px] font-bold text-[#153E73] underline-offset-2 hover:underline"
      >
        {action}
      </a>
    </div>
  );
}

function HubRailSkeleton({
  count,
  tall,
  wide,
}: {
  count: number;
  tall?: boolean;
  wide?: boolean;
}) {
  return (
    <div className="flex gap-2.5 overflow-hidden">
      {Array.from({ length: count }).map((_, i) => (
        <div
          key={i}
          className={
            wide
              ? "home-skeleton h-[180px] w-[78vw] max-w-[320px] shrink-0 rounded-[24px]"
              : tall
                ? "home-skeleton h-[212px] w-[44vw] max-w-[150px] shrink-0 rounded-[24px]"
                : "home-skeleton h-[190px] w-[40vw] max-w-[132px] shrink-0 rounded-[24px]"
          }
        />
      ))}
    </div>
  );
}

export function WeeklyGroupBuysSection({ block }: { block: ResolvedHomeBlock }) {
  const { events, loading } = useGroupBuyHubData();
  const limit = block.displayCount || 12;
  const weeklyOpen = useMemo(() => {
    const active = events.filter((e) => e.status === "active");
    const week = active.filter((e) => isOpenedThisWeek(e.start_at));
    return (week.length >= 3 ? week : active).slice(0, limit);
  }, [events, limit]);

  return (
    <HubShell>
      <section className="gb-hub-section" aria-label={block.title || "本週開團"}>
        <GroupBuyHubHeader
          title={block.title || "本週開團"}
          subtitle={
            block.subtitle ||
            String(block.config?.subtitle ?? "本週熱門開團，一起買更划算")
          }
          href={block.viewAllUrl || "/group-buy"}
        />
        {loading ? (
          <HubRailSkeleton count={4} tall />
        ) : weeklyOpen.length === 0 ? (
          <HubEmpty text="本週尚無開團活動" href={block.viewAllUrl || "/group-buy"} />
        ) : (
          <HorizontalScroller className="gb-hub-rail gap-2.5 md:gap-3">
            {weeklyOpen.map((event) => (
              <WeeklyOpenGroupCard key={event.id} event={event} />
            ))}
          </HorizontalScroller>
        )}
      </section>
    </HubShell>
  );
}

export function ClosingGroupBuysSection({ block }: { block: ResolvedHomeBlock }) {
  const { events, loading } = useGroupBuyHubData();
  const days = Math.max(1, Number(block.config?.ending_within_days ?? 7) || 7);
  const limit = block.displayCount || 12;
  const closingSoon = useMemo(() => {
    return events
      .filter((e) => e.status === "active")
      .filter((e) => isEndingSoon(e.end_at, 24 * days) || Boolean(e.end_at))
      .slice()
      .sort((a, b) => String(a.end_at ?? "").localeCompare(String(b.end_at ?? "")))
      .slice(0, limit);
  }, [events, days, limit]);

  return (
    <HubShell>
      <section className="gb-hub-section" aria-label={block.title || "即將結單"}>
        <GroupBuyHubHeader
          title={block.title || "即將結單"}
          subtitle={
            block.subtitle ||
            String(block.config?.subtitle ?? "倒數中的團購，把握最後機會")
          }
          href={block.viewAllUrl || "/group-buy"}
        />
        {loading ? (
          <HubRailSkeleton count={4} />
        ) : closingSoon.length === 0 ? (
          <HubEmpty
            text="目前沒有即將結單的團購"
            href={block.viewAllUrl || "/group-buy"}
          />
        ) : (
          <HorizontalScroller className="gb-hub-rail gap-2.5 md:gap-3">
            {closingSoon.map((event) => (
              <ClosingSoonCard key={event.id} event={event} />
            ))}
          </HorizontalScroller>
        )}
      </section>
    </HubShell>
  );
}

export function WeeklyLiveStreamsSection({ block }: { block: ResolvedHomeBlock }) {
  const { lives, loading } = useGroupBuyHubData();
  const limit = block.displayCount || 8;
  const showLive = block.config?.show_live !== false;
  const showUpcoming = block.config?.show_upcoming !== false;
  const showReplay = block.config?.show_replay === true;

  const livePreview = useMemo(() => {
    return lives
      .filter((l) => {
        if (l.status === "live") return showLive;
        if (l.status === "scheduled" || l.featured_on_home) return showUpcoming;
        if (l.status === "ended" || l.status === "replay") return showReplay;
        return false;
      })
      .sort((a, b) => {
        const rank = (s?: string | null) =>
          s === "live" ? 0 : s === "scheduled" ? 1 : 2;
        const rd = rank(a.status) - rank(b.status);
        if (rd !== 0) return rd;
        const ao = a.sort_order ?? 0;
        const bo = b.sort_order ?? 0;
        if (ao !== bo) return ao - bo;
        return String(a.scheduled_at ?? "").localeCompare(String(b.scheduled_at ?? ""));
      })
      .slice(0, limit);
  }, [lives, limit, showLive, showUpcoming, showReplay]);

  return (
    <HubShell>
      <section className="gb-hub-section" aria-label={block.title || "LIVE 團購直播"}>
        <GroupBuyHubHeader
          title={block.title || "LIVE 團購直播"}
          subtitle={
            block.subtitle ||
            String(block.config?.subtitle ?? "鎖定直播檔期，不錯過限時優惠")
          }
          href={block.viewAllUrl || "/live"}
        />
        {loading ? (
          <HubRailSkeleton count={2} wide />
        ) : livePreview.length === 0 ? (
          <HubEmpty
            text="本週尚無直播預告"
            href={block.viewAllUrl || "/live"}
            action="查看直播專區"
          />
        ) : (
          <HorizontalScroller className="gb-hub-rail gap-3">
            {livePreview.map((live) => (
              <LivePreviewCard key={live.id} live={live} />
            ))}
          </HorizontalScroller>
        )}
      </section>
    </HubShell>
  );
}

export function ChimeSelectGroupBuySection({ block }: { block: ResolvedHomeBlock }) {
  const { events, loading } = useGroupBuyHubData();
  const limit = block.displayCount || 24;
  const featured = useMemo(
    () => events.filter((e) => e.status === "active").slice(0, limit),
    [events, limit]
  );
  const menu = enabledCategoryMenu(parseCategoryMenu(block.config));

  return (
    <HubShell>
      <FeaturedGroupBuySection
        events={featured}
        loading={loading}
        title={block.title || "CHIMEIDIY 團購精選"}
        subtitle={
          block.subtitle ||
          String(block.config?.subtitle ?? "精選團購好物，一起買更划算")
        }
        viewAllHref={block.viewAllUrl || "/group-buy"}
        categoryMenu={menu}
      />
    </HubShell>
  );
}
