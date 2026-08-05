"use client";

import type { GroupBuyTab } from "@/lib/group-buy/page-settings";
import { cn } from "@/lib/utils";

const CHIP_LABELS: Partial<Record<GroupBuyTab, string>> = {
  all: "全部團購",
  active: "熱烈開團",
  ending_soon: "即將結團",
  upcoming: "即將開團",
};

export function GroupBuyStatusTabs({
  tabs,
  value,
  counts,
  onChange,
}: {
  tabs: GroupBuyTab[];
  value: GroupBuyTab;
  counts: Partial<Record<GroupBuyTab, number>>;
  onChange: (tab: GroupBuyTab) => void;
}) {
  const visible = tabs.filter((t) => CHIP_LABELS[t]);

  return (
    <div className="w-full">
      <div
        className="flex gap-2 overflow-x-auto pb-1 [-ms-overflow-style:none] [scrollbar-width:none] md:justify-center md:overflow-visible [&::-webkit-scrollbar]:hidden"
        role="tablist"
        aria-label="團購狀態分類"
      >
        {visible.map((t) => {
          const selected = value === t;
          const count = counts[t];
          const label = CHIP_LABELS[t] ?? t;
          return (
            <button
              key={t}
              type="button"
              role="tab"
              aria-selected={selected}
              aria-label={count != null ? `${label} ${count}` : label}
              onClick={() => onChange(t)}
              className={cn(
                "inline-flex h-11 shrink-0 items-center gap-1.5 whitespace-nowrap rounded-full px-4 text-sm font-semibold transition",
                selected
                  ? "bg-[#F16458] text-white"
                  : "border border-[#E9EDF2] bg-white text-[#153E73]"
              )}
            >
              <span>{label}</span>
              {count != null ? (
                <span className={cn(selected ? "text-white/90" : "text-[#687386]")}>
                  {count}
                </span>
              ) : null}
            </button>
          );
        })}
      </div>
    </div>
  );
}
