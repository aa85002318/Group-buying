"use client";

import { ChevronRight, Clock3, Flame, Store } from "lucide-react";
import { cn } from "@/lib/utils";

const LINKS = [
  {
    id: "hot",
    title: "本週熱門",
    subtitle: "人氣精選必買",
    bg: "#FFF5CC",
    Icon: Flame,
  },
  {
    id: "closing48",
    title: "48小時內結團",
    subtitle: "倒數搶購中",
    bg: "#EEF8FC",
    Icon: Clock3,
  },
  {
    id: "pickup",
    title: "門市取貨",
    subtitle: "免運更方便",
    bg: "#EFF9EE",
    Icon: Store,
  },
] as const;

export type GroupBuyQuickLinkId = (typeof LINKS)[number]["id"];

export function GroupBuyQuickLinks({
  onSelect,
}: {
  onSelect: (id: GroupBuyQuickLinkId) => void;
}) {
  return (
    <div className="mx-auto grid w-full max-w-[1200px] grid-cols-3 gap-2 md:gap-4">
      {LINKS.map(({ id, title, subtitle, bg, Icon }) => (
        <button
          key={id}
          type="button"
          onClick={() => onSelect(id)}
          aria-label={`${title}：${subtitle}`}
          className={cn(
            "flex h-24 min-w-0 items-center gap-1.5 rounded-2xl px-2.5 text-left transition active:scale-[0.98] md:h-[104px] md:gap-3 md:px-4",
            "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#79C7E8]/50"
          )}
          style={{ backgroundColor: bg }}
        >
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-white/70 text-[#153E73] md:h-11 md:w-11">
            <Icon className="h-4 w-4 md:h-5 md:w-5" strokeWidth={1.75} aria-hidden />
          </span>
          <span className="min-w-0 flex-1">
            <span className="block truncate text-[12px] font-bold leading-tight text-[#153E73] min-[360px]:text-[13px] md:text-base">
              {title}
            </span>
            <span className="mt-0.5 hidden truncate text-[11px] text-[#687386] min-[390px]:block md:text-sm">
              {subtitle}
            </span>
          </span>
          <ChevronRight
            className="hidden h-4 w-4 shrink-0 text-[#153E73]/50 sm:block"
            aria-hidden
          />
        </button>
      ))}
    </div>
  );
}
