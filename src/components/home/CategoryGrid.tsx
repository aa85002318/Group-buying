"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import {
  CalendarDays,
  ChevronRight,
  CookingPot,
  Snowflake,
  Sparkles,
  Sprout,
  Utensils,
} from "lucide-react";
import type { ProductCategory } from "@/lib/types/database";

interface CategoryGridProps {
  categories: ProductCategory[];
}

const ICON_TONES = [
  { bg: "bg-groupBuy-soft", fg: "text-groupBuy" },
  { bg: "bg-success-soft", fg: "text-success" },
  { bg: "bg-info-soft", fg: "text-info" },
  { bg: "bg-warning-soft", fg: "text-foreground" },
  { bg: "bg-primary-soft", fg: "text-primary" },
  { bg: "bg-error-soft", fg: "text-error" },
];

const CATEGORY_ICONS = [Utensils, Sprout, Snowflake, CookingPot, Sparkles, CalendarDays];

/** 手機一列約 4 格，第 5 格微露提示可右滑 */
const MOBILE_ITEM_WIDTH = "calc((100% - 0.75rem * 3) / 4)";

export function CategoryGrid({ categories }: CategoryGridProps) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const dragRef = useRef({ active: false, startX: 0, scrollLeft: 0, moved: false });
  const [scrollState, setScrollState] = useState({
    progress: 0,
    thumbRatio: 1,
    canScroll: false,
    atEnd: true,
  });

  const updateScrollTrack = useCallback(() => {
    const el = scrollRef.current;
    if (!el) return;

    const maxScroll = el.scrollWidth - el.clientWidth;
    if (maxScroll <= 0) {
      setScrollState({ progress: 0, thumbRatio: 1, canScroll: false, atEnd: true });
      return;
    }

    const thumbRatio = Math.min(1, el.clientWidth / el.scrollWidth);
    const progress = el.scrollLeft / maxScroll;
    setScrollState({
      progress,
      thumbRatio,
      canScroll: true,
      atEnd: el.scrollLeft >= maxScroll - 2,
    });
  }, []);

  useEffect(() => {
    updateScrollTrack();
    const el = scrollRef.current;
    if (!el) return;

    const observer = new ResizeObserver(updateScrollTrack);
    observer.observe(el);
    return () => observer.disconnect();
  }, [categories, updateScrollTrack]);

  const handleMouseDown = (event: React.MouseEvent<HTMLDivElement>) => {
    const el = scrollRef.current;
    if (!el || !scrollState.canScroll) return;

    dragRef.current = {
      active: true,
      startX: event.pageX,
      scrollLeft: el.scrollLeft,
      moved: false,
    };
    el.style.cursor = "grabbing";
    el.style.userSelect = "none";
  };

  const handleMouseMove = (event: React.MouseEvent<HTMLDivElement>) => {
    const el = scrollRef.current;
    if (!el || !dragRef.current.active) return;

    event.preventDefault();
    const delta = event.pageX - dragRef.current.startX;
    if (Math.abs(delta) > 4) dragRef.current.moved = true;
    el.scrollLeft = dragRef.current.scrollLeft - delta;
  };

  const stopDragging = () => {
    const el = scrollRef.current;
    if (el) {
      el.style.cursor = "";
      el.style.userSelect = "";
    }
    dragRef.current.active = false;
  };

  const handleItemClick = (event: React.MouseEvent<HTMLAnchorElement>) => {
    if (dragRef.current.moved) {
      event.preventDefault();
      dragRef.current.moved = false;
    }
  };

  const thumbWidthPercent = scrollState.thumbRatio * 100;
  const thumbLeftPercent = scrollState.progress * (100 - thumbWidthPercent);

  return (
    <section className="relative rounded-[20px] bg-surface p-4 shadow-card md:p-5">
      <div className="mb-4 flex items-center justify-between gap-3">
        <h2 className="text-lg font-black text-foreground">商品分類</h2>
        {scrollState.canScroll && (
          <span className="inline-flex items-center gap-1 text-xs font-semibold text-foreground-secondary">
            向右滑動
            <ChevronRight className="h-3.5 w-3.5 text-primary" aria-hidden />
          </span>
        )}
      </div>

      <div className="relative">
        <div
          ref={scrollRef}
          onScroll={updateScrollTrack}
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={stopDragging}
          onMouseLeave={stopDragging}
          className={[
            "flex snap-x snap-mandatory gap-3 overflow-x-auto pb-1 scrollbar-none",
            scrollState.canScroll ? "cursor-grab active:cursor-grabbing" : "",
          ].join(" ")}
        >
          {categories.map((category, index) => {
            const Icon = CATEGORY_ICONS[index % CATEGORY_ICONS.length];

            return (
              <Link
                key={category.id}
                href={`/products?category=${category.id}`}
                onClick={handleItemClick}
                draggable={false}
                className="group flex shrink-0 snap-start flex-col items-center gap-2 py-1 transition-transform active:scale-95"
                style={{ width: MOBILE_ITEM_WIDTH, minWidth: MOBILE_ITEM_WIDTH }}
              >
                <div
                  className={`relative flex h-14 w-14 shrink-0 items-center justify-center overflow-hidden rounded-[18px] shadow-card transition-transform duration-200 group-hover:scale-105 group-active:scale-95 sm:h-16 sm:w-16 ${
                    ICON_TONES[index % ICON_TONES.length].bg
                  } ${ICON_TONES[index % ICON_TONES.length].fg}`}
                >
                  <Icon className="h-7 w-7 stroke-[2.25]" aria-hidden />
                </div>
                <span className="line-clamp-2 text-center text-sm font-semibold text-foreground">
                  {category.name}
                </span>
              </Link>
            );
          })}
        </div>

        {scrollState.canScroll && !scrollState.atEnd && (
          <div
            className="pointer-events-none absolute inset-y-0 right-0 w-10 bg-gradient-to-l from-surface via-surface/90 to-transparent"
            aria-hidden
          />
        )}
      </div>

      {scrollState.canScroll && (
        <div className="mt-3 space-y-1.5">
          <div
            className="mx-auto flex h-1.5 w-28 items-center rounded-full bg-primary-soft px-0.5"
            aria-hidden
          >
            <div
              className="h-1 rounded-full bg-primary transition-[width,margin-left] duration-150 ease-out"
              style={{
                width: `${thumbWidthPercent}%`,
                marginLeft: `${thumbLeftPercent}%`,
              }}
            />
          </div>
          <p className="text-center text-[11px] font-medium text-foreground-secondary">
            左右滑動或拖曳查看更多分類
          </p>
        </div>
      )}
    </section>
  );
}
