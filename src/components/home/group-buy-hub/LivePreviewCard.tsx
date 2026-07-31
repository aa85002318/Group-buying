"use client";

import Link from "next/link";
import type { GroupBuyHubLive } from "./types";

function formatLiveDate(iso?: string | null) {
  if (!iso) return { date: "日期待公布", time: "" };
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return { date: "日期待公布", time: "" };
  const date = `${d.getMonth() + 1}/${d.getDate()}`;
  const time = `${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;
  return { date, time };
}

export function LivePreviewCard({ live }: { live: GroupBuyHubLive }) {
  const { date, time } = formatLiveDate(live.scheduled_at);
  const href = `/live/${live.id}`;
  const isLive = live.status === "live";

  return (
    <article className="gb-hub-live-card group w-[78vw] max-w-[320px] shrink-0 snap-start overflow-hidden rounded-[24px] border border-[#E9EDF2] bg-white shadow-[0_4px_14px_rgba(21,62,115,0.05)] transition duration-300 md:w-[300px] md:max-w-[300px] md:hover:-translate-y-1 md:hover:scale-[1.02]">
      <div className="relative aspect-video bg-[#FFFEFA]">
        <Link href={href} className="absolute inset-0 block">
          {live.thumbnail_url ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={live.thumbnail_url}
              alt=""
              className="h-full w-full object-cover"
            />
          ) : (
            <span className="flex h-full items-center justify-center text-sm text-[#687386]">
              直播預告
            </span>
          )}
        </Link>
        <span
          className={`pointer-events-none absolute left-2.5 top-2.5 rounded-full px-2 py-0.5 text-[10px] font-extrabold text-white ${
            isLive ? "bg-[#F16458]" : "bg-[#153E73]/80"
          }`}
        >
          LIVE
        </span>
        <div className="pointer-events-none absolute inset-x-0 bottom-0 flex items-end justify-between gap-2 bg-gradient-to-t from-black/45 to-transparent p-2.5 pt-8">
          <p className="min-w-0 text-[11px] font-semibold text-white opacity-90">
            {date}
            {time ? ` · ${time}` : ""}
          </p>
          <Link
            href={href}
            className="pointer-events-auto inline-flex h-8 shrink-0 items-center justify-center rounded-full bg-[#FFD454] px-3 text-[11px] font-extrabold text-[#153E73] transition hover:brightness-95 active:scale-[0.98] md:hover:scale-[1.02]"
          >
            提醒我
          </Link>
        </div>
      </div>
      <div className="space-y-1 px-3 py-2.5">
        <Link href={href} className="line-clamp-1 text-[13px] font-extrabold text-[#153E73]">
          {live.theme_label || live.title}
        </Link>
        <p className="line-clamp-1 text-[11px] text-[#687386]">
          {live.host_name ? `主持人 ${live.host_name}` : "CHIMEIDIY 直播"}
        </p>
      </div>
    </article>
  );
}
