"use client";

import Link from "next/link";
import type { RecentBrowseItem } from "@/types/navigation";

export function SideMenuRecentItems({
  items,
  onNavigate,
}: {
  items: RecentBrowseItem[];
  onNavigate: () => void;
}) {
  if (!items.length) return null;

  return (
    <section className="mt-4 px-4">
      <h3 className="text-sm font-bold text-[#153E73]">最近瀏覽</h3>
      <div className="mt-2 flex flex-wrap gap-2">
        {items.map((item) => (
          <Link
            key={item.id}
            href={item.href}
            onClick={onNavigate}
            className="inline-flex h-9 items-center rounded-full border border-[#E8E1D7] bg-white px-3 text-sm font-medium text-[#153E73]"
          >
            {item.label}
          </Link>
        ))}
      </div>
    </section>
  );
}
