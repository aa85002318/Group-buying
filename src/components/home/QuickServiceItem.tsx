"use client";

import { useState } from "react";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { openSideMenu } from "@/lib/side-menu-events";
import type { QuickServiceItem as QuickServiceItemType } from "@/types/home-quick-service";

type QuickServiceItemProps = {
  item: QuickServiceItemType;
  className?: string;
};

const PLACEHOLDER = "/images/home/quick-services/more.svg";

export function QuickServiceItem({ item, className }: QuickServiceItemProps) {
  const [src, setSrc] = useState(item.imageUrl || PLACEHOLDER);
  const isMore = item.id === "more" || item.title === "更多";

  const classNames = cn(
    "quick-service-item flex w-[70px] shrink-0 snap-start flex-col items-center gap-2 sm:w-[82px] lg:w-[92px]",
    "min-h-[44px] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#FFD454]/70",
    className
  );

  const body = (
    <>
      <span
        className={cn(
          "relative inline-flex h-[60px] w-[60px] items-center justify-center rounded-full shadow-[0_5px_14px_rgba(21,62,115,0.06)] transition hover:scale-[1.04] sm:h-[68px] sm:w-[68px] lg:h-[78px] lg:w-[78px]",
          isMore && "border border-dashed border-[#C9D2DF] bg-white"
        )}
        style={isMore ? undefined : { backgroundColor: item.backgroundColor || "#FFF5CC" }}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={src}
          alt={item.title}
          width={48}
          height={48}
          className="h-9 w-9 object-contain sm:h-10 sm:w-10 lg:h-12 lg:w-12"
          onError={() => setSrc(PLACEHOLDER)}
          decoding="async"
        />
        {item.badge ? (
          <span className="absolute -right-1 -top-1 rounded-full bg-[#F16458] px-1.5 py-0.5 text-[9px] font-bold leading-none text-white">
            {item.badge}
          </span>
        ) : null}
      </span>
      <span className="w-full truncate text-center text-xs font-semibold leading-[1.3] text-[#153E73] lg:text-[13px]">
        {item.title}
      </span>
    </>
  );

  if (isMore) {
    return (
      <button
        type="button"
        aria-label={item.title}
        className={classNames}
        onClick={() => openSideMenu()}
      >
        {body}
      </button>
    );
  }

  return (
    <Link href={item.href} aria-label={item.title} className={classNames}>
      {body}
    </Link>
  );
}
