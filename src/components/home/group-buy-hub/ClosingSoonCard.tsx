"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { formatCurrency } from "@/lib/utils";
import { eventImage, eventPrices, remainParts, type GroupBuyHubEvent } from "./types";

function pad(n: number) {
  return String(Math.max(0, n)).padStart(2, "0");
}

export function ClosingSoonCard({ event }: { event: GroupBuyHubEvent }) {
  const [, setTick] = useState(0);
  useEffect(() => {
    const id = window.setInterval(() => setTick((t) => t + 1), 30_000);
    return () => window.clearInterval(id);
  }, []);

  const parts = remainParts(event.end_at);
  const image = eventImage(event);
  const { price } = eventPrices(event);
  const href = `/group-buy/${event.id}`;

  return (
    <article className="gb-hub-closing-card group flex h-[190px] w-[40vw] max-w-[132px] shrink-0 snap-start flex-col overflow-hidden rounded-[24px] border border-[#E9EDF2] bg-white p-2 shadow-[0_4px_14px_rgba(21,62,115,0.05)] transition duration-300 md:h-[198px] md:w-[132px] md:max-w-[132px] md:hover:-translate-y-1 md:hover:scale-[1.02]">
      <div className="relative">
        <Link href={href} className="relative block h-[78px] overflow-hidden rounded-[16px] bg-[#FFFEFA]">
          {image ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={image} alt="" className="h-full w-full object-cover" />
          ) : (
            <span className="flex h-full items-center justify-center text-[10px] text-[#687386]">
              團購
            </span>
          )}
        </Link>
        {parts && !parts.done ? (
          <span className="absolute left-1 top-1 rounded-full bg-[#F16458] px-1.5 py-0.5 text-[9px] font-extrabold text-white shadow-sm">
            倒數中
          </span>
        ) : null}
      </div>

      <div className="mt-1.5 flex min-h-0 flex-1 flex-col">
        <Link href={href}>
          <h3 className="line-clamp-2 text-[11px] font-bold leading-snug text-[#153E73]">
            {event.title}
          </h3>
        </Link>
        {parts && !parts.done ? (
          <p className="mt-1 text-[9px] font-bold leading-tight text-[#F16458]">
            剩餘 {pad(parts.days)}天 {pad(parts.hours)}小時 {pad(parts.minutes)}分鐘
          </p>
        ) : (
          <p className="mt-1 text-[9px] font-bold text-[#687386]">已結束</p>
        )}
        <p className="mt-0.5 text-[13px] font-extrabold text-[#F16458]">
          {formatCurrency(price)}
        </p>
        <Link
          href={href}
          className="mt-auto inline-flex h-7 w-full items-center justify-center rounded-full bg-[#F16458] text-[10px] font-extrabold text-white transition hover:brightness-95 active:scale-[0.98] md:hover:scale-[1.02]"
        >
          加入團購
        </Link>
      </div>
    </article>
  );
}
