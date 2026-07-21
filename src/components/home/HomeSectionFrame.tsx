"use client";

import { AppErrorState } from "@/components/ui/AppErrorState";
import { HomeEmptyState } from "@/components/home/HomeEmptyState";
import { cn } from "@/lib/utils";

type HomeSectionFrameProps = {
  title?: string;
  loading?: boolean;
  error?: string | null;
  onRetry?: () => void;
  empty?: boolean;
  emptyTitle?: string;
  emptyText?: string;
  emptyActionHref?: string;
  emptyActionLabel?: string;
  children: React.ReactNode;
  className?: string;
  skeletonCount?: number;
};

/** Independent home section with loading / error / empty — failure must not blank the page. */
export function HomeSectionFrame({
  title,
  loading,
  error,
  onRetry,
  empty,
  emptyTitle = "目前沒有內容",
  emptyText = "稍後再來看看，或先逛逛其他精選區塊。",
  emptyActionHref,
  emptyActionLabel,
  children,
  className,
  skeletonCount = 4,
}: HomeSectionFrameProps) {
  return (
    <section className={cn("space-y-3", className)}>
      {title ? <h2 className="sr-only">{title}</h2> : null}
      {loading ? (
        <div className="flex gap-3 overflow-hidden" aria-busy>
          {Array.from({ length: skeletonCount }).map((_, i) => (
            <div
              key={i}
              className="home-skeleton aspect-[4/3] w-[42%] shrink-0 rounded-[18px] sm:w-[28%] md:w-auto md:flex-1"
            />
          ))}
        </div>
      ) : error ? (
        <AppErrorState
          title="此區塊暫時無法載入"
          description={error}
          onRetry={onRetry}
          className="rounded-[18px] border border-border-soft bg-surface-soft py-6"
        />
      ) : empty ? (
        <HomeEmptyState
          compact
          title={emptyTitle}
          description={emptyText}
          actionHref={emptyActionHref}
          actionLabel={emptyActionLabel}
        />
      ) : (
        children
      )}
    </section>
  );
}
