"use client";

import {
  BookOpen,
  Gift,
  House,
  Wheat,
  type LucideIcon,
} from "lucide-react";
import type { SideMenuPrimaryItem, SideMenuSectionKey } from "@/types/navigation";
import { cn } from "@/lib/utils";

const ICONS: Record<string, LucideIcon> = {
  house: House,
  home: House,
  wheat: Wheat,
  materials: Wheat,
  gift: Gift,
  group_buy: Gift,
  book: BookOpen,
  recipes: BookOpen,
};

export function SideMenuPrimaryNav({
  items,
  activeSection,
  onSelect,
}: {
  items: SideMenuPrimaryItem[];
  activeSection?: SideMenuSectionKey;
  onSelect: (item: SideMenuPrimaryItem) => void;
}) {
  return (
    <nav className="mt-4 px-2" aria-label="主要入口">
      <ul className="space-y-1">
        {items
          .filter((i) => i.enabled)
          .sort((a, b) => a.order - b.order)
          .map((item) => {
            const Icon = ICONS[item.icon || item.id] || House;
            const selected = activeSection === item.section && item.section !== "home";
            return (
              <li key={item.id}>
                <button
                  type="button"
                  onClick={() => onSelect(item)}
                  aria-current={selected ? "page" : undefined}
                  className={cn(
                    "relative flex min-h-16 w-full items-center gap-3 rounded-2xl px-4 text-left transition",
                    selected
                      ? "bg-[#FFF5CC] text-[#153E73]"
                      : "text-[#153E73] hover:bg-[#FFFEFA]"
                  )}
                >
                  {selected ? (
                    <span
                      className="absolute bottom-3 left-0 top-3 w-1 rounded-r bg-[#FFD454]"
                      aria-hidden
                    />
                  ) : null}
                  <Icon className="h-5 w-5 shrink-0" strokeWidth={2} />
                  <span className="flex-1 text-base font-semibold">{item.label}</span>
                  {item.comingSoon ? (
                    <span className="rounded-full bg-[#EEF8FC] px-2 py-0.5 text-[11px] font-semibold text-[#79C7E8]">
                      即將開放
                    </span>
                  ) : null}
                </button>
              </li>
            );
          })}
      </ul>
    </nav>
  );
}
