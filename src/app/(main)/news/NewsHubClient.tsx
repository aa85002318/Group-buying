"use client";

import { useEffect, useState } from "react";
import { NewsCard } from "@/components/consumer/NewsCard";
import { MOCK_NEWS } from "@/lib/mock/consumer-hub";
import type { NewsCategory, NewsItem } from "@/lib/consumer-hub";
import { cn } from "@/lib/utils";

const TABS: Array<{ id: NewsCategory; label: string }> = [
  { id: "all", label: "全部" },
  { id: "new", label: "新品" },
  { id: "campaign", label: "活動" },
  { id: "promo", label: "優惠" },
  { id: "course", label: "課程" },
  { id: "live", label: "直播" },
  { id: "store", label: "門市公告" },
  { id: "closure", label: "停班停課" },
  { id: "system", label: "系統公告" },
];

export function NewsHubClient() {
  const [tab, setTab] = useState<NewsCategory>("all");
  const [q, setQ] = useState("");
  const [items, setItems] = useState<NewsItem[]>(MOCK_NEWS);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = () => {
    setLoading(true);
    setError(null);
    const params = new URLSearchParams();
    if (tab !== "all") params.set("category", tab);
    if (q.trim()) params.set("q", q.trim());
    fetch(`/api/news?${params}`)
      .then(async (r) => {
        const d = await r.json();
        if (!r.ok) throw new Error(d.error ?? "載入失敗");
        setItems(d.news ?? []);
      })
      .catch((e) => setError(e instanceof Error ? e.message : "載入失敗"))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tab]);

  return (
    <div className="space-y-6 page-enter">
      <header>
        <h1 className="text-2xl font-bold text-caramel">最新資訊</h1>
        <p className="mt-1 text-sm text-foreground-secondary">
          新品、活動、優惠與門市公告
        </p>
      </header>

      <div className="flex flex-col gap-3 sm:flex-row">
        <input
          className="min-h-12 flex-1 rounded-2xl border border-border-soft bg-cream px-4 text-sm"
          placeholder="搜尋標題或摘要"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && load()}
        />
        <button
          type="button"
          onClick={load}
          className="min-h-12 rounded-2xl bg-primary px-5 text-sm font-semibold text-white"
        >
          搜尋
        </button>
      </div>

      <div className="flex gap-2 overflow-x-auto pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        {TABS.map((t) => (
          <button
            key={t.id}
            type="button"
            onClick={() => setTab(t.id)}
            className={cn(
              "inline-flex min-h-11 shrink-0 items-center rounded-full px-4 text-sm font-medium",
              tab === t.id
                ? "bg-primary text-white"
                : "border border-border-soft bg-surface text-caramel"
            )}
          >
            {t.label}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="space-y-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="h-24 animate-pulse rounded-[18px] bg-muted" />
          ))}
        </div>
      ) : error ? (
        <div className="rounded-[18px] border border-red-200 bg-red-50 p-6 text-center text-sm text-red-800">
          {error}
          <button type="button" className="ml-2 underline" onClick={load}>
            重試
          </button>
        </div>
      ) : items.length === 0 ? (
        <div className="rounded-[18px] bg-surface p-8 text-center shadow-card">
          <p className="font-semibold text-foreground">此分類尚無資訊</p>
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
