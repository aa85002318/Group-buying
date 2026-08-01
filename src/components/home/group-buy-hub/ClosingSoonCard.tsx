"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { formatCurrency, cn } from "@/lib/utils";
import {
  PRODUCT_RAIL_BODY,
  PRODUCT_RAIL_CARD_SHELL,
  PRODUCT_RAIL_IMAGE,
  PRODUCT_RAIL_IMAGE_FRAME,
} from "@/lib/ui/product-rail";
import {
  eventDetailHref,
  eventImage,
  eventPrices,
  remainParts,
  type GroupBuyHubEvent,
} from "./types";

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
  const href = eventDetailHref(event);

  return (
    <article
      className={cn(
        PRODUCT_RAIL_CARD_SHELL,
        "md:hover:-translate-y-0.5 md:hover:shadow-[0_8px_20px_rgba(21,62,115,0.08)]"
      )}
    >
      <div className="relative">
        <Link href={href} className={PRODUCT_RAIL_IMAGE_FRAME} aria-label={event.title}>
          {image ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={image} alt="" className={cn("h-full w-full", PRODUCT_RAIL_IMAGE)} />
          ) : (
            <span className="flex h-full items-center justify-center text-xs text-[#687386]">
              團購
            </span>
          )}
        </Link>
        {parts && !parts.done ? (
          <span className="absolute left-2 top-2 rounded-[6px] bg-[#F16458] px-2 py-0.5 text-xs font-bold leading-none text-white">
            倒數中
          </span>
        ) : null}
      </div>

      <div className={PRODUCT_RAIL_BODY}>
        <Link href={href}>
          <h3 className="line-clamp-2 min-h-[40px] text-sm font-semibold leading-[1.4] text-[#153E73] md:min-h-[42px] md:text-[15px]">
            {event.title}
          </h3>
        </Link>
        {parts && !parts.done ? (
          <p className="mt-1.5 text-[11px] font-bold leading-tight text-[#F16458] md:text-xs">
            剩餘 {pad(parts.days)}天 {pad(parts.hours)}小時 {pad(parts.minutes)}分鐘
          </p>
        ) : (
          <p className="mt-1.5 text-[11px] font-bold text-[#687386] md:text-xs">已結束</p>
        )}
        <Link href={href} className="mt-1 block">
          <p className="text-[17px] font-bold leading-none text-[#F16458] md:text-xl">
            {formatCurrency(price)}
          </p>
        </Link>
        <Link
          href={href}
          className="mt-auto inline-flex h-9 w-full items-center justify-center rounded-full bg-[#F16458] text-sm font-bold text-white transition hover:brightness-95 active:scale-[0.98] md:h-10"
        >
          查看詳情
        </Link>
      </div>
    </article>
  );
}
