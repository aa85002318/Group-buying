"use client";

export function QuickMenuSkeleton() {
  return (
    <div
      className="relative overflow-hidden rounded-[20px] border border-border bg-surface shadow-[0_4px_16px_rgba(107,63,36,0.06)]"
      aria-busy
      aria-label="快捷選單載入中"
    >
      <div className="flex h-[120px] items-center gap-2 overflow-hidden px-10 sm:h-[150px] sm:gap-3 sm:px-12">
        {Array.from({ length: 5 }).map((_, i) => (
          <div
            key={i}
            className="flex w-[96px] shrink-0 flex-col items-center gap-2.5 sm:w-[110px]"
          >
            <div className="home-skeleton h-[52px] w-[52px] rounded-2xl sm:h-[58px] sm:w-[58px]" />
            <div className="home-skeleton h-3.5 w-14 rounded-full" />
          </div>
        ))}
      </div>
    </div>
  );
}

export function QuickMenuEmptyState() {
  return (
    <div className="flex h-[120px] items-center justify-center rounded-[20px] border border-border bg-surface px-4 text-sm text-foreground-secondary sm:h-[150px]">
      目前沒有快捷選單項目
    </div>
  );
}
