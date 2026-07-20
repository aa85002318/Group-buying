"use client";

import { useMemo, useState } from "react";
import { NewsCard } from "@/components/consumer/NewsCard";
import { MOCK_NEWS } from "@/lib/mock/consumer-hub";
import type { NewsCategory } from "@/lib/consumer-hub";
import { cn } from "@/lib/utils";

const TABS: Array<{ id: NewsCategory; label: string }> = [
  { id: "all", label: "全部" },
  { id: "new", label: "新品" },
  { id: "campaign", label: "活動" },
  { id: "store", label: "門市公告" },
  { id: "course", label: "課程" },
  { id: "live", label: "直播" },
  { id: "closure", label: "停班停課" },
  { id: "system", label: "系統公告" },
];

export function NewsHubClient() {
  const [tab, setTab] = useState<NewsCategory>("all");
  const items = useMemo(
    () => (tab === "all" ? MOCK_NEWS : MOCK_NEWS.filter((n) => n.category === tab)),
    [tab]
  );

  return (
    <div className="space-y-6 page-enter">
      <header>
        <h1 className="text-2xl font-black text-foreground">最新資訊</h1>
        <p className="mt-1 text-sm text-foreground-secondary">
          第一階段以 mock／公告骨架呈現；後續可接 CMS 與 `store_announcements`。
        </p>
      </header>

      <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-none">
        {TABS.map((t) => (
          <button
            key={t.id}
            type="button"
            onClick={() => setTab(t.id)}
            className={cn(
              "inline-flex min-h-11 shrink-0 items-center rounded-full px-4 text-sm font-bold",
              tab === t.id
                ? "bg-info text-white"
                : "bg-surface-soft text-foreground-secondary hover:text-foreground"
            )}
          >
            {t.label}
          </button>
        ))}
      </div>

      {items.length === 0 ? (
        <div className="card-surface p-8 text-center">
          <p className="font-bold text-foreground">此分類尚無資訊</p>
          <p className="mt-1 text-sm text-foreground-secondary">請稍後再查看，或切換其他分類。</p>
        </div>
      ) : (
        <div className="grid gap-3 md:grid-cols-2">
          {items.map((item) => (
            <NewsCard key={item.id} item={item} />
          ))}
        </div>
      )}
    </div>
  );
}
