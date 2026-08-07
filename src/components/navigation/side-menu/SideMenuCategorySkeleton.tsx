"use client";

export function SideMenuCategorySkeleton({
  chips = 5,
  rows = 6,
  showLabel = false,
}: {
  chips?: number;
  rows?: number;
  showLabel?: boolean;
}) {
  return (
    <div className="space-y-3" aria-busy="true" aria-live="polite">
      {showLabel ? (
        <p className="px-1 text-xs text-[#687386]">正在載入分類…</p>
      ) : null}
      <div className="flex gap-2 overflow-hidden">
        {Array.from({ length: chips }).map((_, i) => (
          <div
            key={`chip-${i}`}
            className="h-10 w-20 shrink-0 rounded-full bg-[#F3F4F6] motion-safe:animate-pulse"
          />
        ))}
      </div>
      <div>
        {Array.from({ length: rows }).map((_, i) => (
          <div
            key={`row-${i}`}
            className="flex min-h-[72px] items-center gap-3 border-b border-[#F0ECE5] py-3"
          >
            <div className="h-12 w-12 shrink-0 rounded-full bg-[#F3F4F6] motion-safe:animate-pulse" />
            <div className="flex-1 space-y-2">
              <div className="h-4 w-[66%] rounded bg-[#F3F4F6] motion-safe:animate-pulse" />
              <div className="h-3 w-1/2 rounded bg-[#F3F4F6] motion-safe:animate-pulse" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
