"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  listVisibleQuickServices,
  type QuickServiceItem as QuickServiceItemData,
} from "@/types/home-quick-service";
import { QuickServiceItem } from "@/components/home/QuickServiceItem";

type QuickServicesCarouselProps = {
  items: QuickServiceItemData[];
};

export function QuickServicesCarousel({ items }: QuickServicesCarouselProps) {
  const visible = useMemo(() => listVisibleQuickServices(items), [items]);
  const scrollerRef = useRef<HTMLDivElement>(null);
  const [canLeft, setCanLeft] = useState(false);
  const [canRight, setCanRight] = useState(false);
  const [needsScroll, setNeedsScroll] = useState(false);
  const [pageIndex, setPageIndex] = useState(0);
  const [pageCount, setPageCount] = useState(1);

  const updateScrollState = useCallback(() => {
    const el = scrollerRef.current;
    if (!el) return;
    const maxScroll = el.scrollWidth - el.clientWidth;
    const needs = maxScroll > 4;
    setNeedsScroll(needs);
    setCanLeft(el.scrollLeft > 4);
    setCanRight(el.scrollLeft < maxScroll - 4);

    const pages = Math.max(1, Math.min(6, Math.ceil(el.scrollWidth / Math.max(el.clientWidth, 1))));
    setPageCount(pages);
    if (maxScroll <= 4) {
      setPageIndex(0);
      return;
    }
    const ratio = el.scrollLeft / maxScroll;
    setPageIndex(Math.min(pages - 1, Math.round(ratio * (pages - 1))));
  }, []);

  useEffect(() => {
    const el = scrollerRef.current;
    if (!el) return;
    updateScrollState();
    el.addEventListener("scroll", updateScrollState, { passive: true });
    const ro = new ResizeObserver(updateScrollState);
    ro.observe(el);
    return () => {
      el.removeEventListener("scroll", updateScrollState);
      ro.disconnect();
    };
  }, [visible, updateScrollState]);

  const scrollByPage = useCallback((dir: -1 | 1) => {
    const el = scrollerRef.current;
    if (!el) return;
    const amount = Math.max(el.clientWidth * 0.75, 200);
    el.scrollBy({ left: dir * amount, behavior: "smooth" });
  }, []);

  const onKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "ArrowLeft") {
      e.preventDefault();
      scrollByPage(-1);
    } else if (e.key === "ArrowRight") {
      e.preventDefault();
      scrollByPage(1);
    }
  };

  if (visible.length === 0) return null;

  return (
    <div className="quick-services-carousel relative" onKeyDown={onKeyDown}>
      {needsScroll && canLeft ? (
        <button
          type="button"
          aria-label="向左滑動"
          onClick={() => scrollByPage(-1)}
          className="absolute left-0 top-[28px] z-10 inline-flex h-[34px] w-[34px] -translate-x-1 items-center justify-center rounded-full border border-[#E9EDF2] bg-white text-[#153E73] shadow-[0_6px_16px_rgba(21,62,115,0.08)] md:top-[34px] md:h-10 md:w-10 md:-translate-x-2"
        >
          <ChevronLeft className="h-4 w-4 md:h-5 md:w-5" strokeWidth={2} />
        </button>
      ) : null}

      {needsScroll && canRight ? (
        <button
          type="button"
          aria-label="向右滑動"
          onClick={() => scrollByPage(1)}
          className="absolute right-0 top-[28px] z-10 inline-flex h-[34px] w-[34px] translate-x-1 items-center justify-center rounded-full border border-[#E9EDF2] bg-white text-[#153E73] shadow-[0_6px_16px_rgba(21,62,115,0.08)] md:top-[34px] md:h-10 md:w-10 md:translate-x-2"
        >
          <ChevronRight className="h-4 w-4 md:h-5 md:w-5" strokeWidth={2} />
        </button>
      ) : null}

      <div
        ref={scrollerRef}
        tabIndex={0}
        role="list"
        aria-label="常用服務列表"
        className={cn(
          "quick-services-track flex gap-3 overflow-x-auto overscroll-x-contain pb-2",
          "scroll-smooth snap-x snap-mandatory scrollbar-none",
          needsScroll && "px-1"
        )}
        style={{ WebkitOverflowScrolling: "touch" }}
      >
        {visible.map((item) => (
          <div key={item.id} role="listitem" className="snap-start">
            <QuickServiceItem item={item} />
          </div>
        ))}
      </div>

      {needsScroll && pageCount > 1 ? (
        <div className="mt-1 flex items-center justify-center gap-2" aria-hidden>
          {Array.from({ length: pageCount }).map((_, i) => (
            <span
              key={i}
              className="rounded-full transition-all"
              style={{
                width: i === pageIndex ? 8 : 6,
                height: i === pageIndex ? 8 : 6,
                background: i === pageIndex ? "#153E73" : "#D9E2EC",
              }}
            />
          ))}
        </div>
      ) : null}
    </div>
  );
}
