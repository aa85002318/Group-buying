"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils";
import {
  DEFAULT_HOME_QUICK_MENU_ITEMS,
  type HomeQuickMenuItem,
} from "@/lib/home/quick-menu";
import { QuickMenuItem } from "@/components/home/QuickMenuItem";
import { QuickMenuArrow } from "@/components/home/QuickMenuArrow";
import {
  QuickMenuEmptyState,
  QuickMenuSkeleton,
} from "@/components/home/QuickMenuSkeleton";

type HomeQuickMenuCarouselProps = {
  items?: HomeQuickMenuItem[];
  className?: string;
  /** 隱藏箭頭（例如桌機全部可見時） */
  hideArrowsWhenFit?: boolean;
};

export function HomeQuickMenuCarousel({
  items: controlledItems,
  className,
  hideArrowsWhenFit = true,
}: HomeQuickMenuCarouselProps) {
  const [items, setItems] = useState<HomeQuickMenuItem[]>(
    controlledItems?.length
      ? controlledItems.filter((i) => i.is_active)
      : DEFAULT_HOME_QUICK_MENU_ITEMS
  );
  const [loading, setLoading] = useState(!controlledItems);
  const [canLeft, setCanLeft] = useState(false);
  const [canRight, setCanRight] = useState(false);
  const [needsScroll, setNeedsScroll] = useState(true);
  const scrollerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (controlledItems) {
      setItems(controlledItems.filter((i) => i.is_active));
      setLoading(false);
      return;
    }

    let cancelled = false;
    setLoading(true);
    fetch("/api/home-quick-menu")
      .then(async (r) => {
        const d = await r.json();
        if (!r.ok) throw new Error(d.error ?? "載入失敗");
        const list = (d.items ?? []) as HomeQuickMenuItem[];
        if (!cancelled) {
          setItems(list.length > 0 ? list : DEFAULT_HOME_QUICK_MENU_ITEMS);
        }
      })
      .catch((e) => {
        console.error("[HomeQuickMenuCarousel]", e);
        if (!cancelled) setItems(DEFAULT_HOME_QUICK_MENU_ITEMS);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [controlledItems]);

  const updateScrollState = useCallback(() => {
    const el = scrollerRef.current;
    if (!el) return;
    const maxScroll = el.scrollWidth - el.clientWidth;
    const needs = maxScroll > 4;
    setNeedsScroll(needs);
    setCanLeft(el.scrollLeft > 4);
    setCanRight(el.scrollLeft < maxScroll - 4);
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
  }, [items, loading, updateScrollState]);

  const scrollByPage = useCallback((dir: -1 | 1) => {
    const el = scrollerRef.current;
    if (!el) return;
    const amount = Math.max(el.clientWidth * 0.72, 280);
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

  if (loading) return <QuickMenuSkeleton />;
  if (items.length === 0) return <QuickMenuEmptyState />;

  const showArrows = needsScroll || !hideArrowsWhenFit;

  return (
    <section
      aria-label="快捷選單"
      className={cn(
        "relative min-w-0 w-full overflow-hidden rounded-[20px] border border-border bg-surface",
        "shadow-[0_4px_16px_rgba(107,63,36,0.06)]",
        "h-[120px] min-[375px]:h-[132px] sm:h-[150px] md:h-[160px] lg:h-[170px]",
        className
      )}
      onKeyDown={onKeyDown}
    >
      {showArrows ? (
        <QuickMenuArrow
          direction="left"
          disabled={!canLeft}
          onClick={() => scrollByPage(-1)}
        />
      ) : null}
      {showArrows ? (
        <QuickMenuArrow
          direction="right"
          disabled={!canRight}
          onClick={() => scrollByPage(1)}
        />
      ) : null}

      <div
        ref={scrollerRef}
        tabIndex={0}
        role="list"
        className={cn(
          "home-quick-menu-scroll flex h-full min-w-0 items-center gap-0.5 overflow-x-auto overscroll-x-contain",
          "scroll-smooth snap-x snap-mandatory scrollbar-none",
          "px-9 sm:px-12"
        )}
        style={{ WebkitOverflowScrolling: "touch" }}
      >
        {items.map((item) => (
          <div key={item.id} role="listitem" className="snap-start">
            <QuickMenuItem item={item} />
          </div>
        ))}
      </div>
    </section>
  );
}
