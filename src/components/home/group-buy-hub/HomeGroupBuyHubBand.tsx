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

/**
 * Homepage extension after 團購 Banner:
 * 本週開團 → 即將結單 → 團購直播預告 → CHIMEIDIY 團購精選
 */
export function HomeGroupBuyHubBand() {
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

  const weeklyOpen = useMemo(() => {
    const active = events.filter((e) => e.status === "active");
    const week = active.filter((e) => isOpenedThisWeek(e.start_at));
    return (week.length >= 3 ? week : active).slice(0, 12);
  }, [events]);

  const closingSoon = useMemo(() => {
    return events
      .filter((e) => e.status === "active")
      .filter((e) => isEndingSoon(e.end_at, 24 * 7) || Boolean(e.end_at))
      .slice()
      .sort((a, b) => String(a.end_at ?? "").localeCompare(String(b.end_at ?? "")))
      .slice(0, 12);
  }, [events]);

  const livePreview = useMemo(() => {
    return lives
      .filter((l) => l.status === "live" || l.status === "scheduled" || l.featured_on_home)
      .sort((a, b) => {
        const ao = a.sort_order ?? 0;
        const bo = b.sort_order ?? 0;
        if (ao !== bo) return ao - bo;
        return String(a.scheduled_at ?? "").localeCompare(String(b.scheduled_at ?? ""));
      })
      .slice(0, 8);
  }, [lives]);

  const featured = useMemo(() => {
    return events.filter((e) => e.status === "active").slice(0, 24);
  }, [events]);

  return (
    <div className="gb-hub-band bg-[#FFFEFA]">
      <div className="gb-hub-band-inner mx-auto w-full max-w-[1100px] px-[15px]">
        {/* Section 1 — 本週開團 */}
        <section className="gb-hub-section" aria-label="本週開團">
          <GroupBuyHubHeader title={<>📦 本週開團</>} href="/group-buy" />
          {loading ? (
            <HubRailSkeleton count={4} tall />
          ) : weeklyOpen.length === 0 ? (
            <HubEmpty text="本週尚無開團活動" href="/group-buy" />
          ) : (
            <HorizontalScroller className="gb-hub-rail gap-2.5 md:gap-3">
              {weeklyOpen.map((event) => (
                <WeeklyOpenGroupCard key={event.id} event={event} />
              ))}
            </HorizontalScroller>
          )}
        </section>

        {/* Section 2 — 即將結單 */}
        <section className="gb-hub-section" aria-label="即將結單">
          <GroupBuyHubHeader title={<>⏰ 即將結單</>} href="/group-buy" />
          {loading ? (
            <HubRailSkeleton count={4} />
          ) : closingSoon.length === 0 ? (
            <HubEmpty text="目前沒有即將結單的團購" href="/group-buy" />
          ) : (
            <HorizontalScroller className="gb-hub-rail gap-2.5 md:gap-3">
              {closingSoon.map((event) => (
                <ClosingSoonCard key={event.id} event={event} />
              ))}
            </HorizontalScroller>
          )}
        </section>

        {/* Section 3 — 團購直播預告 */}
        <section className="gb-hub-section" aria-label="團購直播預告">
          <GroupBuyHubHeader title={<>LIVE 團購直播</>} href="/live" />
          {loading ? (
            <HubRailSkeleton count={2} wide />
          ) : livePreview.length === 0 ? (
            <HubEmpty text="本週尚無直播預告" href="/live" action="查看直播專區" />
          ) : (
            <HorizontalScroller className="gb-hub-rail gap-3">
              {livePreview.map((live) => (
                <LivePreviewCard key={live.id} live={live} />
              ))}
            </HorizontalScroller>
          )}
        </section>

        {/* Section 4 — CHIMEIDIY 團購精選 */}
        <FeaturedGroupBuySection events={featured} />
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
