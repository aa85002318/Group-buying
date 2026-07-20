"use client";

import { AppErrorState } from "@/components/ui/AppErrorState";
import { cn } from "@/lib/utils";

type HomeSectionFrameProps = {
  title?: string;
  href?: string;
  accentClass?: string;
  loading?: boolean;
  error?: string | null;
  onRetry?: () => void;
  empty?: boolean;
  emptyText?: string;
  children: React.ReactNode;
  className?: string;
};

/** Independent home section with loading / error / empty — failure must not blank the page. */
export function HomeSectionFrame({
  title,
  loading,
  error,
  onRetry,
  empty,
  emptyText = "目前沒有內容",
  children,
  className,
}: HomeSectionFrameProps) {
  return (
    <section className={cn("space-y-3", className)}>
      {title ? (
        <h2 className="sr-only">{title}</h2>
      ) : null}
      {loading ? (
        <div className="grid grid-cols-2 gap-3 md:grid-cols-4" aria-busy>
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="aspect-[4/3] animate-pulse rounded-[18px] bg-muted" />
          ))}
        </div>
      ) : error ? (
        <AppErrorState
          title="此區塊暫時無法載入"
          description={error}
          onRetry={onRetry}
          className="py-6"
        />
      ) : empty ? (
        <div className="rounded-[18px] border border-dashed border-border-soft bg-surface-soft p-4 text-center text-sm text-foreground-secondary">
          {emptyText}
        </div>
      ) : (
        children
      )}
    </section>
  );
}
